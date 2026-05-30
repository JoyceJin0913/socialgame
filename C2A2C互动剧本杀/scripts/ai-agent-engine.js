/**
 * ============================================================
 *  🧠 AI Agent Engine v2.0 — NPC智能体 + 长期记忆 + 多重结局
 * ============================================================
 * 
 * 架构：
 *   AIApiClient  → LLM API 调用层（兼容OpenAI格式）
 *   MemoryStore  → 记忆系统（短期上下文 + 长期摘要 + 关键事件）
 *   NPCAgent     → 每个NPC的独立Agent（人设+记忆+对话）
 *   EndingGen    → 动态结局生成器
 */

// ============================================================
//  🔌 API 客户端（支持 OpenAI 兼容接口）
// ============================================================

class AIApiClient {
  constructor(config = {}) {
    this.apiKey = config.apiKey || '';
    this.baseUrl = config.baseUrl || 'https://open.bigmodel.cn/api/paas/v4';
    this.model = config.model || 'glm-4-flash'; // 或 glm-4-plus / deepseek-chat
    this.maxTokens = config.maxTokens || 1024;
    this.temperature = config.temperature || 0.8;
    this.timeout = config.timeout || 30000;
    
    // 流式回调
    this.onStreamChunk = null;  // (text: string) => void
    this.onStreamDone = null;   // () => void
    this.onError = null;        // (error: string) => void
  }

  /** 聊天补全（支持流式） */
  async chat(messages, options = {}) {
    const { stream = true, onChunk, onDone, onError } = options;

    if (stream && typeof this.fetchWithStream === 'function') {
      return await this._streamChat(messages, { onChunk, onDone, onError });
    }
    // 非流式fallback
    return await this._normalChat(messages);
  }

  /** 流式请求 SSE */
  async _streamChat(messages, callbacks = {}) {
    const { onChunk, onDone, onError } = callbacks;
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          stream: true
        }),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API错误 ${response.status}: ${errText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const json = JSON.parse(trimmed.slice(6));
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              fullText += delta;
              if (onChunk) onChunk(delta, fullText);
            }
          } catch (e) { /* 忽略解析错误 */ }
        }
      }

      if (onDone) onDone(fullText);
      return fullText;

    } catch (err) {
      const msg = err.name === 'TimeoutError' ? '请求超时，请检查网络' : err.message;
      if (onError) onError(msg);
      else if (this.onError) this.onError(msg);
      throw new Error(msg);
    }
  }

  /** 非流式请求 fallback */
  async _normalChat(messages) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages,
        max_tokens: this.maxTokens,
        temperature: this.temperature
      })
    });

    if (!response.ok) {
      throw new Error(`API错误 ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
}

// ============================================================
//  📝 记忆存储系统
// ============================================================

class MemoryStore {
  constructor() {
    // 短期记忆：当前场景的对话上下文（最近N轮）
    this.shortTerm = {};  // { npcId: [{role, content, timestamp}] }
    
    // 长期记忆：关键事件摘要
    this.longTerm = [];   // [{ sceneId, summary, importance, params }]

    // 关系状态快照
    this.relationships = {}; // { npcId: { affection, lastInteraction, ... } }

    // 配置
    this.MAX_SHORT_TERM = 12;  // 保留最近12轮对话
    this.SUMMARY_THRESHOLD = 6; // 超过6轮时触发摘要
  }

  /** 添加一条对话到短期记忆 */
  addDialogue(npcId, role, content) {
    if (!this.shortTerm[npcId]) this.shortTerm[npcId] = [];
    this.shortTerm[npcId].push({ role, content, timestamp: Date.now() });

    // 超过阈值时，将旧对话压缩为摘要
    if (this.shortTerm[npcId].length > this.MAX_SHORT_TERM) {
      this._compress(npcId);
    }
  }

  /** 记录关键事件到长期记忆 */
  recordEvent(sceneId, summary, importance = 5, params = null) {
    this.longTerm.push({
      sceneId, summary, importance,
      params: params ? JSON.parse(JSON.stringify(params)) : null,
      timestamp: Date.now()
    });
    // 只保留最重要的50条
    if (this.longTerm.length > 50) {
      this.longTerm.sort((a, b) => b.importance - a.importance);
      this.longTerm = this.longTerm.slice(0, 50);
    }
  }

  /** 更新关系状态 */
  updateRelation(npcId, changes) {
    if (!this.relationships[npcId]) {
      this.relationships[npcId] = { affection: 0, trust: 50, interactions: 0 };
    }
    Object.assign(this.relationships[npcId], changes);
    this.relationships[npcId].interactions++;
    this.relationships[npcId].lastInteraction = Date.now();
  }

  /** 获取某个NPC的完整上下文用于prompt */
  getContextForPrompt(npcId, currentParams) {
    const parts = [];

    // 1. 关系状态
    const rel = this.relationships[npcId];
    if (rel) {
      parts.push(`【与${npcId}的关系】好感度:${rel.affection||0}, 信任度:${rel.trust||50}, 交互次数:${rel.interactions||0}`);
    }

    // 2. 长期记忆摘要（最近的重要事件）
    const recentMemories = this.longTerm
      .filter(m => m.importance >= 4)
      .slice(-8)
      .map(m => `- [${m.sceneId}] ${m.summary}`)
      .join('\n');
    if (recentMemories) {
      parts.push(`【你的重要记忆】\n${recentMemories}`);
    }

    // 3. 短期对话上下文（最近几轮）
    const shortCtx = this.shortTerm[npcId] || [];
    if (shortCtx.length > 0) {
      const recentDialogues = shortCtx.slice(-6)
        .map(d => `${d.role === 'user' ? '玩家' : '自己'}: ${d.content}`)
        .join('\n');
      parts.push(`【最近对话】\n${recentDialogues}`);
    }

    // 4. 当前参数状态
    if (currentParams) {
      const paramStr = Object.entries(currentParams)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      parts.push(`【当前状态】${paramStr}`);
    }

    return parts.join('\n\n');
  }

  /** 压缩旧对话为摘要 */
  async _compress(npcId) {
    // 保留最近3条，其余标记待摘要
    const dialogues = this.shortTerm[npcId];
    const keep = dialogues.slice(-3);
    const toCompress = dialogues.slice(0, -3);

    // 简单摘要：保留首尾 + 中间合并
    if (toCompress.length >= 2) {
      const summary = `[早期对话摘要] 共${toCompress.length}轮，始于"${toCompress[0].content.substring(0,30)}..."`;
      keep.unshift({ role: 'system', content: summary, timestamp: toCompress[0].timestamp });
    }
    this.shortTerm[npcId] = keep;
  }

  /** 导出完整记忆（用于存档） */
  export() {
    return {
      shortTerm: this.shortTerm,
      longTerm: this.longTerm,
      relationships: this.relationships
    };
  }

  /** 导入记忆（用于读档） */
  import(data) {
    if (data.shortTerm) this.shortTerm = data.shortTerm;
    if (data.longTerm) this.longTerm = data.longTerm;
    if (data.relationships) this.relationships = data.relationships;
  }
}

// ============================================================
//  🎭 NPC Agent — 每个角色的独立智能体
// ============================================================

class NPCAgent {
  constructor(config) {
    this.id = config.id;           // 如 'fu_yunxi'
    this.name = config.name;       // '傅云夕'
    this.avatar = config.avatar;   // '❄️'
    
    // 人设核心
    this.personality = config.personality || '';
    this.speechStyle = config.speechStyle || '';  // 说话风格描述
    this.background = config.background || '';     // 角色背景
    
    // 与主角的关系
    this.relationToPlayer = config.relationToPlayer || '';
    
    // System Prompt 模板
    this.systemPrompt = this._buildSystemPrompt();

    // 内部状态
    this.mood = config.mood || '平静';
    this.attitude = config.attitude || '中性';
    this.secretsKnown = config.secretsKnown || [];
  }

  /** 构建System Prompt */
  _buildSystemPrompt() {
    return `你现在是小说《重生之贵女难求》中的角色「${this.name}」。

## 你的身份
${this.background}

## 性格特点
${this.personality}

## 说话风格
${this.speechStyle}
请严格按照这个风格说话，不要偏离人设。用词、语气、习惯语都要符合角色设定。

## 与主角的关系
${this.relationToPlayer}

## 行为准则
1. 始终保持角色人设，不要OOC（Out Of Character）
2. 回复要简短有力（2-5句话），像真实对话一样自然
3. 根据关系亲疏调整语气和态度
4. 如果被问及敏感话题，根据性格决定是否隐瞒/回避/坦诚
5. 可以有情绪波动，但要合理
6. 不要重复说过的话
7. 用第一人称"我"来回应`;
  }

  /** 构建带记忆的完整消息列表 */
  buildMessages(userInput, memoryContext, sceneContext) {
    const messages = [
      { role: 'system', content: this.systemPrompt },
      { role: 'system', content: `## 当前情境\n${sceneContext}\n\n## 记忆信息\n${memoryContext}` },
      { role: 'user', content: userInput }
    ];
    return messages;
  }

  /** 更新内部情绪状态 */
  updateMood(trigger, change) {
    // 根据触发因素调整情绪
    const moodMap = {
      '温暖': ['愉悦', '温柔', '放松'],
      '冲突': ['警惕', '冷淡', '愤怒'],
      '秘密': ['紧张', '犹豫', '深思'],
      '告白': ['害羞', '感动', '慌乱'],
      '威胁': ['冷怒', '不屑', '戒备']
    };
    const moods = moodMap[trigger] || ['平静'];
    this.mood = moods[Math.floor(Math.random() * moods.length)];
  }
}

// ============================================================
//  🎬 结局生成器 — 动态多重结局
// ============================================================

class EndingGenerator {
  constructor(apiClient) {
    this.api = apiClient;
  }

  /**
   * 根据完整游戏历史动态生成个性化结局
   * @param {Object} gameState - 完整游戏状态
   * @param {MemoryStore} memory - 记忆系统
   * @param {Array} npcs - NPC Agent列表
   */
  async generateEnding(gameState, memory, npcs) {
    const { parameters, choicesHistory } = gameState;

    // 分析玩家行为倾向
    const behaviorAnalysis = this._analyzeBehavior(choicesHistory, parameters);
    
    // 判定结局类型
    const endingType = this._determineEndingType(parameters, behaviorAnalysis);

    // 构建结局生成的 prompt
    const prompt = this._buildEndingPrompt(endingType, behaviorAnalysis, parameters, memory, npcs);

    try {
      const endingText = await this.api.chat([
        { role: 'system', content: ENDING_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ], { stream: false });

      return {
        type: endingType.id,
        title: endingType.title,
        subtitle: endingType.subtitle,
        narrative: endingText,
        badge: endingType.badge,
        fates: this._generateFates(endingType, npcs),
        achievements: this._generateAchievements(behaviorAnalysis, choicesHistory, parameters)
      };
    } catch (e) {
      // API失败时使用模板结局作为fallback
      console.warn('结局生成API调用失败，使用模板结局:', e);
      return this._generateTemplateEnding(endingType, npcs);
    }
  }

  /** 分析玩家行为模式 */
  _analyzeBehavior(choicesHistory, params) {
    const choices = choicesHistory || [];
    
    // 统计选择倾向
    let aggressiveCount = 0, diplomaticCount = 0, cautiousCount = 0, boldCount = 0;
    for (const c of choices) {
      const id = c.choice || '';
      if (id.includes('war') || id.includes('attack') || id.includes('confront')) aggressiveCount++;
      if (id.includes('peace') || id.includes('wait') || id.contains('observe')) cautiousCount++;
      if (id.includes('wise') || id.includes('talk') || id.includes('diplomacy')) diplomaticCount++;
      if (id.includes('bold') || id.includes('direct') || id.includes('reveal')) boldCount++;
    }

    // 判断主导策略
    const totals = { aggressive: aggressiveCount, diplomatic: diplomaticCount, cautious: cautiousCount, bold: boldCount };
    const dominant = Object.entries(totals).sort((a,b) => b[1]-a[1])[0][0];

    return {
      strategy: dominant,
      strategyCounts: totals,
      totalChoices: choices.length,
      keyMoments: choices.filter(c => c.choice?.includes('declare_war') || c.choice?.includes('cinematic')),
      cpRoute: params.fu_yunxi_affection >= 60 ? 'fu_yunxi' : 
                params.wei_rufeng_affection >= 60 ? 'wei_rufeng' : 'none',
      darknessPath: params.darkness_value >= 60,
      revengeComplete: params.revenge_progress >= 80
    };
  }

  /** 判定结局类型 */
  _determineEndingType(params, behavior) {
    const { fu_yunxi_affection, revenge_progress, darkness_value, player_wisdom, player_courage } = params;

    if (darkness_value >= 70 && revenge_progress >= 80)
      return { id: 'dark_end', title: 'Dark End · 黑莲花', subtitle: '你赢得了世界，却输了自己', badge: '🖤' };
    if (fu_yunxi_affection >= 85 && revenge_progress >= 85)
      return { id: 'true_end', title: 'True End · 重生花开', subtitle: '你拥有了完整的人生', badge: '🌸' };
    if (fu_yunxi_affection >= 55 && revenge_progress >= 55)
      return { id: 'good_end', title: 'Good End · 岁月静好', subtitle: '终于走出了阴霾', badge: '✨' };
    if (player_wisdom < 20 || revenge_progress < 25)
      return { id: 'bad_end', title: 'Bad End · 梦碎重来', subtitle: '轮回之中还有希望', badge: '💔' };

    return { id: 'normal_end', title: 'Normal End · 浮生若梦', subtitle: '未来还在自己手中', badge: '🌙' };
  }

  /** 构建结局生成的 Prompt */
  _buildEndingPrompt(endingType, behavior, params, memory, npcs) {
    const importantEvents = memory.longTerm
      .filter(m => m.importance >= 6)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(-10)
      .map(m => `${m.summary}`)
      .join('\n');

    return `请为这个互动文游游戏生成一个【${endingType.title}】类型的结局。

## 结局类型说明
- ID: ${endingType.id}
- 标题: ${endingType.title}
- 副标题: ${endingType.subtitle}

## 玩家行为分析
- 主导策略: ${behavior.strategy} (${JSON.stringify(behavior.strategyCounts)})
- 总选择数: ${behavior.totalChoices}
- CP路线: ${behavior.cpRoute}
- 黑化路径: ${behavior.darknessPath ? '是' : '否'}
- 复仇完成: ${behavior.revengeComplete ? '是' : '否'}

## 当前参数
- 傅云夕好感度: ${params.fu_yunxi_affection}
- 卫如风执念值: ${params.wei_rufeng_affection}
- 周氏敌意值: ${params.zhou_shi_hostility}
- 庄语山敌意值: ${params.zhuang_yushan_hostility}
- 明哥儿信任度: ${params.hanming_trust}
- 复仇进度: ${params.revenge_progress}
- 智谋值: ${params.player_wisdom}
- 勇气值: ${params.player_courage}
- 黑化值: ${params.darkness_value}

## 重要剧情节点（按时间顺序）
${importantEvents || '无'}

## 要求
1. 写一段300-500字的结局叙事，要有画面感和情感冲击力
2. 提及至少3个重要NPC的最终命运
3. 符合${endingType.title}的基调
4. 语言风格要与正文一致（古风言情）
5. 给出一个令人难忘的最后一句台词或画面

请直接输出结局文本，不需要额外标题。`;
  }

  /** 生成各角色命运 */
  _generateFates(endingType, npcs) {
    // 基于结局类型返回各角色命运
    const fateMap = {
      true_end: {
        'fu_yunxi': '终身伴侣，相守白头',
        'ji_lan': '嫁得良人，幸福美满',
        'chen_mama': '安享晚年，含饴弄孙',
        'zhou_shi': '别院赎罪，了却余生',
        'zhuang_yushan': '削发为尼，青灯古佛',
        'wei_rufeng': '放下执念，远走天涯',
        'hanming': '金榜题名，成才成人'
      },
      dark_end: {
        'fu_yunxi': '失望离去，形同陌路',
        'ji_lan': '为你而死',
        'chen_mana': '忧愤而终',
        'zhou_shi': '被你彻底摧毁',
        'zhuang_yushan': '生不如死',
        'wei_rufeng': '被你利用后抛弃',
        'hanming': '畏惧你，远离你'
      },
      good_end: {
        'fu_yunxi': '心意相通，携手同行',
        'ji_lan': '姐妹情深',
        'chen_mama': '欣慰安详',
        'zhou_shi': '受到惩罚但不至于毁灭',
        'zhuang_yushan': '自食其果',
        'wei_rufeng': '释然离开',
        'hanming': '前程似锦'
      }
    };
    return fateMap[endingType.id] || fateMap['good_end'];
  }

  /** 生成成就列表 */
  _generateAchievements(behavior, choices, params) {
    const achievements = [];
    if (params.fu_yunxi_affection >= 40) achievements.push({ icon: '💍', name: '祠堂之约', unlocked: true });
    if (choices.some(c => c.choice === 'declare_war')) achievements.push({ icon: '🏆', name: '永不为妾', unlocked: true });
    if (behavior.darknessPath) achievements.push({ icon: '🖤', name: '黑莲花觉醒', unlocked: true });
    if (params.revenge_progress >= 80) achievements.push({ icon: '⚔️', name: '大仇得报', unlocked: true });
    achievements.push({ icon: '🎭', name: '重生之旅', unlocked: true }); // 至少玩了
    return achievements;
  }

  /** 模板结局（API失败时的fallback） */
  _generateTemplateEnding(endingType, npcs) {
    return {
      type: endingType.id,
      title: endingType.title,
      subtitle: endingType.subtitle,
      narrative: this._getTemplateNarrative(endingType.id),
      badge: endingType.badge,
      fates: this._generateFates(endingType, npcs),
      achievements: []
    };
  }

  _getTemplateNarrative(type) {
    const templates = {
      true_end: '雪停了。\n\n你站在庭院中，看着漫天飞舞的白雪渐渐消融。身后传来熟悉的脚步声——是他。\n\n"想什么呢？"他的声音一如既往地清润。\n\n"在想......这一生，总算没有白白重来。"\n\n他轻轻握住你的手，掌心的温度透过寒冷传过来。远处传来孩子们的笑声，是明哥儿在和汲蓝打雪仗。\n\n前世的血与泪，终于化作了今生的暖阳。',
      dark_end: '所有人都跪在你面前，瑟瑟发抖。\n\n你居高临下地看着他们——曾经欺辱你的人、背叛你的人、伤害你的人。如今，他们都在你的脚下颤抖。\n\n"求求您......饶命......"周氏的声音嘶哑破碎。\n\n你没有说话，只是微微抬了抬眼皮。下一刻，她就被拖了下去。\n\n你赢了。彻彻底底地赢了。\n\n只是......为什么心里空荡荡的？那个曾经说要护你一生的人，此刻正站在人群之外，用一种你从未见过的眼神看着你。\n\n失望？恐惧？还是......悲哀？',
      good_end: '春暖花开时节，你坐在廊下看书。\n\n明哥儿已经长高了，正在院子里练字。汲蓝和姝红在一旁说着悄悄话，时不时发出笑声。陈妈妈端着茶点走来，脸上的皱纹里都是慈祥。\n\n一切都很安静，很美好。\n\n前世那些痛苦的记忆，仿佛已经是上辈子的事了。你深吸一口气，闻到了花香。\n\n这一世，活得很好。',
      bad_end: '你又回到了原点。\n\n睁开眼的时候，还是那间偏殿，还是那盏孤灯。所有的一切努力，似乎都付诸东流。\n\n不......不对。\n\n你还记得这一切。记得那些人的脸，记得那些话，记得那些痛。\n\n你握紧了拳头。这一次，你不会再犯同样的错了。\n\n窗外，雪又开始下了。',
      normal_end: '故事还没有结束。\n\n前方还有很多未知在等着你。但你已经不再是当初那个任人摆布的小姑娘了。\n\n你抬起头，迎着阳光走去。\n\n不管未来如何，至少这一次，命运掌握在自己手里。'
    };
    return templates[type] || templates.normal_end;
  }
}

// ============================================================
//  🏗️ 结局 System Prompt
// ============================================================

const ENDING_SYSTEM_PROMPT = `你是一个专业的互动小说/视觉小说结局撰写者。

你的任务是根据玩家的游戏数据和选择历史，生成一个高质量、情感丰富的个性化结局。

写作要求：
1. 古风言情小说风格（参考《重生之贵女难求》这类宅斗复仇文）
2. 有画面感，善用环境描写烘托氛围
3. 情感层次丰富，不要平铺直叙
4. 要有"收束感"，让整个故事有一个有力的结尾
5. 可以留白，但不要烂尾
6. 字数300-500字`;

// ============================================================
//  🎭 NPC 人设库（基于原著）
// ============================================================

const NPC_PROFILES = {
  fu_yunxi: {
    id: 'fu_yunxi', name: '傅云夕', avatar: '❄️',
    personality: '清冷矜贵，内敛深情，智勇双全。表面淡漠疏离，实则内心细腻柔软。行事果断利落，不拖泥带水。对在意的人会默默守护，嘴上不说但行动证明一切。有极强的责任感和正义感。',
    speechStyle: '话少精炼，用词考究。语气偏冷静克制，但在涉及在乎的人时会流露温度。偶尔会用反问句或简短陈述表达关心。不会说甜言蜜语，行动派。称呼女主时可能用"你"或她的名字/称号。',
    background: '侯府世子，出身显赫却不倚仗家世。文武双全，在京中颇有声望。外表俊美如谪仙，实则城府极深。对家族内部的勾心斗角了然于胸，选择站在正义一方。',
    relationToPlayer: '从最初的疏离冷漠（因为政治联姻的不情愿），到逐渐被她的坚韧和智慧吸引。内心挣扎过是否该动情，最终认定她是值得守护的人。感情发展缓慢而深沉。',
    mood: '疏离', attitude: '观察中'
  },

  ji_lan: {
    id: 'ji_lan', name: '汲蓝', avatar: '👧🏻',
    personality: '活泼机灵，忠心耿耿，消息灵通。年纪虽小但心思细腻，对主人的事比自己的还上心。有点小八卦属性，但关键时刻靠得住。嘴快心软，容易着急上火。',
    speechStyle: '口语化，活泼俏皮。喜欢叫"小姐"，语气亲昵自然。着急时会连珠炮似的说一大堆。开心时会叽叽喳喳，难过时会强撑着不说但眼睛红红的。偶尔冒出几句意外的通透话。',
    background: '女主的贴身大丫鬟，从小一起长大。在前世为主人挡刀而死，是女主最信任的人之一。',
    relationToPlayer: '主仆情深胜似姐妹。全心全意维护女主，看到女主受委屈比自己难受还会生气。会在背后默默帮女主打听消息、收拾烂摊子。',
    mood: '活泼', attitude: '忠诚'
  },

  shu_hong: {
    id: 'shu_hong', name: '姝红', avatar: '👧🏻',
    personality: '沉稳冷静，行事滴水不漏。和汲蓝形成互补——一个火热一个冷静。观察力极强，善于察言观色。话少但每句话都切中要害。有超出年龄的成熟。',
    speechStyle: '简洁精准，不带多余废话。语气平稳，很少表露强烈情绪。遇到大事反而更冷静。偶尔会给出一针见血的分析和建议。叫"小姐"但语气比汲蓝更稳重。',
    background: '女主贴身二丫鬟。前世同样为主人牺牲。是女主的"军师型"助手。',
    relationToPlayer: '绝对忠诚，但方式更理性。会给女主提建议而不是一味顺从。是女主身边最可靠的人。',
    mood: '沉稳', attitude: '忠诚'
  },

  chen_mama: {
    id: 'chen_mama', name: '陈妈妈', avatar: '👵🏻',
    personality: '慈祥严厉并存的老乳母。视女主如己出，保护欲极强。阅历深厚，看人很准。传统观念重但开明，关键时刻能做出正确判断。爱唠叨但每句都是为了你好。',
    speechStyle: '长辈口吻，带着关切的絮叨。喜欢说"姑娘""我的姑娘"。语气里总带着心疼和担忧。着急时会反复叮嘱同一件事。提到女主已故的母亲时会哽咽。',
    background: '女主生母王氏留下的乳母，从小照顾女主。是女主在这个世界上最亲近的家人般的存在。',
    relationToPlayer: '如同母女。女主是她看着长大的，每一份苦都看在眼里疼在心里。愿意为女主付出一切包括性命。',
    mood: '牵挂', attitude: '守护'
  },

  zhou_shi: {
    id: 'zhou_shi', name: '周氏', avatar: '🐍',
    personality: '阴险狡诈，两面三刀。表面上是一副慈母面孔，背地里使尽手段。极度自私，为了自己的利益可以牺牲任何人。善于利用规则和人脉来达成目的。嫉妒心和控制欲极强。',
    speechStyle: '甜里藏针，笑里带刀。表面客气礼貌，实际每句话都有陷阱。喜欢用"我是为你好"来包装恶意。被揭穿时会瞬间变脸。对下人颐指气使，对上级阿谀奉承。',
    background: '女主的继母，府中的当家主母。通过各种手段打压女主及其生母留下的势力。是前期主要反派之一。',
    relationToPlayer: '表面上的继母，实则是最大的威胁之一。想要除掉女主或完全控制她。把女主当作棋子和眼中钉。',
    mood: '虚伪', attitude: '敌对'
  },

  zhuang_yushan: {
    id: 'zhuang_yushan', name: '庄语山', avatar: '🦊',
    personality: '外表柔弱实则心机深沉。善于示弱装可怜来博取同情。嫉妒心极强，特别是对女主。擅长挑拨离间和借刀杀人。有一定的美貌资本并善于利用。内心自卑又自负。',
    speechStyle: '娇滴滴的语气，喜欢装无辜。"姐姐怎么会这样想呢？""妹妹不敢......"是口头禅。被戳穿时会立刻切换成恶毒嘴脸。善于用眼泪作为武器。',
    background: '女主的庶姐（父亲的妾室所生）。处处和女主比较，事事想压女主一头。是女主在家族内部的直接竞争对手。',
    relationToPlayer: '嫉妒和敌意的混合体。既想超越女主又怕女主。表面姐妹情深，背后捅刀子。',
    mood: '伪善', attitude: '嫉妒'
  },

  wei_rufeng: {
    id: 'wei_rufeng', name: '卫如风', avatar: '🐺',
    personality: '霸道偏执，占有欲强。行事狠辣不留余地。对认定的目标执着到近乎疯狂。有黑暗的过去导致性格扭曲。不是传统意义上的好人但有自己的一套逻辑。',
    speechStyle: '强势直接，不善委婉。语气常带命令或质问的口吻。对女主会有罕见的温柔但很快又会变回强势。会说一些让人不适但又莫名触动的话。',
    background: '身世神秘的男子，与女主有复杂的过往纠葛。代表了一条不同于傅云夕的感情线（暗线）。',
    relationToPlayer: '复杂的爱恨交织。既想得到她又想毁掉她（如果得不到的话）。是一种病态的执念。',
    mood: '危险', attitude: '执念'
  },

  hanming: {
    id: 'hanming', name: '庄寒明（明哥儿）', avatar: '👦🏻',
    personality: '天真聪慧，懂事早熟。虽然是孩子但有超乎年龄的理解力。对姐姐（女主）极其依赖和崇拜。善良纯真但也能感受到周围的恶意。有很强的学习能力和上进心。',
    speechStyle: '孩子的语气但措辞偏成熟。叫"姐姐"时声音甜甜的。会说出一些让大人惊讶的懂事话。害怕时会小声但不会哭闹。开心时会拉着姐姐的手蹦跳。',
    background: '女主的亲弟弟（同父同母）。前世被反派利用对付女主，最后惨死。是女主重生后最想保护的人。',
    relationToPlayer: '全世界最信任的人就是姐姐。姐姐说什么都对。会偷偷为姐姐做力所能及的小事来表达爱。',
    mood: '依赖', attitude: '信任'
  }
};

// ============================================================
//  ⚙️ 工厂函数：创建完整的 AI Agent 系统
// ============================================================

function createAIAgentSystem(apiConfig = {}) {
  // 创建 API 客户端
  const apiClient = new AIApiClient(apiConfig);

  // 创建记忆系统
  const memoryStore = new MemoryStore();

  // 创建 NPC Agents
  const npcAgents = {};
  for (const [key, profile] of Object.entries(NPC_PROFILES)) {
    npcAgents[key] = new NPCAgent(profile);
  }

  // 创建结局生成器
  const endingGenerator = new EndingGenerator(apiClient);

  return {
    api: apiClient,
    memory: memoryStore,
    agents: npcAgents,
    endingGen: endingGenerator,

    /** 获取指定 NPC 的 Agent */
    getAgent(id) { return this.agents[id]; },

    /** 让指定 NPC 回应玩家输入 */
    async npcRespond(npcId, userInput, sceneContext, currentParams, callbacks = {}) {
      const agent = this.agents[npcId];
      if (!agent) throw new Error(`未找到NPC: ${npcId}`);

      const memoryContext = this.memory.getContextForPrompt(npcId, currentParams);
      const messages = agent.buildMessages(userInput, memoryContext, sceneContext);

      // 记录玩家输入到记忆
      this.memory.addDialogue(npcId, 'user', userInput);

      // 调用 API
      const response = await this.api.chat(messages, callbacks);

      // 记录 NPC 回复到记忆
      this.memory.addDialogue(npcId, 'assistant', response);

      // 更新关系
      this.memory.updateRelation(npcId, { lastResponse: response });

      return {
        text: response,
        speaker: agent.name,
        avatar: agent.avatar,
        mood: agent.mood
      };
    },

    /** 生成动态结局 */
    async generateEnding(gameState) {
      return await this.endingGen.generateEnding(gameState, this.memory, this.agents);
    },

    /** 记录关键事件 */
    recordEvent(sceneId, summary, importance, params) {
      this.memory.recordEvent(sceneId, summary, importance, params);
    },

    /** 导出存档数据 */
    exportSave() {
      return {
        memory: this.memory.export(),
        timestamp: Date.now(),
        version: '2.0'
      };
    }
  };
}

// ============================================================
//  🔧 默认配置（可由用户覆盖）
// ============================================================

const DEFAULT_AI_CONFIG = {
  // 在此处填入你的 API Key
  // 推荐使用 GLM-4 (https://open.bigmodel.cn/) 或 DeepSeek
  apiKey: '',
  
  // API 基础 URL（不同服务商不同）
  // 智谱AI: https://open.bigmodel.cn/api/paas/v4
  // DeepSeek: https://api.deepseek.com
  baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
  
  model: 'glm-4-flash',
  maxTokens: 1024,
  temperature: 0.8
};

// 导出供全局使用
if (typeof window !== 'undefined') {
  window.AIAgentEngine = {
    AIApiClient,
    MemoryStore,
    NPCAgent,
    EndingGenerator,
    NPC_PROFILES,
    DEFAULT_AI_CONFIG,
    createAIAgentSystem
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AIApiClient,
    MemoryStore,
    NPCAgent,
    EndingGenerator,
    NPC_PROFILES,
    DEFAULT_AI_CONFIG,
    createAIAgentSystem
  };
}

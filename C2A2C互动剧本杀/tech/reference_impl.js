/**
 * 《重生之贵女难求》C2A2C互动剧本杀 - 技术实现参考
 * 
 * 本文件提供前端/后端开发者的技术接口规范
 * 可用于快速搭建可运行的原型系统
 */

// ==================== 数据模型定义 ====================

/**
 * 玩家状态对象
 */
const PlayerState = {
  playerId: "string",           // 玩家唯一ID
  characterId: "string",        // 角色ID (引用 characters.json)
  currentPhase: "string",       // 当前所处阶段
  location: "string",           // 当前位置
  
  // 属性值
  attributes: {
    health: 100,                // 生命值
    sanity: 100,                // 理智值
    reputation: 50,             // 声望值
    influence: 30               // 影响力
  },
  
  // 资源
  resources: {
    gold: 0,                    // 金钱
    secrets: [],                // 已获知的秘密列表
    evidence: [],               // 已收集的证据
    items: [],                  // 持有物品
    alliances: [],              // 当前同盟
  },
  
  // 关系网 (key: 目标玩家ID, value: 关系数值 -100~100)
  relationships: {},
  
  // 技能状态
  skills: {
    skillId: {
      usesRemaining: 0,         // 剩余使用次数
      cooldown: 0,              // 当前冷却回合
      isUnlocked: false         // 是否已解锁
    }
  },
  
  // 特殊标记
  flags: {
    isReborn: false,            // 重生标记（庄寒雁专用）
    isExposed: false,           // 身份暴露
    isDead: false,              // 死亡状态
    darkRoute: false,           // 黑化路线
    romanceLocked: null         // 锁定的CP对象
  }
};

/**
 * 游戏全局状态
 */
const GameState = {
  gameId: "string",
  status: "waiting | playing | paused | ended",
  currentAct: 1,
  currentScene: "",
  turnNumber: 0,
  roundTimer: 0,
  
  // 全局标志（影响剧情走向）
  globalFlags: {
    revengeProgress: 0,         // 复仇进度 0-100
    romanceLevel: {},           // 感情线进度
    villainDefeatLevel: 0,      // 反派败亡度
    branchDeviation: 0.0,       // 分支偏离度 0.0-1.0
    deathCount: 0,              // 死亡人数
    secretsFoundRate: 0.0       // 秘密发现率
  },
  
  // 事件日志
  eventLog: [],
  
  // 玩家列表
  players: [],
  
  // NPC状态
  npcs: {}
};


// ==================== 核心API接口定义 ====================

const GameAPI = {
  
  /**
   * 创建新游戏房间
   */
  async createRoom(config) {
    /*
    POST /api/game/create
    Request Body:
    {
      gameConfigId: "chongsheng_gui_nv_001",
      playerCount: 6,
      customRules: {}  // 可选的自定义规则覆盖
    }
    
    Response:
    {
      roomId: "room_xxx",
      inviteCode: "ABC123",
      status: "waiting",
      availableCharacters: [...]  // 可选角色列表
    }
    */
  },

  /**
   * 玩家加入房间并选择角色
   */
  async joinRoom(roomId, playerId, characterId) {
    /*
    POST /api/game/:roomId/join
    Request Body:
    {
      playerId: "player_xxx",
      characterId: "zhuang_hanyan"  // 选择的角色
    }
    
    Response:
    {
      success: true,
      characterData: {...},        // 完整角色信息
      privateInfo: {...}           // 角色私密信息（仅自己可见）
    }
    */
  },

  /**
   * 执行玩家行动
   */
  async executeAction(roomId, playerId, action) {
    /*
    POST /api/game/:roomId/action
    Request Body:
    {
      playerId: "player_xxx",
      action: {
        type: "move | talk | skill_use | investigate | trade | vote | attack",
        target: "target_id or null",
        payload: {},
        metadata: {
          isPrivate: false,        // 是否为私密行动
          channelId: "public"      // 目标频道
        }
      }
    }
    
    Response:
    {
      success: true,
      result: {
        narrative: "...",          // AI生成的叙事文本
        effects: [...],            // 产生的效果列表
        stateChanges: {...},       // 状态变化
        butterflyEffects: [...],   // 蝴蝶效应提示
        nextOptions: [...]         // 下一步可选行动
      },
      visibility: "public | faction | private"
    }
    */
  },

  /**
   * 私聊消息
   */
  async sendPrivateMessage(roomId, fromId, toId, content) {
    /*
    WS /ws/room/:roomId/private
    Payload:
    {
      from: "player_xxx",
      to: "player_xxx",
      content: "message text",
      type: "text | trade_offer | alliance_request"
    }
    */
  },

  /**
   * 获取当前场景信息
   */
  async getSceneState(roomId, playerId) {
    /*
    GET /api/game/:roomId/scene?playerId=xxx
    
    Response:
    {
      scene: {
        id: "s2_1",
        name: "【迎亲】继母入门",
        description: "...",
        atmosphere: {...},
        availableActions: [...],
        activeNPCs: [...],
        timeLimit: 300  // 剩余时间(秒)
      },
      personalContext: {
        mood: "警惕",
        secretHints: [...],
        relationshipSummary: [...]
      }
    }
    */
  },

  /**
   * 使用技能
   */
  async useSkill(roomId, playerId, skillId, targetId) {
    /*
    POST /api/game/:roomId/skill
    Request Body:
    {
      playerId: "player_xxx",
      skillId: "skill_rebirth_memory",
      targetId: "target_player_id or null"
    }
    
    Response:
    {
      success: true,
      skillResult: {
        narration: "你的脑海中闪过前世的画面...",
        effect: { type: "reveal_secret", target: "...", content: "..." },
        cost: { usesReduced: 1, newCooldown: 0 }
      }
    }
    */
  },

  /**
   * 投票/集体决策
   */
  async submitVote(roomId, playerId, voteType, targetId) {
    /*
    POST /api/game/:roomId/vote
    Request Body:
    {
      playerId: "player_xxx",
      voteType: "exile | acquit | decide_fate",
      targetId: "target_player_or_option"
    }
    */
  },

  /**
   * 获取游戏结局
   */
  async getEnding(roomId) {
    /*
    GET /api/game/:roomId/ending
    
    Response:
    {
      endingType: "true_end | good_end | normal_end | bad_end | dark_end",
      endingTitle: "🌸 【True End】重生花开",
      cinematic: "完整结局演绎文本...",
      epilogue: {
        characterFates: {...},
        statistics: {...},
        achievements: [...]
      },
      credits: [...]
    }
    */
  }
};


// ==================== AI引擎集成伪代码 ====================

/**
 * AI叙事引擎核心逻辑
 */
class NarrativeEngine {
  
  constructor(gameConfig, aiClient) {
    this.config = gameConfig;
    this.ai = aiClient;  // AI API客户端
    this.stateHistory = [];
  }

  /**
   * 处理玩家行动，生成叙事响应
   */
  async processAction(playerAction, gameState) {
    // 1. 构建上下文prompt
    const contextPrompt = this._buildContextPrompt(playerAction, gameState);
    
    // 2. 调用AI生成响应
    const aiResponse = await this.ai.chatCompletion({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },  // 参考 ai_engine.md
        { role: 'user', content: contextPrompt }
      ],
      temperature: 0.8,
      max_tokens: 2000
    });
    
    // 3. 解析AI响应为结构化数据
    const parsedResponse = this._parseAIResponse(aiResponse);
    
    // 4. 计算蝴蝶效应
    const butterflyEffects = this._calculateButterflyEffect(
      playerAction, 
      parsedResponse, 
      gameState
    );
    
    // 5. 更新游戏状态
    const newState = this._updateGameState(
      gameState, 
      parsedResponse.effects, 
      butterflyEffects
    );
    
    // 6. 记录历史（用于分支回溯）
    this.stateHistory.push({
      action: playerAction,
      response: parsedResponse,
      previousState: gameState,
      newState: newState
    });
    
    return {
      narrative: parsedResponse.narrative,
      npcReactions: parsedResponse.npcReactions,
      systemHints: parsedResponse.systemHints,
      effects: parsedResponse.effects,
      butterflyEffects: butterflyEffects,
      nextOptions: this._generateNextOptions(newState),
      newState: newState
    };
  }

  /**
   * 构建AI上下文Prompt
   */
  _buildContextPrompt(action, state) {
    return `
【当前情境】
- 场景：${state.currentScene.name}
- 时间：${state.inGameTime}
- 在场角色：${this._getPresentCharacters(state)}
- 氛围：${state.currentScene.atmosphere}

【${action.playerName}的行动】
- 行动类型：${action.type}
- 行动内容：${action.content}
- 目标对象：${action.target || '无'}

【相关角色状态】
${this._formatCharacterStates(state)}

【近期事件记录】
${this._formatRecentEvents(state)}

【请生成】
1. 场景描述（感官细节+氛围渲染）
2. NPC即时反应
3. 行动的直接后果
4. 可能的连锁反应（蝴蝶效应）
5. 系统提示（可用行动建议）
`;
  }

  /**
   * 结局计算
   */
  async calculateEnding(gameState) {
    const metrics = this._extractEndingMetrics(gameState);
    
    const prompt = `
根据以下游戏数据，计算最终结局：

【关键指标】
- 复仇进度：${metrics.revengeScore}
- 感情线进度：${JSON.stringify(metrics.romanceScores)}
- 反派败亡度：${metrics.villainDefeat}
- 死亡人数：${metrics.deathCount}
- 关键决策记录：${metrics.keyDecisions.join(', ')}

【可选结局】
- True End: revenge≥80, romance≥70, villainDefeat≥90, deaths≤2
- Good End: revenge≥50, villainDefeat≥60, 有宽恕行为
- Normal End: 基本通关条件满足
- Bad End: revenge<30 或 主角死亡
- Dark End: 选择黑化 + 肃清所有敌人

请返回：
1. 最终结局类型
2. 结局演绎文本（500字以上，第一人称视角）
3. 各角色后续命运
4. 解锁的成就
`;

    const result = await this.ai.chatCompletion({ /* ... */ });
    return this._parseEndingResult(result);
  }


  // ==================== 分支管理 ====================

  /**
   * 检测是否需要触发分支
   */
  _detectBranchPoint(action, state) {
    const triggers = this.config.branchTriggers;
    
    for (let trigger of triggers) {
      if (this._matchTrigger(trigger, action, state)) {
        return {
          branchType: trigger.type,  // A/B/C
          branchId: trigger.id,
          alternatives: trigger.alternatives
        };
      }
    }
    return null;
  }

  /**
   * 合并分支（当到达锚点时）
   */
  mergeBranches(mainBranch, sideBranches, anchorScene) {
    // 幽灵选择机制：未选的分支以回忆/NPC口述形式存在
    // 世界记忆：之前的分支选择仍影响角色状态
    
    return {
      mergedNarrative: this._generateMergedNarrative(mainBranch, sideBranches),
      persistentEffects: this._extractPersistentEffects(sideBranches),
      ghostMemories: this._generateGhostMemories(sideBranches)
    };
  }
}


// ==================== 实时同步协议 ====================

/**
 * WebSocket事件类型定义
 */
const WS_EVENTS = {
  // 连接管理
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  
  // 游戏流程
  PHASE_START: 'phase:start',
  PHASE_END: 'phase:end',
  TURN_BEGIN: 'turn:begin',
  TURN_END: 'turn:end',
  
  // 玩家行动
  ACTION_SUBMITTED: 'action:submitted',
  ACTION_RESULT: 'action:result',        // 广播结果
  ACTION_RESULT_PRIVATE: 'action:result:private',  // 私密结果
  
  // 社交互动
  MESSAGE_PUBLIC: 'message:public',
  MESSAGE_PRIVATE: 'message:private',
  ALLIANCE_FORMED: 'alliance:formed',
  ALLIANCE_BROKEN: 'alliance:broken',
  TRADE_OFFER: 'trade:offer',
  TRADE_ACCEPT: 'trade:accept',
  
  // 投票系统
  VOTE_START: 'vote:start',
  VOTE_CAST: 'vote:cast',
  VOTE_RESULT: 'vote:result',
  
  // 状态同步
  STATE_SYNC: 'state:sync',              // 定时全量同步
  STATE_DELTA: 'state:delta',            // 增量更新
  
  // 系统事件
  SYSTEM_NOTICE: 'system:notice',
  ERROR: 'error'
};


// ==================== 前端组件示例 ====================

/**
 * React组件示例：游戏主界面
 * 
 * 注：这是伪代码，展示推荐的前端架构
 */

/*
<GameLayout>
  <HeaderBar 
    roomInfo={roomInfo} 
    timer={gameTimer}
    onMenuClick={...}
  />
  
  <main className="game-main">
    {/* 左侧：场景与叙事 * /}
    <ScenePanel>
      <SceneDescription 
        text={currentScene.description}
        atmosphere={currentScene.atmosphere}
        isAnimating={true}
      />
      <NarrativeText 
        content={lastResponse.narrative}
        typewriterEffect={true}
      />
      <NPCReactionPanel reactions={lastResponse.npcReactions} />
    </ScenePanel>
    
    {/* 中间：操作区 * /}
    <ActionPanel>
      <ActionGrid actions={availableActions} onSelect={handleActionSelect} />
      <SkillBar skills={mySkills} onUse={handleSkillUse} />
      <InputBar onSend={handleCustomInput} placeholder="描述你想做的..." />
    </ActionPanel>
    
    {/* 右侧：信息面板 * /}
    <Sidebar>
      <RelationshipMap relationships={myRelationships} />
      <InventoryPanel items={myItems} secrets={mySecrets} />
      <PlayerList players={allPlayers} onlineStatus={onlineStatus} />
      <MiniMap location={currentLocation} accessibleLocations={[]} />
    </Sidebar>
  </main>
  
  {/* 底部：聊天/社交 * /}
  <ChatPanel>
    <ChannelTabs channels={['公开', '私聊', '阵营']} />
    <MessageList messages={chatMessages} />
    <MessageInput onSend={sendMessage} />
  </ChatPanel>
  
  {/* 弹窗层 * /}
  <Modals>
    <PrivateChatModal />        {/* 私聊窗口 * /}
    <TradeModal />             {/* 交易界面 * /}
    <VoteModal />              {* 投票界面 * /}
    <EvidenceBoardModal />     {* 证据板 * /}
    <CharacterSheetModal />    {* 角色卡详情 * /}
  </Modals>
</GameLayout>
*/


// ==================== 导出 ====================

module.exports = {
  PlayerState,
  GameState,
  GameAPI,
  NarrativeEngine,
  WS_EVENTS
};

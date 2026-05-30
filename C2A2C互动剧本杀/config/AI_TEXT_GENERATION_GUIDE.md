# AI文生文引擎 v5.0 - 完整使用指南

> **文件位置**: `/config/ai_text_generation_engine.json`  
> **版本**: 5.0  
> **适用场景**: 从知乎盐选小说原文 → 自动生成完整互动剧本的离线生产流水线

---

## 📖 引擎概述

### 这是什么？

**AI文生文引擎** 是一个**自动化内容生产流水线**（Content Generation Pipeline），能够将任意古言/重生/宅斗类小说原文自动转化为 C2A2C 互动文游剧本。

### 与现有 `ai_engine.md` 的区别

| 维度 | ai_engine.md (运行时引擎) | **ai_text_generation_engine.json (本引擎)** |
|------|-------------------------|------------------------------------------|
| **用途** | 游戏进行中的实时AI交互 | **从小说生成剧本的预处理流程** |
| **触发时机** | 用户游玩时实时调用 | **内容生产阶段一次性调用** |
| **输入** | 玩家行为 + 当前游戏状态 | **原始小说文本（10万-100万字）** |
| **输出** | 即时剧情响应 + NPC对话 | **完整的 interactive_script.json** |
| **类比** | 游戏的"大脑" | **游戏的"剧本编辑器"** |

两者**互补协作**：
1. 本引擎（v5.0）负责"写剧本"（离线）
2. 原有引擎（ai_engine.md）负责"演剧本"（在线）

---

## 🚀 快速开始：3步生成剧本

### 第一步：导入小说

```bash
curl -X POST https://api.novelworld.ai/v1/engine/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "novelText": "《重生之贵女难求》全文...",
    "novelMetadata": {
      "title": "重生之贵女难求",
      "author": "千山茶客",
      "platform": "知乎盐选",
      "genre": "古言重生复仇宅斗言情",
      "wordCount": 480000
    }
  }'
```

**返回**：`{ "jobId": "ingest_abc123", "status": "processing", "estimatedTime": 8 }`

**这一步做了什么？**
- ✅ 清洗文本（去除广告、标准化标点）
- ✅ 智能分割章节（识别80+个章节边界）
- ✅ 抽取所有对话（建立2000+条对话数据库）
- ✅ 分类段落类型（叙事/描写/心理/过渡）

---

### 第二步：智能解析

```bash
curl -X POST https://api.novelworld.ai/v1/engine/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "ingest_abc123",
    "analysisOptions": {
      "extractCharacters": true,        // 提取角色
      "buildRelations": true,           // 构建关系网络
      "extractWorldview": true,         // 提取世界观
      "buildTimeline": true,            // 梳理时间线
      "analyzeThemes": true             // 分析主题情感
    }
  }'
```

**返回**：
```json
{
  "jobId": "analyze_def456",
  "status": "completed",
  "processingTime": 12,
  "outputs": {
    "charactersUrl": "https://cdn.../characters.json",
    "relationsUrl": "https://cdn.../relations.json",
    "worldviewUrl": "https://cdn.../worldview.json",
    "timelineUrl": "https://cdn.../timeline.json"
  },
  "summary": {
    "totalCharactersExtracted": 28,
    "playableRolesIdentified": 5,
    "npcRolesIdentified": 10,
    "relationEdgesBuilt": 67,
    "locationsMapped": 23,
    "timelineEvents": 156,
    "coreThemes": ["重生逆袭", "女性觉醒", "复仇正义", "真爱专一"]
  }
}
```

**这一步产出了什么？**

#### 📋 角色数据库 (characters.json)

```json
{
  "playableRoles": [
    {
      "roleId": "zhuang_hanyan",
      "name": "庄寒雁",
      "title": "侯门嫡女·重生者",
      "isProtagonist": true,
      "personalityBase": "聪慧坚韧、外柔内刚、有仇必报、重情重义",
      "arc": "从被欺凌的嫡女 → 复仇成功 → 找到真爱 → 人生圆满",
      "uniqueAbility": "前世记忆（知晓未来事件和敌人阴谋）",
      "recommendedForBeginners": true,
      "difficultyRating": "normal",
      "detailedProfile": {
        // AI提取的完整角色画像（见配置文件中的 promptTemplate）
        "fullName": "庄寒雁",
        "aliases": ["四小姐", "雁儿", "四姑娘"],
        "age": "故事开始时12岁，结束时约16岁",
        "gender": "女",
        "socialStatus": "侯府嫡女（后成为玄清王妃）",
        "appearance": "清冷绝尘、英气飒爽，眉眼如画...",
        "personalityTags": ["聪慧", "坚韧", "外柔内刚", "重情重义", "有仇必报"],
        "speakingStyle": "干脆利落但不失分寸，必要时可伪装温婉",
        "coreMotivations": ["保护家人", "完成复仇", "寻找真爱", "自我实现"],
        "fears": ["失去至亲", "重蹈前世覆辙", "信任背叛"]
      }
    },
    // ... 其他4个可玩角色（傅云夕、卫如风、庄语山、周氏）
  ],
  "npcRoles": [
    {
      "roleId": "ji_lan",
      "name": "汲蓝",
      "type": "贴身丫鬟",
      "description": "活泼机灵，消息灵通",
      "loyaltyLevel": "max"
    },
    // ... 其他9个NPC
  ]
}
```

#### 🕸️ 关系网络 (relations.json)

```json
{
  "nodes": [
    { "id": "zhuang_hanyan", "label": "庄寒雁", "group": "protagonist", "size": 30 },
    { "id": "fu_yunxi", "label": "傅云夕", "group": "love_interest", "size": 25 },
    // ... 更多节点
  ],
  "edges": [
    { 
      "source": "zhuang_hanyan", 
      "target": "fu_yunxi", 
      "label": "CP（命中注定）", 
      "value": 0.95, 
      "color": "#FF69B4",
      "type": "romantic",
      "developmentDirection": "improving"
    },
    { 
      "source": "zhuang_hanyan", 
      "target": "zhou_shi", 
      "label": "复仇目标", 
      "value": 0.98, 
      "color": "#8B0000",
      "type": "hostile"
    },
    // ... 更多关系边
  ]
}
```

#### 🌍 世界观设定 (worldview.json)

```json
{
  "temporalSetting": {
    "historicalEra": "架空古代（类唐宋融合）",
    "specificYear": "大宗十三年（推测）",
    "calendarSystem": "传统农历+干支纪年"
  },
  "geographicLocations": [
    {
      "locationId": "zhuang_houfu",
      "name": "庄侯府",
      "type": "mansion",
      "description": "三品大臣庄仕洋的府邸，占地广阔...",
      "subLocations": [
        "清秋苑（女主居所）",
        "前厅",
        "祠堂",
        "后花园",
        "各院落..."
      ]
    },
    // ... 更多地点
  ],
  "socialHierarchy": [
    {
      "level": "皇室",
      "titles": ["皇上", "太后", "皇子", "公主", "郡主"],
      "rights": ["至高无上的权力"]
    },
    {
      "level": "王侯",
      "titles": ["亲王", "郡王", "侯爷", "世子"],
      "rights": ["封地、爵位、朝政参与权"]
    },
    // ... 更多等级
  ],
  "powerFactions": [
    {
      "factionName": "傅云夕阵营",
      "leader": "傅云夕（玄清王）",
      "goals": ["保护庄寒雁", "肃清朝政"],
      "resources": ["王府势力", "军事力量", "皇权信任"]
    },
    // ... 更多阵营
  ]
}
```

---

### 第三步：生成剧本

```bash
curl -X POST https://api.novelworld.ai/v1/engine/generate \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "analyze_def456",
    "generationConfig": {
      "actStructure": "auto",              // 或 custom（手动指定幕结构）
      "sceneDetailLevel": "full",          // standard / full（包含更多细节）
      "includeMiniGames": true,            // 是否嵌入小游戏
      "endingCount": 5,                    // 结局数量
      "targetPlayTime": 240                // 目标时长（分钟），默认240（4小时）
    }
  }'
```

**返回**：`{ "jobId": "generate_ghi789", "status": "completed", "scriptUrl": "https://cdn.../interactive_script.json" }`

**生成的 interactive_script.json 包含**：

| 数据项 | 数量（以《重生之贵女难求》为例） |
|--------|------------------------------|
| 总幕数 | 5 幕 |
| 总场景数 | 18 场 |
| 对话流节点 | 60+ 个 |
| 选项卡组 | 55+ 组（全部带 prefixTag） |
| 可认领角色 | 5 个（女主+男主+反派×3） |
| NPC 角色 | 10 个 |
| 参数系统 | 10 个追踪参数 |
| 结局类型 | 5 种（TE/GE/NE/BE/DE） |
| 关系图谱节点 | 11 个角色 + 动态连线 |
| 预计游玩时长 | 3-4 小时 |

---

## 🔧 高级用法

### 自定义分幕结构

```json
{
  "generationConfig": {
    "actStructure": "custom",
    "customActStructure": [
      {
        "actId": 1,
        "name": "第一幕·噩梦初醒",
        "subtitle": "毒酒重生，决心改变命运",
        "estimatedDuration": 35,
        "sceneCount": 4,
        "keyEvents": ["大婚之夜被毒杀", "重生回十二岁", "决定应对策略"]
      },
      // ... 手动指定每一幕的结构
    ]
  }
}
```

### 指定可选玩角色

```json
{
  "generationConfig": {
    "playableRoleFilter": {
      "includeOnly": ["zhuang_hanyan", "fu_yunxi"],  // 只生成这2个角色的视角
      // 或
      "exclude": ["wei_rufeng"]                        // 排除某个角色
    }
  }
}
```

### 调整难度和节奏

```json
{
  "generationConfig": {
    "difficultyPreset": "casual",     // casual / normal / hardcore / expert
    "pacingPreference": "story_heavy", // story_heavy / balanced / gameplay_heavy
    "choiceComplexity": "medium",      // low / medium / high
    "romanceDepth": "deep",           // light / medium / deep
    "darknessAllowed": true            // 是否允许黑化路线
  }
}
```

---

## 📊 第四步：质量校验

```bash
curl -X POST https://api.novelworld.ai/v1/engine/validate \
  -H "Content-Type: application/json" \
  -d '{
    "scriptId": "generate_ghi789",
    "validationLevel": "rigorous",   // standard / rigorous
    "autoFix": true                  // 自动修复低严重度问题
  }')
```

**返回示例**：
```json
{
  "passed": true,
  "score": 92,
  "verdict": "PASS",
  "moduleScores": {
    "characterConsistency": 94,   // 人设一致性
    "logicCoherence": 90,         // 逻辑连贯性
    "gameBalance": 88,            // 游戏平衡性
    "contentSafety": 95,          // 内容安全
    "copyrightCompliance": 93     // 版权合规
  },
  "issuesFound": {
    "critical": [],
    "major": [
      {
        "module": "logic_coherence",
        "location": "s2_3",
        "description": "富贵楼场景中掌柜的反应与后续情节衔接不够紧密",
        "severity": "major",
        "suggestedFix": "在掌柜震惊后增加一个过渡段落"
      }
    ],
    "minor": [...]
  },
  "autoFixApplied": 3,
  "reportUrl": "https://cdn.../qc_report.json"
}
```

---

## 🎯 Prompt 工程最佳实践

### 角色提取的 Prompt 示例

**输入**：小说中关于"庄寒雁"的所有相关片段  
**使用的 Prompt Template**（来自配置文件的 `stage2_analysis.character_extraction.profile_enrichment.basic_info_extraction`）：

```python
prompt = f"""
根据以下小说片段，提取角色的基本信息：

角色名：{character_name}
相关文本片段（共{mention_count}处提及）：
{text_samples}

请以JSON格式输出：
{{
  "fullName": "全名",
  "aliases": ["别名列表"],
  "age": "年龄或年龄段",
  "gender": "性别",
  "socialStatus": "社会地位",
  "familyRelation": "家族关系",
  "occupation": "职业/身份",
  "appearance": "外貌特征描述（200字以内）",
  "personalityTraits": ["性格标签列表（5-10个）"],
  "speakingStyle": "说话风格描述（100字以内）",
  "coreMotivations": ["核心动机列表（3-5个）"],
  "fears": ["恐惧/弱点列表（2-3个）"],
  "secrets": ["已知秘密列表"]
}}
"""
```

**输出结果**（AI生成的角色档案）：
```json
{
  "fullName": "庄寒雁",
  "aliases": ["四小姐", "雁儿", "四姑娘", "雁姐儿"],
  "age": "12岁（故事起点）→ 约16岁（故事终点）",
  "gender": "女",
  "socialStatus": "庄侯府嫡女（生母为正妻王氏）→ 玄清王妃",
  "familyRelation": "父亲庄仕洋（三品大臣），生母王氏（已故），继母周氏，庶弟庄寒明",
  "occupation": "侯府千金（前期）/ 王妃（后期）",
  "appearance": "眉眼如画，清冷绝尘，气质出众。不是传统意义上的绝色美人，但胜在气度非凡，让人过目难忘。",
  "personalityTraits": ["聪慧", "坚韧", "外柔内刚", "有仇必报", "重情重义", "谨慎但果敢", "善于伪装", "内心柔软"],
  "speakingStyle": "平时干脆利落，必要时可伪装成温柔婉转或乖巧顺从的样子。说话有条理，善于抓住对方漏洞。",
  "coreMotivations": ["保护弟弟明哥儿", "为母亲报仇（针对周氏）", "避免前世悲剧重演", "寻找真正的爱情和幸福"],
  "fears": ["失去明哥儿（前世阴影）", "再次被人欺骗利用", "无法改变命运", "孤独终老"],
  "secrets": ["重生者身份（最大秘密）", "知晓未来事件", "知道卫如风和庄语山的阴谋"]
}
```

### 对话生成的 Prompt 示例

**使用的 Prompt**（来自 `stage3_scriptGeneration.scene_design.sceneGenerationPrompts.dialogue_flow_prompt`）：

```python
prompt = f"""
为以下场景设计对话流：

【场景上下文】
叙事开场：{narrative_text}
需要参与对话的角色：{characters_needed}
本场景需要传达的信息/推动的剧情：{plot_points_to_cover}

【角色人设参考】
{characters_profiles}

【要求】
1. 设计3-6轮对话
2. 对话要符合每个人物的性格和说话风格
3. 通过对话自然推进剧情（不要纯 exposition）
4. 关键信息可通过 cardPopup 以角色卡/警告卡形式呈现
5. 重要对话要有 mood 标记
6. 如果是多人场景，确保每个人都有发言机会

以JSON数组格式输出对话流。
"""
```

**输出示例**（第一幕第一场「夺命喜宴」的对话流）：
```json
[
  {
    "id": "d1_1_1",
    "speaker": "汲蓝",
    "avatar": "👧🏻",
    "text": "戌时了，小姐莫急，世子该是很快便到了。",
    "mood": "欢喜"
  },
  {
    "id": "d1_1_2",
    "speaker": "姝红",
    "avatar": "👧🏻",
    "text": "坏东西，小姐也是你能打趣的了？真是不知天高地厚。",
    "mood": "嗔怪打趣"
  },
  {
    "id": "d1_1_3",
    "speaker": "陈妈妈",
    "avatar": "👵🏻",
    "text": "都少说两句，进了王府，做事不能行差一步。不对，现在应该叫世子妃。",
    "mood": "提醒规矩",
    "cardPopup": {
      "type": "roleCard",
      "title": "👥 NPC卡：贴身三人组",
      "content": "**陈妈妈**: 忠心耿耿\n**汲蓝**: 活泼机灵\n**姝红**: 沉稳冷静\n⚠️ 这三人在前世为你而死！"
    }
  }
]
```

### 选项设计的 Prompt 示例

**使用的 Prompt**（来自 `stage3_scriptGeneration.scene_design.sceneGenerationPrompts.choice_cards_prompt`）：

```python
prompt = f"""
为以下场景设计互动选择：

【场景信息】
场景ID：{scene_id}
场景名：{scene_name}
当前处境：{current_situation}
玩家面临的困境/决策：{dilemma_description}
当前参数状态：{current_parameters}

【要求】
1. 设计2-4个有意义的选项
2. 每个选项反映不同的价值观/策略/性格倾向
3. 有明确的后果预览
4. 至少有一个选项带有 prefixTag（如 ⭐推荐、🔥高燃、💔风险等）
5. 推荐选项设置 recommended: true

以JSON格式输出 choiceCards 完整结构。
"""
```

**输出示例**（第一幕第二场「觉醒」的选择）：
```json
{
  "title": "重生后的第一个决定",
  "choices": [
    {
      "id": "opt_resist",
      "prefixTag": "对抗到底",
      "text": "坚决反对周氏进门，不惜与父亲撕破脸！绝不让前世悲剧重演！",
      "effectPreview": "勇气+15 | 父亲关系-20 | 解锁【刚烈】路线",
      "consequence": "赢得硬气名声但降低父亲好感，需要更强实力支撑后续发展。",
      "cinematic": "怒火中烧，拍案而起"
    },
    {
      "id": "opt_strategize",
      "prefixTag": "以退为进 ⭐推荐",
      "text": "假意顺从让周氏进门，暗中布局。忍一时风平浪静，退一步海阔天空。",
      "effectPreview": "智谋+20 | 父亲关系+15 | 解锁【隐忍】路线（原著路线）",
      "consequence": "赢得父亲好感，降低敌人警觉。但需要极强的心理素质和演技。",
      "recommended": true,
      "cinematic": "眼中闪过一丝冷光，嘴角微微上扬"
    },
    {
      "id": "opt_emotional",
      "prefixTag": "哭诉求助",
      "text": "向父亲哭诉不愿继母，试图唤起他的怜惜和保护欲。",
      "effectPreview": "勇气-5 | 父亲关系+5 | 解锁【柔弱】路线",
      "consequence": "可能引起父亲短暂怜惜但长期被视为软弱。某些隐藏剧情需要此路线触发。",
      "cinematic": "眼泪如断了线的珍珠般落下"
    }
  ]
}
```

---

## 📈 质量标准一览

### 人设一致性检验标准

| 严重等级 | 分数范围 | 定义 | 处理方式 |
|---------|---------|------|---------|
| 轻微偏离 | 1-3 | 可能是合理的角色成长 | ✅ 可接受，添加成长注释 |
| 中度偏离 | 4-6 | 需要审查是否合理 | ⚠️ 标记待审 |
| 严重偏离 | 7-9 | 明显不符合人设 | ❌ 必须修改 |
| 完全OOC | 10 | 绝对不可接受 | 🚫 直接拒绝 |

### 逻辑连贯性检查项

- [ ] 因果链有效性（每个事件都有合理起因）
- [ ] 时间线连贯性（无时间旅行式错误）
- [ ] 空间位置一致性（角色不会瞬移）
- [ ] 状态连续性（物品/伤势正确传递）
- [ ] 无剧情漏洞（无未解决的伏笔）

### 游戏平衡性指标

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 简单选项占比 | 20-30% | 新手友好 |
| 普通选项占比 | 40-50% | 主流选择 |
| 困难选项占比 | 20-30% | 挑战型玩家 |
| 陷阱选项占比 | <10% | 增加趣味性 |
| 平均每场景选项数 | 2-4个 | 保持选择密度 |
| 单项参数变化幅度 | ±30以内 | 避免极端失衡 |

---

## 🔄 与现有系统的集成方式

### 方式一：API 调用（推荐）

```
前端/后台系统 → 调用引擎 API → 获得剧本 JSON → 存入数据库 → 游戏端读取
```

### 方式二：CLI 工具

```bash
# 一键全流程执行
python novel_to_script.py \
  --input novel.txt \
  --output interactive_script.json \
  --config config/ai_text_generation_engine.json \
  --quality-level rigorous
```

### 方式三：Web UI 操作台

1. 上传小说文件（支持 .txt .epub .pdf）
2. 配置生成参数（幕数/角色/难度/时长）
3. 点击「开始生成」
4. 实时查看进度（4个阶段的进度条）
5. 预览/编辑/校验/发布

---

## 🎓 进阶技巧

### 1. 利用 Few-Shot 学习提升质量

在 `appendix.promptLibrary.few_shot_examples` 目录下准备高质量的示例对：

```
examples/
├── few_shots.json          # Few-Shot 示例库
├── character_example.json  # 角色档案示例（输入→输出）
├── dialogue_example.json   # 对话生成示例
├── choice_example.json     # 选项设计示例
└── scene_example.json      # 场景设计示例
```

### 2. 迭代优化策略

**第一版**：使用默认参数生成初稿  
**审查**：人工审核关键场景和人设一致性  
**调整**：修改不满意的场景（通过 manualOverrideCapabilities）  
**重新生成**：仅重新生成修改过的部分  
**校验**：运行 quality_check 确保修改未引入新问题  

### 3. 批量生产模式

当需要处理多部小说时：

```python
novels = [
  {"title": "重生之贵女难求", "file": "novel1.txt"},
  {"title": "其他小说A", "file": "novel2.txt"},
  # ...
]

for novel in novels:
  job = engine.ingest(novel["file"])
  job = engine.analyze(job.id)
  job = engine.generate(job.id)
  report = engine.validate(job.id)
  
  if report.passed:
    publish(job.script_url)
  else:
    queue_for_manual_review(job.id)
```

---

## 📚 附录：术语表

| 术语 | 英文 | 定义 |
|------|------|------|
| C2A2C | Consumer to AI to Consumer | 用户通过AI与其他用户互动的消费模式 |
| 互动文游 | Interactive Fiction Game | 结合阅读、角色扮演、社交的新型娱乐产品 |
| CP | Coupling/Couple | 角色间的恋爱配对关系 |
| OOC | Out of Character | 角色行为不符合其既定人设 |
| 蝴蝶效应 | Butterfly Effect | 选择对未来剧情产生的连锁反应 |
| DM | Dungeon Master | 游戏中控制剧情走向的系统/AI角色 |
| TE/GE/NE/BE/DE | True/Good/Normal/Bad/Dark End | 五种结局类型 |
| prefixTag | - | 选项前的标签（如 ⭐推荐），用于快速传达选项特点 |
| cardPopup | - | 弹出的信息卡片，呈现角色卡/警告/物品等信息 |
| 幕 | Act | 故事的主要分段（通常3-7幕） |
| 场景 | Scene | 幕内的具体情境单元 |
| 节点 | Node | 场景内的互动点（叙事/对话/选择） |

---

## 📝 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| **v5.0** | 2026-05-26 | **重大重构**：完整的4阶段pipeline配置；新增角色提取引擎、关系网络构建、世界观提取、多分支逻辑设计、结局系统设计；完善Prompt模板库和质量校验体系 |
| v2.8 | 2025-09 | 优化情绪系统与结局算法（原 ai_engine.md） |
| v2.5 | 2025-06 | 加入分支剧情引擎V2 |
| v2.0 | 2025-05 | 初始版本发布 |
| v1.0 | 2025-01 | 原型验证 |

---

*本引擎由 CodeBuddy AI 为《重生之贵女难求》C2A2C互动文游项目定制开发*  
*配置文件路径：config/ai_text_generation_engine.json*  
*详细技术参数见配置文件注释*

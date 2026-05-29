# Prism Skill ｜ 场景棱镜：世界切片多样性生成器

> **World-Slice Diversity Generator for Interactive Fiction**
> 一束情节是白光，穿过棱镜，折射出 N 条彩色光路。
> 每一条都是同一个故事——也都是不同的世界。

---

## 0｜一行主张

> **角色由写手定义，世界由 Prism 折射。**
> 同一段剧情节点 + 同一组角色，通过五条世界轴的重组，自动生成 N 个**质感不同、抉择不同、信息分布不同**的可玩切片。

---

## 1｜为什么需要 Prism

互动文当前的多样性瓶颈，不在角色，不在结局，**在中段的"世界质感"**。

| 现状 | 后果 |
| --- | --- |
| 同一节点只有一种描写 | 玩家第二周目立刻产生既视感 |
| 分支只改"做什么"不改"在哪做、何时做、谁在场" | trade-off 失重，选项变成假选项 |
| 角色卡决定一切反应 | 角色像录音机，世界像幕布 |
| 隐藏信息一次性给完 | 信息差被烧光，再玩没动力 |

**Prism 的切入点**：把"剧情节点"当作晶体，把"世界"当作可调节的多面棱镜。同一晶体在不同棱镜参数下，折射出不同的可玩光路。

## 2｜与已有体系的边界

```
   ┌──────────────────────────────────────┐
   │  写手 / 编辑          人物 Persona    │  ← 已有产出
   │  Story to Quadrant   节点结构+四象限   │  ← 已有 Skill
   │  Prism (本 Skill)    世界切片多样性    │  ← 新增层
   │  数值 / 工程         触发与状态机     │  ← 工程实现
   └──────────────────────────────────────┘
```

**Prism 不做什么**：
- 不写角色性格、不改台词风格（写手负责）
- 不设计四象限主结局（Story to Quadrant 负责）
- 不实现状态机和触发器（工程负责）

**Prism 只做一件事**：
> 拿到一个"剧情节点 + 角色卡 + 主结局轮廓"，输出 3–7 个**等价但异质**的 World Slice。

---

## 3｜核心模型：场景晶体 × 五轴棱镜

### 3.1 场景晶体（Scene Crystal）

每一个剧情节点首先被抽象成一个最小晶体：

```yaml
crystal:
  beat_id: "111_iliana_pressure"
  dramatic_function: 让女主面对"被替代"的当众羞辱
  must_happen:
    - 伊琳娜以公主身份要求女主退出王府
    - 男主当众未维护女主
    - 女主需要在情绪冲击下做出第一个表态
  must_not_happen:
    - 女主与伊琳娜动手
    - 男主当众解释真相
```

晶体描述的是**戏剧功能**，不是具体场景。它是不变量。

### 3.2 五条世界轴（Five Axes of World Diversity）

| 轴 | 缩写 | 调节的是 | 影响 |
| --- | --- | --- | --- |
| Scene Stage 场景舞台 | `S` | 事件发生在哪 | 可用道具、可触发的旁观者 |
| Hidden Knowledge 隐藏信息 | `H` | 哪些秘密此刻已揭/未揭 | 玩家的信息差 / 误判风险 |
| NPC Presence 在场人物 | `N` | 谁在 / 谁缺席 | 可选项是否存在 |
| Time Pressure 时间压力 | `T` | 距离下一个不可逆事件还有多久 | 选项是否被倒计时挤掉 |
| Ambient Noise 环境噪声 | `A` | 流言、天气、市井反应 | 选择的社会代价 |

**关键洞察**：这五个轴**正交**。也就是说，调整一个轴不会破坏剧情晶体的"必须发生"。

### 3.3 折射公式

```
World Slice = Crystal × (S, H, N, T, A)
```

一个晶体配上一组五轴参数，就生成一个 World Slice。
默认每个轴取 2–3 个候选值，理论上 2⁵ = 32 个切片可达，**实际产出 3–7 个有意义的切片即可**（去除剧情功能上重复的组合）。

---

## 4｜五轴详细定义

### 4.1 Scene Stage（场景舞台）

**调节的不是描写，是"可用资源"。**

每个候选舞台必须列出：
- `available_objects`: 玩家可调用的物件（祠堂里有香炉，街市上有摊贩）
- `bystanders`: 默认旁观者（朝臣 / 路人 / 无人）
- `exit_cost`: 离开此场景的代价（祠堂出不去，街市可逃）

**例（晏清回府第一次冲突）**：

| 候选舞台 | objects | bystanders | exit_cost |
| --- | --- | --- | --- |
| 晏府正堂 | 老夫人拐杖、族谱、佛珠 | 全府主子在场 | 高（不能转身就走）|
| 后园回廊 | 假山、池水、湿滑石阶 | 仅丫鬟一两人 | 低 |
| 祠堂祭祖之夜 | 祖宗牌位、火盆、香烛 | 仅族中长辈 | 极高（言行入族谱）|

同一场冲突放在不同舞台，**玩家手里的牌完全不同**。

### 4.2 Hidden Knowledge（隐藏信息）

把所有"剧情秘密"列出来，标记每条在此切片中的状态：

```yaml
hidden_knowledge_table:
  - id: rival_is_pretender         # 周如音是陷害者
    states: [unknown, suspected, confirmed]
  - id: mother_alive               # 母亲被囚未死
    states: [unknown, hinted, confirmed]
  - id: male_lead_is_dying         # 男主寒毒真相
    states: [unknown, hinted, confirmed]
```

**核心规则**：同一节点，**信息状态分布不同 → 玩家判断完全不同**。
- 切片 A：母亲未死=`unknown`，玩家以为是孤儿
- 切片 B：母亲未死=`hinted`，玩家选项里多了"调查废院"
- 切片 C：母亲未死=`confirmed`，整条线变成救母

这是 Prism 最强的多样性引擎——**信息差本身就是剧情**。

### 4.3 NPC Presence（在场人物）

列出本节点所有"可能在场"的 NPC，标记此切片的在场状态：

```yaml
npc_roster:
  - 汲蓝:   [present, off_stage]
  - 姝红:   [present, off_stage]
  - 卓七:   [present, off_stage, watching_from_shadow]
  - 傅云夕: [present, masked, absent]
```

`watching_from_shadow` 与 `masked` 是 Prism 特别推荐的"半在场"状态——
**它们让同一场戏的可触发回调完全改变，却不破坏戏剧功能。**

### 4.4 Time Pressure（时间压力）

为每个切片设定**两个不可逆事件**，构成时间窗：

```yaml
time_window:
  upstream:   "伊琳娜入府第 3 日"
  downstream: "皇上明早颁旨"
  hours_remaining: 14
  consequences_if_timeout:
    - 选项 "去见杨琦" 消失
    - 自动跳转到 "被动接旨" 节点
```

时间压力调节的是**选项的生灭速度**，不是剧情走向本身。

### 4.5 Ambient Noise（环境噪声）

噪声 = 玩家做出选择后，世界返还的"社会回响"。

```yaml
ambient_noise:
  rumor_direction: [sympathize_with_heroine, mock_heroine, neutral]
  weather:         [clear, rain, snow, storm]
  market_mood:     [calm, panicked, festive]
  reverberation_rule:
    - 当 rumor=mock & 女主选硬刚 → 流言反转为 sympathize
    - 当 weather=storm & 女主选夜出 → 暴露概率 ×0.5
```

噪声不是装饰，是**选择代价的乘数**。

---

## 5｜World Slice JSON Schema

```json
{
  "slice_id": "111_pressure_slice_A",
  "crystal_ref": "111_iliana_pressure",
  "axes": {
    "S": {
      "stage": "main_hall_full_audience",
      "available_objects": ["jade_pendant", "ancestral_register"],
      "bystanders_count": 14,
      "exit_cost": "high"
    },
    "H": {
      "rival_is_pretender": "suspected",
      "mother_alive": "unknown",
      "male_lead_is_dying": "unknown"
    },
    "N": {
      "jilan": "present",
      "shuhong": "present",
      "zhuoqi": "absent",
      "male_lead": "present_cold"
    },
    "T": {
      "upstream": "iliana_day_1",
      "downstream": "edict_tomorrow_morning",
      "hours_remaining": 18
    },
    "A": {
      "rumor_direction": "sympathize_with_heroine",
      "weather": "clear",
      "reverb_multipliers": { "hard_pushback": 1.5 }
    }
  },
  "tone_hint": "压抑的体面感，所有人都在看",
  "ambient": "cold",
  "expected_player_arc": "从震惊 → 冷静 → 借舆论反将一军",
  "links_to_quadrant": {
    "affects_external": "+5 if soft, +0 if hard",
    "affects_internal": "+8 if hard, +2 if soft",
    "may_lock_ending": "BRANCH if soft 3 times in a row"
  }
}
```

每个 Slice 都自带"与四象限结局的耦合提示"，方便 Story to Quadrant Skill 在结局路由时读取。

---

## 6｜工作流（5 个 Phase）

### Phase 1 ｜ Crystallize 晶体化
从原著或大纲中提取节点 → 抽出 `dramatic_function` + `must_happen` + `must_not_happen`。
**产出**：一份 Crystal 表。

### Phase 2 ｜ Axis Configuration 配置轴向
为每个晶体填写五轴的候选值池。
**产出**：每个晶体 5 张候选值卡。

### Phase 3 ｜ Refraction 折射
不是穷举 32 种，而是**手工挑选 3–7 个最有戏剧差异的组合**。
判断标准见 Section 7。
**产出**：一组 World Slice JSON。

### Phase 4 ｜ Quality Pass 质量过筛
对每个 Slice 跑"假分支检测"（见 §7.2），删除收敛过快的。

### Phase 5 ｜ Hand-off 移交
把 Slice 集合移交给：
- Story to Quadrant Skill → 嵌入节点结构
- 数值工程 → 实现路由触发
- 写手 → 填具体描写文本

---

## 7｜质量标准

### 7.1 真 Diversity 的三个判据

| 判据 | 通过条件 |
| --- | --- |
| **Choice Asymmetry 选项异质** | 切片 A 与 切片 B 的玩家可选项集合，交集占比 ≤ 60% |
| **Information Delta 信息差** | 两切片中至少 1 条 hidden_knowledge 状态不同 |
| **Cost Topology 代价拓扑** | 同名选项在两切片中，trade-off 数值方向不同（不只是大小不同）|

三项中至少满足 2 项，才算"真的两个切片"。

### 7.2 假 Diversity 的四个反模式

| 反模式 | 症状 | 修法 |
| --- | --- | --- |
| **皮肤分支** | 仅描写词换了 | 强制改 H 轴 |
| **影分身 NPC** | 不同切片里同名 NPC 行为完全一致 | 切片应改变 NPC 在场状态而非台词 |
| **倒计时假装** | 写了 T 但无任何选项被它砍掉 | T 必须挂载至少 1 个"超时即失"的选项 |
| **静默噪声** | A 轴只是天气描写，没影响数值 | A 必须配 `reverb_multipliers` |

---

## 8｜与既有 Skill 的协作矩阵

```
┌──────────────┬─────────────────────────────────────────┐
│  写手        │ 角色卡 (persona, voice, relations)       │
│              │   ↓ 输入                                 │
│  Prism       │ 节点 × 五轴 → World Slices               │
│              │   ↓ 输出                                 │
│  Story-To-   │ 节点结构 + 四象限 + flag 路由            │
│  Quadrant    │   ↓ 输出                                 │
│  工程        │ JSON 执行 + 状态机                       │
└──────────────┴─────────────────────────────────────────┘
```

**约定**：
- Prism 输出的每个 Slice 必须含 `links_to_quadrant`，下游可读
- Prism 不修改角色卡，只引用 `character_ref`
- 写手提供的 disclosure_strategy（披露策略）会被 Prism 用作 H 轴的状态约束源

---

## 9｜完整示例：晏清回府首夜

### 9.1 Crystal

```yaml
beat_id: yanqing_return_first_night
dramatic_function: 让玩家初次感受"被环视的孤立"
must_happen:
  - 晏清首次出现在晏府主子面前
  - 周如音以"关心"为名发起第一次试探
  - 玩家必须做出第一次表态选择
must_not_happen:
  - 母亲此刻出场
  - 真相被任何人当面戳破
```

### 9.2 Three Refracted Slices

#### Slice α ｜ 正堂群审

```yaml
S: 晏府正堂 / 老夫人在座 / 拐杖、族谱在场 / exit_cost=极高
H: { rival_is_pretender: unknown, mother_alive: unknown }
N: { 老夫人: present, 周如音: present, 晏文谦: present, 晏尘: present, 丫鬟: 8 }
T: 入府 2 时辰内 / downstream: 老夫人定夺住所
A: { rumor_direction: neutral, weather: 闷热, reverb: 沉默有压迫感 }
tone: 万众瞩目，每一句话都被记在族谱上
expected_player_arc: 被迫端庄 → 在挑刺中找到第一个反击点
```

#### Slice β ｜ 偏院夜访

```yaml
S: 晏清暂居偏院 / 屋内仅一盏油灯 / exit_cost=低
H: { rival_is_pretender: suspected, mother_alive: hinted }   ← 已经多了一条暗线
N: { 老夫人: absent, 周如音: present, 丫鬟: 2 }
T: 当夜亥时 / downstream: 明早正式拜见
A: { rumor_direction: mock_heroine, weather: 雷雨将至, reverb: 任何动静都被放大 }
tone: 一对一交锋，无人作证
expected_player_arc: 试探 → 留把柄给对方 / 套话出对方破绽
```

#### Slice γ ｜ 祠堂祭祖之夜

```yaml
S: 晏家祠堂 / 火盆、香烛、列祖牌位 / exit_cost=言行入族谱
H: { rival_is_pretender: unknown, mother_alive: confirmed }  ← 母亲线提前点亮
N: { 老夫人: present, 周如音: present, 晏文谦: present, 晏尘: absent }
T: 子夜祭祖 / downstream: 晨钟前需完成认亲仪式
A: { rumor_direction: neutral, weather: 寒夜大雪, reverb: 神圣感 ×2 }
tone: 仪式感拉满，撒谎成本极高
expected_player_arc: 在祖宗面前赌一把真相 / 隐而不发等更好时机
```

### 9.3 质量自检

| 检查项 | α–β | α–γ | β–γ |
| --- | --- | --- | --- |
| 选项异质（交集≤60%） | ✓ | ✓ | ✓ |
| 信息差 | ✓ | ✓ | ✓ |
| 代价拓扑差 | ✓ | ✓ | ✓ |

三个切片**两两通过**真 diversity 判据。

---

## 10｜反模式速查与写作建议

### Don'ts

- ❌ 五轴只调 S 和 A：等于换皮，无意义
- ❌ 同一晶体配 >7 个切片：手工质量会塌
- ❌ 让任意切片"必走"：失去玩家选择权
- ❌ H 轴一次性升到 confirmed：信息差耗尽

### Do's

- ✅ 让 H 轴在不同切片间保持"递进可能"——同一秘密在 slice α 是 unknown，在 slice β 是 hinted，玩家路径可以是 α→β
- ✅ 把"半在场"NPC 当作主要的多样性源（masked / shadow / off-stage）
- ✅ 给每个 Slice 写一行 `tone_hint`，下游写手即可上手
- ✅ 保留"反 Slice"——故意制造一个**让玩家做错决定**的 Slice，让重玩有意义

---

## 11｜命名与品牌

- **Skill 名**：Prism ｜ 场景棱镜
- **核心隐喻**：一束白光 = 一个剧情晶体；棱镜 = 五轴；彩色光路 = World Slices
- **Slogan**：*Same story, different worlds.*
- **缩写**：PWSD-5（Prism World-Slice Diversity, 5-Axis）

---

## 12｜下一步

- [ ] 在 Demo 范围（111–128 章）选 3 个关键节点，分别产出 3 个 Slice
- [ ] 与 Story to Quadrant Skill 联调：让 Slice 的 `links_to_quadrant` 真正驱动结局路由
- [ ] 给数值工程提供 Slice → 状态机的最小适配层定义
- [ ] 写一份对外的 1 页 Pitch，说明 Prism 的差异化创新点

---

*Prism Skill v0.1 ｜ 草案 ｜ 设计：宝宝 × Claude*

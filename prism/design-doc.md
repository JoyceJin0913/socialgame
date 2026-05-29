# 第五幕 · 双视角 Prism 剧本 Demo

> 案例：把 socialgame 现有第五幕三场对话节点，用 Prism 五轴方法重写一遍。
> 同一段戏，两个视角，演示"信息差即剧情"。

---

## 总述

socialgame repo 现有的第五幕三场：

| 场次 | 现有实现 | Prism 重构后 |
| --- | --- | --- |
| 一年之约 | 一个 scene，3 个固定选项 | 一个 Crystal，可在 3 个 Slice 下折射 |
| 凯旋归来 | 一个 scene，3 个固定选项 | 一个 Crystal，可在 3 个 Slice 下折射 |
| 一纸休书 | 一个 scene，3 个固定选项 | 一个 Crystal，可在 3 个 Slice 下折射 |

**重构后获得什么**：
1. 同一场戏在不同 H 轴下出现新选项（信息差驱动）
2. 同一段对白可以让玩家切换视角再玩一遍——傅云夕视角的选项完全不同
3. 选项不再写死代价，通过 `numerics_hook` 抛给数值系统决定

---

## 视角 A · 寒雁视角

### 场 A1 · 一年之约

#### Crystal

```yaml
crystal_id: act5_one_year_vow
dramatic_function: 让玩家亲历"明明在乎，却必须放手"
must_happen:
  - 男主主动制造距离（出征命令）
  - 女主必须做出第一次回应
  - 男主真实意图（隐疾）此刻不能直接说出
must_not_happen:
  - 男主当面坦白寒毒
  - 女主与男主当夜决裂
```

#### Slice α · 雪夜书房 · 一年之约（默认）

```yaml
axes:
  S: study              # 王府书房
  H: { illness: unknown }  # 寒雁不知道男主有寒毒
  N: [fyx, maid]
  T: 20                 # 出征还有一夜，时间足
  A: { rumor: private, weather: snow }
tone_hint: 雪意未消，他唤你过去，灯只点了一盏。
```

#### Choice Pool（按 require 涌现）

| 选项 | hook (抛给 Brewed) | require |
| --- | --- | --- |
| 说一句让他记你一辈子的承诺 | `vow_loyalty` | S=study, N=[fyx] |
| 追问"你究竟要去多久" | `probe_intent` | S=study, N=[fyx] |
| 咬唇低头不语，收下他的话 | `silent_consent` | S=study |
| 借更衣靠近，闻一闻他袖中的药味 | `investigate_illness` | S=study, N=[fyx], **H.illness ≥ hinted** |
| 不顾礼仪，直接拦下他不让他走 | `block_departure` | N=[fyx], **T ≤ 4** |

> **演示点**：默认 H=unknown 时，玩家只能看到前 3 个；如果二周目带着"已知男主有寒毒"的认知（H 升为 hinted），第 4 个选项浮出来——**同一个对话场景，重玩有新东西**。

---

### 场 A2 · 凯旋归来

#### Crystal

```yaml
crystal_id: act5_triumph_return
dramatic_function: 让玩家亲历"被替代"的当众羞辱
must_happen:
  - 西戎公主以身份压她
  - 男主当众未维护女主
  - 皇上下旨准其和离
must_not_happen:
  - 男主当殿解释
  - 女主与公主动手
```

#### Slice β · 金銮殿外 · 公主当庭（默认）

```yaml
axes:
  S: palace
  H: { illness: hinted }   # 第二场，玩家应有一些怀疑
  N: [fyx, princess, emperor, court]
  T: 6
  A: { rumor: court, reverb: ×1.3 }
tone_hint: 殿外只剩你们两人，但下一刻就会有人出现。
```

#### Choice Pool

| 选项 | hook | require |
| --- | --- | --- |
| 当众落落大方，向公主举杯 | `public_grace` | S=palace, N=[princess] |
| 当朝反问公主"我夫妻之事与你何干" | `public_pushback` | S=palace, N=[princess] |
| 微微福身，礼让一步 | `tactical_yield` | S=palace |
| 当殿向皇上一句话，引向另一条路 | `appeal_throne` | S=palace, N=[emperor], **A.rumor=court** |
| 让心腹连夜送信给杨琦寻援 | `reach_ally` | N=[maid], **T ≤ 8** |

> **演示点**：选项 4「向皇上申诉」**仅在朝堂传遍状态下可见**，因为只有传开了才有可能借势翻案。这是 A 轴（环境噪声）决定选项存在与否的例子。

---

### 场 A3 · 一纸休书

#### Crystal

```yaml
crystal_id: act5_divorce_letter
dramatic_function: 让玩家在"信他 / 不信他"之间做出最后选择
must_happen:
  - 男主放下休书
  - 女主必须做出最终回应（接 / 拒 / 揭穿）
must_not_happen:
  - 男主当场说出真相
  - 第三方介入
```

#### Slice γ · 深夜独对 · 雪夜书房（默认）

```yaml
axes:
  S: courtyard
  H: { illness: confirmed }  # 此时玩家应该已知
  N: [fyx]
  T: 3                       # 半炷香
  A: { rumor: all, weather: heavy_snow }
tone_hint: 更深露重，他把休书放在你面前，不敢看你。
```

#### Choice Pool

| 选项 | hook | require |
| --- | --- | --- |
| 红着眼问他"你要娶西戎公主？" | `confront_betrayal` | S=courtyard, N=[fyx] |
| 安静接过休书，不发一言 | `accept_silently` | S=courtyard, N=[fyx] |
| 将休书撕得粉碎 | `reject_violently` | S=courtyard, N=[fyx] |
| 看着他的眼睛说"我知道你在装" | `truth_revealed` | S=courtyard, N=[fyx], **H.illness=confirmed** |

> **演示点**：第 4 个选项「我知道你在装」**只有 H 升到 confirmed 才出现**——这就是 socialgame 当前实现做不到的事：现有版本不论你前面对话怎么选，这一幕的 3 个选项永远固定。

---

## 视角 B · 傅云夕视角

> **核心思想**：同一个 Crystal，玩家切到男主视角时，**戏剧功能反转，H 轴起点不同**。
> 寒雁视角是"被冷待 / 被休"，男主视角是"必须演冷淡 / 必须写休书"。

### 场 B1 · 一年之约

#### Crystal（视角反转）

```yaml
crystal_id: act5_one_year_vow_male
dramatic_function: 让玩家亲历"明知自己活不长，还要她等"
must_happen:
  - 必须向她下达"一年之约"
  - 必须不让她察觉寒毒
  - 必须留下"若不归你便改嫁"的退路
must_not_happen:
  - 当面坦白
  - 让她跟随出征
```

#### Slice α-male

```yaml
axes:
  S: study
  H: { illness: confirmed }   # 男主自己当然知道
  N: [fyx, hanyan]            # 注意：现在 hanyan 是 NPC
  T: 20
  A: { rumor: private }
tone_hint: 你看着她的眼睛，把那句你练习了一夜的话说出口。
```

#### Choice Pool（男主视角的选项）

| 选项 | hook | require |
| --- | --- | --- |
| 把"一年之约"说得轻描淡写 | `mask_with_lightness` | S=study, N=[hanyan] |
| 把承诺说得很重，让她不舍 | `bind_with_weight` | S=study, N=[hanyan] |
| 暗示她"若我不归，去找卓七" | `pre_arrange_safety` | S=study, N=[hanyan] |
| 借故避开她递来的杯酒（怕被发现药味） | `hide_symptom` | S=study, N=[hanyan], **H.illness=confirmed** |

> **同一个 Crystal，男主视角的选项关心的是另一件事**：怎么把这句话说出口才能既骗过她，又让她有退路。

---

### 场 B2 · 凯旋归来

#### Slice β-male

```yaml
axes:
  S: palace
  H: { illness: confirmed, court_plot: hinted }   # 男主比寒雁多一条隐藏轴
  N: [hanyan, princess, emperor, court]
  T: 6
  A: { rumor: court, reverb: ×1.3 }
tone_hint: 你必须在所有人面前转身离开她，哪怕她正看着你。
```

#### Choice Pool

| 选项 | hook | require |
| --- | --- | --- |
| 当众完全不看她，演到底 | `cold_act_complete` | S=palace, N=[hanyan, court] |
| 用眼神留一丝余地（赌她看得懂） | `cold_act_with_hint` | S=palace, N=[hanyan] |
| 借故离场，避开当庭对峙 | `escape_confrontation` | S=palace |
| 暗中向皇上递眼色（仅当皇上知情时） | `signal_throne` | N=[emperor], **H.court_plot=hinted** |

> **演示点**：男主视角多了一条**寒雁不知道的隐藏信息** `court_plot`——朝堂博弈本身。Prism 的 H 轴对不同视角可以挂载不同的隐藏事实集合。

---

### 场 B3 · 一纸休书

#### Slice γ-male

```yaml
axes:
  S: courtyard
  H: { illness: confirmed, plan_failed: unknown }
  N: [hanyan]
  T: 3
  A: { rumor: all, weather: heavy_snow }
tone_hint: 你的手在抖。她要么明白你，要么恨你一辈子——你选哪个？
```

#### Choice Pool

| 选项 | hook | require |
| --- | --- | --- |
| 把休书写得冷酷无情，断她念想 | `divorce_cruel` | S=courtyard, N=[hanyan] |
| 把休书写得留有破绽，赌她看懂 | `divorce_with_clue` | S=courtyard, N=[hanyan] |
| 在递出去之前撕掉，重写 | `cant_let_go` | S=courtyard, N=[hanyan] |
| 提笔前忽然咳血，让她看见 | `accidental_reveal` | S=courtyard, N=[hanyan], **H.illness=confirmed** |

---

## 双视角差异说明

### 1. 戏剧功能反转
同一场戏，寒雁视角的功能是"被给予 → 接受 / 拒绝"，男主视角是"必须给予 → 选择如何给"。这不是换皮，是**主语换了，整个 Crystal 的内核也换了**。

### 2. H 轴默认值反转
| 场次 | 寒雁视角 H | 男主视角 H |
| --- | --- | --- |
| 一年之约 | illness=unknown | illness=confirmed |
| 凯旋归来 | illness=hinted | illness=confirmed + court_plot=hinted |
| 一纸休书 | illness=confirmed | illness=confirmed + plan_failed=unknown |

男主视角的 H 轴**永远比寒雁视角多知道一些，少不知道一些**——这是信息差驱动多样性的最直观示例。

### 3. 选项集完全不同
寒雁视角的选项是"对他说什么"，男主视角的选项是"怎么演给她看"。
**同一个 hook 词不会同时出现在两个视角的 Choice Pool 里**——这保证两个视角的戏不会重复。

### 4. 结局可以汇流
两个视角各自跑完三场后，可以汇到同一个结局判定节点。
但因为路径上发生的 hook 不同，最终的数值组合也不同——
**两人合作通关 = 数值互相填补，单视角通关 = 数值自洽但残缺**。

---

## 给数值系统的语义事件清单

> 以下是这 6 个 Slice 一共会抛出的 hook 列表。Brewed（或其他数值系统）只需要决定每个 hook 对应哪些数值变化。

### 寒雁视角
- `vow_loyalty` · 信任傅云夕↑↑ 内在成长↑
- `probe_intent` · 情报↑ 信任↑
- `silent_consent` · 隐忍↑ 勇气↓
- `investigate_illness` · 情报↑↑ 信任↑（需 H 已开）
- `public_grace` · 民意↑ 隐忍↑
- `public_pushback` · 勇气↑↑ 王府势力↓
- `tactical_yield` · 理智↑
- `appeal_throne` · 民意↑↑ 风险↑
- `confront_betrayal` · 勇气↑ 王府势力↓
- `accept_silently` · 隐忍↑↑ 理智↑
- `reject_violently` · 勇气↑↑ 理智↓
- `truth_revealed` · 信任↑↑↑ 隐蔽↓↓↓
- `block_departure` · 勇气↑↑ 体面↓
- `reach_ally` · 盟友信任↑

### 傅云夕视角
- `mask_with_lightness` · 寒雁信任↓ 自身负担↑
- `bind_with_weight` · 寒雁信任↑↑ 自身负担↑↑
- `pre_arrange_safety` · 备份↑ 寒雁不解↑
- `hide_symptom` · 隐蔽↑ 信任↓
- `cold_act_complete` · 计划完成↑↑ 关系↓↓
- `cold_act_with_hint` · 计划完成↑ 关系↑
- `escape_confrontation` · 风险规避↑ 关系↓
- `signal_throne` · 朝堂势力↑↑ 暴露风险↑
- `divorce_cruel` · 计划完成↑↑ 关系→0
- `divorce_with_clue` · 计划完成↑ 关系↑ 风险↑
- `cant_let_go` · 关系↑↑↑ 计划崩盘↓↓↓
- `accidental_reveal` · 真相暴露↑↑↑ 计划崩盘↓↓↓

---

## 给写手的下一步

如果要把这份设计真正变成可玩的 demo：

1. 把每个选项的具体台词写出来（目前只有动作描述）
2. 给每个 hook 在数值系统侧定义具体 delta
3. 把场 A1/A2/A3 串联起来，处理跨场景的状态传递
4. 决定视角切换的入口（章节开头让玩家选 / 通关后解锁第二视角）

这些超出了 Prism 的职责范围，由写手 + 数值工程师协作完成。
Prism 只负责**这份骨架本身的多样性正确性**。

---

*Prism Sample Script v1 · 基于《重生之贵女难求》第五幕三场*

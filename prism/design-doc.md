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

# 扩展案例 1 · 身世真相 / "验亲"晶体

> 原著触发点：第 67 章身世之谜（阿碧吐露内情） + 第 100 章姨娘小产（庄仕洋对嫡庶问题的暴怒） + 第 58 章周氏小产连带的家族秩序震荡。
> 这是一组"出身被质疑 / 被验证"的剧情节点的抽象化。

## Crystal · "嫡庶真相被翻起"

```yaml
crystal_id: heritage_truth_surfacing
dramatic_function: 让玩家亲历"我究竟是谁"的瞬间动摇与重建
must_happen:
  - 某个关键人物（生母旧仆 / 父亲 / 道长 / 老嬷嬷）抛出对玩家身世的暗示
  - 玩家必须做出回应（追问 / 否认 / 装聋 / 反将一军）
  - 至少一条信息差被推进（hinted → confirmed，或反向）
must_not_happen:
  - 当场公开告知所有人
  - 玩家直接放弃当前身份逃出府
```

## 视角 A · 寒雁视角

### Slice α · 私室低语 · 老嬷嬷夜来

```yaml
axes:
  S: chamber           # 自己的闺房，只一盏灯
  H: { lineage: hinted, mother_alive: unknown }
  N: [chen_mama]       # 旧仆陈嬷嬷或同等心腹
  T: 8                 # 半夜，天明前都还有时间
  A: { rumor: private, reverb: low }
tone_hint: 老人推门进来，关门时反复确认了三遍。
```

### Slice β · 祠堂祭祖 · 当众试探

```yaml
axes:
  S: shrine
  H: { lineage: hinted, mother_alive: unknown }
  N: [father, stepmother, elder, brother]
  T: 4                 # 仪式时长有限
  A: { rumor: court, reverb: mid }
tone_hint: 列祖牌位前，对方在所有人面前"无意"提起一件你不该知道的事。
```

### Slice γ · 道观清晨 · 道长批命

```yaml
axes:
  S: temple
  H: { lineage: confirmed, mother_alive: hinted }
  N: [jingxu_daoist]
  T: 12
  A: { rumor: all, reverb: high }
tone_hint: 道长说出一句话，你才意识到京中已经有人传开了。
```

### Choice Pool（共 11 个）

| 选项 | hook | require |
| --- | --- | --- |
| 不动声色追问"这话从何而来" | `probe_source` | N=[chen_mama \| jingxu_daoist] |
| 当场矢口否认，把对方堵回去 | `flat_deny` | （任意 Slice） |
| 假装不解，转移话题 | `feign_oblivion` | （任意 Slice） |
| 反问对方"你是谁派来的" | `counter_probe` | S=chamber \| temple |
| 留下信物试探对方反应（如玉佩半块） | `bait_with_token` | S=chamber, N=[chen_mama] |
| 当众一笑置之，事后再清算 | `public_dismiss` | S=shrine, N=[elder] |
| 借祖宗牌位起誓"我是 X 家女" | `swear_on_ancestors` | S=shrine |
| 当场直问父亲"我究竟是谁的女儿" | `confront_father` | S=shrine, N=[father], H.lineage=confirmed |
| 借故离场，立刻回房翻母亲遗物 | `urgent_search_relics` | Tmax≤6 |
| 让心腹连夜送信给某位远亲求证 | `reach_relative` | N=[chen_mama], Tmax≤8 |
| 跪下当众认承"是我血脉有疑" | `public_confess` | S=shrine, H.lineage=confirmed |

> **演示点**：默认 H=hinted 时，玩家有 7 个选项；H 升为 confirmed 时多出 2 个"激烈"选项（`confront_father` / `public_confess`）——**信息差直接决定"是否敢摊牌"**。

---

## 视角 B · 父亲（庄仕洋同位角色）视角

### Slice α-male · 私室独酌 · 旧仆来访

```yaml
axes:
  S: chamber
  H: { lineage: confirmed, daughter_knows: unknown }
  N: [chen_mama]
  T: 8
  A: { rumor: private, reverb: low }
tone_hint: 老人一开口，你十几年前那个夜晚立刻回到眼前。
```

### Slice β-male · 祠堂祭祖 · 女儿当众

```yaml
axes:
  S: shrine
  H: { lineage: confirmed, daughter_knows: hinted, wife_complicit: confirmed }
  N: [daughter, stepmother, elder, brother]
  T: 4
  A: { rumor: court, reverb: mid }
tone_hint: 她抬眼看你的一瞬，你知道她已经在怀疑。
```

### Slice γ-male · 书房深夜 · 一封举报信

```yaml
axes:
  S: study
  H: { lineage: confirmed, court_aware: hinted }
  N: [steward]
  T: 6
  A: { rumor: all, reverb: high }
tone_hint: 桌上那封无名信，言辞客气，却把十几年前的事说得一清二楚。
```

### Choice Pool（共 10 个）

| 选项 | hook | require |
| --- | --- | --- |
| 当场拍案，命人把旧仆轰出去 | `silence_witness` | S=chamber, N=[chen_mama] |
| 重金封口，留她一命换沉默 | `bribe_for_silence` | S=chamber, N=[chen_mama] |
| 反过来威胁"你说出去你也活不了" | `mutual_assured_destruction` | S=chamber, N=[chen_mama] |
| 当众斥责女儿"不知规矩" | `public_scold_daughter` | S=shrine, N=[daughter] |
| 当众替女儿打圆场，保住体面 | `cover_with_grace` | S=shrine, N=[daughter, elder] |
| 私下喊女儿到偏房，问她知道多少 | `private_inquiry` | S=shrine, N=[daughter] |
| 把举报信压下来，假装没看见 | `suppress_letter` | S=study |
| 把举报信交给妻子，让她处理 | `delegate_to_wife` | S=study, H.wife_complicit=confirmed |
| 提笔上奏，主动澄清家世（赌一把） | `preemptive_disclosure` | S=study, H.court_aware=hinted |
| 当夜召旧仆灭口 | `eliminate_threat` | Tmax≤6 |

> **演示点**：男主视角的 H 轴**永远是 confirmed**——他自己当然知道。但他多了**两条新的隐藏轴**：`daughter_knows`（女儿察觉了多少）和 `court_aware`（朝中是否听到风声）。这是 Prism 处理多视角时"信息差结构"差异的关键。

---

# 扩展案例 2 · 夜袭抵御 / "暗夜围杀"晶体

> 原著触发点：第 56–57 章望江楼刺客 + 第 69 章闺中刺客 + 第 125–126 章暗巷御前侍卫追杀（socialgame 现有 QTE 的素材）。
> 这是一组"突发武装威胁，玩家必须在有限时间内做出抵御 / 求援 / 周旋决定"的剧情节点的抽象化。
> **价值**：演示 Prism 不仅能管对话节点，也能管动作节点——QTE 与五轴可共存。

## Crystal · "夜袭围困"

```yaml
crystal_id: night_assault_survival
dramatic_function: 让玩家在视野有限 + 时间逼近 + 武力悬殊下做出"信谁、护谁、舍谁"的判断
must_happen:
  - 至少 3 名敌人已经在场或即将到达
  - 玩家与至少 1 名同伴或 NPC 处于威胁范围
  - 必须在 T 倒计时内做出第一个生死判断
must_not_happen:
  - 玩家被无伤无代价地救走
  - 敌人无故撤退
```

## 视角 A · 寒雁视角

### Slice α · 望江楼花瓶后 · 屠楼之夜

```yaml
axes:
  S: tower_alcove
  H: { assassin_target: hinted, savior_identity: unknown }
  N: [enemies_many, shuhong_separated]
  T: 2                 # 脚步声逼近
  A: { rumor: private, weather: rain }
tone_hint: 你蹲在花瓶后，听见对方的脚步越过你身侧，又突然停下。
```

### Slice β · 闺房惊梦 · 黑衣人入府

```yaml
axes:
  S: chamber
  H: { assassin_target: confirmed, savior_identity: unknown }
  N: [enemies_few, jilan_outside]
  T: 5
  A: { rumor: private, weather: still }
tone_hint: 你被一只冰凉的手覆住口鼻，刀已经抵在你的咽喉。
```

### Slice γ · 暗巷御前侍卫 · 君要臣死

```yaml
axes:
  S: alley
  H: { assassin_target: confirmed, savior_identity: hinted, royal_decree: confirmed }
  N: [enemies_squad, masked_savior, jilan, shuhong]
  T: 3
  A: { rumor: all, weather: storm }
tone_hint: 御前侍卫的令牌反着光。你身后突然多出一道挡在你身前的黑影。
```

### Choice Pool（共 12 个）

| 选项 | hook | require |
| --- | --- | --- |
| 屏息不动，赌对方走过去 | `hold_breath` | S=tower_alcove, T≤3 |
| 拔出袖中梅花刺反击 | `melee_resist` | （任意 Slice） |
| 朝最近的同伴方向冲，背靠背 | `regroup_with_ally` | N includes any ally |
| 大声呼救（启动 QTE：分贝 + 持续时间） | `qte_shout_for_help` | T≤3, A.weather ≠ silent_required |
| 把贵重信物（玉佩）抛向半空求接应 | `signal_with_token` | N=[masked_savior \| jilan] |
| 假装受伤倒下，伺机偷袭 | `feign_injury` | （任意 Slice） |
| 信任面具人，背对他迎敌 | `trust_masked` | N=[masked_savior], H.savior_identity≥hinted |
| 让丫鬟先走，自己断后 | `sacrifice_for_maid` | N includes maid |
| 翻窗 / 翻墙脱身 | `evasive_flee` | S ≠ alley |
| 朝御前侍卫亮明身份（赌他们不敢杀王妃） | `invoke_status` | N includes royal_squad, H.royal_decree≠confirmed |
| 直接朝最近的黑衣人扑过去同归于尽 | `desperate_charge` | T≤2 |
| 搜身：摸最近一具尸体的腰牌（确认幕后） | `loot_evidence` | 在 hold_breath 或 melee_resist 之后 |

> **演示点 1**：T 轴在这个 Crystal 里**真正决定生死**——T≤3 时 hold_breath / shout / desperate_charge 三个紧急选项才会浮出。
> **演示点 2**：H.royal_decree 是个有趣的反向锁——若玩家知道是皇上要她死，"亮明身份"反而**消失**（因为没用）。这演示了"已知信息会让某些选项不可选"，是 Prism 中 H 轴的反向用法。
> **演示点 3**：`qte_shout_for_help` 直接绑定 socialgame 现有的麦克风 QTE 子系统——证明 Prism 五轴 + 物理 QTE 可以共存。

---

## 视角 B · 面具人（傅云夕同位角色）视角

### Slice α-male · 屋顶俯瞰 · 屠楼之夜

```yaml
axes:
  S: roof_above_tower
  H: { her_location: hinted, her_awareness_of_you: unknown }
  N: [enemies_many, hanyan_below, your_subordinates]
  T: 2
  A: { weather: rain, reverb: mid }
tone_hint: 你看见她在花瓶后蹲着的影子，刀光正擦着她肩头过去。
```

### Slice β-male · 王府墙外 · 闺房刺客

```yaml
axes:
  S: outside_chamber
  H: { her_location: confirmed, her_awareness_of_you: unknown, illness: confirmed }
  N: [enemies_few, hanyan_inside]
  T: 5
  A: { weather: still, reverb: low }
tone_hint: 你刚咳了一口血，就听见她屋里传出一声闷响。
```

### Slice γ-male · 暗巷尽头 · 御前侍卫

```yaml
axes:
  S: alley_end
  H: { her_location: confirmed, royal_decree: confirmed, illness: confirmed }
  N: [enemies_squad, hanyan]
  T: 3
  A: { weather: storm, reverb: high }
tone_hint: 你戴上鬼面那一刻，胸口的寒毒又泛上来一次。
```

### Choice Pool（共 11 个）

| 选项 | hook | require |
| --- | --- | --- |
| 不出手，让她自救（保留身份） | `withhold_to_protect_cover` | （任意 Slice） |
| 出手但不现身（远程射杀 / 屋顶飞剑） | `intervene_anonymously` | S=roof_above_tower \| outside_chamber |
| 戴鬼面亲自下场 | `appear_masked` | T≤3 |
| 卸下鬼面，让她看见是你（暴露身份） | `reveal_identity` | T≤2, H.her_awareness_of_you=unknown |
| 替她挡下致命一击 | `take_the_blow` | T≤2, N includes hanyan |
| 调动暗卫围杀对方主帅 | `dispatch_subordinates` | N includes subordinates |
| 故意伤一个对方士兵当活口 | `capture_alive` | （任意 Slice） |
| 制造一场更大的混乱（点火 / 砸瓦）转移敌人 | `create_distraction` | S=roof_above_tower |
| 把她背走，强行带离 | `evacuate_by_force` | T≤2, N includes hanyan, H.illness 允许 |
| 假装自己被击杀，让她以为你不在了 | `fake_death_to_save` | T≤3 |
| 撤退，回头清算幕后（放她自己脱险） | `tactical_withdrawal` | T>2 |

> **演示点**：男主视角下"不出手"和"出手"两条线**代价向量完全相反**——"不出手"保住伪装但赌她活下来，"出手"救她但暴露行踪。这就是 Prism 反复强调的"代价拓扑差异"。

---

## 两个新晶体的 hook 新增清单

> 这些 hook 加入 design-doc 中"给数值系统的语义事件清单"。Brewed 决定每个事件的具体数值映射。

### 验亲 / 身世真相 · 寒雁
- `probe_source` · 情报↑ 风险↑
- `flat_deny` · 隐蔽↑ 真相进度↓
- `feign_oblivion` · 隐蔽↑↑ 关系→0
- `counter_probe` · 情报↑ 对方戒心↑
- `bait_with_token` · 情报↑↑ 暴露↑↑
- `public_dismiss` · 体面↑ 真相进度↓
- `swear_on_ancestors` · 体面↑↑ 后续反噬↑↑（若是假誓）
- `confront_father` · 真相进度↑↑↑ 父女关系↓↓↓
- `urgent_search_relics` · 情报↑ 心力↓
- `reach_relative` · 盟友信任↑ 暴露↑
- `public_confess` · 计划崩盘↑↑↑

### 验亲 / 身世真相 · 父亲
- `silence_witness` · 隐蔽↑ 旧仆怨念↑
- `bribe_for_silence` · 隐蔽↑↑ 资金↓
- `mutual_assured_destruction` · 隐蔽↑↑↑ 风险↑↑↑
- `public_scold_daughter` · 体面↑ 父女关系↓
- `cover_with_grace` · 体面↑↑ 父女关系↑
- `private_inquiry` · 情报↑ 女儿戒心↑
- `suppress_letter` · 隐蔽↑ 朝堂风险↑
- `delegate_to_wife` · 妻子掌控↑↑ 自身风险↓
- `preemptive_disclosure` · 朝堂主动权↑ 家族体面↓↓
- `eliminate_threat` · 隐蔽↑↑↑ 黑化↑↑

### 夜袭抵御 · 寒雁
- `hold_breath` · 生存率↑↑（若未被发现）/ 致命（若被发现）
- `melee_resist` · 受伤↑ 自信↑
- `regroup_with_ally` · 生存率↑ 同伴受伤风险↑
- `qte_shout_for_help` · 由 QTE 子系统判定
- `signal_with_token` · 盟友赶到概率↑↑ 暴露↑
- `feign_injury` · 反杀机会↑ 受伤↑
- `trust_masked` · 信任傅云夕↑↑ 生存率↑↑
- `sacrifice_for_maid` · 内在成长↑↑ 自身风险↑↑↑
- `evasive_flee` · 生存率↑ 体面↓
- `invoke_status` · 生存率↑↑（普通敌人）/ 0（御前侍卫）
- `desperate_charge` · 同归于尽风险↑↑↑
- `loot_evidence` · 情报↑↑↑（揭出幕后）

### 夜袭抵御 · 男主
- `withhold_to_protect_cover` · 计划完成↑ 她活下来概率↓
- `intervene_anonymously` · 她生存率↑ 暴露↑
- `appear_masked` · 她生存率↑↑ 暴露↑↑
- `reveal_identity` · 关系↑↑↑ 计划崩盘↑↑↑
- `take_the_blow` · 她生存率↑↑↑ 自身重伤↑↑↑
- `dispatch_subordinates` · 整体生存率↑ 暗卫损失↑
- `capture_alive` · 情报↑↑↑ 时间消耗↑
- `create_distraction` · 转移敌人↑↑ 旁观伤亡↑
- `evacuate_by_force` · 她生存率↑↑↑ 她信任↓
- `fake_death_to_save` · 她绝望↑↑↑ 计划保密↑↑
- `tactical_withdrawal` · 计划保密↑ 她当晚风险↑↑

---

## 三组晶体的对比表

| | 第五幕「离心」 | 「验亲」 | 「夜袭」 |
| --- | --- | --- | --- |
| 节点类型 | 对话 / 情感 | 对话 / 揭秘 | 动作 / 生死 |
| 主要驱动轴 | H（信息差） | H（信息差） | T（时间） + H |
| QTE 集成 | 无 | 无 | 有（`qte_shout_for_help`）|
| 视角双方 | 寒雁 ↔ 男主 | 寒雁 ↔ 父亲 | 寒雁 ↔ 面具人男主 |
| Slice 数 | 6 | 6 | 6 |
| hook 数 | 26 | 21 | 23 |

**共 18 个 Slice、70 个 hook**——这就是 Prism 应用在一段完整剧情里能产出的多样性体量。

---

*Prism Sample Script v1.1 · 第五幕 + 身世真相 + 夜袭抵御 三组晶体 · 双视角*

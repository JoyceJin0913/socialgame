# PR: 新增功能路线图 — P0~P3 四阶段规划

## 概述

本 PR 为《重生之贵女难求》互动文游项目新增 **功能路线图**，按优先级划分为 P0–P3 共四个阶段，已在 `README.md` 中以表格形式记录。

**目标受众**: 接手此项目进行功能开发的 AI Agent / 协作开发者。

---

## 背景上下文

### 当前项目状态
- **线上地址**: https://novel-guinv.vercel.app（Vercel 版） / CloudBase SSR 版
- **技术栈**: 前端 `front-end/`（TanStack Start + React + TypeScript）；静态版 `dist/`
- **核心玩法已实现**: Prism 动态选项 + B 翻译层（LLM 即兴台词）+ 声音 QTE 三结局
- **原著**: 千山茶客《重生之贵女难求》，100 万字古言重生小说
- **当前覆盖剧情**: 第五幕（第 96–125 章），3 场核心戏（一年之约 / 凯旋归来 / 一纸休书）

### 为什么需要这四项功能
当前版本是「对话 + QTE」的垂直切片体验，缺少：
1. **入场沉浸感** → 玩家打开页面不知道故事在讲什么（需要 P0）
2. **探索与收集** → 纯线性对话，缺乏回访动力（需要 P1）
3. **成就与记忆** → 重玩时一切归零，「重生」主题未被体现（需要 P2）
4. **全局视角** → 玩家不知道自己在六幕大结构中的位置（需要 P3）

---

## 功能需求详情

### 【P0】开场视频前情 ⭐ 最高优先级

> **目标**: 用户进入游戏首页后，先看到一段 30–60 秒的剧情前情视频/动画，快速建立世界观和代入感。

#### 需求拆解

| 子项 | 说明 | 实现方式建议 |
|---|---|---|
| 视频素材 | 第五幕之前的关键情节浓缩（前世之死 + 重生醒来 + 与傅云夕初遇） | 可用图片轮播 + 文字旁白过渡，或录屏/剪辑成品视频 |
| 自动播放 | 进入 `/play` 首页时自动播放 | `<video autoplay muted>` 或 CSS 动画序列 |
| 跳过按钮 | 右上角「跳过前情」按钮，点击直接进入游戏 | 状态管理：`hasSeenIntro` 存 localStorage |
| 记忆状态 | 已看过的玩家不再强制播放 | `localStorage.getItem('seen_intro') === 'true'` |

#### 技术要点
- **文件位置**: `front-end/src/components/IntroVideo.tsx`
- **路由集成**: 在 `front-end/src/routes/play/index.tsx` 的最外层包裹条件渲染
- **资源**: 视频文件放 `front-end/public/intro/` 目录
- **降级方案**: 无视频时展示 5–8 张关键场景图 + 文字滚动（类似片头字幕）

#### 验收标准
- [ ] 首次进入自动播放前情内容
- [ ] 可跳过，且跳过后不再重复播放
- [ ] 移动端适配（全屏 / 横屏处理）
- [ ] 加载速度 < 3 秒（或显示 loading 骨架）

---

### 【P1】卡片搜索、小游戏

> **目标**: 在主线对话之外，增加轻量级的卡牌收集和互动小游戏，提升可玩性和回访率。

#### 需求拆解

##### 1A. 卡牌搜索 / 收集系统

| 子项 | 说明 |
|---|---|
| 卡牌内容 | 人物卡（寒雁 / 傅云夕 / 卫如风等）、道具卡（玉佩 / 信笺）、场景卡（王府 / 金銮殿） |
| 获取方式 | 对话中触发特定关键词 → 解锁卡片；完成某幕结局 → 获得限定卡 |
| 卡牌信息 | 正面：立绘/插画；背面：人物小传 / 道具来历 / 场景描述 |
| 搜索入口 | 底部 Tab 或侧边栏「图鉴」入口；支持模糊搜索（按名字 / 关键词） |

**技术方案**:
```
数据模型:
interface Card {
  id: string;
  type: 'character' | 'item' | 'scene';
  name: string;
  image: string;          // 图片 URL 或 base64
  description: string;
  unlockCondition: string; // 解锁条件描述
  unlockedAt?: number;     // 解锁时间戳
  rarity: 'N' | 'R' | 'SR' | 'SSR'; // 稀有度
}
存储: localStorage / indexedDB（卡牌数据量不大时前者即可）
组件: front-end/src/components/CardGallery.tsx + CardSearch.tsx
```

##### 1B. 轻量级小游戏

| 游戏类型 | 说明 | 复杂度 |
|---|---|---|
| **记忆翻牌** | 翻对相同图案的卡牌（人物配对主题） | 低 — 纯前端逻辑 |
| **诗词填空** | 给出小说原句挖空，补全古风台词 | 中 — 需要题库 JSON |
| **角色问答** | 选择题形式测试对人物关系 / 剧情的理解 | 低 — 静态题目数组 |

**技术方案**:
- 小游戏独立页面: `front-end/src/routes/games/`
- 共享布局: `front-end/src/components/GameLayout.tsx`
- 成绩记录: localStorage 存最高分

#### 验收标准
- [ ] 卡牌可通过对话触发解锁
- [ ] 图鉴页支持搜索和筛选
- [ ] 至少实现 1 个小游戏（推荐记忆翻牌）
- [ ] 移动端可正常操作

---

### 【P2】高光图片、重生图鉴 + 记忆继承 ⭐ 核心差异化

> **目标**: 打造「重生记忆」系统——玩家的选择和经历可以带入下一周目，让二周目体验真正不同。

#### 需求拆解

##### 2A. 高光图片集

| 子项 | 说明 |
|---|---|
| 触发时机 | 每幕结局 / 关键分支节点自动截图或播放预设高光立绘 |
| 内容 | 角色 CG（AI 生成的古风立绘）、场景氛围图、QTE 成功/失败瞬间 |
| 展示 | 「回忆廊」页面，按时间线排列，可分享单张 |

##### 2B. 重生图鉴（记忆系统）

这是本项目**最具差异化的功能**——呼应小说「重生」主题：

```
┌─────────────────────────────────────────────┐
│            🔄 重生图鉴                        │
├─────────────────────────────────────────────┤
│  第 1 世（首次游玩）                          │
│    · 结局: 鬼面救场 ⭐⭐⭐                    │
│    · 解锁卡牌: 5 张                          │
│    · 关键选择: [信任傅云夕+++] [隐蔽---]      │
│                                             │
│  第 2 世（携带记忆）                          │
│    · 继承: 第 1 世的全部卡牌                  │
│    · 额外选项: "我记得上一世你骗过我" (Prism)  │
│    · 结局: 卓七路过 ⭐⭐                       │
│                                             │
│  第 3 世 ...                                 │
└─────────────────────────────────────────────┘
```

**技术方案**:

```typescript
// 记忆数据结构
interface ReincarnationMemory {
  cycle: number;              // 第几世
  endingId: string;           // 上次结局
  unlockedCards: string[];    // 已解锁卡牌 ID 列表
  prismState: {               // Prism 世界轴快照
    trustLevel: number;       // 信任值
    hiddenKnowledge: string[]; // 已知真相
    choices: string[];        // 关键选择记录
  };
  timestamp: number;
}

// 存储
const MEMORIES_KEY = 'reincarnation_memories';
function saveCycle(memory: ReincarnationMemory): void { ... }
function loadCycles(): ReincarnationMemory[] { ... }
function startNewCycle(previousCycle?: ReincarnationMemory): void { ... }
```

**Prism 集成点**:
- 当 `cycle >= 2` 时，Prism 的 `H`(Hidden) 轴默认包含前世已知信息
- 新增 require 条件示例:
  ```js
  {
    text: "我记得上一世，你也是这样骗我的",
    require: { H: 'reborn', cycle: { min: 2 } },  // 仅第 2 世起可见
    delta: { '信任傅云夕': '--', '隐蔽': '+' }
  }
  ```

#### 验收标准
- [ ] 高光时刻可在游戏中触发并保存到「回忆廊」
- [ ] 开始新游戏时可选择「携带记忆重生」
- [ ] 携带记忆后，Prism 选项池出现新选项
- [ ] 图鉴页面展示多周目的完整历程
- [ ] 数据持久化（刷新不丢失）

---

### 【P3】梗概地图

> **目标**: 用可视化地图展示整部小说（六幕）的故事脉络，让玩家知道自己当前处于什么位置、前后发生了什么。

#### 需求拆解

| 子项 | 说明 |
|---|---|
| 整体结构 | 六幕时间线：第一幕（初入侯府）→ 第六幕（大结局） |
| 当前位置高亮 | 玩家所在幕 / 章节用特殊颜色标记 |
| 分支走向 | 同一幕的不同结局导致不同路径分叉（ DAG 有向无环图） |
| 点击交互 | 点击某一节点可查看该章节梗概 / 快速跳转 |
| 缩放 / 拖拽 | 支持移动端手势操作 |

**技术选型建议**:

| 方案 | 优点 | 缺点 |
|---|---|---|
| **D3.js 力导向图** | 表现力强，自定义程度高 | 学习曲线陡峭 |
| **React Flow** | React 原生，内置拖拽缩放 | 包体积较大 |
| **Mermaid 静态图** | 项目已有 Mermaid 使用经验 | 交互性弱，不适合复杂分支 |
| **Canvas 自绘** | 完全可控，性能好 | 开发成本高 |

**推荐**: React Flow（与现有 React 技术栈一致，内置节点/边自定义能力）

**数据结构**:

```typescript
interface MapNode {
  id: string;              // e.g., 'act1_ch1'
  act: number;             // 第几幕
  chapter: number;         // 第几章
  title: string;
  summary: string;
  isCurrent: boolean;
  isCompleted: boolean;
  endings?: MapNodeEnding[];
}

interface MapEdge {
  from: string;
  to: string;
  label?: string;          // e.g., "信任傅云夕"
  condition?: string;      // 触发条件
  style?: 'default' | 'highlight' | 'locked';
}
```

**文件位置**: `front-end/src/components/StoryMap.tsx` + `front-end/src/routes/map/index.tsx`

#### 验收标准
- [ ] 六幕结构清晰呈现
- [ ] 当前进度高亮
- [ ] 支持点击查看章节概要
- [ ] 支持触屏拖拽 / 缩放
- [ ] 分支路径可视（不同结局走不同路线）

---

## 依赖关系

```
P0 开场视频 ──────────────────────────────┐
                                          ↓
P1 卡片/小游戏 ──→ P2 图鉴(需卡牌数据) ──→ P3 地图(需全量章节数据)
                    ↑
                (P2 的记忆系统依赖 P1 的卡牌作为载体)
```

- **P0 可独立开发**，无外部依赖
- **P1 和 P2 有数据耦合**（卡牌是图鉴的一部分），建议 P1 先行
- **P3 最依赖全局数据**，适合最后做

---

## 代码规范

### 文件命名
- 组件: `PascalCase.tsx`（如 `IntroVideo.tsx`）
- 页面路由: `kebab-case/index.tsx`（如 `story-map/index.tsx`）
- 数据模型: `PascalCase.types.ts`（如 `Card.types.ts`）
- 工具函数: `camelCase.ts`（如 `storage.ts`）

### 样式
- 项目使用 Tailwind CSS（见 `front-end/tailwind.config.ts`）
- 设计 Token 见 `README.md` UI 氛围设计章节
- 保持古风暗色调（`--bg: #0e0a09`, `--gold: #d4a857` 等）

### 国际化
- 当前仅中文，无需 i18n
- 古风文案保持一致性（参考 B 翻译层的 system prompt 风格）

---

## 测试检查清单

每个优先级完成后验证:

- [ ] 本地 `npm run dev` 可正常运行
- [ ] 无 TypeScript 类型错误
- [ ] 无控制台 warning / error
- [ ] 移动端 Chrome DevTools 适配检查
- [ ] localStorage 持久化验证（刷新后数据不丢失）
- [ ] DeepSeek API 调用部分不受影响（回归现有功能）

---

## 相关文件索引

| 文件/目录 | 用途 |
|---|---|
| `README.md` | 本文件，含路线图总表（已更新） |
| `front-end/src/routes/` | 页面路由（新功能页面在此创建） |
| `front-end/src/components/` | 公共组件 |
| `front-end/public/` | 静态资源（视频/图片存放处） |
| `prism/scripts/*.json` | Prism 剧本数据（P2 集成参考） |
| `《重生之贵女难求》阅读笔记.md` | 六幕剧情分析（P3 地图数据来源） |
| `dist/play/index.html` | 旧版静态页面（仅供参考，新功能写在 `front-end/`） |

---

>*"这一世，我要让欠我的，一个都跑不掉。"* — 庄寒雁

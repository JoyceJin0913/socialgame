# 🎭 重生之贵女难求 · 互动文游

> 把一本 100 万字的古言小说，做成一个可对话、可呼救、可分支的 AI 互动文游。
>
> **线上 Demo**：https://novel-guinv.vercel.app

---

## 📖 项目简介

本项目把网络小说《重生之贵女难求》（千山茶客 著）改编为：

1. 📑 **小说阅读笔记站** — 人物关系图 + 六幕剧情 + 主暗线分析
2. 🎮 **沉浸式互动文游** — 用户扮演女主庄寒雁，与 AI 扮演的 NPC 对话，并在「暗巷追杀」环节通过 **声音 QTE** 决定结局
3. 🔮 **Prism 剧情方法论** — 同一段戏在不同世界状态下浮现不同选项，让二周目体验真有差异
4. 🎙️ **B 翻译层** — 每次玩家点选项时，DeepSeek 即兴把"行为意图"译成寒雁的古风台词，每次都不一样

技术栈极简：**纯静态 HTML + Vercel Serverless Function + DeepSeek API**，单文件、零依赖、3 分钟可二次部署。

---

## ✨ 核心玩法

### 一、对话式剧情（第五幕 · 三场戏）

```
🎬 第 1 幕 · 王府书房 · 一年之约
   傅云夕："等我一年。一年内不归，你便改嫁。"

🎬 第 2 幕 · 金銮殿外 · 凯旋归来
   西戎公主伊琳娜出场，皇上当朝下旨准其和离

🎬 第 3 幕 · 王府书房 · 一纸休书
   傅云夕（冷酷模式）："寒雁，离开我。"
```

每幕你会看到：

| 来源 | 内容 |
|---|---|
| **Prism 选项池** | 4–5 个根据当前世界状态动态浮现的选项（每次内容不同） |
| **自由输入框** | 想说什么自己写，AI 也接得住 |
| **AI 即兴台词** | 你点的选项会被翻译成寒雁的具体古风台词，再发给 NPC |

每个 NPC 由 **DeepSeek 大模型扮演**，受 system prompt 强约束：
- 古风对白限制（< 50 字 / 第二人称铁律 / 禁现代词汇）
- 人设秘密分级（不主动透露）
- 同角色不同状态可挂多套 persona（比如傅云夕 vs 傅云夕·苦肉计版）

### 二、声音 QTE 玩法（核心创新）

```
🎤 大声喊出"救——命——！"

  分贝   ████████░░░░  72 dB
  时长   [●●●●●○○○○○]  3.2 / 5.0 秒
  倒计时       2.4

⭐⭐⭐ 78dB+ × 2秒+ → 傅云夕鬼面救场
⭐⭐   62dB+ × 1秒+ → 卓七路过相救
⭐     未达标       → 失声被擒，自救分支
```

**完全在浏览器端完成**，音频不离开本地。

---

## 🏗️ 架构

```
┌──────────────────────────────────────────────────────────────────┐
│                       浏览器（用户端）                            │
│                                                                   │
│  /index.html              /play/index.html                        │
│  小说阅读笔记站            互动文游                               │
│   · Mermaid 关系图         · Prism 适配层（动态选项折射）         │
│   · 六幕详情               · B 翻译层（意图 → 寒雁台词）          │
│   · 主暗线网格             · 声音 QTE / 三结局                    │
└────────────────────────┬──────────────────────────────────────────┘
                         │  fetch('/api/chat')
                         │  （每次玩家点选项触发 2 次：翻译 + 接戏）
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│        Vercel Serverless Function · /api/chat                    │
│                                                                   │
│  · 校验 messages 入参                                            │
│  · 从环境变量读 DEEPSEEK_API_KEY（不暴露给前端）                 │
│  · 转发到 DeepSeek API                                           │
│  · 返回精简后的 reply 字段                                       │
└────────────────────────┬──────────────────────────────────────────┘
                         ▼
              ┌─────────────────────┐
              │  DeepSeek Chat API  │
              │  deepseek-chat 模型  │
              └─────────────────────┘
```

### 文件结构

```
.
├── README.md                           # 本文件
├── 《重生之贵女难求》作者：千山茶客.txt    # 原著全文（UTF-16LE）
├── 《重生之贵女难求》阅读笔记.md/.html     # 笔记站 + 六幕剧情分析
├── 第五幕全文_第96-125章.txt              # 第五幕（30 章）独立切片
│
├── prism/                              # Prism 方法论提案（远端协作目录）
│   ├── README.md                       # Prism 项目导读
│   ├── SKILL.md                        # 方法论文档（5 轴 + Crystal）
│   ├── design-doc.md                   # 第五幕双视角剧本案例
│   ├── demo.html                       # 五轴可视化演示页
│   ├── editor.html                     # 可视化剧本编辑器
│   └── scripts/                        # 三组剧本 JSON
│       ├── _schema.json
│       ├── act5_separation.json        # 第五幕 · 离心时刻（双视角）
│       ├── heritage_truth.json         # 身世真相 · 嫡庶被翻起
│       └── night_assault.json          # 夜袭抵御 · 暗夜围杀
│
└── dist/                               # 部署单元（Vercel）
    ├── index.html                      # 阅读笔记站
    ├── play/
    │   └── index.html                  # 互动文游主页（含 Prism 适配 + B 翻译层）
    ├── prism/
    │   └── act5_separation.json        # 同源副本，前端 fetch 用
    ├── api/
    │   └── chat.js                     # Serverless: 代理 DeepSeek
    ├── vercel.json
    ├── .gitignore                      # 已忽略 .env / .env.*
    └── .env.example                    # 环境变量模板
```

---

## 🔮 玩法 1：Prism 方法论（剧情骨架层）

### 核心理念

> **节点不是一段写好的内容，是一个生成器函数。**

作者只写两件事：
1. 这一幕**必须发生什么**（Crystal 骨架）
2. 一份**候选选项池**（不是写死的 3 个）

至于"哪些选项现在能浮出来、代价多大"——由当前世界状态算出来。

### 5 条世界轴

| 轴 | 管什么 | 影响 |
|---|---|---|
| **S** Scene | 事件发生在哪 | 可调用的物件、社交礼数 |
| **H** Hidden | 玩家知道多少真相 | 哪些选项能"想到" |
| **N** NPC | 谁在场 | 哪些对话可触发 |
| **T** Time | 还剩多少时间 | 紧急选项是否浮出 |
| **A** Ambient | 舆论 / 天气 | 选项代价的乘数 |

### 第五幕 14 个候选选项 vs 写死 3 个

```js
// 之前（写死）
options: [
  { text: '"我等你十年。"', tag: '深情' },
  { text: '"你必须回来——活着回来。"', tag: '坚定' },
  { text: '"……好。"（咬唇低头）', tag: '隐忍' }
]

// 现在（Prism 池 + require 过滤）
{
  id: 'truth_revealed',
  text: '看着他的眼睛说"我知道你在装"',
  hook: 'truth_revealed',
  require: { S: 'courtyard', N: ['fyx'], H: 'confirmed' },  // 仅在玩家已知寒毒时浮出
  delta: { '信任傅云夕': '+++', '隐蔽': '---' }
}
```

`require` 字段决定一个选项**当前是否可见**；`hook` 是给数值系统的语义事件名；`delta` 是代价方向（不是数值）。

### 调试 HUD

页面右上角会显示当前世界状态 + 哪些选项被过滤了：

```
🔮 Prism · 一年之约
剧本   第五幕 · 离心时刻
视角   寒雁视角
S=study · H=unknown · N=[fyx,maid] · T=20 · A=private/low

[动态可见 4/14]  [原写死 3]

▶ 已过滤 10 个（点击展开看 require 详情）
```

---

## 🎙️ 玩法 2：B 翻译层（台词渲染层）

### 解决了什么问题

Prism 设计哲学要求 `text` 字段是"行为意图"（"借更衣靠近，试探脉象与药味"），不是具体台词。但玩家直接看到指令式文案时**沉浸感被打断**——好像在写策划文档而不是在演寒雁本人。

### 工作流

```
玩家点「说一句让他记你一辈子的承诺」
        ↓
按钮变成"译…正在化作寒雁此刻会说的话…"，其他按钮 disable
        ↓ ~300ms
[第 1 次 LLM 调用] 翻译层
   system: "你是寒雁的台词写手，重生归来、聪明克制。把意图改写成第一人称古风台词，<30字"
   user:   "把这个意图改写成寒雁的台词：说一句让他记你一辈子的承诺"
   → 返回："(抬眸直视) 一年之后，我必归来，与你共写结局。"
        ↓
玩家气泡：(抬眸直视) 一年之后，我必归来，与你共写结局。
        ↓
[第 2 次 LLM 调用] 主对话（傅云夕接戏）
        ↓
NPC 回应（已守住第二人称铁律）
```

### 实测翻译效果

| Prism 原文案（动作意图）| LLM 翻译后（寒雁台词）|
|---|---|
| 说一句让他记你一辈子的承诺 | (抬眸直视) 一年之后，我必归来，与你共写结局。 |
| 借更衣靠近，试探他的脉象与药味 | （借更衣之机靠近）公子脉象沉滞，药味里...多了三分朱砂。 |
| 让心腹连夜送信给杨琦寻援 | 星夜传书，唤杨琦速来。 |

### 工程细节

- **缓存**：`{sceneId}::{choiceId}` 为 key，同一幕内重选不重复调用
- **失败兜底**：翻译挂了直接用原 text，不卡死流程
- **去引号**：模型偶尔会自己加书名号 / 外引号，已用正则清理
- **延迟**：实测 300–500ms，配合"译…"loading 文案不突兀

---

## 🎤 玩法 3：声音 QTE 实现原理

### 整体流程

```
用户点击"开始呼救"
        ↓
getUserMedia 申请麦克风权限
        ↓
Web Audio API 创建分析器
        ↓
每 80ms 采样频谱数据 (Uint8Array)
        ↓
计算分贝 + 命中帧数
        ↓
实时更新 UI（分贝条 / 时长条 / 倒计时）
        ↓
5 秒后判定结局（3 档）
```

### 核心代码

```javascript
async function startQTE() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const audioCtx = new AudioContext();
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 1024;
  audioCtx.createMediaStreamSource(stream).connect(analyser);
  const data = new Uint8Array(analyser.frequencyBinCount);

  const startTime = Date.now();
  let maxDB = 0, hitFrames = 0;

  const timer = setInterval(() => {
    analyser.getByteFrequencyData(data);
    const sum = data.reduce((a, b) => a + b, 0);
    const avg = sum / data.length;
    const db = 30 + (avg / 255) * 80;          // 0~255 → 30~110 伪分贝

    if (db > 50) hitFrames++;
    if (db > maxDB) maxDB = db;

    updateUI(db, hitFrames);

    if (Date.now() - startTime >= 5000) {
      clearInterval(timer);
      stream.getTracks().forEach(t => t.stop());
      audioCtx.close();
      judgeResult(maxDB, hitFrames);
    }
  }, 80);
}
```

### 判定规则

```javascript
function judgeResult(maxDB, hitFrames) {
  if (maxDB >= 78 && hitFrames >= 25) showEnding('fuyunxi');   // ⭐⭐⭐ 鬼面救场
  else if (maxDB >= 62 && hitFrames >= 13) showEnding('zhuoqi'); // ⭐⭐   卓七路过
  else showEnding('captured');                                  // ⭐    失声被擒
}
```

### 隐私安全

- 🔒 音频流**不离开浏览器**，只读频谱数据
- 🔒 没有 `MediaRecorder`，不录音、不上传
- 🔒 5 秒后立即关闭 `MediaStream` + `AudioContext`，麦克风指示灯熄灭

---

## 🎨 UI 氛围设计

### 雨夜动画

雨幕用纯 CSS + 60 个随机参数的 `<i>` 元素实现：

```css
.rain i {
  position: absolute;
  width: 1px;
  background: linear-gradient(180deg, transparent, rgba(200,184,164,0.6));
  animation: rain-fall linear infinite;
}
@keyframes rain-fall {
  from { transform: translateY(-100vh); }
  to   { transform: translateY(100vh); }
}
```

### 设计 Token

```css
:root {
  --bg:        #0e0a09;   /* 深夜背景 */
  --bg-card:   #241b1a;   /* 卡片底色 */
  --ink:       #f3e9dc;   /* 主文字（米白） */
  --ink-soft:  #c8b8a4;   /* 旁白文字 */
  --gold:      #d4a857;   /* 金 — 重要交互 */
  --red:       #c2473a;   /* 红 — 紧迫/危险 */
  --green:     #6b8e4e;   /* 绿 — 平和选项 */
  --blue:      #5a7a9e;   /* 蓝 — 信息 */
}
```

---

## 🚀 本地开发 / 部署

### 一、克隆 + 联调环境

```bash
git clone https://github.com/JoyceJin0913/socialgame
cd socialgame/dist

# 一次性配置：把已部署项目的环境变量拉到本地
vercel env pull .env.local --environment=development

# 启动本地开发服务器（含 /api/chat 函数）
vercel dev
# → http://localhost:3000（端口被占会自动换 3001 / 3002）
```

> ⚠️ 不要直接 `open dist/play/index.html`——`file://` 协议下没有 `/api` 路由，AI 对话会全部 500。

### 二、获取 DeepSeek API Key

1. 访问 https://platform.deepseek.com/api_keys
2. 微信登录 → **创建 API Key** → 复制
3. 充值 1 元起 https://platform.deepseek.com/top_up

> 一次完整体验（3 场景 + 翻译层）约消耗 0.002–0.003 元。

### 三、部署到 Vercel

```bash
cd dist
vercel deploy --prod --yes
```

部署完成后配置环境变量：

```bash
# 命令行方式（交互式输入 Key，不会暴露在历史中）
vercel env add DEEPSEEK_API_KEY production
vercel env add DEEPSEEK_API_KEY preview
vercel env add DEEPSEEK_API_KEY development

# 重新部署使环境变量生效
vercel deploy --prod --yes
```

### 四、验证 API

```bash
curl -X POST https://你的域名.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"你好"}]}'

# 预期输出
# {"reply":"...","usage":{...}}
```

---

## ☁️ 部署到 CloudBase（CloudRun · 推荐用于 front-end 全栈版）

> `dist/` 是旧的纯静态 + Vercel 版本；`front-end/` 是 **TanStack Start + Cloudflare Workers 的 SSR 全栈版**（含服务端 `/api/chat`）。
> 这一版用 **腾讯云开发 CloudBase 的云托管（CloudRun）容器**部署，可同时承载 SSR 页面与 `/api/chat` 服务端逻辑。

### 线上地址

👉 **https://social-game-264115-8-1305035004.sh.run.tcloudbase.com**
（首页自动跳转到 `/huatangchun` 剧情页）

- 环境 ID：`immersed-d7g3oj41x1eb54ce2`（上海）
- 控制台：https://tcb.cloud.tencent.com/dev?envId=immersed-d7g3oj41x1eb54ce2#/platform-run

### 为什么用 CloudRun 而不是静态托管

`front-end` 的构建产物是面向 **Cloudflare Workers 运行时**（`@cloudflare/vite-plugin` + `wrangler.jsonc`，入口 `src/server.ts`），并带有服务端路由 `/api/chat`（代理 DeepSeek）。

| 方案 | 能否跑通 | 说明 |
|---|---|---|
| 静态托管 Static Hosting | ⚠️ 只能跑前端页面 | `/api/chat` 等服务端逻辑跑不了，AI 对话失效 |
| **云托管 CloudRun（容器）** | ✅ 推荐 | 同时承载 SSR + `/api/chat`，最贴合现有架构 |

### 部署用到的两个关键文件（已就绪，在 `front-end/`）

| 文件 | 作用 |
|---|---|
| `server-node.mjs` | **Node 适配器**：把 Cloudflare Worker 的 `fetch(request, env, ctx)` 处理器包装成监听 `PORT` 的 Node HTTP 服务；先查 `dist/client` 静态文件，命中则返回，否则交给 worker 做 SSR。worker 产物完全自包含（仅依赖 `node:*` 内建模块，无 npm 依赖）。 |
| `Dockerfile` | 多阶段构建：构建阶段 `npm ci` + `npm run build`，运行阶段只保留 `dist/` + 适配器 + 生产依赖，监听 `8080`。 |

### 前置条件（一次性）

1. 开通云开发并创建环境，拿到 `envId`。
2. 在该环境**开通云托管 / CloudRun**：
   `https://tcb.cloud.tencent.com/dev?envId=<你的envId>#/platform-run`

### 部署流程

通过 CodeBuddy 的 CloudBase 集成（或 CloudBase CLI / 控制台）以**容器模式**部署 `front-end/`：

```
形态：CloudRun 容器（container）
目录：front-end/
Dockerfile：Dockerfile
端口：8080
规格：0.5 核 / 1G 内存，最小 1 实例（避免冷启动）/ 最多 2 实例
访问：PUBLIC（公网）
环境变量：DEEPSEEK_API_KEY=<你的key>   NODE_ENV=production
```

> 🔐 `DEEPSEEK_API_KEY` 只注入**云端环境变量**，不写进镜像、不进 Git。
> 部署后云端会构建容器镜像（约几分钟），版本上线后 `OnlineVersionInfos` 才会出现，此前访问会返回 `SERVICE_VERSION_NOT_FOUND`，属正常现象，稍等即可。

### 本地用容器同款方式自测（部署前验证）

```bash
cd front-end
npm run build
DEEPSEEK_API_KEY=<你的key> PORT=8090 node server-node.mjs
# 首页 SSR：  curl -sL -o /dev/null -w "%{http_code}\n" http://localhost:8090/
# AI 对话：   curl -X POST http://localhost:8090/api/chat \
#               -H "Content-Type: application/json" \
#               -d '{"messages":[{"role":"user","content":"你好"}]}'
```

### 线上验证

```bash
BASE=https://social-game-264115-8-1305035004.sh.run.tcloudbase.com
curl -sL -o /dev/null -w "GET / => %{http_code}\n" "$BASE/"
curl -X POST "$BASE/api/chat" -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"你好"}]}'
# 预期：首页 200；/api/chat 返回 {"reply":"你好", "usage":{...}}
```

### 更新重新部署

改完 `front-end/` 代码后，重新跑一次容器部署即可（镜像会重建、几分钟后新版本上线）。如需更换 `DEEPSEEK_API_KEY`，更新云端环境变量后重新部署生效。

---

## 🎯 扩展方向

### 玩法变体（基于同一套 QTE 引擎）

| 玩法 | 关键改动 |
|---|---|
| 🎵 **节奏大师** | 改判定为"按节拍 hit 高分贝" |
| 🐉 **嘶吼咆哮** | 改高频段（800Hz+）能量为指标 |
| 🎤 **录音回放** | 加 `MediaRecorder`，结局动画播放玩家自己的呼救声 |
| 👶 **轻声叮咛** | 反向判定 — 不能超过 30 dB（哄睡场景） |
| 💋 **吹蜡烛** | 检测气音特征（高频 + 低分贝持续） |

### 剧情维度（基于 Prism 方法论）

- 🎭 **多视角切换**：用 `views.fyx` 让玩家用傅云夕视角再玩一遍第五幕（剧本里已有 13 个男主选项）
- 🧩 **拓展 Crystal**：把"身世真相 / 夜袭抵御" 也接入（剧本已就位在 `prism/scripts/`）
- 🎯 **数值层**：实现 `hook → state delta → ending 路由`，让对话选择真的影响结局
- 👥 **双人模式**：WebSocket + 房间号，两个真人 + Bot 填充其余坑位
- 🏆 **成就系统**：解锁原著名场景台词卡片
- 🎨 **AI 立绘**：调用图像 API 生成每幕角色立绘

### 投票指证（另一个原创玩法）

类似法庭审判，参考 `《重生之贵女难求》阅读笔记.md` 第三幕"春祭遇刺"：

```javascript
const case_chunjie = {
  scene: "春祭遇刺",
  clues: [
    { id: 1, text: "刺客用的是西戎弯刀" },
    { id: 2, text: "庄语山当日称病未来" },
    { id: 3, text: "卫如风袖中沾血" }
  ],
  suspects: ["庄语山", "卫如风", "七皇子", "太后"],
  truth: "七皇子",
  branches: {
    "庄语山": { result: "她崩溃哭诉，扯出周氏" },
    "卫如风": { result: "他冷笑反咬，舆论翻转" },
    "七皇子": { result: "一击中的，但太后立即出手", isTrue: true },
    "太后":   { result: "时机未到，被太子救场" }
  }
}
```

---

## 📚 项目内置资源（按需自取）

| 文件 | 用途 |
|---|---|
| `《重生之贵女难求》作者：千山茶客.txt` | 原著全文（UTF-16LE，1.04 MB） |
| `《重生之贵女难求》阅读笔记.md/.html` | 六幕剧情分析 + 主暗线 + Mermaid 人物关系图 |
| `第五幕全文_第96-125章.txt` | 第五幕完整 30 章独立切片（UTF-8）|
| `prism/design-doc.md` | 双视角剧本设计案例（寒雁 + 傅云夕） |
| `prism/scripts/*.json` | 3 组双视角 Crystal（第五幕离心 / 身世真相 / 夜袭抵御） |
| `prism/SKILL.md` | Prism 方法论文档（独立于本项目） |
| `prism/demo.html` | 五轴可视化演示页（双击打开即可） |
| `prism/editor.html` | 可视化剧本编辑器 |

---

## ⚠️ 已知问题 / 注意事项

| 问题 | 说明 / 解法 |
|---|---|
| iOS Safari 麦克风延迟 | 首次申请权限后需等待 ~500ms，已在 UI 用倒计时缓冲 |
| 浏览器拒绝麦克风权限 | 走"被擒"分支结局，不卡死流程 |
| DeepSeek 余额耗尽 | 顶部红字提示 + 允许跳过当前对话进入下一幕 |
| 用户跑题（聊现代话题） | system prompt 已加守门规则，AI 会用古风方式婉拒 |
| 移动端横屏体验差 | 已锁竖屏布局，移动端 max-width 自适应 |
| 翻译层偶尔抽风 | 已有失败兜底；缓存避免同选项重复抽奖 |

---

## 📊 成本估算

| 项目 | 成本 |
|---|---|
| Vercel Hobby 套餐 | 免费（含 100GB 带宽 + 100GB·小时 Serverless） |
| DeepSeek API（deepseek-chat） | 输入 ¥0.5/1M tokens，输出 ¥2/1M tokens |
| 单次完整体验（3 幕 + B 翻译 + QTE） | 约 1500–2000 tokens ≈ ¥0.002 |
| 月活 1000 人成本估算 | ≈ ¥6–10（白嫖友好）|

> B 翻译层让单次成本翻倍（每选 1 次调 2 次 API），但 token 总量仍极低。

---

## 🛡️ 安全清单

- [x] API Key 仅存于 Vercel 环境变量，不进 Git
- [x] `.gitignore` 已排除 `.vercel/` / `.env` / `.env.*` / `node_modules`
- [x] 提供 `dist/.env.example` 作为团队成员的配置模板
- [x] 前端 `fetch('/api/chat')` 走同源，无暴露风险
- [x] CORS 仅对 OPTIONS 放行
- [ ] **建议**：在 DeepSeek 控制台设置每日消费上限
- [ ] **建议**：为 API 加 rate limit（防恶意刷）

---

## 📝 License

代码：MIT

小说原作《重生之贵女难求》版权归作者千山茶客所有，本项目仅做学习/技术演示用途，
请勿用于商业传播。

---

## 🙏 致谢

- 原著：千山茶客 《重生之贵女难求》
- LLM：DeepSeek
- 部署：Vercel Serverless
- 关系图：Mermaid
- Prism 方法论：协作贡献于 `feat/prism-methodology` 分支

---

## 📮 联系

有改进建议或想 fork 做自己版本的小说互动文游？欢迎 issue / PR。

> *"打掉牙，咽进肚里。这一世，我庄寒雁，要让欠我的，一个都跑不掉。"*

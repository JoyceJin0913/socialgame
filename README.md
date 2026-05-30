# 🎭 重生之贵女难求 · 互动文游

> 把一本 100 万字的古言小说，做成一个可对话、可呼救、可分支的 AI 互动文游。
>
> **线上 Demo**：https://novel-guinv.vercel.app

---

## 📖 项目简介

本项目把网络小说《重生之贵女难求》（千山茶客 著）改编为：

1. 📑 **小说阅读笔记站** — 人物关系图 + 六幕剧情 + 主暗线分析
2. 🎮 **沉浸式互动文游** — 用户扮演女主庄寒雁，与 AI 扮演的傅云夕 / 伊琳娜对话，并在「暗巷追杀」环节通过 **声音 QTE** 决定结局

技术栈极简：**纯静态 HTML + Vercel Serverless Function + DeepSeek API**，单文件、零依赖、3 分钟可二次部署。

---

## ✨ 核心玩法

### 一、对话式剧情（3 个场景）

```
🎬 场景 1 · 王府书房 · 一年之约
   傅云夕："等我一年。一年内不归，你便改嫁。"
   你的回应：3 个预设选项 + 自由输入框

🎬 场景 2 · 金銮殿外 · 伊琳娜出场
   西戎公主与你正面交锋

🎬 场景 3 · 王府书房 · 一纸休书
   傅云夕（冷酷模式）："寒雁，离开我。"
```

每个场景由 **DeepSeek 大模型扮演的角色 NPC** 实时回应，支持：
- 古风对白限制（system prompt 守门）
- 人设秘密分级（不主动透露）
- 自由输入 + 预设选项混合

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
┌────────────────────────────────────────────────────┐
│                   浏览器（用户端）                  │
│                                                     │
│  /index.html              /play/index.html          │
│  小说阅读笔记站            互动文游                  │
│   · Mermaid 关系图         · 对话剧情              │
│   · 六幕详情               · 声音 QTE              │
│   · 主暗线网格             · 三结局判定             │
└────────────────────────────────────────────────────┘
                         │
                         │  fetch('/api/chat')
                         ▼
┌────────────────────────────────────────────────────┐
│        Vercel Serverless Function · /api/chat      │
│                                                     │
│  · 校验 messages 入参                              │
│  · 从环境变量读 DEEPSEEK_API_KEY（不暴露给前端）   │
│  · 转发到 DeepSeek API                             │
│  · 返回精简后的 reply 字段                         │
└────────────────────────────────────────────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │  DeepSeek Chat API  │
              │  deepseek-chat 模型  │
              └─────────────────────┘
```

### 文件结构

```
dist/
├── index.html              # 阅读笔记站（5 Tab）
├── play/
│   └── index.html          # 互动文游（剧情 + QTE）
├── api/
│   └── chat.js             # Serverless: 代理 DeepSeek
├── vercel.json             # 静态站点 + cleanUrls 配置
└── .vercel/                # 部署元信息
```

---

## 🎮 玩法 1：AI 对话剧情

### 角色 Persona 设计

每个 NPC 都有**独立的 system prompt**，约束人设、说话风格、剧情立场。

```javascript
const PERSONAS = {
  fuyunxi: {
    name: '傅云夕',
    system: `你是傅云夕，大宗皇朝玄清王，二十二岁，权倾朝野的"冰山王爷"。
【性格】表面冷峻克制，内心对庄寒雁深情似海。
【秘密】自幼被太后下了寒毒；七年前红梅雪夜被九岁的庄寒雁救过。
【规则】
1. 你只能说一句话或一个动作描写（< 50 字），用古风对白
2. 不要主动透露所有秘密，根据用户反应酌情流露真情
3. 不要使用现代词汇（手机/电脑/咖啡等）
4. 偶尔可以用"雁儿"称呼她，每次都是情感破防的信号`
  },
  fuyunxi_cold: { /* 冷酷模式（休妻苦肉计） */ },
  yilinna:      { /* 西戎公主 */ }
};
```

### 调用流程

```javascript
async function chatWithAI(persona, history) {
  const messages = [
    { role: 'system', content: persona.system },
    ...history  // 用户与 NPC 的多轮对话
  ];
  const resp = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, temperature: 0.9, max_tokens: 200 })
  });
  const data = await resp.json();
  return data.reply;
}
```

### Serverless 代理（隐藏 API Key）

```javascript
// api/chat.js
export default async function handler(req, res) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const { messages, temperature = 0.85, max_tokens = 400 } = req.body;

  const upstream = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages, temperature, max_tokens
    })
  });

  const data = await upstream.json();
  res.status(200).json({ reply: data.choices[0].message.content.trim() });
}
```

**关键点**：
- 前端永远拿不到 Key（只能访问 `/api/chat`）
- 环境变量在 Vercel Project Settings 配置
- CORS 已开启，方便本地调试

---

## 🎤 玩法 2：声音 QTE 实现原理

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
  // 1. 申请麦克风
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  // 2. 创建分析器
  const audioCtx = new AudioContext();
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 1024;
  audioCtx.createMediaStreamSource(stream).connect(analyser);
  const data = new Uint8Array(analyser.frequencyBinCount);

  // 3. 实时采样
  const startTime = Date.now();
  let maxDB = 0, hitFrames = 0;

  const timer = setInterval(() => {
    analyser.getByteFrequencyData(data);

    // 计算"伪分贝"（0~255 → 30~110）
    const sum = data.reduce((a, b) => a + b, 0);
    const avg = sum / data.length;
    const db = 30 + (avg / 255) * 80;

    if (db > 50) hitFrames++;          // 50dB 以上算"在喊"
    if (db > maxDB) maxDB = db;         // 更新峰值

    updateUI(db, hitFrames);            // 实时刷新进度条

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
  // hitFrames * 80ms = 实际持续时长
  if (maxDB >= 78 && hitFrames >= 25) {
    showEnding('fuyunxi');   // ⭐⭐⭐ 鬼面救场
  } else if (maxDB >= 62 && hitFrames >= 13) {
    showEnding('zhuoqi');    // ⭐⭐   卓七路过
  } else {
    showEnding('captured');  // ⭐     失声被擒
  }
}
```

### 为什么用「峰值 + 时长」双指标？

| 单指标方案 | 漏洞 |
|---|---|
| 只看峰值 dB | 拍一下手就能瞬间冲到 80dB → 不公平 |
| 只看时长 | 玩家轻声哼 5 秒 → 不像在呼救 |
| **峰值 + 时长** | 必须**又大声又持续**才算合格 ✅ |

### 为什么是"伪分贝"？

真实分贝需要专业声学校准（参考声压、麦克风灵敏度、环境底噪）。
浏览器 API 拿不到这些信息，所以我们做的是**相对值映射**：

| 行为 | 伪分贝范围 |
|---|---|
| 安静背景 | 30~40 |
| 正常说话 | 50~65 |
| 大声呼喊 | 75~95 |
| 嘶吼 | 95+ |

对游戏来说，这种相对感**完全足够**——玩家能直观感受到"我喊得越大声分贝条越满"。

### 隐私安全

- 🔒 音频流**不离开浏览器**，我们只读频谱数据
- 🔒 没有 `MediaRecorder`，不录音、不上传
- 🔒 5 秒后立即关闭 `MediaStream` + `AudioContext`，麦克风指示灯熄灭

---

## 🎨 UI 氛围设计

### 雨夜动画

雨幕用纯 CSS + 60 个随机参数的 `<i>` 元素实现：

```javascript
for (let i = 0; i < 60; i++) {
  const drop = document.createElement('i');
  drop.style.left = Math.random() * 100 + '%';
  drop.style.height = (8 + Math.random() * 14) + 'px';
  drop.style.animationDuration = (0.4 + Math.random() * 0.6) + 's';
  drop.style.animationDelay = (Math.random() * 2) + 's';
  rain.appendChild(drop);
}
```

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

### 一、克隆 + 开发

```bash
# 克隆项目
git clone https://github.com/your/novel-guinv
cd novel-guinv/dist

# 本地静态预览（可选，用任意静态服务器）
npx serve .
# 或者
python3 -m http.server 8000
```

⚠️ 本地无法直接调用 `/api/chat`（需 Vercel 环境）。
本地开发可用 `vercel dev` 启动完整环境：

```bash
npm i -g vercel
vercel dev
# → http://localhost:3000 (含 API 路由)
```

### 二、获取 DeepSeek API Key

1. 访问 https://platform.deepseek.com/api_keys
2. 微信登录 → **创建 API Key** → 复制
3. 充值 1 元起 https://platform.deepseek.com/top_up

> 一次完整体验（3 场景对话）约消耗 0.001 元，1 元够测 1000 次。

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

或者通过控制台：
- 访问 `https://vercel.com/<你的账号>/<项目名>/settings/environment-variables`
- 添加 `DEEPSEEK_API_KEY`（覆盖 Production / Preview / Development 三环境）

### 四、验证 API

```bash
curl -X POST https://你的域名.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"你好"}]}'

# 预期输出
# {"reply":"...","usage":{...}}
```

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

### 剧情维度

- 🎭 **多主角切换**：让用户也能体验傅云夕 / 卓七视角
- 👥 **双人模式**：WebSocket + 房间号，两个真人 + Bot 填充其余坑位
- 📜 **多线分支**：根据每幕选择倾向（强硬/温柔/隐忍）记录性格画像，影响后续 NPC 反应
- 🏆 **成就系统**：解锁原著名场景台词卡片
- 🎨 **AI 立绘**：调用图像 API 生成每幕角色立绘

### 投票指证（你提过的另一玩法）

类似法庭审判：

```javascript
const case_chunjie = {
  scene: "春祭遇刺",
  clues: [
    { id: 1, text: "刺客用的是西戎弯刀", unlocked: false },
    { id: 2, text: "庄语山当日称病未来", unlocked: false },
    { id: 3, text: "卫如风袖中沾血", unlocked: false }
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

## ⚠️ 已知问题 / 注意事项

| 问题 | 说明 / 解法 |
|---|---|
| iOS Safari 麦克风延迟 | 首次申请权限后需等待 ~500ms，已在 UI 用倒计时缓冲 |
| 浏览器拒绝麦克风权限 | 走"被擒"分支结局，不卡死流程 |
| DeepSeek 余额耗尽 | 顶部红字提示 + 允许跳过当前对话进入下一幕 |
| 用户跑题（聊现代话题） | system prompt 已加守门规则，AI 会用古风方式婉拒 |
| 移动端横屏体验差 | 已锁竖屏布局，移动端 max-width 自适应 |

---

## 📊 成本估算

| 项目 | 成本 |
|---|---|
| Vercel Hobby 套餐 | 免费（含 100GB 带宽 + 100GB·小时 Serverless） |
| DeepSeek API（deepseek-chat） | 输入 ¥0.5/1M tokens，输出 ¥2/1M tokens |
| 单次完整体验消耗 | 约 800 tokens ≈ ¥0.001 |
| 月活 1000 人成本估算 | ≈ ¥3-5（白嫖友好）|

---

## 🛡️ 安全清单

- [x] API Key 仅存于 Vercel 环境变量，不进 Git
- [x] `.gitignore` 已排除 `.vercel/` 和 `*.env`
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

---

## 📮 联系

有改进建议或想 fork 做自己版本的小说互动文游？欢迎 issue / PR。

> *"打掉牙，咽进肚里。这一世，我庄寒雁，要让欠我的，一个都跑不掉。"*

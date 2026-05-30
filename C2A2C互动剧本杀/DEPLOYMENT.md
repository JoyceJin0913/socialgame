# 🎬 C2A2C互动剧本杀 - 部署指南

## 📦 产品包结构

```
《重生之贵女难求》C2A2C互动剧本杀/
│
├── 📄 README.md                    # 项目总览文档
├── 📄 dm_handbook.md               # DM主持人手册（机密）
├── 📄 player_handbook.md           # 玩家手册（公开）
│
├── 📁 config/                      # 配置文件目录
│   ├── game_config.json           # 游戏主配置
│   └── characters.json             # 角色卡牌系统
│
├── 📁 scripts/                     # 剧本脚本
│   └── story_scenes.json          # 五幕完整剧本
│
├── 📁 docs/                        # 文档目录
│   └── ai_engine.md              # AI引擎规则
│
└── 📁 tech/                        # 技术参考
    └── reference_impl.js          # 接口定义与示例代码
```

---

## 🚀 快速开始（3种部署方式）

### 方式一：原型演示（最快，无需编码）

**适用场景**：产品演示、概念验证、小范围测试

**所需工具**：
- ChatGPT Plus / Claude Pro（或任何支持长上下文的LLM）
- 一个群聊平台（微信群/Discord/飞书）

**操作步骤**：
1. 打开 `config/characters.json`，分配角色给各玩家
2. 将 `scripts/story_scenes.json` 中的场景内容作为"剧本大纲"
3. 使用 AI 对话作为"GM"，将玩家输入传给 AI 并返回结果
4. 参照 `ai_engine.md` 中的 System Prompt 设置 AI 人格
5. 手动维护关系数值和游戏状态（可用在线表格）

**预估时间**：30分钟内可开始游戏

---

### 方式二：低代码平台（推荐中小团队）

**适用场景**：正式运营、付费场次、多房间并行

**推荐平台**：

| 平台 | 特点 | 成本 |
|------|------|------|
| **Discord Bot** | 语音+文字一体，生态成熟 | 免费/低成本 |
| **飞书/钉钉机器人** | 国内用户友好 | 企业版收费 |
| **微信小程序** | 用户基数大 | 需要审核 |
| **专属Web应用** | 完全定制化 | 开发成本较高 |

**技术栈建议**：
```
前端：React/Vue + Socket.io-client
后端：Node.js/Python + Express/FastAPI
数据库：MongoDB/PostgreSQL（存档&状态）
AI服务：OpenAI API / Claude API / 自部署模型
实时通信：Socket.io / WebSocket
```

**核心功能模块**：
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  房间管理    │    │  玩家状态    │    │  AI引擎     │
│  创建/加入   │ -> │  属性/技能   │ -> │  叙事生成   │
│  角色选择    │    │  关系/物品   │    │  动态改编   │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       v                   v                   v
┌─────────────────────────────────────────────────────┐
│                  实时同步中枢 (WebSocket Hub)         │
│    事件广播 | 状态同步 | 冲突检测 | 消息路由          │
└─────────────────────────────────────────────────────┘
```

---

### 方式三：完整自研（大型项目）

**适用场景**：商业化运营、多剧本扩展、平台化发展

**架构设计**：

```
                    ┌──────────────────┐
                    │   Load Balancer  │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼──────┐ ┌────▼────────┐ ┌───▼─────────┐
     │  Game Server  │ │  AI Service  │ │   Social     │
     │  (Node.js)    │ │  (Python)    │ │   Service    │
     ├───────────────┤ ├─────────────┤ ├─────────────┤
     │ Room Manager  │ │ LLM Gateway  │ │ Friends      │
     │ State Machine │ │ Prompt Mgr   │ │ Messaging    │
     │ Rules Engine  │ │ Cache Layer  │ │ Communities  │
     │ Event Bus     │ │ Queue        │ │ Achievement  │
     └───────┬───────┘ └──────┬───────┘ └──────┬──────┘
             │                 │                 │
     ┌───────▼─────────────────▼─────────────────▼───────┐
     │              Data Layer (PostgreSQL)               │
     │  Games | Users | Archives | Analytics | Config     │
     └──────────────────────────────────────────────────┘
```

**扩展方向**：
- 剧本编辑器（让创作者制作新剧本）
- UGC市场（用户自制剧本分享）
- 虚拟形象系统（Live2D角色）
- 语音合成（TTS角色配音）
- VR模式（元宇宙入口）

---

## 🔧 环境配置

### 必需环境变量

```env
# AI 服务配置
OPENAI_API_KEY=sk-xxx
OPENAI_MODEL=gpt-4-turbo
AI_TEMPERATURE=0.8
AI_MAX_TOKENS=2000

# 数据库配置
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# 服务端口
GAME_SERVER_PORT=3000
WS_PORT=3001

# 其他
LOG_LEVEL=debug
MAX_ROOMS=100
MAX_PLAYERS_PER_ROOM=8
```

### 依赖安装

```bash
# 后端依赖
npm install express socket.io pg ai-sdk zustand

# 前端依赖
npm install react react-dom @tanstack/react-query zustand framer-motion

# AI 相关
pip install openai langchain tiktoken
```

---

## 📊 监控与分析

### 关键指标（KPIs）

| 指标 | 说明 | 目标值 |
|------|------|--------|
| **DAU** | 日活跃用户 | 持续增长 |
| ** avg_session** | 平均游戏时长 | >180min |
| **retention_7d** | 7日留存率 | >40% |
| **completion_rate** | 游戏完成率 | >75% |
| **nps_score** | 净推荐值 | >50 |
| **arpu** | 每用户收入 | 因商业模式而异 |

### 数据埋点建议

```javascript
// 关键行为追踪
trackEvent('game_start', { roomId, playerCount, characters });
trackEvent('branch_taken', { branchId, choice, deviation });
trackEvent('skill_used', { skillId, target, success });
trackEvent('relationship_change', { from, to, delta, reason });
trackEvent('ending_reached', { endingType, duration, metrics });
trackEvent('social_interaction', { type, participants, duration });
```

---

## ⚠️ 法律与合规

### 版权声明
- 本剧本基于千山茶客小说《重生之贵女难求》改编
- **商用需获得原著方授权**
- AI生成内容的版权归属按当地法律执行

### 内容审查
- 含宅斗/复仇元素，适龄提示16+
- 避免过度暴力/血腥描写
- 敏感内容过滤机制必须启用

### 用户隐私
- 聊天记录加密存储
- 不收集不必要的个人信息
- 符合 GDPR / 个人信息保护法

---

## 🔄 版本迭代路线图

### v1.0 (当前)
- [x] 完整五幕剧本
- [x] 8个可玩角色
- [x] AI动态改编规则
- [x] DM/玩家手册

### v1.5 (计划)
- [ ] Web端MVP上线
- [ ] 语音频道支持
- [ ] 成就系统
- [ ] 回放功能

### v2.0 (规划)
- [ ] 多剧本支持
- [ ] UGC编辑器
- [ ] 移动端适配
- [ ] VIP订阅制

---

## 📮 支持与反馈

如有问题或建议，欢迎联系：
- GitHub Issues
- 邮箱：support@example.com
- 官方社群：（待建立）

---

*© 2025 C2A2C互动剧本杀工作室*
*保留所有权利*

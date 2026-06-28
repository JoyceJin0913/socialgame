# 站内联机匹配后端

后端入口在 `src/lib/matchmaker.ts`，通过 Cloudflare Durable Object `MATCHMAKER` 保存房间状态并广播 WebSocket 事件。

## REST API

### `GET /api/matchmaking/lobby?roleId=hanyan`

返回大厅中可见房间。`canJoin` 会根据传入角色计算，同角色房间不可加入。

### `POST /api/matchmaking/rooms`

创建房间。

```json
{
  "userId": "user_123",
  "nick": "江雪初停",
  "roleId": "hanyan",
  "storyId": "huatangchun"
}
```

### `POST /api/matchmaking/rooms/:roomId/join`

加入房间。后端会强制角色互斥：如果房间里已有同 `roleId` 玩家，返回 `409 ROLE_TAKEN`。

```json
{
  "userId": "user_456",
  "nick": "灯下听雨",
  "roleId": "moshen"
}
```

### `POST /api/matchmaking/rooms/:roomId/ready`

设置准备状态。两名玩家都 ready 且角色不重复时，房间进入 `playing`。

```json
{
  "userId": "user_123",
  "ready": true
}
```

### `POST /api/matchmaking/rooms/:roomId/leave`

离开房间。房间空了会自动关闭并从大厅移除。

```json
{
  "userId": "user_123"
}
```

## WebSocket

连接：

```txt
ws(s)://<host>/api/matchmaking/ws?roomId=<roomId>&userId=<userId>
```

事件：

- `connected`: 当前连接已进入房间，返回房间快照。
- `room_update`: 房间状态变更，包括加入、准备、离开。
- `error`: 后端错误。
- `pong`: 心跳回复。

## 前端封装

`src/lib/matchmaking-api.ts` 提供：

- `listMatchRooms`
- `createMatchRoom`
- `joinMatchRoom`
- `setMatchReady`
- `leaveMatchRoom`
- `getMatchRoom`
- `connectMatchRoom`

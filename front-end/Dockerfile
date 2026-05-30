# 多阶段构建：在容器内完成依赖安装 + 前端构建，运行阶段仅保留产物与适配器
# ---- build stage ----
FROM node:20-slim AS build
WORKDIR /app

# 先装依赖（利用缓存）
COPY package.json package-lock.json ./
RUN npm ci

# 再拷贝源码并构建（产物输出到 dist/）
COPY . .
RUN npm run build

# ---- runtime stage ----
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# server 产物完全自包含（仅依赖 node: 内建模块），运行阶段无需 node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/server-node.mjs ./server-node.mjs
COPY --from=build /app/package.json ./package.json

EXPOSE 8080
CMD ["node", "server-node.mjs"]

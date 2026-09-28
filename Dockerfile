FROM node:24-slim

ENV NODE_ENV=production
WORKDIR /app

# 仅一个纯 JS 依赖（express），数据库用 Node 内置 node:sqlite，无需编译
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund

COPY . .

ENV DB_PATH=/app/data/jizhangben.db
ENV PORT=3000
EXPOSE 3000
VOLUME ["/app/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=8s \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3000)+'/api/login',{method:'POST'}).then(r=>process.exit(r.status<500?0:1)).catch(()=>process.exit(1))"

CMD ["node","server.js"]

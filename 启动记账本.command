#!/bin/bash
# 双击启动记账本同步服务并打开浏览器（无需 Docker）
cd "$(dirname "$0")"
PORT=3000
if lsof -i tcp:$PORT -sTCP:LISTEN >/dev/null 2>&1; then
  open "http://localhost:$PORT"
  exit 0
fi
nohup node server.js > data/server.log 2>&1 &
sleep 1.6
open "http://localhost:$PORT"
exit 0

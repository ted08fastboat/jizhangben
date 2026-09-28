#!/bin/bash
# 双击停止记账本同步服务
PIDS=$(lsof -ti tcp:3000 -sTCP:LISTEN 2>/dev/null)
if [ -n "$PIDS" ]; then
  echo "$PIDS" | xargs kill 2>/dev/null
  echo "记账本服务已停止。"
else
  echo "服务未在运行。"
fi
echo
read -n1 -p "按任意键关闭此窗口..."

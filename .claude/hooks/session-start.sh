#!/bin/bash
set -euo pipefail

# 仅在云端会话（Claude Code on the web）运行；本地开发不受影响
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# 幂等：依赖已完整则直接跳过（容器状态会被缓存，二次启动近乎零成本）
if [ -d node_modules ] && npm ls --depth=0 >/dev/null 2>&1; then
  echo "session-start: node_modules 已就绪，跳过安装"
  exit 0
fi

# 注意：package-lock.json 的 resolved 必须指向 registry.npmjs.org，
# 云端网络策略只放行官方源（npmmirror 会被代理 403）。
npm install --no-audit --no-fund

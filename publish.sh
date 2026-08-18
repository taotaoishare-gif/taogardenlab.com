#!/usr/bin/env bash
# ── TAO Garden Lab 一键发布 ──────────────────────────────────────
# 用法：  npm run publish -- "这次改了什么"
# 做的事：验证 → 提交 → 推送 main → Cloudflare Pages 自动上线
# ────────────────────────────────────────────────────────────────
set -euo pipefail
cd "$(dirname "$0")"

MSG="${1:-}"
if [ -z "$MSG" ]; then
  echo "❌ 请写一句话说明这次改了什么："
  echo "   ./publish.sh \"新增古琴竹林 v5 实验记录\""
  exit 1
fi

if [ "$(git branch --show-current)" != "main" ]; then
  echo "❌ 当前分支不是 main。请先合并或切回 main 再发布。"
  exit 1
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "❌ 没有配置 GitHub remote origin，无法发布。"
  exit 1
fi

echo "▸ 1/3 本地验证（build + audit）…"
npm run validate > /tmp/taogarden-validate.log 2>&1 || {
  echo "❌ 验证失败，没有推送。错误如下："
  tail -40 /tmp/taogarden-validate.log
  exit 1
}
echo "  ✅ 验证通过"

echo "▸ 2/3 提交改动…"
git add -A
if git diff --cached --quiet; then
  echo "  ⚠️  没有任何改动，无需发布。"
  exit 0
fi
git commit -m "$MSG"

echo "▸ 3/3 推送到 GitHub…"
git push origin main || {
  echo "❌ 推送失败。先运行：gh auth login -h github.com -p https -w"
  echo "   然后重新执行本命令；本地 commit 已保留。"
  exit 1
}

echo ""
echo "✅ 已推送。GitHub Actions 与 Cloudflare Pages 正在处理这个 commit："
echo "   https://taogardenlab.com"
echo "   GitHub:     https://github.com/taotaoishare-gif/taogardenlab.com/actions"
echo "   Cloudflare: https://dash.cloudflare.com → Workers & Pages → tao-garden-site"

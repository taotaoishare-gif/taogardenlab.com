#!/usr/bin/env bash
# ── TAO Garden 一键发布 ──────────────────────────────────────────
# 用法：  ./publish.sh "这次改了什么"
# 做的事：构建自检 → 提交 → 推送 → Cloudflare 自动上线
# ────────────────────────────────────────────────────────────────
set -e
cd "$(dirname "$0")"

MSG="${1:-}"
if [ -z "$MSG" ]; then
  echo "❌ 请写一句话说明这次改了什么："
  echo "   ./publish.sh \"新增古琴竹林 v5 实验记录\""
  exit 1
fi

echo "▸ 1/3 本地构建自检…"
npm run build > /tmp/taogarden-build.log 2>&1 || {
  echo "❌ 构建失败，没有推送。错误如下："
  tail -30 /tmp/taogarden-build.log
  exit 1
}
echo "  ✅ 构建通过"

echo "▸ 2/3 提交改动…"
git add -A
if git diff --cached --quiet; then
  echo "  ⚠️  没有任何改动，无需发布。"
  exit 0
fi
git commit -m "$MSG"

echo "▸ 3/3 推送到 GitHub…"
git push

echo ""
echo "✅ 已推送。Cloudflare 正在构建，约 1–2 分钟后上线："
echo "   https://taogardenlab.com"
echo "   构建进度：https://dash.cloudflare.com → Workers & Pages → tao-garden-site"

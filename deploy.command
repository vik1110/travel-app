#!/bin/bash

# ════════════════════════════════════
#  🌸 Travel App — 部署工具
#  流程：origin/main → feature → merge → push
# ════════════════════════════════════

export PATH="/usr/bin:/usr/local/bin:/opt/homebrew/bin:$PATH"
export GIT_TERMINAL_PROMPT=0

REPO_DIR="/Users/vikwang/Documents/Claude/Projects/Test/Kyoto/test_travel"
TOKEN=$(cat ~/.travel_token 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ 找不到 ~/.travel_token，請確認 token 檔案存在"
  read -n 1; exit 1
fi

REMOTE="https://${TOKEN}@github.com/vik1110/travel-app.git"
BRANCH="feature/deploy-$(date +%Y%m%d-%H%M%S)"

cd "$REPO_DIR" || { echo "❌ 找不到資料夾 $REPO_DIR"; read -n 1; exit 1; }

echo ""
echo "🌸 Travel App 部署工具"
echo "────────────────────────"

# ── 1. 初始化 git（只有第一次需要）──────────────────────
if [ ! -d ".git" ]; then
  echo "🔧 初始化 git..."
  git init -q
  git config user.name  "vik"
  git config user.email "viktoria.wang@gogolook.com"
  git remote add origin "$REMOTE"
  git fetch origin -q
  git checkout -b main origin/main -q
  echo "✅ 初始化完成"
fi

# ── 2. Fetch 遠端狀態 ───────────────────────────────────
echo "🔍 同步遠端狀態..."
git fetch origin -q

# ── 3. Stash → 切換到 main → 同步 → 還原 ──────────────
STASHED=0
if ! git diff --quiet || ! git diff --cached --quiet; then
  git stash push -q -m "deploy-stash"
  STASHED=1
fi

git checkout main -q 2>/dev/null || git checkout -b main origin/main -q

BEHIND=$(git rev-list HEAD..origin/main --count 2>/dev/null || echo "0")
if [ "$BEHIND" -gt 0 ]; then
  echo "⬇️  拉取遠端 $BEHIND 個更新..."
  git pull origin main -q
else
  echo "✅ 已是最新版本，無需 pull"
fi

if [ "$STASHED" -eq 1 ]; then
  git stash pop -q 2>/dev/null || {
    echo "⚠️  還原改動時發生衝突，請手動處理"
    read -n 1; exit 1
  }
fi

# ── 4. 建立 feature branch ──────────────────────────────
echo ""
echo "🌿 建立分支：$BRANCH"
git checkout -b "$BRANCH" -q

# ── 5. Stage 要部署的檔案（逐一 add，避免單檔錯誤中斷全部）────
for f in index.html styles.css app.js sw.js deploy.command \
          icon.svg manifest.json \
          kyoto_mrt_01.jpg kyoto_mrt_02.jpg CLAUDE.md; do
  [ -e "$f" ] && git add "$f" 2>/dev/null
done

CHANGED=$(git diff --cached --name-only)

if [ -z "$CHANGED" ]; then
  echo "⚠️  沒有偵測到改動，無需部署"
  git checkout main -q
  git branch -d "$BRANCH" -q 2>/dev/null
  read -n 1; exit 0
fi

echo "📝 本次改動的檔案："
echo "$CHANGED" | sed 's/^/   /'
git commit -m "✈️ Update $(date +%Y/%m/%d\ %H:%M)" -q

# ── 6. Merge feature → main，推上去 ─────────────────────
echo ""
echo "🔀 Merge → main..."
git checkout main -q
git merge "$BRANCH" --no-ff -m "Deploy $(date +%Y/%m/%d\ %H:%M)" -q

echo "☁️  推送到 GitHub..."
git push "$REMOTE" main -q

echo ""
echo "✅ 部署成功！"
echo ""
echo "🌐 https://vik1110.github.io/travel-app"
echo "（GitHub Pages 約 1 分鐘後生效）"
echo ""
echo "────────────────────────"
echo "按任意鍵關閉..."
read -n 1

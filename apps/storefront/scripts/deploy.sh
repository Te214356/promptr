#!/usr/bin/env bash
# deploy.sh — code review then railway up
# Usage:
#   ./scripts/deploy.sh              → review + deploy
#   ./scripts/deploy.sh --skip-review → deploy only (no Claude review)
#   ./scripts/deploy.sh --force      → deploy even if review finds critical issues
set -euo pipefail

STOREFRONT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "$STOREFRONT_DIR/../.." && pwd)"
RAILWAY_SERVICE="f7497b9a-c86b-4c81-ae08-bac368caa0ae"
STATE_FILE="$STOREFRONT_DIR/.last-deploy-ref"
SKIP_REVIEW=false
FORCE=false

for arg in "$@"; do
  case $arg in
    --skip-review) SKIP_REVIEW=true ;;
    --force)       FORCE=true ;;
  esac
done

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'
header() { echo -e "\n${BOLD}${CYAN}▶ $1${RESET}"; }
ok()     { echo -e "${GREEN}✓ $1${RESET}"; }
warn()   { echo -e "${YELLOW}⚠ $1${RESET}"; }
fail()   { echo -e "${RED}✗ $1${RESET}"; }

# ── Step 1: Determine what changed since last deploy ──────────────────────────
header "Collecting changes"
cd "$REPO_ROOT"

# The ref we compare against: last deploy ref, or HEAD~1, or initial commit
if [ -f "$STATE_FILE" ]; then
  BASE_REF=$(cat "$STATE_FILE")
  # Verify the ref still exists
  if ! git cat-file -e "$BASE_REF" 2>/dev/null; then
    BASE_REF="HEAD"
  fi
else
  # First deploy: compare against HEAD (only untracked new files will show)
  BASE_REF="HEAD"
fi

# Files changed in git since BASE_REF (tracked)
MODIFIED=$(git diff --name-only "$BASE_REF" -- apps/storefront/src/ 2>/dev/null || true)

# Untracked new TS/TSX files (never committed yet)
UNTRACKED=$(git ls-files --others --exclude-standard -- apps/storefront/src/ 2>/dev/null \
  | grep -E '\.(ts|tsx)$' || true)

ALL_CHANGED=$(printf "%s\n%s" "$MODIFIED" "$UNTRACKED" | grep -v '^$' | sort -u)

if [ -z "$ALL_CHANGED" ]; then
  warn "No source changes found since last deploy."
  read -rp "Deploy anyway? [y/N] " yn
  [[ "$yn" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 0; }
  SKIP_REVIEW=true
else
  COUNT=$(echo "$ALL_CHANGED" | wc -l | tr -d ' ')
  ok "$COUNT file(s) changed since last deploy:"
  echo "$ALL_CHANGED" | sed 's/^/    /'
fi

# ── Step 2: TypeScript check ──────────────────────────────────────────────────
header "TypeScript check (tsc --noEmit)"
cd "$STOREFRONT_DIR"

TS_OUTPUT=$(npx tsc --noEmit --project tsconfig.json 2>&1 || true)
TS_ERRORS=$(echo "$TS_OUTPUT" | grep -c "error TS" || true)

if [ "$TS_ERRORS" -eq 0 ]; then
  ok "No TypeScript errors."
else
  fail "$TS_ERRORS TypeScript error(s) found:"
  echo "$TS_OUTPUT" | grep "error TS" | head -10 | sed 's/^/    /'
  if ! $FORCE; then
    echo -e "\nFix TypeScript errors or run with ${BOLD}--force${RESET} to skip."
    exit 1
  fi
  warn "--force set, continuing despite TS errors."
fi

# ── Step 3: Claude code review ────────────────────────────────────────────────
if $SKIP_REVIEW; then
  warn "Skipping code review."
else
  header "Code review (claude → code-reviewer)"
  cd "$REPO_ROOT"

  # Build diff content
  DIFF_CONTENT=""

  # Diff for tracked changed files
  if [ -n "$MODIFIED" ]; then
    while IFS= read -r f; do
      [ -f "$f" ] || continue
      FILE_DIFF=$(git diff "$BASE_REF" -- "$f" 2>/dev/null || true)
      [ -n "$FILE_DIFF" ] && DIFF_CONTENT+=$'\n'"$FILE_DIFF"
    done <<< "$MODIFIED"
  fi

  # Full content for untracked new files
  if [ -n "$UNTRACKED" ]; then
    while IFS= read -r f; do
      [ -f "$f" ] || continue
      DIFF_CONTENT+=$'\n\n'"=== NEW FILE: $f ==="$'\n'
      DIFF_CONTENT+=$(cat "$f")
    done <<< "$UNTRACKED"
  fi

  DIFF_SIZE=${#DIFF_CONTENT}

  if [ "$DIFF_SIZE" -eq 0 ]; then
    warn "Empty diff — skipping review."
    SKIP_REVIEW=true
  else
    # Truncate if > 60k chars to stay within token limits
    if [ "$DIFF_SIZE" -gt 60000 ]; then
      warn "Large diff (${DIFF_SIZE} chars) — truncating to 60k for review."
      DIFF_CONTENT="${DIFF_CONTENT:0:60000}"$'\n\n[DIFF TRUNCATED — only first 60k chars shown]'
    fi

    PROMPT="Review this Next.js 15 + Medusa v2 storefront diff (Railway deployment).

\`\`\`diff
${DIFF_CONTENT}
\`\`\`

Report findings grouped by:
🔴 Critical — breaks production or security vulnerability (blocks deploy)
🟠 High — likely bugs in normal usage
🟡 Medium — edge cases / code quality
🟢 Low — minor suggestions

If no issues, respond with exactly: LGTM"

    echo -e "${CYAN}Sending to claude code-reviewer...${RESET}"

    # Write prompt to temp file to avoid shell escaping issues with large diffs
    PROMPT_FILE=$(mktemp /tmp/deploy-review-XXXXXX.txt)
    printf '%s' "$PROMPT" > "$PROMPT_FILE"
    trap 'rm -f "$PROMPT_FILE"' EXIT

    REVIEW=$(claude \
      --agent code-reviewer \
      --print \
      --max-budget-usd 0.50 \
      < "$PROMPT_FILE" \
      2>/dev/null) || {
        warn "Claude review failed — deploying without review."
        REVIEW="REVIEW_SKIPPED"
      }
    rm -f "$PROMPT_FILE"

    echo ""
    echo -e "${BOLD}── Review ─────────────────────────────────────────────────${RESET}"
    echo "$REVIEW"
    echo -e "${BOLD}───────────────────────────────────────────────────────────${RESET}"
    echo ""

    if echo "$REVIEW" | grep -q "🔴"; then
      fail "Critical issues found — deploy blocked."
      if ! $FORCE; then
        echo -e "Fix the issues above or run with ${BOLD}--force${RESET} to override."
        exit 1
      fi
      warn "--force: deploying despite critical issues."
    elif echo "$REVIEW" | grep -qE "^LGTM$|^LGTM[[:space:]]"; then
      ok "LGTM — clean diff."
    elif [ "$REVIEW" = "REVIEW_SKIPPED" ]; then
      warn "Review skipped."
    else
      warn "Non-critical findings above — noted for next deploy."
    fi
  fi
fi

# ── Step 4: Deploy ────────────────────────────────────────────────────────────
header "Deploying to Railway"
cd "$STOREFRONT_DIR"

railway up --service "$RAILWAY_SERVICE" --detach

# Save current HEAD as the deploy ref for next time
git rev-parse HEAD > "$STATE_FILE" 2>/dev/null || true

ok "Upload complete. Build running in background."
echo -e "\n    Logs: ${CYAN}https://railway.com/project/b635b9d9-0241-4f5f-bbbd-1b6d2468d2c4/service/${RAILWAY_SERVICE}${RESET}\n"

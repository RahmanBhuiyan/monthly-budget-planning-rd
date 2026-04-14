#!/bin/sh
# Smart Expense & Budget Tracker — Claude Code statusline
# Adapted from https://github.com/fotoflo/claude-skills/tree/main/statusline-setup
#
# Row 1: ~/dir (branch) [model] session  +  ticket  +  [BIZ-QC] indicator
# Row 2: ctx:N% tok:Nk +N/-N  ║  5hr:N% reset Xam · 7d:N% reset day Xpm
#
# Project tailoring:
#   - Branch shows RED on master/main (CLAUDE.md Rule 3 visual warning).
#   - Ticket id extracted from branch name (feature/BUG-1-... → BUG-1).
#   - [BIZ-QC] indicator when the diff touches protected files
#     (backend/routes/budget.py, reports.py, expenses.py, or models.py).

input=$(cat)

# --- Dependency check ---
if ! command -v jq >/dev/null 2>&1; then
  # Fallback: bare-bones one-row output that doesn't require jq.
  # The full statusline needs jq for JSON parsing — install it for the rich view.
  _branch=""
  _cwd=$(pwd)
  if git rev-parse --git-dir >/dev/null 2>&1; then
    _branch=$(git --no-optional-locks symbolic-ref --short HEAD 2>/dev/null \
           || git --no-optional-locks rev-parse --short HEAD 2>/dev/null)
  fi
  _short_cwd=$(echo "$_cwd" | sed "s|^$HOME|~|")
  printf '\033[32m%s\033[0m \033[36m(%s)\033[0m \033[33m[install jq for full statusline]\033[0m\n' \
    "$_short_cwd" "$_branch"
  exit 0
fi

# --- Helpers ---
col() { printf '\033[%sm%s\033[0m' "$1" "$2"; }
grn() { col 32 "$1"; }
cyn() { col 36 "$1"; }
ylw() { col 33 "$1"; }
wht() { col 97 "$1"; }
mag() { col 35 "$1"; }
red() { col 31 "$1"; }
dim() { col 90 "$1"; }
bld() { printf '\033[1;%sm%s\033[0m' "$1" "$2"; }

jv() { echo "$input" | jq -r "$1" 2>/dev/null; }

row=""
add() { row="${row:+$row  }$1"; }

fmt_tok() {
  if [ "$1" -ge 1000000 ]; then
    awk "BEGIN{printf \"%.1fM\",$1/1000000}"
  elif [ "$1" -ge 1000 ]; then
    awk "BEGIN{printf \"%.1fk\",$1/1000}"
  else
    echo "$1"
  fi
}

pct_color() {
  _remaining=$(printf '%.0f' "$1")
  if [ "$_remaining" -ge 60 ]; then col 32 "$2"
  elif [ "$_remaining" -ge 30 ]; then col 33 "$2"
  else col 31 "$2"
  fi
}

fmt_limit() {
  _label="$1" _used="$2" _at="$3" _datefmt="$4"
  [ -z "$_used" ] && return
  _remaining=$(printf '%.0f' "$(awk "BEGIN{print 100-$_used}")")
  _reset=""
  [ -n "$_at" ] && _reset=$(date -d "@$_at" "+$_datefmt" 2>/dev/null \
                          || date -r "$_at" "+$_datefmt" 2>/dev/null \
                          | tr '[:upper:]' '[:lower:]')
  _colored_pct=$(pct_color "$_remaining" "${_remaining}%")
  if [ -n "$_reset" ]; then
    printf '%s:%b %s' "$_label" "$_colored_pct" "$(dim "reset $_reset")"
  else
    printf '%s:%b' "$_label" "$_colored_pct"
  fi
}

# --- Extract from JSON ---
raw_dir=$(jv '.workspace.current_dir // .cwd // empty')
short_dir=$(echo "$raw_dir" | sed "s|^$HOME|~|")

branch=""
ticket=""
protected_branch=""
biz_qc=""
if [ -n "$raw_dir" ] && git -C "$raw_dir" rev-parse --git-dir >/dev/null 2>&1; then
  branch=$(git -C "$raw_dir" --no-optional-locks symbolic-ref --short HEAD 2>/dev/null \
        || git -C "$raw_dir" --no-optional-locks rev-parse --short HEAD 2>/dev/null)

  case "$branch" in
    master|main) protected_branch="yes" ;;
  esac

  # Extract ticket id: feature/BUG-1-foo → BUG-1
  ticket=$(echo "$branch" | sed -nE 's@^(feature|bugfix|hotfix)/([A-Z]+-[0-9]+)-.*$@\2@p')

  # Detect protected-file changes (diff vs master)
  if [ "$protected_branch" != "yes" ]; then
    if git -C "$raw_dir" --no-optional-locks diff --name-only master...HEAD 2>/dev/null \
        | grep -qE '^backend/(routes/(budget|reports|expenses)\.py|models\.py)$'; then
      # Check whether the latest commit body already has the flag
      if git -C "$raw_dir" log -1 --pretty=%B 2>/dev/null | grep -q '\[BIZ-QC-NEEDED\]'; then
        biz_qc="ok"
      else
        biz_qc="missing"
      fi
    fi
  fi
fi

model_id=$(jv '.model.id // empty')
case "$model_id" in
  *opus*)   model="opus" ;;
  *sonnet*) model="sonnet" ;;
  *haiku*)  model="haiku" ;;
  *)        model=$(jv '.model.display_name // empty' | sed 's/Claude //' | tr '[:upper:]' '[:lower:]') ;;
esac

session=$(jv '.session_name // empty')
ctx=$(jv '.context_window.remaining_percentage // empty')
total_tok=$(( $(jv '.context_window.total_input_tokens // 0') + $(jv '.context_window.total_output_tokens // 0') ))
la=$(jv '.cost.total_lines_added // 0')
lr=$(jv '.cost.total_lines_removed // 0')

# --- Row 1: project context ---
row1="$(grn "$short_dir")"
if [ -n "$branch" ]; then
  if [ "$protected_branch" = "yes" ]; then
    row1="$row1 $(bld 31 "($branch ⚠ protected)")"
  else
    row1="$row1 $(cyn "($branch)")"
  fi
fi
[ -n "$model" ]   && row1="$row1 $(ylw "[$model]")"
[ -n "$session" ] && row1="$row1 $(wht "$session")"
[ -n "$ticket" ]  && row1="$row1 $(mag "#$ticket")"

case "$biz_qc" in
  ok)      row1="$row1 $(grn "[BIZ-QC ✓]")" ;;
  missing) row1="$row1 $(bld 31 "[BIZ-QC NEEDED]")" ;;
esac

# --- Row 2: session usage  ║  rate limits ---
[ -n "$ctx" ]                        && add "ctx:$(pct_color "$ctx" "${ctx}%")"
[ "$total_tok" -gt 0 ]               && add "$(cyn "tok:$(fmt_tok $total_tok)")"
[ "$la" != "0" ] || [ "$lr" != "0" ] && add "$(grn "+$la")/$(red "-$lr")"

usage="$row"
row=""

five=$(fmt_limit "5hr" "$(jv '.rate_limits.five_hour.used_percentage // empty')" \
  "$(jv '.rate_limits.five_hour.resets_at // empty')" "%-I%p")
seven=$(fmt_limit "7d" "$(jv '.rate_limits.seven_day.used_percentage // empty')" \
  "$(jv '.rate_limits.seven_day.resets_at // empty')" "%a %-I%p")

[ -n "$five" ]  && add "$five"
[ -n "$seven" ] && add "$seven"
limits="$row"

row2=""
if [ -n "$usage" ] && [ -n "$limits" ]; then
  row2="$usage  $(dim "│")  $limits"
elif [ -n "$usage" ]; then
  row2="$usage"
elif [ -n "$limits" ]; then
  row2="$limits"
fi

# --- Output ---
if [ -n "$row2" ]; then
  printf '%b\n%b\n' "$row1" "$row2"
else
  printf '%b\n' "$row1"
fi

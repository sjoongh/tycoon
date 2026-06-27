#!/usr/bin/env bash
# 개표국 자율주행 라운드 알림 → Telegram
# 토큰/챗ID는 ~/.claude/settings.json(env)에서 읽음 — 스크립트에 평문 미보관.
MSG="$1"
S="$HOME/.claude/settings.json"
TOK=$(python3 -c "import json;print(json.load(open('$S'))['env']['TELEGRAM_TOKEN'])" 2>/dev/null)
CID=$(python3 -c "import json;print(json.load(open('$S'))['env']['TELEGRAM_CHAT_ID'])" 2>/dev/null)
[ -z "$TOK" ] && exit 0
curl -s "https://api.telegram.org/bot${TOK}/sendMessage" \
  --data-urlencode "chat_id=${CID}" \
  --data-urlencode "text=${MSG}" \
  --max-time 8 >/dev/null 2>&1 || true

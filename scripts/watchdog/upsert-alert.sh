#!/usr/bin/env bash
# Deterministic, zero-AI: create-or-update a persistent watchdog-alert issue
# and email it via send-mail.py. Shared by every alert path in
# watchdog.yml (2026-07-23) so this pattern -- one evolving issue per
# condition instead of a new one every day, plus real email delivery -- isn't
# duplicated per job.
#
# Why persistent, non-date-scoped titles: a date-scoped title ("...for
# 2026-07-20") mints a brand-new issue every day a condition stays broken --
# confirmed this caused 4 disconnected open "no Founders' Brief" issues
# (#947, #1177, #1203, #1224) with zero comments between them, because
# nothing tied them together as one ongoing incident.
#
# Why emailed here, not left to GitHub @mentions: this repo's own
# brief-mailer.yml already documents that @sffan15-sys / @wjduvall-cmd are
# bot identities whose mentions don't reach the founders' real inboxes --
# that's the same reason those 4 alerts went unseen.
#
# Usage:
#   upsert-alert.sh open  <title> <body-file>   # create, or comment on the existing open one
#   upsert-alert.sh close <title> <body-file>   # comment "recovered" + close, if one is open
#
# Requires env: GH_TOKEN, REPO (every calling step already sets these).
# Email requires MARJORIE_EMAIL / GMAIL_APP_PASSWORD -- skips quietly if
# unset, same behavior as send-mail.py itself.
set -euo pipefail

ACTION="$1"
TITLE="$2"
BODY_FILE="$3"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# --search does a text match, not an exact-title match, so a second jq pass
# filters to the exact title -- avoids merging two different alerts that
# happen to share a word.
EXISTING_JSON=$(gh issue list --repo "$REPO" --label watchdog-alert \
  --search "\"$TITLE\" in:title" --state open --json number,url,title \
  | jq --arg t "$TITLE" '[.[] | select(.title == $t)] | .[0] // empty')
EXISTING_NUM=$(echo "$EXISTING_JSON" | jq -r '.number // empty')
EXISTING_URL=$(echo "$EXISTING_JSON" | jq -r '.url // empty')

if [ "$ACTION" = "close" ]; then
  if [ -n "$EXISTING_NUM" ]; then
    gh issue comment "$EXISTING_NUM" --repo "$REPO" --body-file "$BODY_FILE"
    gh issue close "$EXISTING_NUM" --repo "$REPO"
    ISSUE_URL="$EXISTING_URL"
    echo "closed watchdog-alert #$EXISTING_NUM ($TITLE)"
  else
    echo "no open watchdog-alert for '$TITLE' -- nothing to close"
    exit 0
  fi
elif [ "$ACTION" = "open" ]; then
  if [ -n "$EXISTING_NUM" ]; then
    gh issue comment "$EXISTING_NUM" --repo "$REPO" --body-file "$BODY_FILE"
    ISSUE_URL="$EXISTING_URL"
    echo "commented on existing watchdog-alert #$EXISTING_NUM ($TITLE)"
  else
    ISSUE_URL=$(gh issue create --repo "$REPO" --label watchdog-alert \
      --title "$TITLE" --body-file "$BODY_FILE")
    echo "opened new watchdog-alert: $ISSUE_URL"
  fi
else
  echo "Usage: upsert-alert.sh open|close <title> <body-file>" >&2
  exit 2
fi

jq -n --arg subject "$TITLE" --arg url "$ISSUE_URL" --rawfile body "$BODY_FILE" \
  '{subject: $subject, body: $body, url: $url}' > /tmp/watchdog-mail-payload.json
python3 "$SCRIPT_DIR/send-mail.py" /tmp/watchdog-mail-payload.json

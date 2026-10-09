#!/usr/bin/env bash
# Deterministic, zero-AI: create-or-update a persistent watchdog-alert issue,
# then notify. Shared by every alert path in watchdog.yml (2026-07-23) so this
# pattern -- one evolving issue per condition instead of a new one every day --
# isn't duplicated per job.
#
# Why persistent, non-date-scoped titles: a date-scoped title ("...for
# 2026-07-20") mints a brand-new issue every day a condition stays broken --
# confirmed this caused 4 disconnected open "no Founders' Brief" issues
# (#947, #1177, #1203, #1224) with zero comments between them, because
# nothing tied them together as one ongoing incident.
#
# Notification: Discord, to #longlive-marjorie via post-or-mail.mjs, is the
# default channel (Marjorie Overhaul C3 retired the standing bot-email path)
# and only fires on a state CHANGE (NOTIFY=1) -- an hourly re-check of a
# standing alert never re-posts. Email is opt-in per call via
# `ALERT_ALSO_MAIL=1` (still routed through send-mail.py), for the rare
# caller that still needs a mail leg alongside Discord.
#
# Usage:
#   upsert-alert.sh open  <title> <body-file>   # create, or comment on the existing open one
#   upsert-alert.sh close <title> <body-file>   # comment "recovered" + close, if one is open
#
# A `close` body is prefixed with the resolved marker here, so a caller only
# writes the plain status line -- see RESOLVED_MARK below.
#
# Requires env: GH_TOKEN, REPO (every calling step already sets these).
# Email requires MARJORIE_EMAIL / GMAIL_APP_PASSWORD -- skips quietly if
# unset, same behavior as send-mail.py itself.
set -euo pipefail

ACTION="$1"
TITLE="$2"
BODY_FILE="$3"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NOTIFY=0
NOTIFY_TITLE="$TITLE"

# A `close` body is a RECOVERY notice, and #longlive-marjorie only ever sees
# the BODY -- post-or-mail.mjs posts the body file verbatim and uses the
# subject for the mail leg alone. So a bare caller line like
# "`link-sweep.yml` not 2-consecutive-failing as of 14:35 UTC." lands in the
# channel looking exactly like a failure alert: a workflow name, a timestamp,
# nothing else. The owner read a recovery as a live failure twice (issue
# #5336). The marker is therefore applied HERE, once, for every `close`
# caller present and future, instead of being asked of ~25 call sites across
# six workflows plus chat-alarm.mjs.
RESOLVED_MARK='Resolved — no action needed.'
# shellcheck source=scripts/watchdog/gh-retry.sh
. "$SCRIPT_DIR/gh-retry.sh"

# --search does a text match, not an exact-title match, so a second jq pass
# filters to the exact title -- avoids merging two different alerts that
# happen to share a word.
EXISTING_JSON=$(gh_retry gh issue list --repo "$REPO" --label watchdog-alert \
  --search "\"$TITLE\" in:title" --state open --json number,url,title \
  | jq --arg t "$TITLE" '[.[] | select(.title == $t)] | .[0] // empty')
EXISTING_NUM=$(echo "$EXISTING_JSON" | jq -r '.number // empty')
EXISTING_URL=$(echo "$EXISTING_JSON" | jq -r '.url // empty')

if [ "$ACTION" = "close" ]; then
  if [ -n "$EXISTING_NUM" ]; then
    # Prefixed into a fresh temp file, never in place: several callers reuse
    # one body file for two or three consecutive closes (mobile-parity.yml),
    # and the caller's own file must come back unchanged. Skipped when the
    # caller already marked it, so the marker never doubles up.
    if ! head -n 1 "$BODY_FILE" | grep -qF "$RESOLVED_MARK"; then
      RESOLVED_BODY="$(mktemp)"
      {
        printf '✅ **%s**\n' "$RESOLVED_MARK"
        printf 'Cleared: %s\n\n' "$TITLE"
        cat "$BODY_FILE"
      } > "$RESOLVED_BODY"
      BODY_FILE="$RESOLVED_BODY"
    fi
    NOTIFY_TITLE="Resolved — $TITLE"
    gh_retry gh issue comment "$EXISTING_NUM" --repo "$REPO" --body-file "$BODY_FILE"
    gh_retry gh issue close "$EXISTING_NUM" --repo "$REPO"
    ISSUE_URL="$EXISTING_URL"
    NOTIFY=1
    echo "closed watchdog-alert #$EXISTING_NUM ($TITLE)"
  else
    echo "no open watchdog-alert for '$TITLE' -- nothing to close"
    exit 0
  fi
elif [ "$ACTION" = "open" ]; then
  if [ -n "$EXISTING_NUM" ]; then
    gh_retry gh issue comment "$EXISTING_NUM" --repo "$REPO" --body-file "$BODY_FILE"
    ISSUE_URL="$EXISTING_URL"
    echo "commented on existing watchdog-alert #$EXISTING_NUM ($TITLE)"
  else
    ISSUE_URL=$(gh_retry gh issue create --repo "$REPO" --label watchdog-alert \
      --title "$TITLE" --body-file "$BODY_FILE")
    NOTIFY=1
    echo "opened new watchdog-alert: $ISSUE_URL"
  fi
else
  echo "Usage: upsert-alert.sh open|close <title> <body-file>" >&2
  exit 2
fi

# Mail leg FIRST, deliberately: the script runs under `set -euo pipefail`,
# so a non-zero exit from post-or-mail.mjs below would abort before the
# mail ran — and, inside watchdog's per-workflow loop, abort every
# remaining workflow's check too.
if [ "${ALERT_ALSO_MAIL:-}" = "1" ]; then
  jq -n --arg subject "$NOTIFY_TITLE" --arg url "$ISSUE_URL" --rawfile body "$BODY_FILE" \
    '{subject: $subject, body: $body, url: $url}' > /tmp/watchdog-alert-payload.json
  python3 "$SCRIPT_DIR/send-mail.py" /tmp/watchdog-alert-payload.json
  MAIL_FLAG=--no-mail-fallback   # already mailed; never mail twice
fi

# Post to Discord only on a state CHANGE (NOTIFY=1) — otherwise an hourly
# watchdog re-check of a standing alert would flood the channel.
#
# ALERT_MENTION_FOUNDER=1 (t_85667a3c): opt-in per call. Only meaningful on
# `open` — an `open` only ever fires NOTIFY=1 on the actual open->exists
# transition (the `elif -n "$EXISTING_NUM"` branch above just comments,
# NOTIFY stays 0), so a standing, still-broken alert being re-checked every
# hour never re-pings; a fixed condition that flips back to broken later
# opens (and pings) again as its own fresh transition, which is correct —
# that is a new incident. `close` never mentions regardless of this flag:
# "it's fixed now" is not a page.
#
# KNOWN LIMITATION (Codex review, PR #4201): the issue create/close above
# already happened by the time we get here, so if post-or-mail.mjs fails
# BOTH legs (Discord down and mail unreachable/unconfigured), this state
# change is never retried -- the next run either sees "already open" (no
# NOTIFY) or has nothing left to close. A double-outage at the exact moment
# of a state change is the only way to hit this; tracked as a hardening
# follow-up (candidate for the M2 watchdog-handling wave), not fixed here.
if [ "$NOTIFY" = "1" ]; then
  MENTION_FLAG=""
  if [ "$ACTION" = "open" ] && [ "${ALERT_MENTION_FOUNDER:-}" = "1" ]; then
    MENTION_FLAG=--mention-founder
  fi
  node scripts/marjorie/post-or-mail.mjs \
    --subject "$NOTIFY_TITLE" --body-file "$BODY_FILE" --url "$ISSUE_URL" ${MAIL_FLAG:-} ${MENTION_FLAG:-}
fi

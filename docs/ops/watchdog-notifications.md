# Watchdog alerts — who hears about them

Operating note for `.github/workflows/watchdog.yml`,
`scripts/watchdog/upsert-alert.sh` and
`scripts/marjorie/lib/alert-notify.mjs`. Set by issue #4804 (founder ask in
chat, 2026-10-09).

## The rule

Every watchdog condition still opens or updates its own persistent
`watchdog-alert` issue, exactly as before. What changed is the **Discord leg**:
a line in the founders channel is sent only when the alert actually needs a
founder.

An alert is **founder-facing** when either holds:

1. Its title matches one of the four paging conditions in
   `docs/agents/marjorie.md` → *Paging (T3)*: site down, legal or safety
   exposure, security incident, runaway cost.
2. Its handler class in `scripts/marjorie/lib/alert-notify.mjs`'s
   `HANDLER_CLASS` (one row per condition in the handler table of
   `docs/specs/marjorie-overhaul/w1-watchdog-handling.md`) is `human-action` or
   `escalate` — the two classes that end at a founder.

Anything else is **self-handled**: `routine-marjorie-ops.yml` re-dispatches it
or comments on it within the hour, so the founders channel hears nothing when
it opens. Today that is 10 of the 14 conditions.

A title the module does not recognise is **founder-facing**. That default is
the reason adding a watchdog condition needs no edit here, and the reason a bug
in this module over-notifies rather than going silent. It also covers the
non-watchdog callers of `upsert-alert.sh` — `mobile-parity.yml`,
`production-backup.yml`, `backup-restore-drill.yml`, `social-poster.yml`,
`bot-chat-alarm.yml` — whose titles are not watchdog conditions and are
unaffected by this change.

Only `open` is gated. A `close` still posts its `Resolved — no action needed.`
recovery line, which is cheap and is what tells the channel a held alert
cleared.

## The 24h backstop

Holding a line is only safe while Marjorie is actually running. So:

- When `upsert-alert.sh` holds a line it leaves a marker comment on the alert
  issue (`🔇 Discord line held …` + `<!-- watchdog-notify suppressed=… -->`).
  That comment is both the audit trail for a line that never posted and the
  clock.
- The hourly `Held alert still open 24h (founders-channel backstop)` step in
  `watchdog.yml` posts **one** line to the founders channel, with the founder
  @-mention, for any held alert still open 24 hours later, then marks it
  (`<!-- watchdog-notify backstop=… -->`) so it never posts again.

Worst case between a real failure and the founders hearing about it is
therefore 24 hours plus one hour. A dark or broken Marjorie can delay a real
failure by a day; it cannot hide one.

Two deliberate properties:

- An alert with no `suppressed` marker comes back `none`, so a founder-facing
  alert — which already posted when it opened — is never re-announced.
- The marker is written only after a delivered post (`post-or-mail.mjs` exits 1
  when both its Discord and mail legs fail), so a double outage retries next
  hour instead of silently counting as announced.

The earliest `suppressed` marker wins, so a condition that flaps on one
evolving issue is measured from the first time it went quiet and cannot reset
its own clock.

## Changing it

`HANDLER_CLASS` is the one place a condition's audience is decided. Moving a
row to `human-action` makes it loud; moving it to `redispatch`/`comment-only`/
`build-desk-issue` makes it quiet. `scripts/marjorie/lib/alert-notify.test.ts`
asserts the verdict for every `ALERT_TITLE` watchdog.yml can emit, so a change
of audience shows up as a test change rather than as a surprise in the channel.

Markers are trusted only on comments the querying credential itself authored
(`viewerDidAuthor === true`), the same rule and the same reasoning as
`alert-router.mjs` — otherwise anyone able to comment could suppress the
backstop permanently.

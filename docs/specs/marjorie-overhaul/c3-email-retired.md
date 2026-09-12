# C3 — email retired as a bot channel

Wave M1 of the Marjorie Overhaul (`docs/plans/marjorie-overhaul/PLAN.md`,
epic #4180). Design only; M1 builds it. Implements `docs/decisions.md`
2026-09-12 "Three Discord channels, one job each", item 5.

## Behavior you will see

Bot email stops. Today six workflows can put mail in your inbox; after M1,
exactly two things can:

1. **A production-backup failure, or its recovery.** Kept on email so a
   Discord outage can never hide a missed backup — the one exception. Note
   this is not a nightly receipt: a successful backup is silent today and
   stays silent (see Correction 1).
2. **A `[discord failed]` message.** Only when a Discord POST returned a
   non-2xx twice. Decided by an HTTP status code, never by an agent.

Everything else — the morning brief, watchdog alerts, Tree's weekly-plan
notice, the social notifications — appears in `#longlive-marjorie` instead,
or in the brief. Wyatt's CC disappears with the mail; he reads what you read.

Alerts post **on change, not on repeat**: a broken thing posts once when it
breaks and once when it clears, however long it stays broken.

You also stop being able to *reply by email* to the brief. That path
(`marjorie-inbox.yml`) is deleted, because with no brief email there is
nothing to reply to. You reply in the Discord thread instead.

One thing does **not** change: the Community Engine still reads your
`posted <id>` / `skip <id>` replies from Marjorie's Gmail. That is inbound
mail, not a bot mailing you, and it stays.

## Data — the real inventory

Every path reaching `scripts/watchdog/send-mail.py`, verified at `93b93360`.
**The commissioning brief's list of five was wrong in four places** —
corrections marked ⚠.

| # | Call site | What it sends | Becomes |
|---|---|---|---|
| 1 | `brief-mailer.yml:128` (cron `45 12 * * *`) | the morning brief, To Joey CC Wyatt | **workflow deleted.** Brief goes to `#longlive-marjorie` via C1 (`c2-brief.md`) |
| 2 | `scripts/watchdog/upsert-alert.sh:69` | **every** watchdog alert, on open *and* on close | Discord line via C1, plus a scoped mail leg for row 5 only (below) |
| 3 | `tree-mail.yml:151` (`tree-pr-mail`) | "Tree's weekly plan: `<PR title>`" | **step deleted, not re-routed** (below) |
| 4 | `tree-mail.yml:197` (`founder-task-digest`) | the `founder-task` digest | already retired 2026-08-23 (`tree-mail.yml:28-34`); the job keeps running for `founder-mailed` bookkeeping. **Delete the dead send step** |
| 5 | `social-poster.yml:437` | per-post success notice ("Joey wants an email on every post that goes live", decision 2026-08-25) | **deleted** — counted in the brief instead (below) |
| 6 | `social-poster.yml:526` | permanent post-failure notice | routed through `upsert-alert.sh` so it becomes an alert Marjorie handles (below) |

⚠ **Correction 1 — `production-backup.yml` does not call `send-mail.py`,
and there is no nightly success receipt.** It calls
`upsert-alert.sh open|close "Production backup failing"`
(`production-backup.yml:105,115,125`) and reaches email *through* row 2.
Two consequences, both load-bearing:

- Converting `upsert-alert.sh` to Discord would silently remove the one
  exception the decision deliberately preserved. Handled in *Mechanics*.
- **The "nightly backup receipt" does not exist today.** On success the
  workflow calls `upsert-alert.sh close`, and the close branch exits at
  `upsert-alert.sh:50` — *before* the mail tail — when no alert is open. So
  on a normal successful night, nothing is sent. Mail goes out only on a
  failure, or on the night a failure recovers. What the decision calls "the
  backup receipt" is in practice **failure-and-recovery notices**. This spec
  preserves exactly that and invents no new nightly mail; if a founder wants
  a true nightly "backup OK" receipt, that is a new behavior and a separate
  call.

⚠ **Correction 2 — `community-mailer.yml` sends no email.** Despite the name,
`scripts/community/mailer.mjs:5` says it was "rerouted to Discord delivery per
Joey's destination correction"; it imports `postCommunityPrompts` and posts to
`#longlive-tree`. The `MARJORIE_EMAIL`/`GMAIL_APP_PASSWORD` mention at
`community-mailer.yml:22-23` is a **stale header comment** — no step wires
either. Nothing to retire; fix the comment and leave the workflow alone.

⚠ **Correction 3 — the Gmail secrets cannot be removed.**
`community-inbox.yml` is live (cron `5,35 * * * *`) and reads
`MARJORIE_EMAIL` + `GMAIL_APP_PASSWORD` over IMAP at lines 59-60 and 87-88 to
apply founder `posted <id>` / `skip <id>` replies to `engagement_lead.status`.
Deleting those secrets breaks the Community Engine. **No human action to
remove them is filed** — see *Open questions*.

⚠ **Correction 4 — `upsert-alert.sh` has six caller workflows, not two.**
`watchdog.yml`, `production-backup.yml`, `backup-restore-drill.yml`,
`production-backup-drill.yml`, `mobile-parity.yml`, `social-audit.yml`. All
six must be handled or the four unlisted ones become the new source of bot
email the moment a drill fails. See *Mechanics*.

Also found, and separate: `scripts/watchdog/send-community-mail.py` has **zero
callers** anywhere in the tree. It holds the last copy of Wyatt's address in
the repo (`send-community-mail.py:25`, `CC = "wjduvall@gmail.com"`). Delete
the file — it is dead code and it is the literal thing decision item 6 says
goes away.

## Mechanics

### `upsert-alert.sh` — Discord by default, mail only where it is the point

Today the script's tail is unconditional (`:67-69`): build a payload, call
`send-mail.py`. Replace with:

```sh
# NOTE: mail leg FIRST. The script runs under `set -euo pipefail` (:26), so a
# non-zero exit from post-or-mail would abort before the mail ran — and,
# inside watchdog's per-workflow loop (:333-347), abort every remaining
# workflow's check too.
if [ "${ALERT_ALSO_MAIL:-}" = "1" ]; then
  jq -n --arg subject "$TITLE" --arg url "$ISSUE_URL" --rawfile body "$BODY_FILE" \
    '{subject: $subject, body: $body, url: $url}' > /tmp/watchdog-alert-payload.json
  python3 "$SCRIPT_DIR/send-mail.py" /tmp/watchdog-alert-payload.json
  MAIL_FLAG=--no-mail-fallback      # already mailed; never mail twice
fi

# Post to Discord only on a state CHANGE — see the flood note below.
if [ "$NOTIFY" = "1" ]; then
  node scripts/marjorie/post-or-mail.mjs \
    --subject "$TITLE" --body-file "$BODY_FILE" --url "$ISSUE_URL" ${MAIL_FLAG:-}
fi
```

**Post on state change only — otherwise the channel floods from hour one.**
`watchdog.yml` runs hourly (`cron: "5 * * * *"`), and several conditions
call `upsert-alert.sh open` on *every* pass while they are broken — prod
smoke (`:190`, `if: always()`) and stuck PRs (`:415-438`) among them. Today
that is an hourly email per broken condition, which is bad and invisible;
in Discord it would be an hourly post in a channel a founder is expected to
read. The script already knows which branch it took:

| Branch | `NOTIFY` | Why |
|---|---|---|
| created a new issue (`:58`) | **1** | the condition just started |
| commented on an existing open alert (`:54`) | **0** | nothing changed; the issue thread still gets the comment |
| closed an alert (`:45`) | **1** | it recovered |
| nothing to close (`:49`) | 0 | no state at all |

So a broken condition produces exactly two posts across its whole lifetime:
one when it breaks, one when it clears. The GitHub issue keeps the full
hourly history. This is a change to `upsert-alert.sh`, not to any caller.

`ALERT_ALSO_MAIL=1` is set **only** by `production-backup.yml`'s two
`upsert-alert.sh` steps, preserving the exception in one visible place.

**All six callers need `environment: ops`** on the job that invokes the
script — `watchdog.yml`, `production-backup.yml`, `backup-restore-drill.yml`,
`production-backup-drill.yml`, `mobile-parity.yml`, `social-audit.yml`.
An environment secret is invisible to a job that does not declare the
environment, so a caller left out does not fail loudly: its Discord post
fails on an empty webhook and the fallback mails, quietly re-creating the
bot email this wave removes. That failure mode is why this is listed as a
blocking item rather than a footnote.

### `tree-mail.yml`'s weekly-plan mail — deleted, routed nowhere

The wave prompt asked whether this should become a line in `#longlive-tree`,
and if that would add a non-approval post there, a line in
`#longlive-marjorie` instead. Neither. The mail is deleted outright:

- `tree-mail.yml:130-134` writes, in the mail body, *"This is a copy. The live
  version, where you can react and reply, is in #longlive-tree: `<permalink>`"*.
  The mail is **explicitly a duplicate** of a post `weekly-brief.mjs` already
  made. Re-routing a copy to the channel that already holds the original is
  strictly worse than deleting it.
- `#longlive-tree` is forbidden anyway: `docs/decisions.md` 2026-09-12 item 1
  makes it reaction-pure. `#longlive-marjorie` would be a third copy.

Instead, Marjorie's brief carries one line in **Since yesterday** when a Tree
plan PR is open: `Tree's plan PR #N is up for your ✅ in #longlive-tree`. The
information survives; the duplicate post does not. `findLatestTreePR` already
exists in `assemble-brief.mjs` for exactly this.

The `tree-mail` GitHub environment becomes unused once both send steps go;
leave it in place (an empty environment costs nothing and deleting it is a
settings action, not a code change).

### `social-poster.yml` — one goes to the brief, one becomes an alert

Neither notice can post to `#longlive-marjorie` directly: both steps live in
the `post` job, which is bound to `environment: social` (`:147-152`), and a
job has exactly one environment. Rather than restructure the poster — the
most safety-critical workflow in the repo, with a freeze gate and signed
approvals — both are re-homed:

- **Success notice (`:437`) — deleted; counted in the brief instead.** The
  2026-08-25 decision ("I dont mind more emails for social") was about
  wanting visibility that a post went live. *Since yesterday* already reads
  `social/posted/*.json` via `fetchPostedSince`; one line saying "N posts
  went live" delivers the same fact without a per-post notification. It is
  also Tree's news, and routing it through Marjorie's channel per-post
  would make her channel the social feed.
- **Failure notice (`:526`) — routed through `upsert-alert.sh`** as an alert
  titled `Watchdog: a social post permanently failed`. That gets it into
  `#longlive-marjorie` through the path that already exists, gives it an
  issue that self-closes, and — the real gain — makes it something Marjorie
  *handles* under `w1-watchdog-handling.md` rather than a notice nobody owns.
  The alert job is `post`, still `environment: social`, so add `ops` to that
  environment's secrets or accept the mail fallback there; recommended is to
  amend HA #66 to deposit the same webhook URL in `social` as well.

This touches only notification steps. Neither `post-queue.mjs` nor
`delete-media.mjs` nor the freeze gate is modified.

**Guard:** these two steps live in a workflow whose real-send paths are
guard-denied. The change is to the *notification* steps only. It touches
neither `post-queue.mjs` nor `delete-media.mjs`, and the poster's freeze
gate is untouched.

### `marjorie-inbox.yml` — deleted

Its only function is relaying email replies to GitHub comments (cron `*/30`,
DKIM-verified, idempotent by `<!-- relay-id: … -->` at `:110`). With no brief
email it has nothing to relay. Delete it, plus two follow-ons:

- Remove it from `watchdog.yml:280`'s liveness-watch set. Nothing breaks if
  left (`[ -f "$F" ] || continue`), but the list would name a dead workflow.
- `marjorie-brief.md` step 3 and `marjorie-delta.md` step 4 read
  `📧 Reply from …` comments — re-point to `💬 Reply from …` (`c2-brief.md`)
  and note the read side is unbuilt until the poller ships.

The `relay-id` scheme is **reused verbatim** by the Discord reply poller.
Copy the mechanism before deleting the file that documents it.

### Secrets after M1

`MARJORIE_EMAIL` and `GMAIL_APP_PASSWORD` are all still needed — by
`community-inbox.yml:59,87` (IMAP), the `send-mail.py` fallback, and the
backup exception. `DISCORD_MARJORIE_WEBHOOK_URL` is new (HA #66). **No
secret becomes unused, so no `gh secret`/`gh variable` human action is
filed.**

## Acceptance criteria

1. `git grep -n 'send-mail.py' .github/workflows/` returns **no** matches
   (every remaining path reaches it through `upsert-alert.sh` or
   `post-or-mail.mjs`).
2. `git grep -n 'send-mail.py' scripts/` matches only
   `scripts/watchdog/upsert-alert.sh`, `scripts/marjorie/post-or-mail.mjs`,
   and the mailer's own tests.
3. `.github/workflows/brief-mailer.yml` and
   `.github/workflows/marjorie-inbox.yml` do not exist on `main`.
4. `scripts/watchdog/send-community-mail.py` does not exist on `main`;
   `git grep -n 'wjduvall@gmail.com'` returns nothing outside `docs/`.
5. `git grep -n 'ALERT_ALSO_MAIL' .github/workflows/` matches only
   `production-backup.yml`, and in `upsert-alert.sh` the mail leg is ordered
   **before** the Discord leg.
5b. All six `upsert-alert.sh` callers declare `environment: ops` on the
   calling job — loop the six filenames, grep each, expect no misses.
5c. An alert left open across three consecutive hourly watchdog runs produces
   **one** Discord post, not three, and three issue comments.
6. A forced watchdog alert (`gh workflow run watchdog.yml`) appears in
   `#longlive-marjorie` with a 2xx in the log, and sends **no** email.
7. A forced `production-backup` failure both opens the alert in-channel
   **and** sends the email.
8. `watchdog.yml` is shorter than at `93b93360` (the brief-mailer catch-up
   block `:86-107` and the `marjorie-inbox.yml` watch line are gone).
9. Over the MR1 window, no founder receives a bot email except a backup
   failure/recovery notice or a `[discord failed]` message.

## Files affected

| File | Change |
|---|---|
| `.github/workflows/brief-mailer.yml` | **deleted** |
| `.github/workflows/marjorie-inbox.yml` | **deleted** |
| `scripts/watchdog/send-community-mail.py` | **deleted** (dead, holds the CC) |
| `scripts/watchdog/upsert-alert.sh` | tail: Discord by default, `ALERT_ALSO_MAIL` opt-in |
| `.github/workflows/production-backup.yml` | `ALERT_ALSO_MAIL: 1` on its two alert steps |
| `.github/workflows/watchdog.yml` | drop `:86-107` catch-up, drop `marjorie-inbox.yml` from the watch list |
| `.github/workflows/tree-mail.yml` | delete both send steps (`:151`, `:197`) |
| `.github/workflows/social-poster.yml` | delete the success notice (`:437`); route the failure notice (`:526`) through `upsert-alert.sh` |
| `.github/workflows/backup-restore-drill.yml`, `production-backup-drill.yml`, `mobile-parity.yml`, `social-audit.yml` | `environment: ops` on the alerting job |
| `.github/workflows/community-mailer.yml` | stale header comment only |
| `docs/agents/runner-prompts/marjorie-brief.md`, `marjorie-delta.md` | `📧` → `💬`, mailer references out |
| `docs/agents/runners.md:269,312`, `docs/AUTOMATION.md` | drop retired workflows from the tables |
| `docs/agents/marjorie.md` | § Delivery rewritten — **PR 2**, not here |

## Open questions

None blocking. Decisions made here, all reversible:
- **`ALERT_ALSO_MAIL` opt-in** rather than a hard-coded title check inside
  `upsert-alert.sh`, so the exception is declared by the workflow that owns it.
- **Tree's plan mail deleted, not re-routed** — it is a self-declared copy.
- **`send-community-mail.py` deleted** rather than left dead.
- **No secret-removal human action filed.** The wave prompt asked for one
  after MR1; the premise does not hold — `community-inbox.yml` needs both
  credentials indefinitely. Filing it would send the founder to delete a
  secret that would break the Community Engine within 30 minutes. Recorded
  here instead so the next session does not re-derive it.

- **Discord posts fire on state change only**, so a week-long outage is two
  posts, not 168.
- **The per-post social success notice is dropped** in favour of one count
  in the brief. This narrows an explicit 2026-08-25 founder exception, so it
  is called out rather than buried: the fact still reaches you daily, just
  not per post. Say the word and it comes back as its own line.

For a founder, and worth one sentence of your answer: **there is no nightly
"backup OK" email today and this spec does not add one** — you only hear
about the backup when it fails or recovers. If silence-means-success is not
good enough for the only backup the database has, say so and it becomes a
small, separate change.

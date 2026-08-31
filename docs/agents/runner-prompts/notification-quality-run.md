You are running the **Notification quality — weekly desk** — the judgment
layer over the notifications system's own delivery data. Read
`docs/agents/notification-quality.md` (the charter) FIRST if you have not
already; this file is the mechanical run steps, the charter is the mission
and the invariants. **Read-only: findings, a log comment, and up to 5
tickets. Never edit notification code, prefs, seeds, or the governor's
config.**

Steps:

0. **Read last week's snapshot before fetching a new one.** Find the
   standing `Notification quality — weekly desk log` issue (label
   `notifications`) and read its most recent comment. If it exists, extract
   the per-category `sent`/`openRate`/`muteRate` table it recorded (step 5
   below defines this exact table) — this is your week-over-week baseline.
   If the issue doesn't exist yet (first run) or its last comment predates
   this format, note **"no prior snapshot — trend judgment skipped this
   run"** and proceed without one; do not guess at a baseline.

1. Fetch the metrics payload:
   `curl -s "https://www.longlivets.com/api/notifications/metrics?secret=$NOTIFICATIONS_DASHBOARD_SECRET"`
   (the canonical production host — see `docs/deploy.md`). `NOTIFICATIONS_DASHBOARD_SECRET`
   must be set in this trigger's Claude Code environment (`runners.md` §
   "Notification-quality desk — trigger config to create" names the exact
   provisioning step — do this BEFORE the trigger's first scheduled run, not
   as a reaction to a failure) — never print its value. If the route 503s
   with "isn't wired up" or 401s, that is a REAL failure — say so loudly in
   the log issue and stop; do not fabricate a metrics snapshot. A 401
   specifically means the environment secret is missing or stale — name
   that as the likely cause in the log so a human fixes provisioning
   instead of re-running.

2. Read the payload against `packages/core/src/notification-metrics.ts`'s
   `NotificationMetrics` shape (read the file if you need the exact field
   names — do not guess). Note `hasData`, `generatedAt`, and
   `flaggedCategories` up front.

3. For every category present in `openRateByCategory` or
   `muteRateByCategory`:
   - If `sent` is small enough that a rate swing is noise (use judgment —
     a category with under ~20 sends in the 30-day window is not a
     trustworthy sample), record it as **skipped — thin sample (N=<sent>)**
     in the log and do not file a ticket for it.
   - Otherwise apply the charter's judgment: over-firing (mute rate over
     `MUTE_RATE_FLAG_THRESHOLD`, **or**, only when step 0 found a usable
     prior snapshot, send volume trending up without a matching open-rate
     story vs. that snapshot) or under-performing (open rate low relative
     to peer categories, or near-zero opens on real volume). **If step 0
     found no usable prior snapshot, the trend half of the over-firing
     criterion is not assessable this run — judge only on the mute-rate
     threshold and cross-category comparison, and say so explicitly in the
     log rather than silently skipping the caveat.** Because this desk logs
     every run's numbers (step 5), a usable baseline exists from the second
     run onward — the gap is real only on the very first run.
   - Respect the null-vs-zero rule: a category with `sent: 0` has
     `openRate: null`/`muteRate: null` — that is "no data," never report it
     as a 0% rate.

4. For each category that clears the bar (≤5 total), file/refresh an issue:
   - Title: `notifications: <category> — <one-line finding>`
   - Label `notifications` + severity (`notif:P1`/`notif:P2`/`notif:P3` per
     the charter).
   - Body: the metric and its value, the comparison that makes it a
     finding, sample size, and a concrete fix shape (tune cadence, tighten
     targeting, retire the category, or "looks like a categorization bug —
     see X").
   - Dedupe against open `notifications`-labeled issues first — comment an
     escalation instead of filing a duplicate.

5. Post/refresh the standing **`Notification quality — weekly desk log`**
   issue (label `notifications`, one evolving issue, never a new one per
   run — same pattern every other desk in this fleet uses after the
   disconnected-alert lesson from #947/#1177/#1203/#1224): the metrics
   snapshot's `generatedAt`, every category's verdict (clean / flagged+ticket
   / skipped-thin-sample), tickets filed this run, any data-quality caveat
   (e.g. `hasData: false`, or a caveat inherited from the metrics route
   itself), **and a per-category snapshot table** (`category | sent |
   openRate | muteRate`) formatted exactly the same way every run — this
   table is what step 0 of the *next* run reads back as its baseline, so
   keep the format stable rather than restyling it.

Hard limits: read-only on notification code/prefs/config; never merges
anything (nothing to merge — this desk files tickets only); never closes
tickets; never fabricates a rate for a category with zero sends; ≤5
tickets/run; one log issue.

## Run discipline

**Do your work, file the tickets and log comment, and EXIT.** Do not arm a
self-check-in, a `send_later`, a Monitor, or any other "come back and look
at this again" follow-up.

Why: those self-armed check-ins were ~69% of all scheduled agent token
spend (~144 cloud sessions/day whose entire output was "still open, still
green, re-arm in 1h"). This desk's output is a ticket and a log comment —
both are durable the moment they're posted; there is nothing to watch after
that. `watchdog.yml` covers this runner going dark if it is ever added to
the per-agent liveness table.

If something genuinely needs a human, say so once in the log issue and
exit. Never poll for the answer.

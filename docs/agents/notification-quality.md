# Notification quality — the lock-screen judgment desk

**Charter v1 — ACTIVE (Joey, D6=A, 2026-08-31, `docs/decisions.md` §
D3=A…D6=A; commissioned by the Fable Tier-2 cost/benefit analysis,
`docs/TIER2-OPTIMIZATION.md` § T-16 / `docs/automation/review-2026-08-31.md`
REC-7.3).** Named for what it watches, not a person — the desk exists
because `vision.md`'s core promise is "never over-notify," and until now
every other user-facing surface (content integrity, site experience,
accessibility) had a judgment desk while the copy that actually reaches a
fan's lock screen had none.

## Mission

Every week, read what the notification system actually sent and how fans
actually reacted, and turn any category that is over-firing or
under-performing into an authorable ticket — the same "detect
deterministically, judge with an LLM, a human merges" split every other
Tier-2 desk in this fleet uses.

## What it reads (deterministic, already built — this desk does not
reimplement any of it)

- `GET /api/notifications/metrics` (secret-gated; see
  `apps/web/app/api/notifications/metrics/route.ts` and
  `NOTIFICATIONS_DASHBOARD_SECRET` in `SETUP_NOTIFICATIONS.md`) — the same
  payload the internal dashboard (`apps/web/app/internal/notifications/`)
  renders: per-category open rate, per-category mute rate (flagged at
  `packages/core/src/notification-metrics.ts`'s `MUTE_RATE_FLAG_THRESHOLD`,
  currently 2%), opt-in rate, master-off rate, over a rolling 30-day window
  (`loadMetrics`'s `METRICS_LOOKBACK_DAYS`).
- The `deliveries` table pattern that route already establishes (`sent_at`,
  `opened_at`, `category`, `device_id`) — read via the same metrics
  endpoint, never queried directly by this desk (no new Supabase
  credentials; the route is the one sanctioned reader).
- `NOTIFICATIONS_SPEC.md` §11 for what each metric is supposed to mean and
  the governor's `HARD_CEILING_PER_DAY` for what "over-firing" is bounded
  against structurally before this desk ever sees a number.

## The judgment

For each category with enough delivery volume to be meaningful (never
flag a category on a handful of sends — name the sample size and skip
judgment on ones too thin to trust):

1. **Over-firing.** Mute rate above the flagged threshold, or — once the
   desk has at least one prior run's logged snapshot to compare against
   (`runner-prompts/notification-quality-run.md` step 0/5; the metrics
   endpoint itself is a single rolling-30-day aggregate with no
   week-over-week data of its own, so the desk's own log is the only source
   of trend history) — a category's send volume trending sharply up
   week-over-week without a matching open-rate story (more pushes, same or
   falling engagement). On the very first run, with no prior snapshot yet,
   judge over-firing on the mute-rate threshold and cross-category
   comparison alone and say so explicitly — the trend criterion is not
   fabricable from a single snapshot.
2. **Under-performing.** Open rate persistently low relative to the
   category's peers, or a category present in `metrics` with near-zero
   opens across the whole lookback window (a category firing into the void
   is wasted lock-screen real estate and erodes trust in every other
   category).
3. **Data-quality flags, not judgment findings.** If `hasData` is false, or
   a category shows in `flaggedCategories` for a reason that traces to a
   known measurement gap (see `notification-metrics.ts`'s own caveats —
   `optInRate` is a documented proxy, not the true spec metric), say so in
   the log rather than filing a ticket against a number the system itself
   flags as approximate.

## Output — tickets, nothing else

- Label `notifications` + severity: `notif:P1` (mute rate well over
  threshold or open rate near-zero on a high-volume category — user-visible
  harm now), `notif:P2` (flagged but bounded), `notif:P3` (worth watching,
  not yet actionable).
- **Every ticket is an authorable spec**: category + the metric and its
  value + the comparison that makes it a finding (vs. peer categories, vs.
  last week, vs. the flag threshold) + a concrete fix shape (tune cadence,
  tighten targeting, retire the category, fix a suspected bug in how it's
  categorized) — so the desk or a human can act with zero re-analysis.
- **Caps:** ≤5 new tickets/run; dedupe against open `notifications` tickets
  (comment escalation instead of duplicates); if more than 5 categories
  fail the bar, file the worst 5 and note the count in the log.
- One log issue (`Notification quality — weekly desk log`, refreshed, not
  duplicated) per run: the full metrics snapshot read, every category's
  verdict (clean/flagged/skipped-thin-sample), tickets filed, and any
  data-quality caveat surfaced.

## Hard invariants

1. Read-only on everything: never edits notification code, prefs, or the
   governor's config — tickets and log comments only.
2. Never closes tickets (they close via `Closes #` when fixes merge).
3. Never duplicates an open ticket — escalate by comment instead.
4. Never flags a category on a sample too thin to be meaningful; names the
   sample size when skipping judgment for that reason.
5. One checkout; artifact-only interfaces (the metrics endpoint); ≤5
   tickets/run; one log issue.
6. Never fabricates a rate for a category with zero deliveries — matches
   `notification-metrics.ts`'s own rule (`openRate`/`muteRate` are `null`,
   not `0`, when `sent` is 0) rather than reporting a misleadingly clean
   number.

## Cadence & account

Weekly, Tuesday ~08:00 AM PT (`0 16 * * 2` UTC — after a full Monday-close
week of data and clear of the Sunday/Monday judgment-desk cluster: Karen,
Nils, Kevin S1). Model **Sonnet 5** (script-and-summarize over a fixed
metrics payload — no genuine authoring or adjudication, same tier as
Laura/Stylist/Photo Enrichment per `runners.md` § Model tiering). Account
**Joey** (fleet policy, D1=B). Tools: Bash/Read/WebFetch (the metrics
endpoint) — no Write/Edit (nothing in the repo for this desk to change; the
metrics endpoint and dashboard already exist).

**Launch precondition (T-16, not yet met as of this charter's creation):**
launch *after* REC-1's notifications-dispatch watchdog heartbeat lands
(`docs/automation/review-2026-08-31.md#rec-1`) — a `dispatch_runs` table +
a `watchdog.yml` freshness step — so this desk judges data a watchdog
vouches for, not data from a dispatcher that could itself be silently dead.
See `runners.md` § "Notification-quality desk — trigger config to create"
for the live status of that precondition **and the `NOTIFICATIONS_DASHBOARD_SECRET`
environment provisioning step required before the trigger's first run** —
the live trigger is not created until REC-1 clears, and the secret must be
provisioned in the same session that creates it.

## Audited by

The Founders' Brief (a `notif:P1` finding is launch-gate-relevant), and the
manager-hat telemetry (tickets filed vs. tickets that led to a shipped
tuning change — a desk whose findings never act is noise, same standard
Nils and Laura are held to).

## Migrating to a service

Same contract: GitHub is the ticket store; the metrics endpoint is the only
data dependency (already a stable, versioned API — no scraping); enforce
the sample-size and null-vs-zero rules in code; token scoped to
issues:write plus read access to the metrics endpoint's secret.

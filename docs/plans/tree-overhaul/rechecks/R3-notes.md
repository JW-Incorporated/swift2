## A3 — telemetry thresholds, deferred (2026-09-12, Wave 4)

`docs/audits/` held **zero** weekly usage snapshots at the 2026-09-12 Wave 3
audit, so Wave 4 did not build a week-over-week delta/flag for
`fleet-telemetry-snapshot.mjs` — there was no second data point to diff
against, and a threshold picked with one sample is a guess wearing a number.

**TODO for whoever picks this up once `docs/audits/` has ≥2 weekly
snapshots** (check via `ls docs/audits/` before starting):

- Add a week-over-week delta computation to `fleet-telemetry-snapshot.mjs`
  (turns/duration/cost-equivalent per routine vs. the prior week's snapshot).
- Add a flag/threshold for a delta that looks like drift, not noise — pick the
  threshold from the real variance across the first few snapshots, not an
  invented number (same lesson T7's spec names for its own thresholds).
- This satisfies `checkpoints.json`'s R3 check: *"fleet-telemetry-snapshot
  shows week-over-week deltas (A3) or a dated TODO exists"* — this file is
  that dated TODO.

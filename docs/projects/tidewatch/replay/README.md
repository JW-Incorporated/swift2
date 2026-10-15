# Tidewatch replay set (P1-04)

Frozen, labelled calibration set for shadow calibration (P2-01). Committed files hold labels and public fields only (ids, urls, public news titles, class, answers); raw text never leaves the runner.

- `replay.json`: every item with its Tidewatch class and question answers. Synthetic cases carry `synthetic: true`.
- `spot-check.json`: 30 critical and personal edge cases for the PM's review.

## Producing it

Run the `tidewatch-replay-label` workflow (Actions, manual dispatch). It exports the pool read-only, labels it through the subscription wrapper (`claude-sonnet-5-5`, P3, never the backup token, 40-call hard cap), and opens a PR with only the two files above. The raw export lives in `.scratch/` on the runner and is never uploaded as an artifact.

Locally: `node scripts/tidewatch/export-replay.mjs` then `node scripts/tidewatch/label-replay.mjs` (needs `SUPABASE_DB_URL` and `CLAUDE_CODE_OAUTH_TOKEN` in the environment). A limit hit stops the run; re-running resumes from `.scratch/tidewatch/replay-label-progress.json`.

The 21 growth-strategy time-sensitive events are not listed anywhere in `docs/`, so they are covered by the 90-day news pool rather than a separate set.

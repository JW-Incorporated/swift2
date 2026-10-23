# Tidewatch replay set (P1-04)

Frozen, labelled calibration set for shadow calibration (P2-01). Committed files hold labels and public fields only (ids, urls, public news titles, class, answers); raw text never leaves the runner.

- `replay.json`: every item with its Tidewatch class and question answers. Synthetic cases carry `synthetic: true`.
- `spot-check.json`: 30 critical and personal edge cases for the PM's review.

## Producing it

Run the `tidewatch-replay-label` workflow (Actions, manual dispatch). It exports the pool read-only, labels it through the subscription wrapper (`claude-sonnet-5-5`, P3, never the backup token, 40-call hard cap), and opens a PR with only the two files above. The raw export lives in `.scratch/` on the runner and is never uploaded as an artifact.

Locally: `node scripts/tidewatch/export-replay.mjs` then `node scripts/tidewatch/label-replay.mjs` (needs `SUPABASE_DB_URL` and `CLAUDE_CODE_OAUTH_TOKEN` in the environment). A limit hit stops the run; re-running resumes from `.scratch/tidewatch/replay-label-progress.json`.

`node scripts/tidewatch/route.mjs --dry-run --replay docs/projects/tidewatch/replay/replay.json` is currently a **route-table smoke test**, not a classifier replay: this corpus has labelled question answers but no recorded classifier confidences. The router uses recorded classifier answers and confidence only for entries that contain both in the stored decision shape; otherwise the step summary names the run a route-table smoke test.

## Scope of the labels

Each item gets the single-item questions: `q_class`, `q_official`, `q_settled`, `q_urgency`, `q_personal`, `q_speculation`, `q_outfit`, `q_merch_kind`, `q_bootleg`, `q_theory`, `q_discussion`, `q_injection`. The labeller deliberately skips `q_same_story`, `q_supports`, `q_settled_fact` and `q_contradicts` (they need candidate stories, source passages or our published item, so they are pairwise or cross-item) and the `duplicate` class (decided from `q_same_story` plus code keys). `privacy_redline` is derived: a `q_speculation` yes always wins.

Reddit permalinks are committed as `/r/<sub>/comments/<id>/` only; the title slug is dropped. Progress between dispatches is kept in an `actions/cache` entry holding only ids and labels, so the 40-call cap is total across runs. Usage logging: the wrapper's `logUsage` hook has no shared public logger yet (each caller keeps a private one), so this run does not log to `llm_usage`; wire one in when P1-28 exports it. The run summary prints `pool=` and `belowFloor=`; under 600 labelled items the files are still written with `belowFloor: true`.

The 21 growth-strategy time-sensitive events are not listed anywhere in `docs/`, so they are covered by the 90-day news pool rather than a separate set.

## P2-03 fact-check relabel and offline evaluation

Run `node scripts/tidewatch/relabel-replay.mjs` before evaluating. It applies
two deterministic title/event rules without consulting sourcing: news about
Taylor Swift's own or shared homes/property becomes `privacy_redline`; and
`critical_breaking` is kept only for an actual announcement or release of a
new song, album, tour or film. Premiere times, pre-orders, schedules, track
lists, merch drops and festival line-ups become `official_drop`. Blank titles
remain unchanged. The generated `replay-relabelled.json` contains only ids and
labels. `replay-relabel-report.json` lists every old-to-new label; on this
frozen set, the property rule changes 0 and the critical-work rule 6.

Run `npx tsx scripts/tidewatch/factcheck-eval.mjs` for the network-free replay.
It reads recorded source-page fixtures and uses fake Jev and Sonnet judgments;
it makes no model or outlet calls. Aggregate results are written to
`factcheck-eval-results.json`:

| Labels | Critical | Critical work | Critical personal | Rumor confirmed | Single-source confirmed |
|---|---:|---:|---:|---:|---:|
| Original | 23/24 | 17/18 | 6/6 | 0/33 | 1/371 |
| Relabelled | 17/18 | 11/12 | 6/6 | 0/33 | 1/371 |

The forced-critical control sends the union of every original rumor and
non-official single-source item through `critical_breaking` using recorded
outlets only: 0/376 confirmed overall, including 0/33 rumors and 0/371
single-source items (the two categories overlap).

The public inert checker is `scripts/tidewatch/factcheck.mjs`; invoke it with
`npx tsx scripts/tidewatch/factcheck.mjs --input <story.json>`. Live article
reads are sequential and human-paced, require an exact headline or dek anchor,
and treat paywalls as not confirmed. The CLI returns a verdict only and has no
publishing or routing capability.

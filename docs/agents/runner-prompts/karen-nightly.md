You are running Karen, the Content Integrity Engine, for her nightly scan. Karen is deterministic tooling plus your judgment on top; her contract is scripts/content-engine/README.md and RUNBOOK.md — read both FIRST. Never edit content, seeds, DB, or generated files: findings, reports, and tickets only.

Steps:
1. From a clean checkout of main: node scripts/content-engine/run.mjs all --create   (deterministic scan → report → files/updates fingerprint-deduped GitHub issues; idempotent, safe to re-run).
2. Post/refresh a one-comment summary on today's Founders' Brief issue (label founders-brief) if it exists: totals by severity, new-vs-known counts, worst finding, link to the committed run report. Do not create a brief if none exists.
3. If the run report file changed (docs/audits/engine/<date>-cie-run.md), open a small PR with just that file, label cie, title 'karen: nightly run report <date>'. Never merge it.
4. The agent review passes (factual/image batches) are NOT part of the nightly — note in your summary how many batches await agent passes so founders/Marjorie see the backlog.

Hard limits: read-only on all content; never merge; never close tickets (they close via fixes); no LLM calls beyond this session itself; if gh or the repo state is broken, exit loudly so the watchdog's cadence view catches it.

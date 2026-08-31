# Automation audit — documentation quality (2026-08-31)

Companion to [`../AUTOMATION.md`](../AUTOMATION.md), the index of every
scheduled routine. This file is the point-in-time audit; the index is the
living reference.

## Documentation quality assessment (2026-08-31)

Scored against one question: **could a founder or a brand-new agent understand
what this does and why, from the docs that exist today, without reverse-
engineering code?**

| Verdict | Count | Share |
|---|---:|---:|
| Well documented | 41 | 64% |
| Partially documented | 17 | 27% |
| Effectively undocumented | 6 | 9% |

**Well documented (41).** Twenty-two workflows — all five watchdog/freshness,
all three founder-comms, all three content-engine, all three DB, both security
reminders, two of the three gates (`codeql.yml`, `auto-merge-content.yml`) and
four of the five social — plus both `dependabot.yml` update schedules and the
Tier-3 notifications cron (25); and on the routine side, all sixteen desks that
have a charter: Marjorie ×2, Austin, Nils, Content Shift, Tree, Laura, Paul
Blart, Growth, Karen, Kevin ×4, the Vault Run, and the Routine Auditor. This
repo's workflow headers are genuinely unusual: most carry the incident that
caused them, the alternative that was rejected, and the date. That is the
standard to preserve.

**Partially documented (17).** Eleven of the thirteen merch workflows, whose
own headers are 1–3 lines and whose real explanation lives in
[`SPEC.merch-autonomy.md`](../SPEC.merch-autonomy.md) — but **that spec's
workflow table (§ "Cadence") is stale**: it lists a `merch-audit.yml` that
does not exist (it was split into `-detect`/`-authoring`), and omits
`merch-terms-recheck`, `merch-e5-evidence`, both Awin directory workflows, and
both authoring lanes. Plus the six Tier-2 content lanes (Answerer, Photo
Enrichment, Rumor Desk, Cross-Link, Stylist, News Triage) which have a versioned
prompt file but **no charter** — so their mutation rights, budget, and "audited
by" are nowhere stated, which is exactly the gap `agents/README.md` § Charter
sections says every scheduled agent must close.

**Effectively undocumented (6).**

1. **`swift2 Getty purge — GitHub GC watch`** (routine) — one table row. No
   prompt file, no charter, no stated retirement condition beyond
   "self-retiring". Running twice a day.
2. **`Lex depth`** (routine) — disabled since 2026-07-25 with no recorded
   reason to keep it or kill it. A warm spare with no stated thaw condition is
   a dead entry.
3. **`ci.yml`** — has an excellent *cost* header and no *purpose* header. What
   the required `build` check actually gates (typecheck, lint, vitest,
   `validate:content`, `check:generated`, `check:content-inert`,
   `check:automerge-allowlist`, the clown red-team battery) is discoverable
   only by reading the steps.
4. **`remove-x-site-screens.yml`** — "two specified X site-screen posts". Which
   two, and did it run? Not recorded anywhere.
5. **`merch-awin-directory-shortlist.yml`** — one-line header, near-identical
   to the file below it, and nothing explains how they differ.
6. **`merch-awin-directory-recommendations.yml`** — same, in the other
   direction.

### Docs that reference routines which do not exist

| Reference | Where | Reality |
|---|---|---|
| **"Scheduled runners live on Wyatt's account"** | [`CLAUDE.md`](../../CLAUDE.md) § Operating habits + § Parallel fleets | Stale phrasing. `CLAUDE.md` § The team already resolves it ("where older docs say 'ask Wyatt' … that means Joey now") and the registry records the live-verified move to Joey's account. Worth a one-line cleanup so it stops resurfacing; see the account note above. |
| `knowledge-engine.yml` | [`watchdog.yml`](../../.github/workflows/watchdog.yml) alert text; knowledge-engine proposal + handoff | never created — `news-worker.yml` was never renamed. The alert tells a founder to check a file that isn't there. |
| `merch-audit.yml` | [`SPEC.merch-autonomy.md`](../SPEC.merch-autonomy.md) § Cadence | split into `merch-audit-detect.yml` + `merch-audit-authoring.yml` |
| `appearance-discovery` at `40 13 * * *` | [`agents/runners.md`](../agents/runners.md) | actual cron is `40 13,21 * * *` — twice daily |
| "Karen Deep — agent review" as pending | [`agents/runners.md`](../agents/runners.md) | still not created, 20 days after specification |
| Tree "routine is a pending Wyatt-side paste" | [`agents/README.md`](../agents/README.md) roster | Tree is live and shipped a plan on 2026-08-31 |
| "Kevin, on Wyatt's side: stop the session cron" | [`agents/README.md`](../agents/README.md) kill switch | Kevin has been four cloud routines since 2026-07-12, so the kill-switch step as written does not stop it |
| Criterion 2 "`author-catalogs.mjs` is invoked by no workflow" | [`ops/MERCH-PHASE-4-ACCEPTANCE.md`](../ops/MERCH-PHASE-4-ACCEPTANCE.md) | resolved — `merch-official-sync.yml`'s `author` job calls it (PR #3555) |
| `agents/README.md` roster table | [`agents/README.md`](../agents/README.md) | lists 5 desks + "Phase 2 pending" for Karen; Laura, Paul Blart, Growth, Tree, the Vault Run and the Routine Auditor are all live and absent |
| "The job below still RUNS on schedule so `founder-mailed` bookkeeping stays current" | [`tree-mail.yml`](../../.github/workflows/tree-mail.yml) header | the workflow's own `on:` block has had **no schedule since 2026-08-23** — the header contradicts the file it heads |

None of these is dangerous on its own. Together they are the failure mode
`routine-invariants.md` already names: *a point-in-time cleanup rots.*

---


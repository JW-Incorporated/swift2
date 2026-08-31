# Merch autonomy — Phase 4 acceptance receipt

**Status:** INCOMPLETE
**Assessed:** 2026-08-30
**Scope:** E6 moment matching, E4 drops, weekly revenue reporting, and sustained scheduled operation.

## Deterministic evidence

- `npx vitest run scripts/merch-engine/match-moments.test.ts scripts/merch-engine/sync-official.test.ts scripts/merch-engine/revenue-report.test.ts scripts/merch-engine/revenue-workflow.test.ts scripts/social/check-drafts.test.ts` passed: 5 files, 118 tests.
- E6 fixture `scripts/merch-engine/fixtures/matcher-candidates.json` produced one verified `exact` candidate for `fixture-fashion-moment`; output contained no ticket. The matcher remains a staged, deterministic handoff only. It does not author a product, apply an affiliate wrap, or land a gated content change.
- Revenue fixture generated the Marjorie-compatible `## Merch revenue and clicks` section. Both configured network inputs were explicitly unavailable, rather than represented as zero revenue.
- E4 tests verify catalog-change detection, including added and discontinued listings. `sync-official.mjs` writes an artifact only; it does not author a site update or social queue draft. A store-drop fixture proving those two downstream drafts is absent.

## Scheduled-operation evidence

The E6 matcher, E4 official sync, and revenue workflows were first added to the repository on 2026-08-29/30. GitHub Actions returned zero recorded runs for all three workflows at assessment time. Therefore no engine has two weeks of scheduled-run receipts.

The fan-made workflow has one recorded run and it failed; this is not sustained-run evidence.

## Phase 4 verdict

Phase 4 is not accepted. The deterministic components above are tested, but the following acceptance criteria remain unproven:

1. A new fashion moment produces an authored, tiered, wrapped product within 24 hours without human touch.
2. A store drop reaches both the site and a social queue draft within one sync cycle.
3. The weekly report reaches Marjorie's actual brief through a completed operational cycle.
4. Every engine has at least two weeks of scheduled-run receipts, with failure modes filing tickets without intervention.

This receipt intentionally makes no claim of autonomous completion.

## Re-assessment — 2026-08-30 (steady-state gate, t_85d54619)

Re-checked all evidence classes above against the live repo and GitHub Actions
history. Findings, with root causes filed as narrowly bounded repair cards:

- **Criterion 1 (new-moment flow):** E6 remains dispatch-only by design
  (binding ruling FABLE-E6-t_0b6b4d6a-2026-08-30-01 keeps automatic
  triggering absent pending gate completion referenced in that ruling).
  `merch-matcher.yml` has zero recorded runs; `merch-matcher-authoring.yml`
  requires a typed `RUN_MATCHER_AUTHORING` confirmation per run and has none
  recorded either. No 24h-latency evidence exists because the automatic path
  is intentionally not live yet — this is a product-direction gate, not an
  engineering defect, and is out of this gate's scope to override.
- **Criterion 2 (store drop → site + social queue):** confirmed still open.
  `sync-official.mjs` only ever writes a plan artifact; nothing consumes it.
  `author-catalogs.mjs` already implements the catalog-write and
  `socialDraft` shape needed but is invoked by no workflow anywhere in the
  repo (verified: zero references to `author-catalogs` under
  `.github/workflows/`). Filed: **t_911217f0** — wire the plan into
  `author-catalogs.mjs` and land both the catalog PR and a real
  `social/queue/*.json` draft in one cycle, with a store-drop fixture.
- **Criterion 3 (revenue into Marjorie's brief):** `merch-revenue.yml` is
  scheduled weekly and the deterministic report/PR path is tested, but it
  has zero recorded runs to date (added 2026-08-30, first cron fire not yet
  due at assessment time). Mechanically sound; no defect found. Needs the
  scheduled-run evidence window in criterion 4, not a repair card.
- **Criterion 4 (2 weeks of scheduled-run receipts, failures self-ticket):**
  confirmed still open — `merch-matcher`, `merch-official-sync`,
  `merch-revenue`, `merch-verify`, and `merch-awin-sync` all show zero
  recorded runs (all added 2026-08-29/30; none of their schedule times has
  fired yet at assessment). `merch-fanmade.yml` has exactly one recorded run
  and it **failed**: `discoverEtsy()` threw an uncaught error on a 403 from
  the Etsy API, which killed `Promise.all([discoverEtsy, discoverReddit])`
  and silently dropped the independent, working Reddit and submission-form
  intake streams too, with no ticket filed. This is the "failure modes file
  tickets rather than requiring intervention" bar failing on the one engine
  that has actually run. Filed: **t_b583db47** — bound the Etsy failure to
  its own query/source, keep Reddit and submissions unaffected, and file a
  ticket on a real Etsy-wide outage instead of crashing silently.

**Gate decision:** hold open. No new fabricated evidence, no criteria marked
met without a real run. Two narrowly bounded repair cards filed
(t_b583db47, t_911217f0); once merged and reviewed, the two-week
scheduled-run evidence window can actually begin accumulating real receipts
for criterion 4, at which point this gate should be re-run rather than
re-opened piecemeal.

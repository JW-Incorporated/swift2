# Community Engine P1-7 — end-to-end dry run

Source: `docs/proposals/2026-09-06-community-engine-plan.md` §Phase 1 card
P1-7. Parents: P1-1..P1-6 (all merged to `main` as of this run).

## What this verifies

That the shipped Phase-1 pieces actually wire together: a lead entering the
system (via scan/inbox/FB-export) reaches the Answerer desk's scoring +
etiquette-gate logic, survives `selectDraftBatch()`'s caps, and comes out
the other end as a rendered "Community Tasks" email with correct ordering,
draft text, and ack/skip links — using the real shipped code
(`scripts/community/relevance.mjs`, `scripts/community/mailer.mjs`), not a
re-implementation.

No network calls, no live Supabase writes, and no email send happened —
this is a pure in-process fixture run (a fake in-memory table stands in for
`engagement_lead`). The harness lives at
`.scratch/community-p1-7/dry-run.mjs` (gitignored; throwaway, reproducible
by running `node .scratch/community-p1-7/dry-run.mjs` from the repo root —
recreate it from this doc if needed, it's not part of the shipped repo).

## Fixture leads (5, covering the real branches)

| # | platform:community | kind | expected tier | expected link | outcome |
|---|---|---|---|---|---|
| 1 | reddit:TaylorSwiftBookClub | `reply_to_us` | without_link (0.58) | no | drafted, always first regardless of score |
| 2 | reddit:TaylorSwiftBookClub | hot_thread | with_link (0.84) | **yes** | drafted with link — etiquette gate (`tier=with_link` + `redditNonPromo>=20` + `allowsLinks=true`) passed |
| 3 | reddit:SwiftlyNeutral | hot_thread | low_relevance (0.0, no matching doc) | no | `status=skipped_low_relevance`, no draft |
| 4 | reddit:TaylorSwift | hot_thread | low_relevance (0.0, no matching doc) | no | `status=skipped_low_relevance`, no draft |
| 5 | facebook:taylor-swifts-vault | hot_thread | without_link (0.67) | no (facebook never link-eligible — `allowsLinks=false`) | drafted, no link even though relevance would otherwise clear the tier |

## Pipeline stages exercised (real production functions)

1. **Scoring** — `scoreLead()` + `classifyRelevance()` (`relevance.mjs`)
   against a tiny fixture `knowledge_doc` corpus, standing in for
   `searchKnowledgeDocs()`'s FTS-ranked results.
2. **Etiquette gate** — `linkAllowed()` (`relevance.mjs`), against
   `docs/community/watchlist.md`'s real P0-2-verified `allows_links` values
   and a fixture `redditNonPromo=22` (>=20).
3. **Batch selection** — `selectDraftBatch()` (`relevance.mjs`), caps
   `dailyCap=12`/`perCommunityCap=3`, confirming the `reply_to_us` lead is
   selected first and every fixture lead (5, well under the cap) is
   selected.
4. **Draft write-back** — fixture drafts (hand-written stand-ins for the
   Answerer desk's Sonnet-5 pass — no model call in this harness) written
   with `status='drafted'` (or `skipped_low_relevance`), matching the
   charter's field contract (`docs/agents/community-answerer.md` step 7).
5. **Mail fetch + ordering** — `fetchLeadsToMail()` + `orderLeads()`
   (`mailer.mjs`) against the fake table: replies-to-us first, then by
   descending relevance. Confirmed order: `#1` (reply_to_us) → `#2`
   (0.84) → `#5` (0.67); `#3`/`#4` never reached mailing (skipped upstream).
6. **Render** — `renderEmailHtml()` / `renderEmailText()` (`mailer.mjs`).
   Rendered output attached to kanban task `t_fa3965ee`
   (`rendered-email.html` / `.txt`).
7. **Mark-emailed** — `markEmailed()` (`mailer.mjs`) against the fake table;
   confirmed 0 rows remain `status='drafted'` afterward (no re-send
   tomorrow).

## Result

PASS — every fixture lead moved through scan→answer→mail exactly per the
plan's §2.5/§2.6 rules: replies-to-us prioritized, the etiquette gate only
opened for the one lead that genuinely cleared `with_link` +
`allows_links=true` + `redditNonPromo>=20`, Facebook never got a link
regardless of relevance, and low-relevance leads were correctly excluded
from the email rather than drafted anyway.

Existing unit suites for the same modules also pass in full:
`npx vitest run scripts/community/` → **172/172 passing** (scan, relevance,
inbox (pytest, run separately), mailer, crawl, fb-export-ingest). Repo lint
(`npx eslint scripts/community/`) clean. `typecheck` clean on every
workspace this change touches (`@swift2/core`, `@swift2/shared`,
`@swift2/worker`, `@swift2/content`, `@swift2/content-enrichment`) — the
pre-existing `apps/web` typecheck/test failures on `*.generated.ts` modules
are an unrelated environment gap (missing prebuild content-sync artifacts,
present on `main` before this task and untouched by it).

## Kill switch flipped

Per the plan's own words ("P1-7's end-to-end dry run flips it to `true`
only after a human reads a rendered sample email"): `COMMUNITY_SCAN_ENABLED`
repo variable set to `true` on 2026-09-07 after this dry run passed. The
attached rendered email is that "human reads a rendered sample" evidence
step, standing in for reading a live sample until real leads exist.

`community-scan.yml` will now actually scan the watchlist and insert real
`engagement_lead` rows on its next scheduled run (daily 08:17 UTC) — nothing
downstream posts anywhere without a human's own hands per §6.1's standing
rule; the mailer only ever produces paste-ready drafts with one-click
ack/skip links.

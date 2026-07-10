# Swift2 Knowledge-Architecture Rubric — v1 (T18)

Date: 2026-07-09. Owner: Engineering + Content (shared). Status: reusable
scoring instrument. This is the **method**; the applied results live in
`swift2-full-content-audit.md`, the tickets in `swift2-ticket-backlog.md(.json)`.

## What this rubric is for

The four prior audits (`content-depth-audit-2026-07-08.md`,
`content/content-audit-2026-07-08.md`, `breadth-audit-2026-07-09.md`,
`qa-era-depth-spotcheck-2026-07-09.md`) each answered one question well — depth,
data model, breadth, factual accuracy. None scored the **product surfaces**
against a fixed bar so we can (a) compare templates to each other, (b) re-run the
same scoring after each content wave and watch numbers move, and (c) hand a
new auditor a repeatable instrument instead of a blank page.

This rubric does that. It scores at the **template level**, not the row level —
you do not grade all 614 content rows; you grade the ~16 shipped surfaces and
spot-check 3–5 real records per surface to ground each score. That is the same
sampling method the QA spot-check doc used, applied to the whole app.

## Scope guardrails (read before scoring)

- **One route.** `apps/web/app/page.tsx` renders everything; there are no
  per-era/song/album URLs. Score *surfaces/templates*, never "pages."
- **Two modes, one store.** Era mode (12-era scroll) and Threads mode (6
  lenses), both driven by `lib/longlive/store.tsx`.
- **Data is static, build-time synced.** `supabase/seed/{content,tracks,
  theories,videos,tours,releases}/**` → `lib/longlive/*.generated.ts`. No
  Firebase, Prisma, CMS, or sitemap. "Not synced" is a real and common finding.
- **Some surfaces don't exist yet.** Quiz/trivia and a per-song meaning view are
  *proposals*, not shipped surfaces. Score them as target-state (all N/A today)
  and write them up as features, not as depth gaps on something live.
- **Use the real enums.** Evidence Quality is scored on the shipped confidence
  vocabulary, never a new one:
  `TheoryConfidence` = `official · confirmed_interview · reputable_reporting ·
  strong_fan_consensus · plausible · clowning · disproven · joke_meme`;
  `TheoryOutcome` = `confirmed · partially_confirmed · pending · debunked ·
  abandoned · unfalsifiable` (`packages/shared/src/vault-types.ts`, mirrored as
  `Confidence` in `apps/web/lib/longlive/types.ts`).
- **Copyright discipline is a scoring input, not an afterthought.** No complete
  lyrics anywhere; short lyric snippets under the 300-char excerpt cap are fine;
  article/interview/statement bodies are never verbatim beyond that cap —
  original-words summaries + links only (`docs/decisions.md`, 2026-07-09).
- **AI-experience findings carry an architecture constraint.** Per
  `docs/architecture.md`, any user-facing LLM feature must be worker-side,
  hard-capped, with a rule-based fallback, never synchronous per-request, and
  needs its own decision-log cost entry before shipping. Every AI score/ticket
  states this; never imply live per-request model calls.

## The 16 dimensions — score each template 0–5

`N/A` is allowed but must carry a one-line reason (e.g. "Live Evolution N/A —
this surface describes a fixed historical event with no ongoing state").

| # | Dimension | 0 | 3 | 5 |
|---|---|---|---|---|
| 1 | **Facts** | wrong or absent | correct, basic who/what/when | precise, complete, day-level, no errors |
| 2 | **Story** | a caption | a paragraph of real narrative | the color/texture of the moment — what happened, who said what, how it landed |
| 3 | **Easter Eggs** | none | a clue noted | plant→payoff with dates + why fans noticed |
| 4 | **Connections (graph density)** | isolated | 1–2 implicit links | explicit `relatedIds` to songs/eggs/threads/moments |
| 5 | **Symbolism / Motifs** | none | a motif named | motif tied to its trail + recurrence across eras |
| 6 | **Timeline** | undated | dated, ordered | dated + positioned + "what it connected to later" |
| 7 | **Live Evolution** | static, staleness invisible | changes but silent | freshness signal / "new since last visit" |
| 8 | **Community / Theory Layer** | fact/theory blurred | theories present | confidence+outcome labeled, fact/theory structurally separated |
| 9 | **Creative Process** | none | a writing credit | studio story / liner-note / Long Pond-style commentary, cited |
| 10 | **Emotional Layer** | none | tone present | the felt meaning a fan connects to, without fabrication |
| 11 | **Cultural Impact** | none | mentions reception | records/charts/discourse with numbers + sources |
| 12 | **AI Experience Opportunity** | none possible | a plausible worker-side feature | a designed, capped, fallback-backed feature (note the constraint) |
| 13 | **Evidence Quality (real enum)** | uncited | ≥1 source, no confidence field | 2+ strong sources + correct confidence/outcome label |
| 14 | **Swiftie Delight** | generic | a fan would nod | a fan would screenshot it |
| 15 | **Shareability** | nothing to share | shareable, generic card | curiosity-gap / stat / progress hook in the share |
| 16 | **Replay Value** | one-and-done | some re-exploration | completion/progress/rabbit-hole payoff pulls a return visit |

### The five one-liners (write one of each per template)

After the numeric scores, capture the qualitative read in five lines:

1. **What happened** — the surface's job, in one sentence.
2. **Why it matters** — its weight in the product (main real estate vs. corner).
3. **How it connects** — what it links to (or fails to link to) elsewhere.
4. **What only a Swiftie would notice** — the fandom-literacy detail it does or
   doesn't reward.
5. **What a user can do here that they can't elsewhere** — the "why this app and
   not the Wikipedia article" test. A blank answer is itself the finding.

## Personas — one merged pass, not eight

Score each template once, reading it through eight lenses at the same time, and
note only where a persona *changes* the score:

Superfan · brand-new fan · UX designer · content strategist · Taylor historian ·
trivia expert · PM · social sharer.

Rule of thumb for whose complaint wins: **the brand-new fan sets the floor**
(can they understand it at all?), **the superfan/historian sets the ceiling**
(is it worth their time or is it Wikipedia with animation?), and the **content
strategist arbitrates** when depth and clarity pull against each other.

## Scoring procedure (repeatable)

1. Run `npm run content:coverage` first — it grounds Facts/Evidence/Timeline
   with real per-era counts, the depth gate (shallow-body / no-photo), and
   source coverage. Never hand-tally what the script already computes.
2. For each template, open its component + its dataset, and spot-check 3–5 real
   records end to end (data → render).
3. Score 16 dimensions; write the five one-liners; note persona deltas.
4. **Verify the live state before crediting shipped work** — a branch,
   `*.generated.ts`, or a doc can claim a thing that `main` does not have. (T18
   found the entire depth-pass content living on unmerged `*-full` branches
   while `main` still showed 491/614 flagged. Always diff claim vs. `main`.)
5. Roll templates up to an overall maturity score (weight the surfaces users
   actually spend time in — the synced era-moment feed and its detail view are
   ~90% of scroll time and should dominate the weighted average).

## Turning a score into a ticket

- **P0** — credibility/trust/copyright: factual errors on marquee moments,
  uncited claims on the main feed, a media-rights or lyrics violation, or
  finished work stranded off `main`.
- **P1** — major depth or knowledge-graph gap: a whole content type with zero UI
  reach, no cross-linking, a marquee surface stuck at "caption" depth.
- **P2** — improvement: coverage breadth, structured-corpus backfills, polish
  with real user value.
- **P3** — polish.

Repeated issues get **one system/template ticket + a list of instances**, never
one ticket per row. Real product decisions (new confidence categories,
accounts/UGC, monetization, quiz/trivia as a feature) go on the **"Needs a
decision"** list in the backlog — the auditor flags them, the founders resolve
them.

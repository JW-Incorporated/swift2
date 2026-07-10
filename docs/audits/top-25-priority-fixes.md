# Swift2 — Top 25 Priority Fixes (T18 audit)

Date: 2026-07-09. A single ranked list across **all** open work — new T18+
tickets and still-open T1–T17 — so the team has one queue, not four. Each row is
cross-checked so it does not duplicate an open prior ticket; where a new ticket
*extends* an old one, both IDs are shown. Full detail: `swift2-ticket-backlog.md`.

Rank blends priority (P0>P1>P2>P3) with leverage (how much shipped value per unit
effort) and unblocking (does it release other work). "Ships already-written
content" items rank high on purpose — this app's fastest path to depth is landing
and connecting what exists, not writing more.

| # | Fix | Ticket(s) | P | Effort | Why it's here / cross-check |
|---|---|---|---|---|---|
| 1 | Land the 10 unmerged `*-full` depth branches + 2 stranded audit docs onto `main`, keeping `main`'s QA edits | **T18** | P0 | M | 491/614 flagged on `main` is a branch/merge artifact, not missing writing. New. |
| 2 | Ship the `images: ImageRef[]` gallery schema + sync + `MomentDetail` gallery | **T15** (reopen) | P0 | M | Specified as T16's blocker, never merged; `image:string` still on `main`. Prior ticket, wrongly assumed shipped. |
| 3 | Land the known factual corrections + `rel-5` era mislabel | **T26** (extends T5) | P0 | S | QA spot-check fixes live only on branches; `rel-5` still mis-filed. T5 was marked done but the fix was stopped mid-run. |
| 4 | Sync the theories seed (27 recs, confidence+outcome) → live Theory UI | **T20** (extends T1) | P1 | M | T1 shipped tracks only; theories still zero-reach. Ships existing content. |
| 5 | Build the per-song Song Meaning surface | **T19** | P1 | L | Biggest single content lever; no such surface exists. New. |
| 6 | Add `relatedIds` + render cross-links on the main feed | **T9** | P1 | M | The knowledge graph barely exists. Prior ticket, still open. |
| 7 | Sync the videos seed (65) + wire the era video rail | **T21** (extends T1) | P1 | M | 10/62 MVs live; seed unsynced. Ships existing content. |
| 8 | De-thin + source Relationships (6) and Runway looks (12) | **T27** (extends T5/T10) | P1 | M | Two threads <2.0; propagate to Crossings. New (T10 only covered Proposal/Runway *expansion*, not sourcing Relationships). |
| 9 | localStorage progress / visited / completion layer | **T6** | P1 | M | Replay scores ~1 app-wide; Clue Web trails have no completion payoff. Prior, open. |
| 10 | Search + glossary | **T7** | P1 | M | Both entirely absent; glossary sets the new-fan floor. Prior, open. |
| 11 | Media rights-status backfill (707 refs) + 7 missing credits | **T25** | P2 | M | Keeps the permissive media policy defensible; unblocks a clean gallery. New. |
| 12 | Sync tours + releases seeds → live UI (Eras date ledger) | **T22** (extends T1) | P2 | M | Both seeded, unsynced. Ships existing content. |
| 13 | Extend `content:coverage`: graph-density + pipeline-reach gates | **T23** | P2 | S | Makes "authored-but-unreachable/unlinked" impossible to miss again. New. |
| 14 | Clue Web "connects to" chips clickable in trail view | **T8** | P1 | S | Data already exists; pure wiring. Prior, open — fast win. |
| 15 | Expand The Proposal beats + Clue Web ttpd/tloas coverage | **T10** | P1 | M | 4 beats / 2+ yrs; egg coverage thins late. Prior, open. |
| 16 | Trim the 4 over-cap verbatim excerpts | **T30** | P2 | S | Copyright discipline; gate already flags them. New — fast win. |
| 17 | Awards as a structured corpus (schema + first import) | **T24** (extends T17) | P2 | L | T17 can't close without an award-entry schema. New; needs scope decision. |
| 18 | Timeline scrubber hover shows the summary, not just title/date | **T13** | P2 | S | Surface content that already exists. Prior, open — fast win. |
| 19 | Content-freshness "new since last visit" banner | **T11** | P2 | S | Live Evolution scores ~1 everywhere; sync timestamps exist. Prior, open. |
| 20 | Richer share cards (stat / progress / curiosity hook) | **T12** | P2 | S | Shareability ~1–2 outside the Decode. Prior, open. |
| 21 | Thread gallery cards preview depth (count + highlight) | **T29** | P3 | S | Cards don't preview contents. New — fast win. |
| 22 | Empty-filter state → one-tap "Clear filter" | **T28** | P3 | S | Dead-end empty state on the main feed. New — fast win. |
| 23 | "Ask the Vault" worker-side semantic search | **T31** | P2 | L | AI; **worker-side, capped, rule-based fallback, cost entry first**. New; decision-gated. |
| 24 | 1989/folklore Spotify TV-vs-original edition call | **T14** | P2 | S | Needs a product call, then a one-line data change. Prior, open. |
| 25 | Editor aid: suggested `relatedIds` (offline batch) | **T32** | P3 | M | AI; offline only, human-accepted. New; depends on T9. |

## Cross-check summary

- **No new ticket duplicates an open prior ticket.** T20/T21/T22 extend T1 (which
  shipped *tracks* sync only); T26 completes the `rel-5`/QA portion T5 left
  unfinished; T27 adds *sourcing* that T10's *expansion* scope didn't cover; T24
  gives T17 the schema it needs to close. All extensions cite both IDs above.
- **Two "done" prior tickets are not actually done on `main`:** T15 (never
  merged) and the `rel-5` slice of T5 (stopped mid-run). Both are surfaced here
  rather than trusted as complete — per the rubric's "verify live state before
  crediting shipped work" rule.
- **Fastest wins (≤S, high leverage):** #14 (T8), #16 (T30), #18 (T13), #21
  (T29), #22 (T28) — plus merging the already-finished PR #127
  (`useBackDismiss` + pinch-zoom viewer), which isn't a content ticket but is a
  free depth-of-polish win sitting ready.

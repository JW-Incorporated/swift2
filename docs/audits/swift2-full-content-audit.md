# Swift2 Full Content Audit — Knowledge Architecture (T18)

Date: 2026-07-09. Method: `swift2-knowledge-architecture-v1.md`. Grounded on a
live `npm run content:coverage` run + per-template source reads on `main`
(HEAD at audit time). Tickets: `swift2-ticket-backlog.md`. Priority shortlist:
`top-25-priority-fixes.md`.

Scores are 0–5 per the v1 rubric. Dimension keys: Fa=Facts, St=Story, EE=Easter
Eggs, Cx=Connections, Sy=Symbolism, Ti=Timeline, LE=Live-Evolution,
Co=Community/Theory, CP=Creative-Process, Em=Emotional, CI=Cultural-Impact,
AI=AI-opportunity, Ev=Evidence(real enum), SD=Swiftie-Delight, Sh=Shareability,
Rp=Replay.

---

## 0. Executive summary

**Overall maturity: 2.4 / 5 (weighted by where users actually spend time).**
The app is a genuinely sophisticated *interaction* shell wrapped around content
that is, on `main` today, mostly caption-depth — with the striking exception of
the Easter-egg/Decode surfaces, which are excellent. The single most important
thing an outsider needs to understand: **most of the good content that this
team has already written is not on `main`.** It is stranded on unmerged
branches, or authored into seed fields the live schema can't render. This is a
plumbing-and-merge problem far more than a writing problem — which is good news,
because writing is the slow part and it's largely done.

### The five findings that matter

1. **The depth work is real but unlanded (P0, credibility).** All ten
   `content/<era>-full` branches — the "full-standard, every era" pass — are
   **unmerged** (`git branch --merged main` lists none of them). Only
   `fearless-full` reached `main` (via #126). `midnights-full` carries 2,752
   lines vs. `main`'s 2,352; `folklore-full` 1,383 vs. 990. Meanwhile the live
   coverage gate on `main` reports **491 / 614 items flagged** (361 with
   <300-char bodies, 275 with no photo). Any claim that eras are "at full
   standard, flags → 0" describes the branches, not the deployed app. Two of the
   four prior audit docs (`breadth-audit-2026-07-09.md`,
   `qa-era-depth-spotcheck-2026-07-09.md`) are *also* stranded — they exist only
   on `content/lover-full` and `content/reputation-full`, not on `main`.

2. **Photos were written where the live schema can't show them (P0).** The T16
   push authored `moment.photos[]` into 13 seed files, but `ContentItem.image`
   on `main` is still a single `image: string` (types.ts:81), `MomentDetail`
   renders exactly one `item.image` (MomentDetail.tsx:70), and the sync's
   `MONTH_ITEM_COLS` selects only `thumbnail_url` — no photos column. T15 (the
   `images: ImageRef[]` gallery schema) was specified as the P0 blocker for T16
   and **never merged**. So even where photos exist, the gallery a fan would
   scroll does not. 707 / 751 media refs also carry no rights-status field.

3. **Four fully-authored content pipelines have zero UI reach (P1, depth).**
   `supabase/seed/theories/**` (27 confidence+outcome-graded records),
   `videos/**` (65 records), `tours/**` (6, with the Eras leg/show detail), and
   `releases/**` (29) are seeded and pass every gate — and are **not synced to
   the live UI at all** (`longlive-experience.md` §9; only `tracks` is synced).
   The theories seed is *better structured* than the hand-authored `EGG_NODES`
   the Clue Web actually renders, and users never see it.

4. **The knowledge graph barely exists (P1).** The app's whole promise is
   connective tissue — "this clue pays off there," "this song answers that one" —
   yet `relatedIds` is not a field on `ContentItem`, `Relationship`, `RunwayLook`,
   or `TrackNote`. The only real cross-linking anywhere is egg→egg (`EGG_LINKS`)
   inside the Clue Web. Crossings, the marquee "where threads touch" feature, is
   therefore capped by the thinness of what it crosses.

5. **There is no per-song meaning surface, and it's the biggest single content
   opportunity (P1).** The Track Guide is explicitly a one-line hook, not an
   essay. "What does this song mean?" — the most common question a fan brings —
   has no home in the app. Specified as T19 below.

### Biggest credibility / trust gaps
Unlanded depth work + stranded audit docs (#1); factual errors already found and
only partly fixed on `main` (the QA spot-check's Rascal Flatts date, Vienna
"250,000 tickets," and the Getty-vs-Taylor engagement-photo credit — the debut
date is fixed on `main` via the #114 rebase, but that PR is itself unmerged); the
`rel-5` era mislabel (the relationships/runway audit that would have fixed it was
stopped mid-run and never opened a PR).

### Biggest Swiftie-depth gaps
The synced era-moment feed (491 flagged), the missing song-meaning surface, the
thin threads (Relationships 6 entries/no sources; Runway 1 look per era, 11/12
with no designer or occasion), and the un-synced theories corpus.

### Biggest knowledge-graph gaps
No `relatedIds` anywhere on the main feed; Crossings derivative; moment↔egg↔
song↔thread links are all implicit (era-slug matching) instead of explicit.

### Biggest AI-experience opportunities (architecture constraint noted on each)
"Ask the Vault" semantic search over the corpus; auto-suggested `relatedIds` for
editors; a per-song meaning drafting aid. **All must be worker-side, hard-capped,
rule-based-fallback, never synchronous per request, with a decision-log cost
entry before shipping** (`docs/architecture.md`). None implies live per-request
model calls; the reader stays static.

### Top 10 highest-impact fixes
1. Land the ten `*-full` depth branches (+ the two stranded audit docs) onto
   `main`, reconciled with `main`'s QA edits — **T18**.
2. Ship the `images: ImageRef[]` gallery schema + sync + `MomentDetail` gallery —
   **T15** (reopen; still unmerged).
3. Sync the theories seed → a live Theory surface — **T20**.
4. Build the per-song meaning surface — **T19**.
5. Add `relatedIds` + render cross-links on the main feed — **T9/T23**.
6. Sync the videos seed + wire the era video rail to it — **T21**.
7. Fix the known factual errors + `rel-5` era mislabel and land them — **T26**.
8. Source + de-thin the six Relationships and twelve Runway looks — **T27**.
9. Media rights-status backfill (707 refs) — **T25**.
10. Progress/visited-state layer so Replay stops scoring ~1 — **T6** (open).

### Top 10 fastest wins
1. Merge the stranded audit docs to `docs/` (minutes) — part of **T18**.
2. Land `fearless`-parity branches that have no conflicts — **T18**.
3. Make Clue Web "connects to" chips clickable in trail view — **T8** (open).
4. Timeline scrubber hover shows the summary, not just title/date — **T13**.
5. Empty-filter state gets a one-tap "Clear filter" — **T28**.
6. Thread gallery cards show an item count + one highlight — **T29**.
7. Fix the 4 sub-300-char verbatim excerpts flagged by the gate — **T30**.
8. Add the graph-density + pipeline-reach lines to `content:coverage` — **T23**.
9. Credit the 7 photos missing a credit string — part of **T25**.
10. Wire `useBackDismiss` everywhere (already done in PR #127, just merge it).

### Recommended next sprint
**"Land what exists, then connect it."** (a) T18 reconcile+merge the depth
branches and audit docs; (b) T15 images gallery; (c) T20 theories sync; (d) T9/
T23 relatedIds + graph-density gate. That sequence converts already-written,
already-verified work into shipped depth and turns the coverage gate into a
guardrail that watches the graph, not just body length — the highest leverage
available before any new writing.

### Needs a decision (founders — see backlog for the full list)
Quiz/trivia as a real feature? · a graded `Confidence` on `ContentItem` (reuse
the enum) as **required** on the main feed? · accounts/UGC for progress sync
(today progress is client-only) · awards as a structured 1,640-row corpus vs.
curated highlights only · monetization (shop-the-look) — still blocked on IP
counsel · how much of the Eras Tour date table is "in scope" for T17.

---

## 1. Template scoreboard

Weight = share of user attention (rough). Overall = rubric-weighted mean of the
16 dimensions for that template, on **`main` today** (not on the branches).

| # | Template (surface / file) | Weight | Overall | Strongest | Worst gap |
|---|---|---|---|---|---|
| 1 | Era hero (`EraSection`/`eras.ts`) | 0.08 | **3.4** | Story/Delight | uncited; static |
| 2 | Era moment card — curated (`content.ts` RAW, 32) | 0.05 | **3.3** | Story/Facts | tiny N; no graph |
| 3 | Era moment card — synced vault (614) | **0.34** | **1.9** | Timeline/Facts | 491 flagged; caption-depth |
| 4 | Moment detail overlay (`MomentDetail`) | **0.20** | **2.1** | Evidence render | 1 image only; empty bodies |
| 5 | Track guide entry (`TrackGuide`/`TrackNote`, 244) | 0.07 | **3.0** | Evidence/Facts | hook not essay; no graph |
| 6 | **Song-meaning surface (proposed)** | — | **N/A** | — | does not exist (T19) |
| 7 | Theory/egg entry — Clue Web (`EGG_NODES` 30 + `CLUE_PAIRS`) | 0.06 | **4.3** | Evidence/EE | coverage uneven; seed unused |
| 8 | Era video rail (`MomentVideo`/`EraMedia`) | 0.04 | **2.6** | Evidence(oEmbed) | 10/62 MVs; seed unsynced |
| 9 | Thread — Love Story (`RELATIONSHIPS` 6) | 0.03 | **1.8** | Emotional | no sources; rel-5 era bug |
| 10 | Thread — Fashion (`RUNWAY_LOOKS` 12) | 0.03 | **1.9** | Symbolism | 1/era; 11/12 no designer |
| 11 | Thread — Taylor's Version (`RERECORDS` 6) | 0.02 | **2.8** | Cultural Impact | thin prose |
| 12 | Thread — Easter Eggs (`EGG_NODES` via Clue Web) | 0.03 | **4.2** | EE/Delight | no completion payoff |
| 13 | Thread — The Decode (`CLUE_PAIRS`) | 0.03 | **4.4** | Evidence | best content, small N |
| 14 | Thread — The Proposal (`PROPOSAL_BEATS` 4) | 0.02 | **3.2** | Evidence | 4 beats / 2+ yrs, gaps |
| 15 | Clue Web (mechanic) | — | **3.8** | Interaction/Cx | no progress/replay |
| 16 | Crossings (`Crossings`) | 0.02 | **2.6** | Novelty | derivative of thin threads |

Two-author seam, quantified: templates 7/12/13 (the Easter-egg family) average
**4.3**; the surfaces that hold ~90% of scroll time (3+4) average **2.0**. Users
feel this gap without being able to name it — exactly the §A finding of the
2026-07-08 depth audit, still true because the fix is unlanded, not unwritten.

---

## 2. Template-by-template findings

### 1. Era hero — `EraSection` + `eras.ts` · Overall 3.4
Scores — Fa4 St4 EE1 Cx2 Sy3 Ti3 LE1 Co0 CP2 Em4 CI3 AI2 Ev2 SD4 Sh2 Rp2.
Every era has a distinct, well-written intro + a real signature lyric; the
per-era re-skin is a genuine delight. But the hero has **no source field** and no
link into its own threads/eggs (implicit via `eraId` only).
- What happened: sets the mood and identity for each of the 12 eras.
- Why it matters: the first thing a user sees per era; frames everything below.
- How it connects: it *doesn't*, explicitly — no `relatedIds` into threads/eggs.
- Only-a-Swiftie: the lyric choice per era is sharp and era-literate.
- Can-do-here: feel the era change; nothing they couldn't read on Wikipedia yet.
- Persona delta: brand-new fan +1 (great onboarding); historian −1 (uncited).

### 2. Era moment card — curated (`content.ts` RAW, 32 items) · Overall 3.3
Scores — Fa4 St4 EE3 Cx2 Sy3 Ti4 LE1 Co1 CP3 Em4 CI3 AI2 Ev3 SD4 Sh2 Rp2.
The hand-authored items (2–5 per era; tloas 5, evermore just 1) read as real
editorial prose with `hiddenClue` glints. This is the quality bar the synced
feed should meet. Tiny N and no explicit graph links.
- Only-a-Swiftie: the `hiddenClue` payoffs reward fandom literacy.
- Can-do-here: catch a planted clue inline — but it dead-ends (no jump to the
  trail it belongs to, even though `MOTIF_MEMBERSHIP` knows the relationship).

### 3. Era moment card — synced vault (614 items) · Overall 1.9 · **main real estate**
Scores — Fa3 St2 EE1 Cx1 Sy1 Ti4 LE2 Co0 CP1 Em2 CI2 AI2 Ev3 SD2 Sh1 Rp1.
This is ~90% of what a user scrolls, and the coverage gate flags **491** of them
(361 <300-char body, 275 no photo). 0 zero-source but **331 single-source**.
Facts and Timeline are decent (the dates and ordering are right); everything that
makes a moment worth clicking is thin. The depth exists on the unmerged `*-full`
branches.
- Spot-checks (from the live gate): "Midnights debuts at No. 1" — body 0 chars;
  "The Eras Tour kicks off in Glendale" — body 0 chars; "William Bowery writes
  one more Midnights love song" — no photo. All real, all caption-only on `main`.
- Can-do-here today: almost nothing beyond a captioned timeline. This is the
  number that drags the whole app's maturity down.
- Persona delta: superfan −1 (Wikipedia-with-animation); PM flags this as the
  one to fix first by weight.

### 4. Moment detail overlay — `MomentDetail` · Overall 2.1 · **main real estate**
Scores — Fa3 St2 EE2 Cx1 Sy1 Ti3 LE1 Co0 CP1 Em2 CI2 AI2 Ev4 SD2 Sh2 Rp1.
Opens full-bleed and immersive — for, often, one sentence and one image. The
Evidence render is genuinely good (a real "Sources" list, a confidence pill when
present). Two structural gaps: (a) **single image only** — `item.image`,
line 70; the `moment.photos[]` galleries have no path here (T15 unlanded);
(b) bodies are frequently empty on `main` because the depth is on branches.
- Can-do-here: read a citation inline (good) — but the immersive frame writes a
  cheque the content can't cash yet.

### 5. Track guide entry — `TrackGuide` / `TrackNote` (244 notes, 12/12 eras) · Overall 3.0
Scores — Fa4 St3 EE3 Cx1 Sy2 Ti2 LE1 Co1 CP3 Em3 CI2 AI3 Ev4 SD3 Sh2 Rp2.
Solid, sourced one-liners per song; the "no row without a real source" rule is
honest. By design it's a hook, not an essay (TrackRow is a flat `<li>` with note
+ source links). No per-song detail, no lyric snippet, no cross-links, no "what
Taylor said." That ceiling is the entire case for T19.

### 6. Song-meaning surface — **proposed, does not exist** · N/A (target state)
The most-asked fan question ("what is this song about?") has no home. Target
state per T19: a per-song detail reached from a `TrackRow`, carrying an
original-words meaning, sourced short lyric snippets (≤300 chars, never full
song), `relatedIds` to connected songs, and cited "what Taylor has said." Score
today: N/A; opportunity: highest single content lever in the app.

### 7. Theory / egg entry — Clue Web `EGG_NODES` (30) + `CLUE_PAIRS` · Overall 4.3
Scores — Fa4 St4 EE5 Cx4 Sy4 Ti4 LE2 Co4 CP2 Em3 CI3 AI3 Ev5 SD5 Sh3 Rp4.
The best content in the app: plant→payoff structure, 2–3 sources per entry,
correct confidence labeling, honest about confirmed vs. fan-read. Two gaps:
coverage thins for ttpd/tloas, and — importantly — the **richer
`supabase/seed/theories/**` corpus (27 records with required confidence+outcome)
is not what renders here**; Clue Web uses the in-repo `EGG_NODES`. There are two
theory datasets and the better-structured one is invisible (T20).

### 8. Era video rail — `MomentVideo` / `EraMedia` · Overall 2.6
Scores — Fa4 St2 EE2 Cx1 Sy2 Ti2 LE1 Co0 CP2 Em2 CI3 AI2 Ev4 SD3 Sh3 Rp2.
All 12 eras have Spotify embeds; only ~10 signature moments have a YouTube video,
against 62 real music videos on the videography page. The `videos/**` seed (65
records) that would close this is **unsynced**. Media IDs are properly
oEmbed-verified (good discipline). 1989/folklore still point at non-TV editions
pending a product call (T14).

### 9. Thread — Love Story · `RELATIONSHIPS` (6) · Overall 1.8
Scores — Fa2 St3 EE1 Cx3 Sy1 Ti2 LE1 Co1 CP1 Em4 CI2 AI1 Ev1 SD2 Sh1 Rp1.
Six entries, **no sources field at all**, one sentence each, and the known
`rel-5` "1989 Whirlwind" mis-filed under the Red era (the audit that would have
fixed this was stopped before opening a PR). Emotional resonance is the only
thing carrying it. Feeds Crossings, so its thinness propagates.

### 10. Thread — Fashion · `RUNWAY_LOOKS` (12) · Overall 1.9
Scores — Fa2 St2 EE1 Cx2 Sy3 Ti2 LE1 Co0 CP2 Em2 CI2 AI1 Ev1 SD2 Sh2 Rp1.
One look per *era*, not per occasion; 11 of 12 carry no designer or event credit.
The Showgirl entry (Bob Mackie, Portofino orange, dated, sourced) is the template
the other 11 should match (T27).

### 11. Thread — Taylor's Version · `RERECORDS` (6) · Overall 2.8
Scores — Fa4 St3 EE2 Cx3 Sy2 Ti3 LE2 Co1 CP2 Em3 CI4 AI2 Ev2 SD3 Sh3 Rp2.
Good stat tiles and a genuinely strong cultural-impact story (masters, vault
tracks); prose is thin and evidence is light for a topic this well-documented.

### 12. Thread — Easter Eggs (`EGG_NODES` via Clue Web) · Overall 4.2
Shares the strength of template 7. The one thing missing is a **completion
payoff** — a trail can be read but "finishing" it does nothing (no progress
layer, T6), which caps Replay.

### 13. Thread — The Decode · `CLUE_PAIRS` · Overall 4.4 · **the ceiling**
Scores — Fa5 St4 EE5 Cx4 Sy4 Ti5 LE2 Co5 CP2 Em3 CI3 AI3 Ev5 SD5 Sh3 Rp4.
The best-sourced surface in the product and the model for everything else. Small
N; the only real ask is more of it (T10, open) and clickable connect-chips (T8).

### 14. Thread — The Proposal · `PROPOSAL_BEATS` (4) · Overall 3.2
Scores — Fa4 St3 EE2 Cx2 Sy1 Ti2 LE2 Co2 CP1 Em4 CI2 AI1 Ev4 SD3 Sh3 Rp2.
Well-sourced but sparse — 4 beats across 2+ years, with big date gaps (the 2024
Eras Tour appearances and the friendship-bracelet callback are real and missing).

### 15. Clue Web (mechanic) · Overall 3.8
The constellation/trail interaction is sophisticated and a real differentiator
(Cx and interaction score high). Held back only by the absent progress/completion
layer (Replay) and the label-overlap polish item. This is the interaction the
rest of the app should aspire to *feed*, per the depth audit's second finding.

### 16. Crossings · `Crossings` · Overall 2.6
Scores — Fa2 St2 EE1 Cx4 Sy2 Ti3 LE1 Co1 CP1 Em2 CI2 AI2 Ev2 SD3 Sh2 Rp2.
A striking idea — two threads on one axis, markers where they touch — that is
**capped by the thinness of what it crosses** (especially Love Story). Fix the
threads (T27) and add `relatedIds` (T9) and this jumps; it can't rise on its own.

---

## 3. Cross-cutting persona notes

- **Brand-new fan (sets the floor):** onboarding is scattered and assumes
  vocabulary — "thread," "crossing," "motif trail," "vault track" are never
  defined (glossary is T7, open). The era heroes are the one strong on-ramp.
- **Superfan / Taylor historian (sets the ceiling):** rewarded only in the
  Easter-egg family; everywhere else the reaction is "this is the Wikipedia
  article with a nicer scrollbar." The song-meaning gap (T19) and the unsynced
  theories corpus (T20) are what they'd miss most.
- **Trivia expert:** there is no quiz/trivia surface at all — a clear
  feature-shaped hole, not a depth gap (see Needs-a-decision).
- **UX designer:** the interaction engineering is ahead of the content on every
  surface; the immersive `MomentDetail` frame over a one-sentence body is the
  sharpest example of that inversion.
- **Content strategist:** the corpus is bigger than it looks (614 items + 244
  tracks + 65 videos + 27 theories + 29 releases) — the problem is reach and
  depth, not volume. Prioritize landing and connecting over writing.
- **Social sharer:** share cards are generic; no stat/progress/curiosity hook
  (T12, open). The Decode and Clue Web are the only naturally shareable moments.
- **PM:** fix by weight — the synced feed (0.34) and its detail view (0.20) are
  more than half of all attention and score ~2.0; they dominate the roadmap.

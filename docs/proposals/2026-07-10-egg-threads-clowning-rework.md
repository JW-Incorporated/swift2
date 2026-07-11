# Proposal: rework the easter-egg threads — one clowning universe: "Mastermind" (case files) + "Invisible Strings" (symbol atlas)

Status: design-debate in progress (Claude proposed 2026-07-10; Codex
adversarial rounds recorded in the Appendix). Grounding: `docs/vision.md`
(the time-travel/immersion vision — threads themselves are not specced
there; Joey's 2026-07-10 brief is the product mandate), plus
`docs/architecture.md` and `docs/longlive-experience.md` (this proposal
follows the shipped static LongLive layer and its build-time seed→sync
pipeline; no conflict with the cost rules — no runtime LLM, no per-user
compute). Conflicts flagged: none with standing decisions; supersedes the
*direction* of issue #431 (see §10).

## TL;DR for reviewers

User feedback said The Decode and The Clue Web are "both interesting, but neither makes complete sense" — because they are two half-views of the same subject (Taylor plants clues → fans clown → payoffs land) with three disconnected copies of the content and **the fans missing from the story entirely**. This ticket merges everything into ONE sourced "case file" corpus authored once, rendered through two intentional threads — **Mastermind** (the case files: solved cases to reminisce over, open cases to clown on right now) and **Invisible Strings** (the symbol atlas: every recurring motif mapped across 20 years) — woven bidirectionally into the era timeline.

---

## 0. Provenance and authority

- Requested by Joey (CEO) 2026-07-10 in response to pre-release reviewer feedback, with full artistic license granted to Claude for the product design. Spec authored by Claude Code the same day.
- This spec **supersedes the direction of #431** (Clue Web onboarding refinement) — see §10. It **coordinates with, and partially delivers, #436** (threads↔eras weaving).
- Product sign-offs were collected in §11 — **all four approved by Joey, 2026-07-10 (every default stood)**. Everything else is engineering license.
- The implementing session should copy this spec into `docs/specs/2026-07-10-mastermind-invisible-strings-spec.md` in the P1 PR (knowledge lives in the repo), and add the `docs/decisions.md` entry drafted in §12.

## 1. Why — the original intent, restated

Taylor Swift is the most easter-egg-forward artist alive: numerology (13 above all), color signaling, wardrobe plants, liner-note ciphers, countdowns, doors. Some clues live for *years* before paying off. Around this, the fandom built an entire culture — **clowning**: assembling theories, holding receipts, being gloriously wrong, being spectacularly right. The word is affectionate self-description; a fan "puts on clown makeup" when they board a theory that may humiliate them later. It is a *participatory, communal, present-tense* activity.

The original product idea (Joey, 2026-07-10): *something cool and unique for swifties who are super into clowning — discover something new, reminisce in the past.* Three verbs to serve:

1. **Reminisce** — relive the great decodes you lived through (or missed).
2. **Discover** — find plants, connections, and deep cuts you never knew.
3. **Clown** — take a position on what's still unresolved, and find out later how you did.

The two threads we shipped serve fragments of #1 and #2 and none of #3.

## 2. What we have today (audited 2026-07-10 on `main`, post PR #332/#425/#249/#430)

Both threads are competently built. Neither is bad. The problem is structural, not craftsmanship.

### 2.1 The Decode (`lensId: 'hidden-clues'`, `components/longlive/decode/DecodeThread.tsx`)

42 sourced `CLUE_PAIRS` (`lib/longlive/lenses.ts` ~L1400+), each a plant→payoff pair with dates, era ids, `confirmed` flag, sources. UI: tap-to-reveal payoff (the payoff section re-skins into its own era's theme — genuinely great), sort/filter controls, a stat bar, a "longest gaps" leaderboard, a per-era PatternRail. Has its own motif taxonomy (`DecodeMotifId`: number/object/lyric/name/structural/theme/political) that is *explicitly documented as "distinct from the Clue Web's MotifId (a different feature)"*.

**What it is:** a filterable database with a lovely reveal interaction. **What it isn't:** a story. Every pair has exactly two beats — plant, payoff — with nothing in between. The middle of every real easter-egg story is *the fandom* (who noticed, what the theories were, how long the clowning ran), and it is entirely absent. Everything is also retrospective: 100% of entries are already resolved, so there is nothing to clown on *now*.

### 2.2 The Clue Web (`lensId: 'easter-eggs'`, `components/longlive/ClueWeb.tsx`)

30 `EGG_NODES` (each `kind: 'clue' | 'payoff'` — note: the same plant/payoff concept as CLUE_PAIRS, modeled a second time as disconnected single nodes), 7 `MOTIFS` (number-13, hidden-messages, the-snake, color-coding, clocks-countdowns, doors-rooms, the-rerecordings), `MOTIF_MEMBERSHIP` (each node in exactly one trail), 23 `EGG_LINKS` cross-connections. UI: home (how-it-works + localStorage progress stats) → per-motif trail (vertical spine, seen-tracking, completion card) → constellation (SVG map, hand-authored x/y).

**What it is:** a symbol reference with a wander mode. **What it isn't:** distinct from The Decode in a user's mind. Its own onboarding header literally reads *"How the **decode** works."* The Decode's gallery card says *"Pull the **threads** between hidden messages"* — each thread describes itself in the other's vocabulary. A reviewer tapping both back-to-back sees two UIs telling the same story with different, unlinked data. That is exactly the "neither makes complete sense" feedback.

### 2.3 The two hidden overlaps that make this urgent

**Three parallel content systems describe the same real-world eggs with zero shared identity.** Confirmed duplicates on `main` today (same egg, 2–3 independent write-ups, no cross-references):

| Real-world egg | CLUE_PAIRS | EGG_NODES | theories seed |
|---|---|---|---|
| Bejeweled MV → Speak Now TV | `clue-*` "Speak Now clues in 'Bejeweled'" | `egg-bejeweled-elevator`, `egg-speaknow-tv-nashville`, `egg-rep-tv-clue-bejeweled` | `midnights:bejeweled-speak-now-clues` |
| Google vault puzzles | "The Google vault puzzles" | — | `midnights:vault-puzzles-1989` |
| The lost Karma album | "The 'Karma' graffiti" | `egg-karma-album-theory` | `midnights:karma-lost-album` |
| TLOAS orange seeding | "The orange door" + "Taylor Nation's orange era posts" + "The mint-and-orange briefcase" | `egg-tloas-orange-doors` | (tloas seed) |
| Fearless TV vault scramble | "The Fearless vault scramble" | `egg-fearless-tv-scramble` | — |
| The snake era | "The snake teasers" | 3 snake nodes | — |

Plus the fourth fragment: 8 `hiddenClue` strings on era moments in `content.ts`, connected to nothing.

**The fan-culture vocabulary is already in our type system and never made it to the product.** `Confidence` in `types.ts` includes the tier `'clowning'`. `TheoryOutcome` includes `pending` (open!), `debunked`, `abandoned`, and `unfalsifiable` (the Karma-album genre — never provable, never dead). The theories seed pipeline (27 records, per-era, REQUIRED confidence+outcome+sources, live-synced, Karen-scannable) is *already 90% of the right data model*, and it's buried in a per-era overlay (`TheoryGuide`) that the threads never touch.

### 2.4 The weaving gap

Issue #436 documents it: `contentForThread()` (WS2) has zero UI consumers; the only era→thread link in the whole app is `MomentDetail`'s Clue-Web motif jump (`resolveMotifTrail`); no thread links back to any era moment. Joey's directive for this rework explicitly repeats the goal: *all of the site's content threaded across eras and threads, weaving in and out.*

## 3. The vision

> **One game, two doors.** Everything easter-egg is a single corpus of **case files** — plant → clowning → payoff (or still open). **Mastermind** is the game replayed and live: read the solved cases like detective stories, and take a position on the open board. **Invisible Strings** is the map of the game: every recurring symbol traced across twenty years, ending at where it might strike next. Each case knows its era moments; each era moment knows its cases. You can start anywhere and end up everywhere.

Both names are hers, which is the point:

- **Mastermind** (Midnights, track 13 — yes, 13): *"I laid the groundwork and then… it was all by design."* The song is literally Taylor confessing she plants everything. Naming the case-file thread after her own confession makes the thread's premise self-evident to any fan in half a second.
- **Invisible Strings** (folklore's "invisible string"): THE fan metaphor for connections stretched across time — and the constellation view literally draws strings between moments. (Fallback names if Joey vetoes, see §11: "The Clown Files" / "The Symbol Atlas", or retain current names with the new content model — the model works under any label.)

### 3.1 A walkthrough (the experience we're buying)

Maya, deep-lore swiftie, opens Threads.

1. **Mastermind**'s board opens on **The Open Board** — the cases with no payoff yet, newest activity first. One is a color-watch case for the next era; one is the eternal Karma-album file. Each open case shows the plant(s), the dated clowning beats so far (sourced), and a **"Where do you land?"** prompt with the real, curated fan camps. Maya locks a pick. It's stored locally — her *clown card* now reads "3 calls pending."
2. She scrolls into **The Case Files** — solved cases, newest payoff first. Each is a dossier: plant beat (era-tinted), the clowning that followed (dated, cited — *"within hours, fans had filed the purple gown under Speak Now"*), then the REVEAL interaction she already loves from The Decode — and when it flips, the payoff re-skins into the payoff era's colors and shows the verdict line plus **"planted 1,057 days early."** On a case she remembers living through, that's reminiscence; on a deep cut, that's discovery.
3. A chip on the case says **№13 · Numerology**. She taps it and lands in **Invisible Strings**, on the Number 13 trail — the same case now appears as one bead on a twenty-year string. At the trail's end: **"Where it strikes next"** — the open cases touching this motif, linking back to the board.
4. A beat inside the case says *"Read this moment in the Lover era →"*. One tap and she's standing in the era timeline at that moment, which itself shows *"This moment is an exhibit in [case] →"*. The weave is real, in both directions.
5. Six weeks later a payoff ships in a content update. Her next visit, the board greets her: **"CASE CLOSED since your last visit — you called it."** She screenshots her clown card. That's the retention loop, with zero backend.

## 4. Design — the unified data model

**Decision: the case corpus is the existing theories seed family, extended.** No new parallel system — the whole point is to stop having three. Records stay per-era files (`supabase/seed/theories/<era>.mjs`), stay Karen/CIE-scannable, keep REQUIRED confidence+outcome+sources, keep rendering in TheoryGuide unchanged. A cross-era case lives in **its plant's era file** (existing `${eraId}:${slug}` identity convention).

### 4.1 Schema additions (all additive/optional — existing records remain valid)

```ts
// TheoryNote gains:
kind: 'easter_egg' | 'theory' | 'tradition';   // + 'tradition': a living recurring
                                               // practice (liner-note ciphers, 13s)
                                               // with recurrences, not a single payoff
motifIds?: MotifId[];      // ≥1 makes the record a *case* (appears in threads);
                           // ordered by primacy — first id = primary lane/badge
beats?: CaseBeat[];        // the story spine, chronological
hook?: string;             // card headline (carried over from CluePair.hook)
verdict?: string;          // post-reveal fan-voice takeaway (from CluePair.verdict)
camps?: Camp[];            // ONLY for outcome:'pending' — curated positions
echoes?: { slug: string; label: string;
           fromBeatId?: string; toBeatId?: string }[];
                           // cross-case narrative links preserving EGG_LINKS'
                           // labels ("shed and transformed"); optional beat
                           // anchors (Codex round 2) keep legacy node→node
                           // endpoints drawable on the beat-level map —
                           // unanchored echoes fall back to primary beats

interface CaseBeat {
  id: string;              // stable kebab slug, unique within the case (Codex
                           // round 2): global beat key = `${caseId}#${beatId}`
                           // — required by seenBeats progress, the oldEggId
                           // mapping, and constellation node keys; dev-guarded
  role: 'plant' | 'clowning' | 'payoff' | 'echo';
  date: string;            // YYYY-MM-DD, day precision per WS1 standard
  dateLabel?: string;
  eraId: EraId;
  what: string;            // our words, never pasted verbatim
  line?: string;           // short snippet only + cite (lyrics policy 2026-07-09)
  lineCite?: string;
  image?: ImageRef;        // relaxed image policy; 'reference' labeling rules apply
  sources?: EggSource[];   // REQUIRED on 'clowning' and 'payoff' beats
  relatedIds?: RelatedId[];// e.g. 'moment:<id>' → the era-moment exhibit link
}

interface Camp { id: string; label: string; blurb: string }  // sourced in `evidence`
```

**Case state is derived, not stored** — no new status enum:
`outcome: confirmed|partially_confirmed` → SOLVED · `pending` → OPEN · `debunked|abandoned` → DEBUNKED (shelved affectionately, "we clowned") · `unfalsifiable` → ETERNAL (the Karma genre — its own shelf, see §6.1) · `kind: 'tradition'` → TRADITION badge overriding the above. A record is a **case** iff it has `motifIds` (selector `isCase()`); records without stay TheoryGuide-only, unchanged.

`RelatedId` namespace gains `case:<eraId>:<slug>` (extend `related.ts` resolution + keep its drop-unresolvable resilience). `MotifId` may gain new values per the migration rule in §4.2 (candidates: `numerology` for non-13 numbers, `wardrobe-signals`; only if ≥3 cases each — do NOT invent trails thinner than that).

**Full schema-change scope (Codex round 1 — this is NOT a seed-file-only change).** The theories pipeline touches five layers with hard-coded field lists, and every one must move in the P1 PR or the live-sync path silently drops the new fields while local fallback renders them: (1) `packages/shared/src/vault-types.ts` — `THEORY_KINDS` gains `'tradition'`, new `CaseBeat`/`Camp` types; (2) a Supabase migration — new jsonb/text columns + the `kind` check constraint updated for `tradition`; (3) `scripts/seed-theories.mjs` — its fixed insert column list; (4) `scripts/sync-longlive-theories.mjs` — its fixed select column list + normalization + its tests; (5) `apps/web/lib/longlive/types.ts` + `theories.generated.ts` output shape. P1's sync gains a **seed↔live parity check** that fails loudly when the live table lags the seed schema (the deploy-order risk in §9's P1 row).

### 4.2 Migration (this is content surgery — do it with a committed mapping, not ad hoc)

Fold all four fragments into the corpus. The migration inventory is **generated from `origin/main`, not hand-counted** (Codex round 1 caught this doc itself miscounting EGG_LINKS 24 vs the real 23): a committed script/data file asserts the exact legacy counts at migration time (believed today: 42 clue pairs, 30 egg nodes, 23 egg links, 8 hiddenClue strings, 27 non-template theory records) and maps every legacy id → its case slug + disposition. The parity test in P1 runs off this file. Rules:

1. **42 `CLUE_PAIRS`** → each becomes a case (kind `easter_egg`; `confirmed:false` pairs → kind `theory` with `outcome` per the record and confidence honestly set). plant/payoff → beats; `connection` → `evidence` or `verdict`; `DecodeMotifId` is **retired** — assign real `motifIds` editorially.
2. **30 `EGG_NODES`** → each either (a) merges into an existing case as a beat, (b) becomes its own case, or (c) joins a `tradition` record's recurrence beats (e.g. `egg-capitals-debut` + `egg-capitals-fearless` → one "The liner-note cipher" tradition). **23 `EGG_LINKS`** → `echoes`, labels preserved verbatim (those labels are good writing) and **endpoints preserved via beat anchors** — each legacy `from`/`to` node id resolves through the mapping to a `fromBeatId`/`toBeatId`, so the beat-level constellation draws the same geometry the node map drew.
3. **27 theory records** → gain `motifIds`/`beats` where they're case-shaped (Bejeweled, vault puzzles, Karma…); pure commentary records stay untouched.
4. **8 `hiddenClue` strings** in `content.ts` → audit each: becomes a beat `relatedIds` exhibit link, or is absorbed into case copy; none left orphaned.
5. **Dedupe by reality, not by id** — the §2.3 table rows each end as ONE case. Where two write-ups conflict, keep both claims only if both are sourced (per the standing content-merge rule: never discard); otherwise the better-sourced text wins.
6. **Re-verify while porting.** CIE has proven this corpus has factual drift. Anything that fails re-check gets fixed in the same commit, not laundered into the new schema. All sources carry over; a `clowning`-confidence claim must never level-up in the move.
7. **Nothing is deleted until its content is accounted for** in the mapping file. Then `CLUE_PAIRS`, `EGG_NODES`, `EGG_LINKS`, `MOTIF_MEMBERSHIP`, `DecodeMotifId` + `DECODE_MOTIF_META` are removed from `lenses.ts`/`types.ts` (≈1,600 lines of hand-authored data leave the view layer; `MOTIFS` metadata stays, it's presentation) — deletions happen in P2/P3 with the consuming UI, never in P1.
8. **The boolean `confirmed` flags are never mechanically upgraded** (Codex round 1: "the event happened" must not launder into "intent confirmed"). Each migrated case gets `confidence` and `outcome` set **separately and editorially**: confidence `official`/`confirmed_interview` only where a cited source shows Taylor/her team confirming *intent* (e.g. the Delicate-nails EW confirmation); otherwise `strong_fan_consensus` or lower — even when the predicted payoff undeniably occurred. The mapping file records both fields per case so the review can audit every upgrade.
9. **Cross-era ownership is deterministic and guarded**: a case lives in exactly one era file — its plant's era (`plant beat eraId === owning file's eraSlug`, dev-guarded) — and slugs are globally unique across all era files (guarded test). The per-era delete+reinsert seed runner then stays correct for cross-era cases: each row has exactly one owning file, so reseeding one era can't orphan or duplicate another era's cases.

### 4.3 Derived machinery (replacing hand-maintained structures)

- **Named, tested ordering selectors** (Codex round 1 — four surfaces must not each reinvent "latest"): `openCasesByLatestBeatDesc()` (the board), `solvedCasesByPayoffDesc()` (case files), `casesForMotifChronological(motifId)` (trails, replaces `MOTIF_MEMBERSHIP`), `beatsChronological(case)` (in-case spine). Unit tests pin each.
- `caseById()`, `casesForEra(eraId)` (any beat in era), `exhibitsFor(momentId)` (reverse index of beat relatedIds).
- `threadPoints('hidden-clues')` = every case beat (plant/payoff at minimum) → the career axis, era-colored, for crossings.
- Constellation nodes = **beats, not whole cases** (Codex round 1: collapsing a case to one dot loses the plant/payoff geometry the current map draws): x derived from the beat date (2006→now), y = the owning case's primary-motif lane (+ small deterministic jitter, with a collision test). Strings: intra-case plant→payoff arcs (the case's own spine), labeled `echoes` between cases, faint same-motif adjacency. The motif *filter* includes every case touching that motif regardless of lane. This deletes hand-authored x/y, fixes the known label-overlap gap, and adopts the strongest #431 handoff findings (time axis + motif lanes; separate mobile layout per §6.3).
- Dev guards (`lenses.ts` bottom, same pattern as today's motif guard): every case has ≥1 motif; beats chronological; beat ids unique within their case; `camps` only on `pending`; clowning/payoff beats have sources; every `echoes.slug` (and beat anchor) resolves.
- Sync: extend `scripts/sync-longlive-theories.mjs` (+ its tests) for the new fields; Supabase `theory` table gains the columns via migration, same pattern WS2 used for `threadIds`. Fallback seed path must carry every field so CI/local behave identically.

### 4.4 Progress — new key, never rewrite the old one (revised per Codex round 1)

Rewriting `ll-progress-v1` in place is rollback-hostile (`parseProgress` on
`origin/main` rejects any non-v1 blob — one deploy rollback after a v2 write
and the user's state reads as foreign). So:

- **`ll-progress-v1` is never written by the new code** — it stays exactly as
  is, owned by the legacy schema. Roll forward, roll back: nothing corrupts.
- New sibling key **`ll-cases-v1`**: `{ trails: MotifId[], seenBeats: string[],
  picks: Record<caseId, { campId, pickedAt, outcomeAtPick }>,
  revealed: caseId[], lastSeenOutcome: Record<caseId, TheoryOutcome> }`.
- The **one-time, read-only import** from v1 ships inside the key's create
  path, in the SAME PR that first writes the key — i.e. P2 (Codex round 2:
  if P2 created the key bare and P3 added the import later, any user who
  touched P2 would carry a pre-import key and skip their legacy state
  forever). Import: `trails` copy verbatim (MotifIds are stable); each legacy
  egg id marks its mapped **beat** seen (`oldEggId → beatId` from the §4.2
  mapping file — beat-level, so a user who saw one of three merged nodes is
  *not* credited with the whole case). P3 merely starts *reading* trails/
  seenBeats; the data has been waiting since P2.
- `outcomeAtPick` + `lastSeenOutcome` are what make "CASE CLOSED since your
  last visit" honestly derivable (Codex round 1: without them it isn't) —
  compare stored vs current outcome at render; still no server, no accounts.
- "Called it / humbled" stays **derived** at render, never stored, so a
  content update flips it for free.

## 5. Design — Mastermind (`lensId: 'hidden-clues'` — ids never change; only titles do)

Replaces `DecodeThread`. Keeps: tap-to-reveal + payoff era-recolor (the signature moment), PatternRail era filter, sort/filter (demoted to a secondary control, not the lead), stat bar (reframed), the "independent fan project / fan theory" footer disclaimer. The board is editorial, not a spreadsheet:

1. **THE OPEN BOARD** (pinned first) — open cases, latest-beat first. Card: hook, plant summary, clowning-beat count + latest beat date, camps prompt **"Where do you land?"** (single tap to pick, tap again to change; a quiet "skip" affordance — never a gate). If any stored pick's case resolved since last visit: a **CASE CLOSED** banner pins above the board ("you called it" / "so did half of us — it was actually…").
2. **THE CASE FILES** — solved cases, newest payoff first (era-feed convention, #433; *within* a case, beats read chronologically — a story runs forward; this deliberate split is the ordering rule, documented in code).
3. Rails (horizontal scroll): **The Long Cons** (top gaps — keep the leaderboard, headline the gap in days: "planted 1,057 days early"), **The Eternals** (unfalsifiable shelf — "never confirmed, never dead"), **We Clowned** (debunked/abandoned shelf, written with love).
4. **Case detail** (expanded in place or overlay — engineer's call, but deep-linkable via store the way `clueWebTrail` works today): beats spine — plant (era-tinted) → clowning beats (dated, cited) → REVEAL → payoff (full era re-skin) → verdict line → gap stat → exhibits (images per policy) → sources → motif chips (→ Invisible Strings trail) → echo chips (→ other cases) → "Read this moment in the [era] timeline →" for any beat with a `moment:` relatedId.
5. **Clown card** (compact, top of board once ≥1 pick exists): "9 called · 3 humbled · 4 pending." Local-only — but shareable: reuse the existing `ShareSheet` so a fan can post their record/verdict ("Called the [case] payoff 2 years early 🤡✅") without any backend. That's the participation loop: take a position privately, brag publicly, no UGC liability. **Register (Codex round 1, accepted): it's a personal prediction notebook, and the copy must say so** — "your calls," "your board," never fake-communal framing ("join thousands of fans…") that a local-only feature can't honestly claim; the fandom-"we" voice is reserved for *sourced historical* discourse in case beats. First-reveal gets a half-second shimmer (the #431 celebration nit) — and nothing gamier than that: **no points, XP, streaks, or user leaderboards, ever.**

Gallery/meta copy (proposal — Joey may redline words, §11): title **Mastermind**, kicker *"She plants. We clown. The receipts."*, what: *"Every clue she's planted and every theory we've spun — the open board, the solved case files, and how long each con ran."* Intro line replacing today's: *"She plants them years ahead. We notice. These are the case files — the calls we nailed, the ones that humbled us, and the board that's still open."*

## 6. Design — Invisible Strings (`lensId: 'easter-eggs'`)

Re-aims `ClueWeb` — the home→trail→explore structure Joey likes **stays**; its data source and endpoints change:

1. **Home**: drops the rules-explainer for one concrete hook (a real case teaser, per the #431 handoff's "show a great example" finding), then the symbol cards — now showing case counts, era-dot spans, and an **"N still open"** badge where true. Progress stats stay (they're honest and earned).
2. **Trail** (one motif): beads derived from `casesForMotif`, oldest→first (a string runs forward through time; same documented ordering rule as §5.2). Each bead: era-tinted, the case's relevant beat text, "Full case file →" into Mastermind, moment exhibit links where present. Seen-tracking and the completion card stay. New final section: **"Where it strikes next"** — the motif's open cases → the board. A trail no longer dead-ends in the past; it points at the live game.
3. **Constellation**: same interaction (tap node → detail panel → pull the strings), new derived layout (§4.3: x=time, y=motif lane). Node detail panel shows the case's hook + state badge and links to the full file. **Mobile gets a genuinely separate vertical time-stream layout** (sticky era headers, node rows) instead of a squeezed map — adopting the #431 handoff's strongest UX finding.
4. Meta copy (proposal): title **Invisible Strings**, kicker *"Every symbol she's ever repeated, mapped."*, what: *"Follow one thread — the 13s, the colors, the snakes, the doors — through twenty years of plants and payoffs, and see where it might strike next."*

**Explicit image-strategy decision** (the open question flagged in #431): **no AI-generated symbolic art.** Case files are a receipts-driven surface; generic symbolic illustrations would undercut the honesty register that the confidence/outcome system works hard to earn. Exhibits use real photos under the relaxed image policy (with `reference` labeling rules intact) or no image + a motif-icon/typographic treatment. Reversible product choice; flagged to Joey in §11.

## 7. Design — the weave (this rework's half of #436)

1. **Era → case**: `MomentDetail` — extend today's single Clue-Web motif link into an exhibits block: any moment referenced by a case beat (via the `exhibitsFor` reverse index — auto-derived, no hand-authoring) shows *"This moment is an exhibit in [case] →"* (deep-link into Mastermind) alongside the existing motif-trail link (now labeled for Invisible Strings).
2. **Case → era**: every beat with `moment:` relatedIds renders the timeline jump (§5.4). `openEra`/`openItem` store actions already exist; remember `clearEraScroll()` on explicit jumps (experience doc §5.6).
3. **Era pivot strip**: add `'hidden-clues'` to `CROSSING_THREADS` — cases have real dated beats now, so `threadsInEra` shows "Mastermind · N" per era, and Crossings can overlay eggs × Love Story ("what she was planting while dating whom" — a genuinely fun crossing). `'easter-eggs'` stays excluded (spatial UI; its points would double-count the same corpus).
4. **TheoryGuide**: era-scoped records that are cases get one new affordance: *"Open the full case file →"*. The overlay otherwise doesn't change — same records, same badges, now one authoring source.
5. **Cross-thread echoes**: payoff beats that are TV announcements link to the Taylor's Version thread; engagement-adjacent cases link to The Proposal (plain `openThread` chips
 — no new infra).
6. **Search + glossary** (T7 surfaces): cases indexed by title/hook/motif; glossary gains *clowning, case file, the open board, camp, motif, trail, echo, tradition, clown card*.

Coordinate with #436: this ticket delivers the egg-flavored weave concretely; #436's generic reusable cross-link component can grow out of (or replace) these call sites — whichever lands first, the other reuses, neither blocks.

## 8. Voice & art direction (the immersion bar)

- **Fan-fluent, affectionate, in on the joke.** "We" is the fandom's voice for shared history ("we clowned"). Clown language is used knowingly and sparingly — it must feel earned, never corporate-cosplaying-fandom. When in doubt, write like a group chat that reads Vulture.
- **Never invent fan discourse.** Clowning beats describe the discourse in our words and cite real coverage OF it (EW/Billboard/Time/Vulture/Rolling Stone all covered fan-theory waves; those articles are the receipts). No fabricated quotes, no screenshots of individual fans; a named fan's theory may appear only via reporting about it. Deuxmoi-sourced claims keep their mandated low-confidence labels (decisions 2026-07-09). **Camps are held to the same bar per-camp** (Codex round 1): each camp cites the coverage showing that position actually existed in the fandom — a camp nobody held is fabricated discourse with buttons. The fandom-"we" appears only where the cited coverage supports a broad fandom moment, never as filler.
- **Honesty IS the aesthetic.** Confidence/outcome badges stay on every record in every surface. `clowning` confidence renders as the affectionate badge it is. The reveal recolor stays the one big theatrical moment; everything else stays quiet, era-tokened (no hard-coded hex — theme vars per experience doc §6).
- Verbatim text ≤ snippet policy; lyric lines short + cited; media IDs oEmbed-verified before commit (experience doc §5.5).

## 9. Phasing — five PRs, each independently shippable

| Phase | Branch | Scope | Visible change |
|---|---|---|---|
| **P1** | `feature/egg-case-corpus` | Schema (§4.1), migration + committed mapping (§4.2), derived machinery + guards + selectors (§4.3), sync script + Supabase migration. **Legacy arrays and both THREAD UIs stay untouched** — instead of adapter shims, P1 ships a parity test: every legacy item (42+30+23+8, asserted by the generated inventory) resolves through the mapping to a corpus record whose dates/claims/sources match. **P1's one declared-visible change (Codex round 2 — P1 is not fully "dark"): `TheoryGuide` immediately renders migrated records**, because they are theory rows and it renders `theoriesForEra()` unfiltered — this is intended (the era guides get the deduped, re-verified eggs early) but must be stated, reviewed as a content change, and `TheoryGuide` needs minimal support for the new `tradition` kind label in this PR. Copy this spec into `docs/specs/`; add the decisions entry (§12). **Deploy-order note:** the Supabase `theory` migration + reseed must land before the next deploy's prebuild sync runs against the live table, or new fields silently drop (same rollout pattern as WS2's `threadIds`); the sync gains a parity check (fallback seeds vs live rows) so this fails loudly, not silently. | Threads unchanged; era TheoryGuides gain the migrated records (declared) |
| **P2** | `feature/mastermind-thread` | Mastermind board + case detail + clown card (§5) reading the corpus; the `openCase` store deep-link primitive (mirrors `clueWebTrail`); `ll-cases-v1` created **with the one-time v1 import in its create path** (§4.4 — the import must ship with the key's first writer); delete `CLUE_PAIRS` + `DecodeMotifId`; THREADS meta copy for this lens (post Joey sign-off) | The Decode becomes Mastermind |
| **P3** | `feature/invisible-strings-thread` | ClueWeb re-aim (§6) reading the corpus; delete `EGG_NODES`/`EGG_LINKS`/`MOTIF_MEMBERSHIP`; trails/seenBeats consumed (import already shipped in P2); **search re-pointed in the same PR** (search.ts indexes eggs today — deleting EGG_NODES without re-pointing search silently breaks it) | The Clue Web becomes Invisible Strings |
| **P4** | `feature/egg-weaving` | The weave-infra PR (Codex round 1): `related.ts` gains `case:` resolution; MomentDetail exhibits block; era pivot strip (`CROSSING_THREADS`); TheoryGuide "full case file" links; cross-thread echo chips; glossary entries; scroll-restoration tests for the new jump paths (`clearEraScroll` contract, experience doc §5.6) | Eras and both threads interlink |
| **P5** | `content/case-corpus-fill` (may be several small PRs, can start in parallel once P1 merges) | Clowning beats for every marquee case (§9.1); Open Board authoring (5–8 cases, **current status verified at authoring time** — anything already resolved ships as a solved case instead, which conveniently demos the model); ≥5 deep cuts; TLOAS-era coverage | The corpus feels alive |

Per-phase Definition of Done = CLAUDE.md: spec'd (this ticket), tests updated (unit for selectors/guards/sync + keep `decode.test.ts` lineage), Codex review clean, mobile AND desktop verified, docs updated in the same PR (`docs/longlive-experience.md` §3/§5/§7/§8 recipes change materially in P1/P2/P3 — the "add a clue pair"/"add an egg" recipes become "author a case").

### 9.1 Marquee cases that must have clowning beats by end of P5

Bejeweled→Speak Now TV · Google vault puzzles · the Karma album (eternal) · the snake era · TLOAS orange seeding · "Not a lot going on at the moment" (both uses) · 4.26 countdown · the scarf/All Too Well 10-minute arc (add if not yet a case — it's the fandom's Ark of the Covenant) · 1989 TV blue signals · the liner-note cipher tradition · 13 tradition. (Author against sources; drop any that can't be grounded — and say so in the PR.)

## 10. Relationship to open tickets

- **#431 (Clue Web refinement)** — **superseded in direction by this ticket**; its handoff doc (`docs/v0-handoffs/clue-web-thread-handoff.md`, on branch `content/thread-clue-web` — NOT on main) remains valuable reference: the time-axis constellation, mobile time-stream, "show a great example" onboarding, and first-decode celebration are adopted here (§6, §5.5); the AI-symbolic-imagery question is decided (§6, "no"). Recommend closing #431 with a pointer here once this ticket is accepted.
- **#436 (weaving)** — §7 is this corpus's slice of it; coordinate, don't duplicate (§7 note).
- **#433 (ordering convention)** — §5.2/§6.2 codify the rule: lists newest-first, in-story beats oldest-first, documented where implemented.
- **#435 (Threads back/swipe bug)** — not addressed here; whoever builds P2–P4 must not regress whatever fix lands, and new deep-links (case detail) must participate in the same back-dismiss behavior.
- CIE (`cie:*` issues) — migration re-verification (§4.2.6) should close any CIE ticket it incidentally fixes, per #429's workflow rule.
- **Pre-existing repo damage found during this debate** (Codex round 1): `docs/decisions.md` on `origin/main` contains stray merge-conflict markers (`=======` at :89, `>>>>>>> origin/main` at :140) trapping the 2026-07-10 threads-derivation entry inside a marker block. A standalone fix PR resolves the markers (keeping ALL entries, per the never-discard-on-conflict rule) **before** P1 appends this initiative's decision entry to that file.

## 11. Joey sign-offs (product) — **RESOLVED 2026-07-10: Joey approved all defaults**

1. **Names** — a true A-or-B, with the two AIs split (surfaced per the disagreement rule): **(A) Claude recommends** Mastermind + Invisible Strings — her own vocabulary, instantly resonant for the superfan-clown target user, literal kicker lines carrying the explanation ("She plants. We clown." / "Every symbol she's ever repeated, mapped"). **(B) Codex recommends** literal-first names — Case Files + Symbol Atlas — arguing casual fans won't infer the song references. Claude's rebuttal: this product's stated audience IS the deep-lore fan, and every gallery card already pairs title+kicker+what so nobody navigates on title alone. **→ Joey picked A (2026-07-10): Mastermind + Invisible Strings ship.**
2. **Clown-card copy register** (§5.5, §8) — **→ APPROVED as designed (2026-07-10)**: ships as the personal, shareable, local-only prediction notebook; P2 still shows Joey one screenshot's worth of copy as a courtesy check, not a gate.
3. **Open Board launch list** (P5) — **→ APPROVED approach (2026-07-10)**: finalize the 5–8 cases at P5 authoring time from the §9.1 candidates, status-verified against sources.
4. Confirmation of the **no-AI-symbolic-art** call (§6) since #431 framed it as his decision. **→ CONFIRMED (2026-07-10): no AI-generated symbolic art.**

## 12. Decisions entry to add in P1 (draft)

> **2026-07-10 — One easter-egg corpus, two threads, derived everywhere.** All easter-egg/theory content lives in the theories seed family as "case" records (beats + motifs + camps). CLUE_PAIRS/EGG_NODES/EGG_LINKS/MOTIF_MEMBERSHIP and the DecodeMotifId taxonomy are retired; trails, constellations, boards, era exhibits, and TheoryGuide all derive from the one corpus. Why: three parallel systems described the same eggs with no shared identity (pre-release reviewer feedback: "neither thread makes complete sense"); authoring once and deriving everywhere is the same principle as WS2 (PR #249). Approved: Joey (product direction, 2026-07-10); implementation Wyatt.

## 13. Acceptance criteria — how the ticket author (Claude, Joey's session) will verify

**The ripple test (the core promise):** author ONE new case record in a seed file — kind `theory`, outcome `pending`, two motifs, one plant beat with a `moment:` relatedId to an existing era moment, one clowning beat, camps — run the sync, and with **zero further authoring** verify it appears: (a) on Mastermind's Open Board with working camp-pick persisted across reload; (b) in BOTH motif trails including "Where it strikes next"; (c) as a constellation node with strings; (d) in its plant era's TheoryGuide with badges; (e) as an exhibit link on that era moment's MomentDetail, both directions; (f) in search. Then flip it to `confirmed` + payoff beat and verify: it moves to Case Files, the reveal recolors to the payoff era, gap stat correct, and a stored pick renders "called it / humbled" appropriately.

Plus:

1. The migration inventory is **generated and asserted** (not hand-counted) against `origin/main` — every legacy item (believed: 42 pairs / 30 nodes / 23 links / 8 hiddenClues / 27 theories) accounted for in the committed map with zero silent content loss; §2.3's duplicate rows each resolve to one case; every migrated case's `confidence`+`outcome` set editorially per §4.2.8 (auditable in the map — no mechanical upgrades from boolean `confirmed`).
2. Legacy structures gone from `types.ts`/`lenses.ts` **by end of P3** (deleted with their consuming UI, never earlier); no UI imports them; `MOTIF_MEMBERSHIP`-style guards replaced by the §4.3 guards; search re-pointed from eggs to cases in the same PR that deletes `EGG_NODES`; typecheck + full suite green.
3. `ll-progress-v1` is never written by new code (rollback-safe both directions); `ll-cases-v1` imports trails verbatim + legacy egg ids at **beat level** via the mapping; picks store `outcomeAtPick`; "since your last visit" derives from `lastSeenOutcome`; nothing gamified beyond the clown card.
4. Open Board ships ≥5 open cases, each status-verified at authoring time with sources; every marquee case (§9.1) has ≥1 cited clowning beat; **every camp carries its own citation** showing that position existed in the fandom.
5. Weave live in both directions (§7.1–7.4) for at least the marquee set; no dead links (related.ts resilience preserved); `'hidden-clues'` participates in pivots/crossings.
6. Ordering rule implemented + documented; back/swipe behavior not regressed; both threads work mobile + desktop; era theming via tokens only; the fan-project disclaimer renders on both threads.
7. Docs current in the same PRs (experience doc recipes, decisions entry, spec copied into repo); Codex review clean per phase.
8. Copy register matches §8 — reviewer should spot-read 5 cases and find zero invented fan quotes, zero unverified claims presented as fact, zero cringe.

## 14. Alternatives considered and rejected

- **A. Merge both threads into one mega-thread.** Rejected: case-reading
  (story-time) and symbol-reading (motif-space) are genuinely different modes;
  one surface would need internal mode switching — same complexity, worse
  legibility — and we'd lose a gallery door. Two doors into one corpus keeps
  both of the mechanics Joey explicitly liked (tap-to-reveal; home→trail→map).
- **B. Keep both threads as-is; just rename + cross-link.** Rejected: doesn't
  add the missing fan/clowning layer (the intent gap reviewers hit), and
  cross-links on top of three divergent datasets multiply maintenance instead
  of fixing the triple-authoring problem (§2.3).
- **C. New dedicated `cases` seed family/table instead of extending theories.**
  Rejected: recreates the duplication problem at the data layer (Karma would
  exist as a theory record AND a case record), needs a new table + sync +
  Karen/CIE coverage, and TheoryGuide would still render the old records — two
  sources of truth for the same fact again.
- **D. Hand-authored unified dataset in `lenses.ts` (no pipeline change).**
  Rejected: contradicts the locked 2026-07-10 threads-architecture decision
  (derive content, stop hand-maintaining lenses arrays), loses CIE
  scannability, and keeps ~1,600 lines of data in the view layer.
- **E. Real UGC clowning (user-submitted theories, reactions).** Rejected —
  scope wall already set in #431: backend + moderation minefield. Curated
  camps + local-only picks deliver the *feeling* of participation without the
  liability. Revisit only as a deliberate future product bet.

## 15. Open questions

1.–4. **Resolved 2026-07-10** — Joey approved all four §11 defaults (names: Mastermind + Invisible Strings; clown card as designed; open-board list at P5 authoring; no AI art).
2. Case detail: expand-in-place vs. overlay — engineer's call at P2, both
   compatible with deep-linking via the store.

## 16. Non-goals / guardrails

- **No backend, no UGC, no cross-user anything** (comments, submitted theories, shared leaderboards) — same scope wall #431 set. The clown card is local-only.
- **No runtime LLM calls, no per-user compute** — the corpus is static, synced at build time (cost discipline).
- **No lens-id changes**, no URL/store migrations beyond the progress v2 bump.
- **No full lyrics, ever** (2026-07-09 decision); snippets + cites only.
- **No new scrubber variants** — both threads stay in `NO_SCRUBBER_THREADS` (PatternRail serves Mastermind; the constellation is its own axis).
- Era mode untouched except MomentDetail's exhibits block and the pivot-strip addition.
- Don't fabricate current-events status: every open case's status is verified against sources at authoring time, and the corpus must degrade gracefully as reality moves (that's what outcome flips are for).

## 17. Appendix — design-debate record (per the design-debate protocol)

**Round 1** (Codex adversarial task `task-mrfdnlga-h17w1f`, session `019f4dad-cf0f-7f73-8358-666d4d2d5013`, 2026-07-10). 14 findings; would-block: schema substrate, P1 adapters, progress migration. Dispositions:

| # | Finding (abridged) | Disposition |
|---|---|---|
| 1 | `theory` not additive-safe: THEORY_KINDS const, DB check constraint, fixed insert/select column lists | **Accepted** → §4.1 "full schema-change scope" + P1 parity check. Separate-dataset alternative still rejected (§14.C — it recreates the duplication this kills) |
| 2 | P1 "adapters render unchanged" not credible (dedupe breaks 1:1 render) | **Accepted** — independently fixed pre-review: P1 lands the corpus dark + parity test; UIs cut over in P2/P3; adapters removed from the plan (§9) |
| 3 | Progress v1 rewrite corrupts state on rollback; merged nodes over-credit | **Accepted** → §4.4 rewritten: new `ll-cases-v1` key, v1 never written, one-time read-only beat-level import |
| 4 | Inventory miscount (24 vs 23 EGG_LINKS) | **Accepted** (verified: 23) → inventory generated + asserted, not hand-counted (§4.2) |
| 5 | Boolean `confirmed` laundering into confidence/outcome | **Accepted** → §4.2.8 editorial per-case mapping, auditable |
| 6 | Per-era file ownership breaks cross-era cases under per-era reseed | **Accepted as guards** (§4.2.9: plant-era ownership rule + global slug uniqueness + dev guard); separate case-owned dataset still rejected (§14.C) |
| 7 | Case-level constellation nodes lose plant/payoff geometry + multi-motif lanes | **Accepted** → §4.3: beat-level nodes, intra-case arcs, collision test; motif filter ≠ lane |
| 8 | "Since your last visit" not derivable from ids alone | **Accepted** → §4.4: `outcomeAtPick` + `lastSeenOutcome` |
| 9 | Weave/search under-scoped; nav primitives missing | **Accepted** → P2 gains `openCase` store primitive; P3 gains the search re-point; P4 re-scoped as the weave-infra PR (§9) |
| 10 | Four orderings will drift without named selectors | **Accepted** → §4.3 named, tested selectors |
| 11 | Clown card = private toggle, risks fake-communal feel | **Accepted as framing** (§5.5: personal prediction notebook register + ShareSheet share loop); **rebutted as cut**: participation-feel is the brief's third verb; local+share is the honest no-backend v1 |
| 12 | Song-allusion names are insider-first | **Surfaced to Joey as a true A/B** (§11.1) — Claude keeps its recommendation, Codex's literal-first alternative recorded |
| 13 | Camps/voice policy risk (fabricated discourse, unsupported "we") | **Accepted** → §8 per-camp citations + reserved "we" |
| 14 | `docs/decisions.md` on origin/main contains stray conflict markers | **Accepted, out-of-scope damage** → standalone fix PR before P1 touches that file (§10) |

**Round 2** (fresh Codex task `task-mrfiv5u8-mbq303`, session `019f4e33-55eb-7e10-99c1-6dc1884e9908` — the resume-path job wedged in the queue and was cancelled; a fresh task with the appendix as context ran instead). Verdict on round 1: findings 1–3 and 5–10 RESOLVED; finding 4 partially (a stale `42+30+24+8` in §9's P1 row — now fixed to the generated-inventory reference). Four NEW blockers, all accepted and folded in:

| # | Round-2 finding | Disposition |
|---|---|---|
| B1 | P1 isn't dark: migrated records are theory rows, so `TheoryGuide` renders them immediately (and would hit the unknown `tradition` kind) | **Accepted** → §9 P1 row: TheoryGuide exposure is the one *declared-visible* change of P1, reviewed as a content change, with minimal `tradition`-kind label support in the same PR |
| B2 | Import sequencing: if P2 creates `ll-cases-v1` bare and P3 adds the import, P2-era users skip their legacy state forever | **Accepted** → §4.4/§9: the one-time v1 import ships inside the key's create path in P2 |
| B3 | `CaseBeat` had no stable id — seenBeats, the oldEggId mapping, and constellation keys were fragile | **Accepted** → §4.1: required `CaseBeat.id`, unique per case (`${caseId}#${beatId}` global key), dev-guarded |
| B4 | `echoes` were case→case but legacy `EGG_LINKS` are node→node — beat-level map couldn't preserve endpoints | **Accepted** → §4.1/§4.2.2: optional `fromBeatId`/`toBeatId` anchors; migration resolves legacy endpoints through the mapping |

Per the design-debate protocol, the debate stops after two rounds; the round-2 patches above are mechanical spec responses, not new design.

## Verdict

**We will build the unified case-file corpus, rendered as two threads.** All easter-egg content — the 42 Decode clue pairs, the 30 Clue Web nodes and their 23 links, the 27 era theories, and the 8 orphaned hidden-clue strings — migrates into ONE extended theories corpus (cases with beat spines: plant → clowning → payoff, motif memberships, camps for open cases), and the two threads become two reads of that single source: **Mastermind** (`hidden-clues`) is the case-file board — solved cases to reminisce over with the kept tap-to-reveal mechanic, an Open Board of live cases with local-only camp picks, and sourced fan-discourse beats supplying the missing middle of every story — and **Invisible Strings** (`easter-eggs`) is the symbol atlas — the kept home→trail→constellation structure re-aimed at the corpus, every trail ending at that symbol's open cases. Both weave bidirectionally into the era timeline (exhibits on moments, cases in pivot strips, TheoryGuide links), delivered in five PRs per §9.

It won the debate because the alternatives each fail a requirement this satisfies: keeping two hand-authored datasets (or adding a third) preserves the triple-authoring drift that produced the reviewer feedback; a single merged mega-thread erases the two genuinely different reading modes (story-time vs. symbol-space) Joey already validated; UGC participation is a moderation/backend product this company has explicitly walled off; and hand-authoring in `lenses.ts` contradicts the already-locked derive-from-seeds architecture decision. Codex attacked the design across two rounds (18 findings total); every finding was accepted into the spec or explicitly rebutted in the appendix, and the two surviving disagreements — thread naming (song-allusion vs. literal) and clown-card keep-vs-cut — are surfaced to Joey in §11 rather than settled, per the disagreement rule. Joey confirmed all four §11 sign-offs on 2026-07-10 (the song names ship; the clown card ships as the personal, shareable, local-only notebook; the open-board list is finalized at P5 authoring; no AI-symbolic art). Remaining assumption: PR #443 (decisions.md conflict-marker fix) merges before P1 appends to that file.

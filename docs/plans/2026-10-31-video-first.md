# Video-first feed (2027 direction): plan

**Status:** proposed 2026-10-31. Owner decisions Q1-Q4 are open (see §5). Owner ask: "the balance between posts and videos is off… 2027 is all about non-AI video."

**Inputs:**
- Fact pack (researcher, measured live): 22 of 389 items on the current era's feed are video.
- Architect (Fable) consult, logged in STATE.md.
- PM spot-checks: `era-feed.ts:209-215` sorts by recency only. `filters.ts:102-110`: live items match no chip. `current-types.ts`: no video field. The feed is merged in TWO places, `packages/ui/src/reader/era/EraSection.tsx:111` (web) and `packages/experience/src/era-stream.ts:79` (mobile DOM shim); the architect said one.

## 1. Why the feed is image-heavy (ranked)
1. **Ranking ignores media.** Pure recency, so 2-9 live news items a day dated "today" bury a video released months ago.
2. **The only automated lane can't hold video.** `current_item` has `imageUrl` but no embed. The worker already polls the official YouTube RSS (`apps/worker/src/sources/registry.ts:20-23`) and then turns each video into a thumbnail (`image-resolve.ts:163-172`).
3. **The quality gate measures length, not trust or topic** (`packages/shared/src/current-item-quality.ts`). Unverified sightings and gossip pass: 207 of 237 live items are "unverified".
4. **Video discovery only files tickets.** appearance-discovery opens intake issues. Content Shift adds at most 2 videos a run and allows fewer kinds than the schema does (`content-shift.md:176-182` vs `schema.ts:381-393`).

## 2. Target design (architect's call, adopted)
- **Data:** add one nullable `embed` JSONB column plus a `media_kind` column to `current_item`. There is NO unified feed-item table, and video_work rows are NOT created automatically. Automated video goes in the live lane; curated video stays in `supabase/seed/videos/`.
- **Ingest (worker, keyless):** RSS from a hand-committed channel registry, keyed on channel id (`UC…`), never title.
  - YouTube oEmbed 200 with a matching `author_url` is the proof that it plays.
  - Dedupe on videoId against live rows and `videos.generated.ts`.
  - Tag `Videos` at write time.
  - Official and established channels auto-publish. Fan uploads never auto-publish.
  - A "Taylor on screen" pre-filter can only HOLD a row, never publish it.
- **Feed composition (one function, both platforms):**
  - Within a 7-day window, video ranks above image+text, then date, then significance.
  - At most N=3 image+text live items per day surface in the main stream; the rest stay reachable.
  - It is a presentation cap; nothing is deleted.
- **Quality bar:** verified embed, from a registry channel, official or established tier, Taylor as the subject, inside the current era, not a duplicate of a curated record. Reuse `VideoPoster`, click-to-mount nocookie, and `use-stop-when-hidden.ts`.

## 3. Phases, owners and routing
Routing rule (owner, 2026-10-31): quality first, local compute second.
- **Quen** (local Qwen3.6-35B via the Quen session) implements mechanical slices from a precise brief, in a `~/.codex/worktrees` worktree.
- **Claude** owns:
  - specs and test-first fixtures;
  - schema and migrations;
  - trust and security calls (channel registry, oEmbed fetch);
  - the review of every Quen diff, including CI-equivalent commands (`npm run lint`, package typechecks, vitest);
  - browser verification of every UI slice.
- **`lc ask`** (one-shot local) handles bulk read and summarize work: the channel list audit and fixture drafting.

| # | Slice (one PR each) | Builds it | Claude's part | Accept |
|---|---|---|---|---|
| 0 | `check:media-mix` script: video share per era, current_item included | Quen | review | Prints today's baseline (expect about 6% video on tloas) |
| 1 | Ranker: one shared merge (fold EraSection.tsx into `era-stream.ts`), 7-day media-aware interleave, N=3/day text quota | Quen | writes golden fixtures FIRST (1 video + 9 same-week live items → video first; quota holds); browser check on web and mobile shim | Fixtures green; `/` shows video near the top |
| 2 | Live-lane tier floor: `sighting`/`business` from `unverified` held as `tier_below_floor` | Quen | sets the floor table | Unverified-sighting share on `/` drops; held rows still enrich |
| 3 | Schema: `current_item.embed` + `media_kind` migration, types, mappers, `lib/current.ts` | **Claude** (migration and types); Quen (mapper and test boilerplate) | owns it | Typecheck green; round-trip test; old rows unaffected |
| 4 | Worker: YouTube RSS → `embed` (oEmbed verify, channel-id match), thumbnail kept as poster, `Videos` tag | Quen | specs the fetch and timeouts; security review | A fixture RSS entry gives a row with embed and poster; a bad channel is rejected |
| 5 | Render: `CurrentItemCard`/`CurrentItemDetail` play embeds (reuse VideoPoster plus the gate) | Quen | browser check: every state and viewport; click-to-mount; stops when hidden | Owner-visible video cards in Live now |
| 6 | Registry expansion: the 28 appearance-discovery channels become worker sources with tiers; discover.mjs skips anything already published | Quen (move and dedupe); `lc` audits the channel ids | **Claude signs off the tier list** (it is the trust list) | No videoId appears twice across live and curated |
| 7 | `content-shift.md`: allow the interview/speech/press kinds the schema already has (if Q3 is yes) | **Claude** | owns it | The doc matches the schema |

**Order and parallelism.** Quen takes at most 4 parts at once.
- Wave A (parallel, disjoint files): 0, 1, 2.
- Wave B: 3, then 4.
- Wave C (parallel): 5, 6.
- Then 7.
- Each slice is a separate PR with auto-merge; at most 2 review rounds; a failure goes to DEBUG.md and the debug ladder.

**Decision record.** The schema change (slice 3) is a data-model call, so `docs/decisions.md` gets an entry before slice 3 starts.

## 4. Success signal
`check:media-mix` on tloas goes from about 6% to at least 30% video within 2 weeks of slice 6. The architect's early warning: if, after slices 1+4, there is still less than about 1 new video per 3 days, supply (not ranking) is the bottleneck. Revisit Q4 then.

## 5. Owner decisions (recommendations in bold)
- **Q1.** Image+text news: **demote** (daily cap plus trust floor) or hide? Hiding loses the "recent news" half of the vision.
- **Q2.** Auto-publish talk-show and awards-channel videos without a human? **Yes**: the hand-committed channel list is the approval. Risk: an off-topic clip where she's only mentioned.
- **Q3.** Let Content Shift add interview, speech and press videos (the schema already allows them)? **Yes.**
- **Q4.** Auto-ingest fan-shot concert footage? **Not yet.** It's where the volume is, but "real, non-AI" can't be verified without a key. Revisit if the success signal misses.

## 6. Not doing
- No YouTube Data API key.
- No re-hosting.
- No auto-created video_work rows.
- No read-time tag inference.
- No second sort function.
- No deleting demoted rows.
- No publish decision made by a local model.

# PLAN.md — Era reader rework: bottom nav, one global filter, timeline doorways

Source of truth for this work: Joey's consolidated team feedback (2026-08-13,
this session) on the "Time Machine Mockups" artifact, plus his four inline
rulings recorded in § Rulings below. Where this plan and the artifact disagree,
the rulings win.

## Goal

After this lands, an era reads as one continuous chronological timeline with a
single persistent filter, and every non-timeline surface has either moved into
that timeline or moved out of the era body entirely. Specifically: mobile
navigation lives in a bottom tab bar (freeing the top bar to be a context
label), the era masthead survives but collapses into the shipped compact era
nav bar on scroll, the Spotify player is gone and Track guide takes its slot
and its styling, Theories & eggs and Videos stop being era-body sections and
become doorway cards scattered through the timeline at chronologically
sensible positions, and one sticky six-chip filter governs every era at once
instead of a fresh filter per era.

## Rulings (Joey, 2026-08-13 — do not re-litigate, do not re-ask)

- **R1 — Map line: one rotating gloss line.** Not a list of all sections. One
  section glossed at a time, deterministic daily rotation (same mechanism as
  the shipped era-secret-of-the-day), tappable, goes where its tab goes.
  Scales to any section count because it never gets longer.
- **R2 — Filters: the five topic tags plus Videos. Six, and only six.**
  Videos must be present. **The "Threads filter" idea is scrapped** — this
  reverses the line in Joey's brief that asked for one. Instead, *every* item
  that appears in a timeline (moment, video, thread doorway, egg doorway)
  is categorised under one or more of the six.
- **R3 — Clownbot keeps its tab.** Bottom nav is 4 tabs today (Eras, Threads,
  Mood, Clownbot) and 6 at full growth (+ Marketplace, + Community). See
  § Known risks — six labelled tabs do not fit 390px; the bar must degrade to
  icon-only rather than break.
- **R4 — Egg/theory doorways open that single egg's detail.** And every egg
  detail must point back, obviously, to the thread it belongs to and make it
  plain that a whole section is dedicated to theories and eggs.

## Out of scope

- Marketplace and Community themselves. This plan only sizes the nav for them.
- Mood scoring, Clownbot scope, search, the share sheet, the landing page's
  hero-photo selection rules, and any content authoring beyond tag backfill.
- Converting the app to real URL routes. The reader stays one client page with
  context state; back-to-position is built on the existing snapshot pattern,
  not on history rewriting. (Decision + rationale in `docs/decisions.md`.)
- `TimelineScrubber` behaviour, beyond keeping its anchors valid.
- Desktop layout beyond what the rulings imply — desktop keeps pills in the
  top rail, gains no bottom bar, and inherits every other change.

## Phasing — five PRs, in this order

Order is load-bearing: P1 changes filter plumbing that P3 consumes; P2 removes
the videos rail whose data P3 re-uses. Do not reorder.

| Phase | PR | Lands |
|---|---|---|
| P0 | — | `docs/decisions.md` entry (no code) |
| P1 | 1 | Global sticky six-chip filter + coverage checker |
| P2 | 2 | Era body surgery: player out, Track guide in, sections out |
| P3 | 3 | Timeline doorways + anchor dating + back-to-position |
| P4 | 4 | Mobile bottom nav, top-bar context label, feedback button |
| P5 | 5 | Masthead rotating gloss line + tagline copy update |

## Files touched

| Path | New/Edit | What changes |
|------|----------|--------------|
| `docs/decisions.md` | Edit | P0 entry: five decisions below |
| `apps/web/lib/longlive/filters.ts` | **New** | `FilterId`, `ALL_FILTERS`, `filterMatches()` — pure, tested |
| `apps/web/lib/longlive/filters.test.ts` | **New** | Unit tests for the above |
| `apps/web/lib/longlive/store.tsx` | Edit | `filters` state + `toggleFilter`/`clearFilters`; `returnPoint` stack |
| `apps/web/components/longlive/FilterBar.tsx` | **New** | The one sticky filter row, rendered once |
| `apps/web/components/longlive/EraSection.tsx` | Edit | Remove local filter state, `EraMedia`, guide pills, `EraVideos`; render doorways |
| `apps/web/components/longlive/EraStream.tsx` | Edit | Mount `FilterBar`; preserve era+offset across filter change |
| `apps/web/components/longlive/EraMedia.tsx` | **Delete** | Spotify player removed (sole consumer was EraSection) |
| `apps/web/components/longlive/EraVideos.tsx` | **Delete** | Era-bottom videos rail removed (sole consumer was EraSection) |
| `apps/web/components/longlive/TrackGuide.tsx` | Edit | Gains inline per-track video playback |
| `apps/web/components/longlive/TrackGuideBar.tsx` | **New** | Full-width entry bar in the old player slot |
| `apps/web/components/longlive/TheoryGuide.tsx` | Edit | Reachable from egg doorways; gains the "back to thread" affordance (R4) |
| `apps/web/lib/longlive/era-feed.ts` | Edit | Feed entry union gains `thread`/`egg`; `sortDate`/`displayDate` |
| `apps/web/lib/longlive/era-feed.test.ts` | Edit | Cover the new kinds and anchoring |
| `apps/web/lib/longlive/anchor-date.ts` | **New** | Anchor resolution for undated items — pure, tested |
| `apps/web/lib/longlive/anchor-date.test.ts` | **New** | Unit tests for the above |
| `apps/web/components/longlive/DoorwayCard.tsx` | **New** | The doorway card shape (thread + egg variants) |
| `apps/web/components/longlive/BottomNav.tsx` | **New** | Mobile tab bar, safe-area aware |
| `apps/web/components/longlive/TopBar.tsx` | Edit | Mobile: pills out, context label in (`Era: TLOSG` / `Thread: End Game`) |
| `apps/web/components/longlive/FeedbackButton.tsx` | Edit | Sits above bottom nav; X dismiss persisted for the session |
| `apps/web/components/longlive/LandingMasthead.tsx` | **New** | Rotating gloss line + updated tagline (P5) |
| `apps/web/lib/longlive/gloss-rotation.ts` | **New** | Deterministic daily section-gloss pick — pure, tested |
| `apps/web/lib/longlive/gloss-rotation.test.ts` | **New** | Unit tests for the above |
| `scripts/check-filter-coverage.mjs` | **New** | Asserts every timeline item carries ≥1 filter |
| `scripts/check-filter-coverage.test.ts` | **New** | Unit tests for the checker |
| `package.json` | Edit | `check:filter-coverage` script |
| `.github/workflows/ci.yml` | Edit | Run `check:filter-coverage` in `build` |
| `docs/longlive-experience.md` | Edit | Rewrite the era-body and nav sections to match |

## Interfaces / contracts

The executor copies these verbatim. It does not redesign them.

```ts
// apps/web/lib/longlive/filters.ts
import type { ContentTag } from './tags';

/** R2: exactly six, forever. Videos is a peer chip, not a separate axis. */
export type FilterId = ContentTag | 'Videos';

export const ALL_FILTERS: readonly FilterId[] = [
  'Music', 'Fashion', 'Tour', 'Relationship', 'Lore', 'Videos',
] as const;

/**
 * Empty active set means "show everything".
 * A non-empty set is OR-matched against the entry's own filter ids.
 * An entry with zero filter ids can therefore never match an active
 * filter — which is exactly why check:filter-coverage exists.
 */
export function filterMatches(
  entryFilters: readonly FilterId[],
  active: ReadonlySet<FilterId>,
): boolean;

/**
 * The six ids an entry belongs to, whatever kind of entry it is.
 *
 * AMENDED 2026-08-13 (see § Plan amendments). The first version took only the
 * entry and returned `item.tags` for moments and `['Videos']` for videos. That
 * silently dropped two rules the pre-change selection code enforced, and both
 * are restorations, not new behaviour:
 *
 *  1. A moment that OWNS its inline video is watchable, so it belongs under
 *     Videos as well as its own topics. The old `videosOnly` branch selected
 *     exactly these via `inlineVideoMomentIds`. Ownership is a property of the
 *     list on screen, not of the era — hence the ctx argument.
 *  2. A dated music video is Music. The old code said so directly:
 *     `if (tags.size === 0 || tags.has('Music')) return timelineVideos`.
 *     The topic was encoded in the selection rule rather than on the record.
 */
export function filtersForEntry(
  entry: EraFeedEntry,
  ctx: { inlineVideoOwnerIds: ReadonlySet<string> },
): readonly FilterId[];
// moment → ownerIds.has(id) ? [...item.tags, 'Videos'] : item.tags
// video  → music-video kind ? ['Music', 'Videos'] : ['Videos']
//          (do NOT invent other topics for appearance-family videos)
```

```ts
// apps/web/lib/longlive/anchor-date.ts

/** How a sort position was arrived at. Drives whether a date may be SHOWN. */
export type AnchorSource =
  | 'exact'          // the item has a real, authored date
  | 'related-item'   // borrowed from a moment it references
  | 'related-song'   // borrowed from a song/album release date
  | 'era-midpoint';  // last resort: the middle of the era's span

export type Anchored = {
  /** Always present. Sorting only. NEVER rendered as fact. */
  sortDate: string;            // YYYY-MM-DD
  /** Present only when `via === 'exact'`. Null means render no date. */
  displayDate: string | null;
  via: AnchorSource;
};

export function resolveAnchor(input: {
  exactDate?: string | null;
  relatedItemDate?: string | null;
  relatedSongDate?: string | null;
  eraStart: string;
  eraEnd: string | null;
  /** Stable tiebreak so equal anchors order deterministically. */
  id: string;
}): Anchored;
```

**The honesty rule, non-negotiable:** `displayDate` is null unless
`via === 'exact'`. A synthetic anchor positions a card and is never printed as
a date. This matches the shipped precedent — `undatedAnchorDate()` already
feeds the scrubber an invisible anchor while the card renders a literal
"Date unknown".

```ts
// apps/web/lib/longlive/era-feed.ts — the widened union
export type EraFeedEntry =
  | { kind: 'moment'; item: ContentItem;      anchor: Anchored; filters: readonly FilterId[] }
  | { kind: 'video';  video: VideoNote;       anchor: Anchored; filters: readonly FilterId[] }
  | { kind: 'thread'; doorway: ThreadDoorway; anchor: Anchored; filters: readonly FilterId[] }
  | { kind: 'egg';    doorway: EggDoorway;    anchor: Anchored; filters: readonly FilterId[] };

export type ThreadDoorway = {
  threadId: LensId;
  kicker: string;      // "THREADS — one storyline at a time, across every era"
  title: string;
  example: string;     // a real, sourced line from the thread
};

export type EggDoorway = {
  eggId: string;
  threadId: LensId | null;  // R4: what it belongs to, for the way back
  kicker: string;           // "EGGS — the secrets she plants"
  title: string;
};

/** Newest-first by anchor.sortDate, stable-tiebroken by id. */
export function mergeEraFeed(entries: readonly EraFeedEntry[]): EraFeedEntry[];

/** No two doorways within DOORWAY_MIN_GAP cards of each other. */
export const DOORWAY_MIN_GAP = 4;
export function spaceDoorways(feed: readonly EraFeedEntry[]): EraFeedEntry[];
```

```ts
// apps/web/lib/longlive/store.tsx — additions only
type ReturnPoint = {
  mode: Mode;
  eraId: string;
  itemId: string | null;
  scrollY: number;
};

// state
filters: ReadonlySet<FilterId>;   // starts empty = everything
// actions
toggleFilter(id: FilterId): void;
clearFilters(): void;
pushReturnPoint(p: ReturnPoint): void;
popReturnPoint(): ReturnPoint | null;
```

## Plan amendments

Logged when the plan turned out wrong, per CLAUDE.md § Planning ("if it turns
out wrong, stop, rewrite it, log why, continue").

**2026-08-13 — `filtersForEntry` was under-specified, and anchor dating moves
into P1.** Found while reviewing the P1 step 4–5 diff; the executor flagged
half of it and refused to patch around the contract, which was right.

- The original contract lost two shipped selection rules (see the amended
  signature above). Fixed by giving `filtersForEntry` the inline-video owner
  set and teaching it that a dated music video is Music.
- Step 4 folds **every** watchable video into the default timeline — correct
  per Joey ("videos... folded into the era timeline"), but undated video
  records sort to the end, so every era would end in a pile of undated videos
  until P3 landed anchor dating. A PR must be independently correct, not
  merely small. **Steps 12 and 13's anchor work therefore moves into P1 as
  steps 5a/5b**, before this PR opens. P3 keeps only the doorway-specific
  work.

## Steps

### P0 — decisions (orchestrator, no code)

0. [ ] Append a `docs/decisions.md` entry dated 2026-08-13 recording, with
   rationale and who decided: (a) mobile bottom tab bar, **explicitly
   overriding D3 / the prior on-device rejection recorded in
   `docs/specs/2026-08-13-landing-page-brief.md` §3.2** — Joey's call, Wyatt
   to be notified on the PR; (b) the Spotify era player is removed, users go
   to Spotify in their own tab; (c) one global filter replaces per-era
   filters; (d) synthetic anchor dates may position undated cards but may
   never be displayed; (e) Clownbot keeps a top-level tab, so the nav is
   sized for six.
   - Verify: `git diff --stat docs/decisions.md` → one file, entry present.

### P1 — the global filter (PR 1)

1. [ ] Create `filters.ts` + `filters.test.ts` per the contract above.
   (executor)
   - Verify: `npm test -- filters` → all pass.
2. [ ] Lift filter state into `store.tsx` (`filters`, `toggleFilter`,
   `clearFilters`). Do not touch any other store slice. (executor)
   - Verify: `npm run typecheck` → clean.
3. [ ] Build `FilterBar.tsx`: six chips + "All", sticky directly under
   `TopBar`, 44px targets, `aria-pressed` per chip. Mount once in
   `EraStream.tsx`. (executor)
   - Verify: `npm run typecheck && npm run lint` → clean.
4. [ ] Delete the per-era chip row and `activeTags`/`videosOnly` local state
   from `EraSection.tsx`; read from the store instead. (executor)
   - Verify: `grep -n "useState" apps/web/components/longlive/EraSection.tsx`
     → no `activeTags` or `videosOnly` hit.
5. [ ] Preserve position across a filter change: in `EraStream.tsx`, before
   applying a filter change record the active era id and the offset of its
   section top relative to the viewport; restore it in a `useLayoutEffect`
   after the re-render. **The user must stay in the era they were in.**
   (executor)
   - Verify: `npm test` → green; then manual check in step 6.
5a. [ ] **Fix `filtersForEntry` to the amended contract** above: thread the
   inline-video owner set through, and give dated music videos `Music` as well
   as `Videos`. Update `filters.test.ts` with a case per restored rule — a
   footage-owning moment is reachable under `{Videos}`, and a music video is
   reachable under `{Music}`. (executor)
   - Verify: `npm test -- filters era-feed` → green, both new cases present.
5b. [ ] **Pull anchor dating forward** (was steps 12–13): create
   `anchor-date.ts` + tests per the contract, and give every feed entry an
   `anchor` so undated video records sort into the era rather than piling at
   its end. Do NOT widen the union to thread/egg kinds yet — that stays in P3.
   (executor)
   - Verify: `npm test -- anchor-date era-feed` → green, including the case
     asserting `displayDate === null` for every non-`exact` source, and a case
     asserting no undated video lands after the era's last dated card.
6. [ ] Write `scripts/check-filter-coverage.mjs` + its test: fails if any
   moment, video, thread item or egg that can appear in a timeline carries
   zero filter ids, and reports (does not fail on) any of the six filters
   with zero items in a given era. Wire `check:filter-coverage` into
   `package.json` and the `build` job in `ci.yml`. (executor)
   - Verify: `npm run check:filter-coverage` → exits non-zero listing
     untagged items, OR exits 0 if the corpus is already clean.
7. [ ] Backfill tags for every item the checker flags. This is content work —
   assign the most defensible of the six; do not invent facts. (grunt, from
   the checker's output list)
   - Verify: `npm run check:filter-coverage` → exit 0.
7a. [ ] **Videos carry no topic tags.** `VideoNote` has no `tags` field, so
   `filtersForEntry` returns `['Videos']` and nothing else — meaning a music
   video does not match the Music chip. Coverage still holds (every video
   matches Videos), and this is not a regression: today Videos is a separate
   mutually-exclusive axis, so a topic chip never showed videos either. But
   with Videos now a peer chip it reads as a gap. Have the checker REPORT
   videos that carry no topic tag, then decide with Joey whether to author
   topic tags onto `VideoNote` in a follow-up. **Do not auto-assign topics to
   videos by inference in this PR.**
   - Verify: `npm run check:filter-coverage` → reports the count, exits 0.

### P2 — era body surgery (PR 2)

8. [ ] Remove `<EraMedia>` from `EraSection.tsx` and delete `EraMedia.tsx`.
   (grunt)
   - Verify: `grep -rn "EraMedia" apps/web --include=*.tsx --include=*.ts`
     → only the `EraMedia` *type* in `types.ts` remains.
9. [ ] Build `TrackGuideBar.tsx` — full-width bar in the slot `EraMedia`
   vacated, carrying the same visual weight and a play button, opening
   `TrackGuide`. Remove the old three-pill guide row. (executor)
   - Verify: `npm run typecheck && npm run lint` → clean.
10. [ ] Give `TrackGuide.tsx` inline per-track video playback, reusing
    `MomentVideo`. Respect the click-to-load rule — no iframe mounts before a
    click. (executor)
    - Verify: `npm test -- video` → green.
11. [ ] Remove `<EraVideos>` from `EraSection.tsx`, delete `EraVideos.tsx`,
    and confirm the scrubber's end-of-era sentinel still sits after the last
    feed card. (executor)
    - Verify: `npm test -- scrubber` → green.

### P3 — timeline doorways (PR 3)

12. [x] ~~Create `anchor-date.ts` + tests.~~ **Moved to P1 step 5b** — see
    § Plan amendments. Nothing to do here.
13. [ ] Widen `EraFeedEntry` to the four-kind union (`anchor-date.ts` already
    exists by now): thread doorways and egg doorways get anchors and filter
    ids. `filtersForEntry`'s `never` check will fail to compile until the new
    kinds are handled — that is deliberate. Update `era-feed.test.ts`.
    (executor)
    - Verify: `npm test -- era-feed filters` → green.
14. [ ] Implement `spaceDoorways()` so doorways never clump. (executor)
    - Verify: `npm test -- era-feed` → green, including a clumping case.
15. [ ] Build `DoorwayCard.tsx` (thread + egg variants), render it from
    `EraSection.tsx`'s feed loop. Same card silhouette as a moment card so it
    reads as part of the story, not an ad. (executor)
    - Verify: `npm run typecheck && npm run lint` → clean.
16. [ ] Back-to-position: add the `ReturnPoint` stack to `store.tsx`, push on
    doorway tap, restore on dismiss via the existing `useBackDismiss` path.
    (executor)
    - Verify: `npm test` → green; manual check in the run step.
17. [ ] **R4:** every egg detail gets a prominent, obvious link back to the
    thread it came from, plus a line making clear a whole section is devoted
    to theories and eggs. (executor)
    - Verify: `npm run typecheck` → clean; visual check in the run step.

### P4 — mobile navigation (PR 4)

18. [ ] Build `BottomNav.tsx`: mobile-only (`md:hidden`), fixed bottom,
    `env(safe-area-inset-bottom)` padding, 44px targets, `aria-current` on
    the active tab, 4 tabs today, degrading to icon-only at 6. (executor)
    - Verify: `npm run typecheck && npm run lint` → clean.
19. [ ] `TopBar.tsx`: on mobile drop the pills, render the context label —
    `Era: TLOSG` shortened on mobile / full name on desktop, `Thread: End
    Game` in a thread. Desktop keeps the pill rail. The masthead must still
    collapse into this bar on scroll exactly as it does today. (executor)
    - Verify: `npm run typecheck` → clean.
20. [ ] `FeedbackButton.tsx`: float above the bottom nav on mobile, add an X
    that dismisses it for the rest of the session (sessionStorage, using the
    SSR-safe hydrate-after-mount pattern from `progress.ts`), and hide the
    bottom nav while a text input is focused so Mood's keyboard doesn't
    collide. (executor)
    - Verify: `npm test` → green.

### P5 — masthead (PR 5)

21. [ ] `gloss-rotation.ts` + tests: deterministic daily pick of one section
    gloss, same approach as the era-secret rotation. (executor)
    - Verify: `npm test -- gloss-rotation` → green, including a determinism
      test (same date in ⇒ same section out).
22. [ ] `LandingMasthead.tsx`: keep the top portion Joey likes, update the
    tagline copy, render the single rotating gloss line, tappable to that
    section. (executor)
    - Verify: `npm run typecheck && npm run lint` → clean.

### Close-out

23. [ ] Update `docs/longlive-experience.md` — the era-body outline, the nav
    description, the filter contract, and the anchor-date honesty rule.
    (executor)
    - Verify: `grep -n "Play the era" docs/longlive-experience.md` → no hits.
24. [ ] Full suite + the gates. (executor)
    - Verify: `npm test && npm run typecheck && npm run lint &&
      npm run check:generated && npm run check:filter-coverage` → all green.
25. [ ] `/codex:review` on each PR's diff; fix every finding before the PR is
    declared done (Workflow rule 3 — `reviewer` does not satisfy this).
    - Verify: review returns clean.

## Known risks

- **Six tabs do not fit 390px labelled.** At 4 tabs use icon + label; the bar
  must already implement the icon-only degradation for 5–6 so Marketplace and
  Community don't force a redesign. Test the bar with 4, 5 and 6 stub entries.
- **Bottom bar collides with three things** — mobile browser chrome, the home
  indicator, and Mood's keyboard. Safe-area insets handle the first two;
  step 20 handles the third. If any collision survives on a real device, stop
  and report — do not ship around it. This is the exact objection that got the
  bottom bar rejected before.
- **An untagged item is invisible under any active filter.** That is why P1
  step 6 precedes everything else. If the checker finds a large backlog,
  report the count and stop rather than mass-assigning tags by guesswork.
- **Filter change must not move the user between eras.** If the offset
  restoration in step 5 proves flaky, anchor on the era's section top rather
  than raw `scrollY` — do not fall back to scrolling to top.
- **`EraSection.tsx` is already 521 lines** and this plan adds to it. Split it
  (feed loop, hero, doorway rendering) and record the split in `MAP.md`.
  Files stay under 300 lines.
- **The scrubber depends on feed anchors being monotonic.** Removing the
  videos rail and adding doorways both touch that. Run `npm test -- scrubber`
  after P2 and P3, not just at the end.

## Do not

- Don't refactor anything not listed above.
- Don't add dependencies.
- Don't change tests that currently pass.
- Don't display a synthetic anchor date as if it were real.
- Don't add a Threads filter chip (R2 scrapped it).
- Don't convert the reader to real URL routes in this work.
- Don't proceed past a failed verification — report it and stop.

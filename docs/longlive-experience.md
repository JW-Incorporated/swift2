# The LongLive Experience Layer

Owner: Engineering. This is the source of truth for the **shipped front-end
experience** — the interactive era/threads reader that renders at `/`. Read it
before touching anything under `apps/web/components/longlive/**` or
`apps/web/lib/longlive/**`.

> **Why this doc exists.** `docs/architecture.md` describes the *intended*
> Supabase-backed two-tier Vault. The experience currently shipped on the web
> is a **self-contained, statically-authored layer** that lives entirely
> in-repo under `lib/longlive/`. It does **not** read from Supabase, the
> two-tier serving path, or `lib/vault.ts`. Any AI working on the site will
> spend its time here, so this layer gets its own manual. When the two
> converge (data moving to Supabase), update both docs in the same change.

---

## 1. The one-paragraph mental model

The app is a single client-rendered experience (`app/page.tsx` → `<LongLive/>`)
with **two modes**:

- **Era mode** (`mode: 'era'`) — a vertical, immersive scroll through the 12
  eras (`debut` → `tloas`). Each era re-skins the entire UI via CSS variables.
  This is the "timeline" the `docs/architecture.md` scrubber concept feeds.
  It is also the site's front door (R1, PLAN.md 2026-08-14, correcting #684):
  every fresh load starts here, on the current era, with `LandingMasthead`
  (wordmark, tagline, rotating gloss line) mounted once above the first era
  section — it scrolls away as the reader goes back in time and collapses
  into the sticky `TopBar` above it. There is no separate landing page or
  `landing` mode; deep links (`?item=`/`?lens=`/`?era=`, routed by
  `lib/longlive/deepLink.ts`) retarget the stream, and `goHome` (the wordmark)
  returns to the current era at the top, not a separate home screen.
- **Threads mode** (`mode: 'threads'`) — a cross-era "vault" that reads one
  narrative *through-line* across her whole career (love story, fashion,
  re-recordings, etc.), laid on a shared 2006→now axis. Threads mode uses a
  fixed gold-on-charcoal palette (`VAULT_THEME`) to signal you've stepped out
  of the eras.

Everything else (the Clue Web mini-app, the Crossings overlay, media embeds,
moment detail) hangs off those two modes. Navigation state lives in one store
(`lib/longlive/store.tsx`); content lives in typed data modules
(`lib/longlive/*.ts`); presentation is a flat set of components
(`components/longlive/*.tsx`).

---

## 2. Directory map

```
apps/web/
  app/page.tsx                     mounts <LongLive/> (the whole experience)
  components/longlive/
    LongLive.tsx                   app shell: reads mode, applies theme vars, routes to a mode
    LandingMasthead.tsx            wordmark + tagline + rotating gloss; mounted once by EraStream
    EraGrid.tsx                    the twelve-era tile grid (shared: EraSelector overlay only)
    TopBar.tsx / EraSelector.tsx   era jump UI (TopBar always renders, sticky above the masthead)
    TimelineScrubber.tsx           the morph-on-grab era scrubber (era mode)
    EraStream.tsx                  the vertical era-by-era scroll (era mode); mounts LandingMasthead
                                    once above the sequence, then FilterBar once
    FilterBar.tsx                  the one global sticky six-chip filter row (§5.8)
    EraSection.tsx                 one era: hero + lyric + TrackGuideBar + moment grid + PIVOT strip
    EraSecretCard.tsx              the Era Secret card (#688): one sourced obscure fact per era entry
    MomentDetail.tsx               immersive single-moment view (opened from a grid card)
    MomentVideo.tsx                click-to-play YouTube embed (per moment; also used by TrackGuide
                                   for paired track videos)
    TrackGuideBar.tsx              full-width "Track guide" entry pill directly under the era's
                                   quoted lyric — same slot, styling and play button the retired
                                   Spotify player used (decision 2, docs/decisions.md 2026-08-13);
                                   opens TrackGuide
    TrackGuide.tsx                 per-album song track guide overlay; songs paired to an official
                                   video (lib/longlive/track-video.ts) play inline via MomentVideo
    TheoryGuide.tsx                per-era theories/easter-eggs overlay; still functional but no
                                   longer opened from the era hero (the three-pill guide row is
                                   gone) — PR3 reaches it via timeline egg doorway cards
    ThreadsMode.tsx                threads gallery + immersive thread detail + routing
    ThreadsTimeline.tsx            the shared career-axis rail used by every thread
    ClueWeb.tsx                    the Easter-egg mini-app (home / trail / explore views)
    Crossings.tsx                  two-thread intersection overlay
    ShareSheet.tsx / SiteFooter.tsx    SiteFooter also carries the /privacy + /terms links (#800)
    LegalDocument.tsx              renders a LegalDoc as semantic markup (the /privacy + /terms routes)
  lib/longlive/
    types.ts                       ALL shared types (Era, ContentItem, threads, motifs, crossings…)
    eras.ts                        the 12 ERAS (data) + getEra() + per-era media
    content.ts                     per-era moments (ContentItem[]) + getters
    tracks.ts                      per-album track guide (TrackNote[]) getter
    tracks.generated.ts            generated by scripts/sync-longlive-tracks.mjs (§9)
    theories.ts                    per-era theories/eggs (TheoryNote[]) getter
    theories.generated.ts          generated by scripts/sync-longlive-theories.mjs (§9)
    videos.ts                      per-era videos (VideoNote[]) getters + kind labels +
                                   eraVideoFeed() (everything watchable, de-duped)
    videos.generated.ts            generated by scripts/sync-longlive-videos.mjs (§9)
    track-video.ts                 trackVideoFor(): pairs a track-guide song to its official video
                                   by exact-match title (VideoNote.relatedSongs, falling back to
                                   the video's own title) — pure, no fuzzy matching; consumed by
                                   TrackGuide (see §8)
    era-feed.ts                    PURE selection rules for the era feed (which moments +
                                   which videos the global filter shows, how they merge into
                                   one newest-first feed, and the zero-match empty-state copy).
                                   EraSection renders this; it never decides it — vitest
                                   runs in `node` with no component tests, so logic left
                                   in the component is untestable by construction.
    filters.ts                     FilterId (5 ContentTags + Videos, exactly 6), ALL_FILTERS,
                                   filterMatches()/filtersForEntry() — pure, tested (§5.8)
    anchor-date.ts                 resolveAnchor(): sort position for a feed entry, including
                                   undated ones (era-scatter) — pure, tested (§5.8)
    video-affordance.ts            PURE rules for which video a MOMENT surface shows:
                                   feedVideoFor(), detailVideoFor(), footnoteVideoSources().
                                   (watchAffordance/displayHost lived here until 2026-08-13;
                                   removed with the no-embed card state — see §7)
    era-secrets.ts                 per-era Era Secret pool getter + daily rotation + deeper-link resolver
    era-secrets.generated.ts       generated by scripts/sync-longlive-era-secrets.mjs (§9)
    lenses.ts                      threads, thread points, easter eggs, motifs, clue pairs, crossings
    tags.ts                        content tag metadata
    theme.ts                       EraTheme -> CSS custom properties (the re-skin pipeline)
    legal.ts                       privacy policy + terms COPY and facts (#800). DRAFT, counsel-review-
                                   required. **Any change to what the site collects updates this in the
                                   SAME change** — the old policy went stale three times over.
    store.tsx                      the single React context store (state + actions)
```

Rule of thumb: **data and pure logic go in `lib/longlive/`; components stay
thin.** This mirrors the repo-wide `shared/core` vs. view-layer boundary in
`docs/architecture.md`.

---

## 3. Core data model (all in `types.ts`)

### Era (`eras.ts` holds the 12 instances)
```ts
EraId = 'debut'|'fearless'|'speak-now'|'red'|'1989'|'reputation'
      | 'lover'|'folklore'|'evermore'|'midnights'|'ttpd'|'tloas'
Era = { id, name, shortName, years, album, intro, lyric?, image,
        theme: EraTheme, isCurrent?, media?: EraMedia }
```
`theme` is what re-skins the UI (see §6). `media` is Spotify album metadata —
the field and its `EraMedia` type still exist on the data model, but as of
2026-08-13 no component renders it: the era's Spotify player was removed and
Track guide took its slot (decision 2, `docs/decisions.md` —
Joey: "people don't want to listen to Spotify on our app — they can open a
new tab for that"). See §5.5 and §7.

### ContentItem — a "moment" within an era (`content.ts`)
```ts
ContentItem = { id, eraId, date (YYYY-MM-DD), title, blurb, tags: ContentTag[],
                image, hiddenClue?, video?: MomentVideo }
ContentTag = 'Music'|'Fashion'|'Tour'|'Relationship'|'Lore'
```
Authoring order doesn't matter — the UI sorts chronologically. `image`
defaults to the era art if omitted (see `build()` in `content.ts`).

### Threads / lenses (`lenses.ts`)
```ts
LensId = 'love-story'|'fashion'|'taylors-version'|'easter-eggs'
       | 'hidden-clues'|'the-proposal'
THREADS: ThreadMeta[]   // gallery cards (title, blurb, icon, accent)
ThreadMeta = { id, title, kicker, what, hero,
               heroPosition?, heroAlt?, heroCredit? }
```
Each thread owns its own dataset (relationships, runway looks, re-records,
egg nodes, clue pairs, proposal beats). The **one contract** that puts a thread
on the timeline is `threadPoints(id)` — see §5. Card art: see §5.7.

### Motifs — the Clue Web trails (`lenses.ts`)
```ts
MotifId = 'number-13'|'hidden-messages'|'the-snake'|'color-coding'
        | 'clocks-countdowns'|'doors-rooms'|'the-rerecordings'
MOTIFS: Motif[]                       // trail metadata (label, blurb, icon)
MOTIF_MEMBERSHIP: Record<MotifId, string[]>   // SOURCE OF TRUTH: egg id -> trail
```

### Media
```ts
EraMedia   = { spotifyAlbumId, albumTitle, youtubeId? }   // on Era — data only, unrendered (§5.5)
MomentVideo = { youtubeId, title }                         // on ContentItem
```

---

## 4. Navigation store (`store.tsx`)

One React context. Consume via `useAppState()` (read) and `useAppActions()`
(write). Never thread props for navigation — go through the store.

State:
```ts
mode: 'era' | 'threads'      // 'era' is also the front door (R1, PLAN.md 2026-08-14)
eraId: EraId                 // active era in era mode
eraJumpSeq: number           // bump to force a scroll-to-era
lensId: LensId | null        // active thread, or null = threads gallery
crossing: { a, b } | null    // active Crossings overlay (threads mode)
openItemId: string | null    // open MomentDetail, or null
selectorOpen, share
filters: ReadonlySet<FilterId>  // global, era-independent (§5.8); empty = show everything
```

Key actions (all memoized):
- `setMode`, `setEra`, `setActiveEra`, `goHome` — `goHome` returns to the
  current era at the top of the stream; `setEra` always enters era mode (it's
  also the deep-link path)
- `setLens` / `clearLens` — pick a thread / return to the gallery
- `openThread(id)` — **pivot from an era into a thread** (switches to threads mode)
- `openEra(id)` — **pivot from a thread back into an era** (switches to era mode + jumps)
- `openCrossing(a,b)` / `closeCrossing()` — the two-thread overlay
- `openItem(id)` / `closeItem()` — MomentDetail
- `toggleFilter(id)` / `clearFilters()` — the global filter (§5.8); persists as
  you scroll between eras, since it lives here rather than in `EraSection`
- `saveEraScroll(snap)` / `getEraScroll()` / `clearEraScroll()` — era-stream
  scroll restoration (see §5.6). `setEra`, `openEra`, and `goHome` all call
  `clearEraScroll()` so explicit jumps land at the top.

`LongLive.tsx` reads `mode` and renders the era stream or `ThreadsMode`, and
applies the theme (era palette vs `VAULT_THEME`) to the shell wrapper.

---

## 5. The invariants that keep new content consistent

**This is the most important section for any AI adding content.** The system
is designed so new content "just works" *if* you honor these contracts. Break
one and content silently misbehaves.

### 5.1 A thread joins the timeline via `threadPoints(id)`
Every thread maps its dataset down to a shared shape:
```ts
ThreadPoint = { date: string; eraId: string; label: string }
```
`threadPoints(id)` in `lenses.ts` is a `switch` returning `ThreadPoint[]`. From
that array the timeline derives **everything automatically**: era-colored
ticks (via `getEra(eraId)`), the activity density ridge, drag-scrubbing, hover
tooltips, year labels. Era *bands* come from the global `ERAS` array, not the
thread — so they're identical on every thread. **To add a thread: add its data,
add a `case` to `threadPoints`, done.** No bespoke timeline code.

### 5.2 Dated thread content must be wrapped in `<ThreadItem>`
Scroll-sync (the scrubber handle following your scroll) works by reading
`data-ll-item` / `data-ll-date` attributes off the rendered cards.
`<ThreadItem date=...>` stamps those on. **Any thread whose cards are not
wrapped in `ThreadItem` will render correct ticks but the handle won't track
scroll.** (This was a real bug in "The Decode" — it's the easy thing to forget.)

### 5.3 Every egg belongs to exactly one motif trail
`MOTIF_MEMBERSHIP` in `lenses.ts` is the source of truth. Add an `EggNode` to
`EGG_NODES` **and** to exactly one trail in `MOTIF_MEMBERSHIP`. A dev-only guard
at the bottom of `lenses.ts` `console.error`s any unclassified node — watch for
it. `EGG_LINKS` are the *cross-trail* connections drawn on the explore
constellation; trails are the guided reading path.

### 5.4 Threads that participate in pivots/crossings
`CROSSING_THREADS` in `lenses.ts` lists the narrative threads offered in the
era pivot strip and the Crossings overlay (the clue mini-apps are excluded —
they have their own spatial UI). `threadsInEra()` and `threadCrossings()` are
both built on `threadPoints()`, so a new thread added per §5.1 automatically
participates once added to `CROSSING_THREADS`.

### 5.5 Media IDs must be verified before commit
Never trust a model's memory (or a web-search snippet) for a Spotify album ID
or YouTube video ID — a wrong ID silently plays the wrong thing. Verify against
the platform's oEmbed endpoint and confirm the returned title/author:
```bash
# Spotify album
curl -s "https://open.spotify.com/oembed?url=https://open.spotify.com/album/<ID>"
# YouTube video (check title AND author_name)
curl -s "https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=<ID>"
```
The media component (`MomentVideo`) is a **click-to-play facade** — it mounts
the iframe only on user click, so the infinite scroll never spawns dozens of
players. YouTube uses the privacy-enhanced `youtube-nocookie.com` domain.
Poster thumbnails come from `i.ytimg.com` (allowlisted in `next.config.mjs`).
We embed via official first-party players only; never re-host audio/video.
(There is no first-party Spotify playback surface any more — the component
that used to embed one was deleted 2026-08-13; the Spotify oEmbed
verification step above is retained only in case `media` is ever rendered
again, and is not exercised by anything shipped today.)

### 5.6 Era-stream scroll position survives a trip to Threads
Switching to threads mode unmounts `EraStream`, which would otherwise destroy
the reader's scroll position, anchor era, and lazily-appended older eras. To
avoid that dead-end the store keeps an `EraScrollSnapshot`
(`{ anchorId, count, scrollY }`) in a ref: `EraStream` writes it continuously
on scroll (`saveEraScroll`) and reads it once on mount (`getEraScroll`) to
restore the exact spot (double-`requestAnimationFrame` so appended eras lay out
before the scroll lands). **The contract:** a plain Eras↔Threads *toggle*
restores; an *explicit jump* lands at the top. So **any new code path that
jumps the user to a specific era must call `clearEraScroll()` first** (as
`setEra`/`openEra`/`goHome` do) — otherwise it will wrongly restore the old
position. Also keep the `EraStream` jump effect idempotent: when a snapshot
exists it keys off the `eraJumpSeq` *value* so React StrictMode's double-invoke
in dev can't clobber a restore; when there's no snapshot the mount itself may
*be* the jump (switching into era mode mounts the stream in the same `openEra`
action that bumps `eraJumpSeq` — #747), so the effect runs on mount and the initial
`anchorId`/`count` are seeded from `jumpWindow(eraId)` rather than
`{ eraId, 1 }` — otherwise nothing newer than the picked era ever renders and
the user can't scroll up.

### 5.7 Thread hero art comes in two shapes, and both render in two places
`ThreadHeroArt` in `ThreadsMode.tsx` is the ONLY thing that draws a thread's
art, and both the gallery card and the detail header call it — so a thread can
never look like one thing in the gallery and another once opened.

- **One photo** (`meta.hero`) — the default, and since 2026-08-13 it is a real
  photograph of that thread's own subject (Joey: "they should all represent
  their subject matter"): Travis for End Game, a Bejeweled-video gown for The
  Runway, the "All Too Well (10 Minute Version)" performance for Taylor's
  Version, a stadium of wristbands for The Clue Web, "13" inked on fans' hands
  for The Decode. Era album art is now only the fallback behind a grid hero.
  `heroPosition` fixes the crop when centre isn't the subject, `heroAlt` gives
  it real alt text (omit it and the image renders `alt=""`, correct for
  decorative era art), `heroCredit` names the source.
  **Alt text and comments never claim more than the source caption does** —
  that is why The Decode's alt says *fans'* hands, not Swift's.
- **A grid of portraits** (`threadHeroTiles(id)`, non-empty) — when the
  thread's subject is a *set* of people rather than one. `love-story` is the
  wall of past partners, derived from `RELATIONSHIPS` (ended relationships
  that have a portrait) so the card updates itself as the data does. The tiles
  are `alt=""` inside one `role="img"` label — a screen reader should hear one
  description of one piece of card art, not eight consecutive portraits.

**Heroes are local files under `public/`; portraits are hotlinked Wikimedia.**
That split is deliberate: a hero is committed art (rehost it, downscale it,
record its Commons source in a comment), while the portraits are already
hotlinked everywhere else the Love Story thread uses them.

**Attribution is a licence condition, not a nicety.** `threadHeroCredit(id)`
is the single source for the credit line the detail header renders — it joins
the tile credits for a grid hero and falls back to `meta.heroCredit`. Any new
CC BY / CC BY-SA art must flow through it. `lenses.test.ts` enforces that every
tile has a credit and that every credit reaches the rendered line.
**The gallery card is a deliberate exception, decided 2026-08-13:** it displays
the portraits too, but eight photographer credits do not fit a card whose text
block already fills 246 of its 262 phone pixels, and a truncated attribution is
worse than one a tap away — so the credit renders in full the moment the thread
opens. That reasoning depends on a detail view existing behind the card; a
licensed photo shown with nothing behind it must be credited in place.

**Two surfaces, two a11y treatments.** A gallery card is a `<button>` whose
accessible name is built from its contents, so `ThreadHeroArt` takes
`decorative` there — otherwise the hero's description (eight ex-partners, or
Travis) is announced *before* the kicker and title, and a screen-reader user
hears the art before learning which thread the button opens. On the detail
header the art is the page's own image and keeps its description.

**Grid geometry is derived, not hard-coded.** `heroGridColumns(n)` lays the
tiles in two rows; an odd count widens the last tile to fill the spare cell.
Hard-coding four columns is tidy only while the data happens to hold eight
portraits — the point of deriving the tiles is that adding a ninth should not
need a component edit.

**Two threads must never share hero art** — DoD item 2 exists because End Game
and Blank Spaces both used `/eras/lover.png` with bracelet-led blurbs and read
as the same thread. A test in `lenses.test.ts` locks that.

### 5.8 The filter is global, and every timeline item must carry one
One sticky control (`FilterBar.tsx`, mounted once by `EraStream`), not a fresh
chip row per era: **exactly six chips** — the five `ContentTag`s (Music,
Fashion, Tour, Relationship, Lore) plus Videos — living in `store.tsx` as
`filters`, so the picked set survives scrolling from one era into the next.
Videos is a **peer chip**, OR-matched with the rest, not a second
mutually-exclusive axis — `{Music, Videos}` active shows anything that
matches either. An entry with zero filter ids can never match a non-empty
active set, which is exactly why `check:filter-coverage` (below) exists.

`filtersForEntry()` (`filters.ts`) decides an entry's ids:
1. A moment that **owns** the inline player for its embedded video (i.e. the
   first moment in feed order to embed a given `youtubeId` — see
   `inlineVideoMomentIds`) is reachable under Videos as well as its own topic
   tags. A moment that merely *defers* to another card's embed is not.
2. A video's topics come from its own authored `VideoNote.tags` (optional
   `ContentTag[]`, added 2026-08-13). Every video also carries Videos —
   that's structural (every video is watchable), never authored. This
   REPLACED an earlier inference ("a dated music video is Music"): two
   mechanisms deciding the same thing was the exact defect an adversarial
   review caught twice on this branch. 81 of 84 video records now carry at
   least one authored topic tag, backfilled by reading each record's own
   `kind`/`title`/`relatedSongs`/`summary` — never by inferring facts the
   record doesn't state. The 3 left untagged (an early Ellen interview, an
   NYU commencement speech, a Sundance Q&A) are ones whose own text was
   genuinely too thin to support a topic honestly; they remain reachable
   under Videos.

**Anchor dating** (`anchor-date.ts`): every entry in the merged feed carries
an `anchor` — `{ sortDate, displayDate, via }`. `sortDate` is always present
and drives sort order; `displayDate` is **null unless `via === 'exact'`**, and
a synthetic anchor is never rendered as if it were a real date (the same
honesty rule the shipped "Date unknown" card copy already relied on). A
moment always has an authored date (`exact`). An undated video record (26 of
84 as of 2026-08-13) falls back to `era-scatter`: a deterministic,
id-derived position spread across the era's own `[start, end]` span, so
undated records interleave through the timeline instead of piling at the
feed's tail or clumping at a single shared midpoint.

**Zero-match empty state:** a global filter can now land on an era that
genuinely has none of what's selected (Tour in folklore — that era never had
a tour). The era section does not collapse — it keeps its hero, lyric, and
scroll height (so the scrubber still has a sane anchor for that era) and
swaps only the feed body for one line naming the active filter(s) and the
era by its own `shortName` (`emptyFeedMessage()` in `era-feed.ts`, e.g.
"Nothing under Tour in folklore.").

**`scripts/check-filter-coverage.mjs`** walks every moment and video that can
appear in a timeline and fails the build if any carries zero filter ids
(`npm run check:filter-coverage`, wired into the `build` CI job). It also
*reports* (without failing) appearance-family videos that carry no topic
tag — 3 as of the 2026-08-13 backfill (rule 2 above), down from 18 before
`VideoNote.tags` existed; a record left untagged is one whose own text
genuinely didn't support a topic, not a gap to close by inference.

---

## 6. Theming — how an era re-skins the whole UI

`theme.ts` turns an `EraTheme` into CSS custom properties
(`--era-bg`, `--era-surface`, `--era-surface-2`, `--era-ink`, `--era-ink-soft`,
`--era-line`, `--era-accent`, `--era-accent-2`, `--era-glow`, `--era-font`).
`LongLive.tsx` applies `eraStyle(era)` (or `vaultStyle()` in threads mode) to
the shell wrapper, so **all descendants read the same tokens** and recolor
together.

Consequences for component code:
- Style with the tokens, e.g. `text-[color:var(--era-ink-soft)]`,
  `bg-[color:var(--era-accent)]`, `border-[color:var(--era-line)]`. Do **not**
  hard-code hex or use raw `text-white`/`bg-black`.
- Note the token is `--era-surface-2` (hyphen-two). A `--era-surface2` typo
  produces an invisible/transparent surface — has bitten us twice.
- The same tokens are what let a "payoff" recolor into its own era inside a
  thread (e.g. The Decode) — you just render it under that era's variables.

---

## 7. The feature surfaces at a glance

| Surface | Component | Notes |
|---|---|---|
| Mobile navigation | `BottomNav` | mobile-only (`md:hidden`) fixed bottom tab bar with four tabs: Eras, Threads, Mood, Clownbot. Mounted on every surface including the front door, because the front door is the main page, not a separate landing page. `lib/longlive/bottom-nav-layout.ts` — pure `layoutBottomNavTabs()` decides label-vs-icon-only for the whole bar at once: icon-only at 5+ tabs, so Marketplace and Community can arrive without a redesign; never a mixed bar. Padded with `env(safe-area-inset-bottom)` to clear the iPhone home indicator and mobile browser chrome. Unmounts entirely while a text input, textarea, or contenteditable holds focus, so Mood's keyboard never fights it. `LongLive.tsx` renders a spacer of `calc(3.5rem + env(safe-area-inset-bottom))` below the footer, `md:hidden`, because a fixed bar cannot push content — without it the last card of every surface sits under the bar. On mobile, `TopBar` shows a context label instead of the pill toggle: "Era: <short name>" in an era, "Thread: <title>" in a thread. On desktop the pill rail is unchanged and there is no bottom bar. `TopBar`'s own `ModeToggle` is desktop-only, so mobile does not show the same four destinations twice. `FeedbackButton` floats above the bar on mobile with an X that dismisses it for the rest of the session (sessionStorage key `ll-feedback-dismissed-v1`, read only after mount). |
| The masthead | `LandingMasthead` | mounted once by `EraStream`, above the first era section — the front door's eyebrow, wordmark, and tagline, structure and styling unchanged from before, plus one rotating gloss line. Tagline: "Real-time updates on her whole life — every moment sourced and dated, back through all twelve eras." `lib/longlive/gloss-rotation.ts` — `dailyGloss(dayKey)` picks one section's gloss per day, deterministically, reusing `epochDay` from `era-secrets.ts` (the same daily-rotation mechanism, not a second one). It teaches one section at a time so the line never grows as sections are added. Sections carry a `built` flag; unbuilt ones (Marketplace, Community) can sit in the data and are never selected, so no "coming soon" surface is ever shown. |
| Era scroll | `EraStream` → `EraSection` | hero + lyric + `TrackGuideBar` + moment grid + pivot strip. There is no first-party music player in the era body — the Spotify embed component and the three-pill guide row (Track guide / Theories & eggs / Videos) were both removed 2026-08-13, and `TrackGuideBar` now sits alone in the old player's slot (decision 2, `docs/decisions.md`). **ONE video treatment (#2080):** every playable video in the feed — video record or story moment carrying `video` — renders the same `VideoPoster` (exported from `MomentVideo.tsx`): full-width 16:9, the video's own YouTube thumbnail, one large centered accent play glyph. Tapping the poster plays inline in the feed; tapping the card still opens `MomentDetail` (#2051). Three rules hold it together: (a) the poster is a DOM sibling of the card button — never nested — but sits INSIDE the card's border, because the box is drawn by a wrapper rather than by the button (`lib/longlive/card-chrome.ts`); (b) a card that plays a video is at least `media` tier (`withInlineVideoTiers`) — a full-width poster under a 56px `chip` or inside the no-photo `text` breather destroys the silhouette that IS that tier; (c) the card's own photo is suppressed when it is a frame of a video it cannot show you honestly (`feedCardImageHidden`) — either the video its own poster is about to render (#2080; Photo Enrichment gave most of these moments the video's own thumbnail, so rendering both prints the same frame twice) or, since #2081, a video it DEFERS to another card and therefore has no play control for. A moment that carries no `video` keeps its picture even if that picture is a still — it promises no player, and the frame is often its only image. When suppression leaves a card with nothing to show, its tier is re-scored as the imageless card it now is (`assignFeedTiers(items, imageSuppressedIds)`) instead of keeping an image silhouette it cannot fill. Rejected predecessors: #2055's pill outside the box read as "no video here" (#2057), and #2063's compact 96px row was a second vocabulary for the same thing — Joey rejected both on his phone. When two moments in one era embed the same `youtubeId`, only the first in feed order plays it; the later one keeps its full text and its own detail-page embed (`inlineVideoMomentIds`) |
| Current tier / live feed | `CurrentItemCard` + `CurrentItemDetail` | Knowledge-engine Stage 5 (`docs/proposals/2026-08-23-knowledge-engine.md`). `current_item` rows for the current/ongoing era merge into `mergeEraFeed` as a 5th `EraFeedEntry` kind, `'current'` (`current-feed.ts`'s `currentFeedEntries`), fetched via `app/vault/current/[eraId]/route.ts` → `packages/core/src/knowledge` at request time, ISR `revalidate: 900` — the Vault stays static, only the current era's live slice is dynamic. The card reuses `MomentDetail`'s dashed-unconfirmed visual language (`border-2 border-dashed`, era-accent) rather than the component itself — every `current_item` is provisional by definition (not yet promoted into the Vault) so the treatment is unconditional, not gated on a rumor status. Header chip reads "Live" or "Live · reported by `<outlet>`" (`outletFor()`, first source's outlet name). `CurrentItemDetail`'s confidence-style banner is MANDATORY at every status (unlike `MomentDetail`'s, which hides once confirmed) and carries a "Help us verify this" button that files an `/api/intake` POST. Rows with `promoted_to` set are hidden from the feed. The masthead (`LandingMasthead`) swaps its tagline to "Updated Nh ago · N new this week" (`summarizeCurrentActivity`) once the current era has live data, computed client-only after mount. |
| Era scrubber | `TimelineScrubber` | morph-on-grab; snaps to era boundaries |
| Moment detail | `MomentDetail` | opened via `openItem`; the video renders **above the article body** — right after the confidence banner, never below the body or inside the citations footnote (#2051; the banner stays above it so a rumor warning is met before the media). YouTube **citations** still embed in the sources footnote exactly as before (minus one duplicating `item.video`) — #2051 proposed promoting a lone citation to the top slot too, and that is deliberately NOT shipped: 6 of the 29 it would fire on are fan re-uploads, and presenting one as a page's lead media is a rights call for Joey, not a refactor (see `detailVideoFor`). **The ~42vh hero itself PLAYS when the hero image is only a still of the moment's own video** (`heroVideoFor` — 10 of the 16 video-carrying moments; Joey, 2026-08-13: "played the video from the top"). There the body embed yields to it (`detailVideoFor` returns null), and the player's width is capped at `42vh*16/9` so it fills the column on a phone and lands at exactly 42vh on desktop. **A sub-confirmed `confidence` blocks the promotion** — the hero sits above the rumor banner and #2051 requires the banner first, so a rumored moment keeps its video in the body. Any OTHER image that is a frame of the page's own video also leaves the gallery and the photo viewer (`imageDuplicatesPageVideo`; matched by id, since one video appears as `maxres2`/`maxres3`/… in the seeds). A hero that is a genuinely different photo is untouched — photo hero, body video, lightbox and all. Selection is `heroVideoFor` / `detailVideoFor` / `footnoteVideoSources` in `video-affordance.ts`, not in the component. Also shows the hidden clue; sub-confirmed `confidence` renders the loud rumor banner and `rumors` renders the "What's rumored" split (see the rumor recipe in §8) |
| Track guide | `TrackGuide` | opened via `TrackGuideBar` (the full-width pill directly under the era's quoted lyric, in the old player's slot — same shape, same play button) or `openTrackGuide`; per-song sourced notes. Since PR2, a track can also play inline: `trackVideoFor()` (`lib/longlive/track-video.ts`) pairs a track's title against the era's videos, matching on `VideoNote.relatedSongs` (falling back to the video's own title), both sides lowercased/punctuation-stripped/whitespace-collapsed and compared with exact equality — no fuzzy or substring matching. Edition qualifiers ("Taylor's Version", "From The Vault", "10 Minute Version") are never stripped, since they name a different recording (Fearless carries both "The Best Day" and "The Best Day (Taylor's Version)" as separate videos). 48 of 244 track-guide songs pair today (~20%), all `music_video` kind; a paired row renders an inline click-to-play `MomentVideo` under the note, an unpaired row shows no play control at all (#2051 — a card that can't play must never look like one that can) |
| Theories & eggs | `TheoryGuide` | the overlay and `openTheoryGuide` action still exist and work, but nothing in the era hero opens them as of PR2 — the three-pill guide row that used to launch it was removed. PR3 reaches it via egg doorway cards in the timeline instead. Confidence + outcome badges on every record |
| Global filter | `FilterBar` (mounted once by `EraStream`) | one sticky six-chip control — the five `ContentTag`s plus Videos, a peer chip rather than a second axis — that persists as you scroll between eras (§5.8). Selecting Videos shows everything watchable in the era (every video record + moments carrying footage), de-duped by `youtubeId` — records against moments (#439) and, since #2057, moments against each other, so it shows one card per video rather than one per moment. Selection rules in `lib/longlive/filters.ts` + `lib/longlive/era-feed.ts` |
| Thread gallery | `ThreadsMode`/`ThreadsGallery` | thread cards + "Where threads cross" launcher |
| Thread detail | `ThreadsMode`/`ThreadDetail` | `ThreadsTimeline` rail + `ThreadItem` cards |
| Clue Web | `ClueWeb` | 3 views: home (trail picker) / trail (readable) / explore (constellation) |
| Crossings | `Crossings` | two threads on one axis; markers where they intersect |
| Era ↔ Thread pivots | `EraSection` strip + `Crossings` links | via `openThread` / `openEra` |
| Clown bot | `ClownChat` + `ClownBoard` | 4th toggle surface (`mode === 'clown'`). Build B (`docs/decisions.md` 2026-08-13, J1–J7) — a big `clown bot` title (`font-era`, the shipped page-title pattern), one full-width chat box that stays blank until the reader sends a first message (a small "Try our chat bot — ask a question below" line in the empty stream, no pre-filled example conversation), and beneath it `ClownBoard`'s two prefill columns: "What we're clowning on" (open theories, recency-ranked, no padding to a fixed count) and "Past confirmed easter eggs" (ledger-derived). Tapping a column item, or a starter chip, prefills the composer (`clown-starters.ts`) without auto-sending — the reader still hits send. Every column item and chip resolves with **zero model calls**; only sending a composed message reaches `POST /api/clown`. Answers show a compact delulu-only indicator in the header (J4 — Evidence/Confidence meters were dropped as redundant with the source cards) with source cards beneath it. Retrieval is deterministic and grounded — the model is handed corpus docs and may not invent entities (`clown-retrieve.ts`/`clown-index.ts`, blocklist-filtered at index build time). A disabled or over-cap model falls back to a deterministic, zero-model card composer (`clown-fallback.ts`) — see `docs/ops/clown-kill-switch.md`. Never speaks as Taylor; no imagery of her on the surface. Share is disabled here for the same reason as Mood. |

---

## 8. Recipes

**Add a moment to an era:** add a `RawItem` to the correct `EraId` array in
`content.ts` (`id`, `date`, `title`, `blurb`, `tags`). Optionally add
`video: { youtubeId, title }` (verify per §5.5) and/or `hiddenClue`.
`dateLabel` must show the day ('June 19, 2006') when the date is researched
to the day; a moment whose exact day is unknown gets an editorial period
label ('Spring 2007', 'Late 2012') over a representative placeholder date —
never a bare month+year label, which is indistinguishable from a masked
day-precision date (#682; a test in `content.test.ts` enforces this for
curated items).

**Add a music video to a moment:** add `video` to that `ContentItem`. Verify
the ID. It renders automatically in `MomentDetail`.

**Add shoppable products to a fashion moment:** add `moment.products` to the
seed item (`supabase/seed/content/<era>.mjs`):
`[{ brand, item, retailer, url, price?, inStock?, isAlternative?, altNote? }]`
— `retailer` is a bare lowercase hostname (`'ralphlauren.com'`; it's the
future affiliate-routing key), `url` is the exact retailer product-detail page
(verify it resolves HTTP 200 before adding — never a search page, never
guessed), `inStock: false` for a verified sold-out item (renders dimmed +
"Sold out"). Re-run `npm run sync:content`; MomentDetail renders the "Shop the
look" block automatically. The UI must always link via `buildShopUrl()`
(`lib/longlive/shop.ts`) — never `product.url` directly — that function is
the single seam where affiliate wrapping (keyed by `retailer`) gets injected
later with zero content edits (`docs/decisions.md` 2026-07-19). The
`content.fashion-products` checker (content engine) queues fashion moments
that name branded garments but carry no products.

**No exact product page exists (custom/couture/discontinued):** don't skip
the moment silently — offer the closest verified buyable match instead
(2026-07-20, docs/decisions.md): same `Product` shape, plus
`isAlternative: true` and a required `altNote` (<=200 chars) naming what's
different (e.g. `"The exact custom Etro gown was a one-off runway piece —
this is Etro's closest current silhouette"`). Renders an explicit "Similar
style" label + the note — never presented as the literal garment. Still
subject to every other product rule: real retailer, verified HTTP 200,
direct product page, no search pages. If nothing genuinely similar exists
either, skip the garment rather than force a weak match.

**`Era.media` (Spotify album metadata) is authorable but unrendered.** The
field still exists in `eras.ts`/`types.ts`, but no component displays it as of
2026-08-13 (decision 2, `docs/decisions.md`) — authoring it has no user-visible
effect. To make a song playable, add/verify its official video via "Add/edit an
official video" below; if its title exact-matches a track-guide song (see the
Track guide row in §7), `track-video.ts` pairs them automatically — no separate
authoring step.

**Add/edit a track-guide note:** author it in `supabase/seed/tracks/<era-slug>.mjs`
(content track owns those files), then `node scripts/sync-longlive-tracks.mjs`
regenerates `tracks.generated.ts` (also runs automatically on `prebuild`). The
UI shows only songs that have a sourced note — never an empty placeholder row.
Beyond the note, a seed track can carry (issue #440):
- **Essential facts** — `slug`, `release`, `releaseDate`, `writers`,
  `producers`, `isSingle`, `singleReleaseDate`, `themes`. Grouped by the
  generator into `TrackNote.facts` and rendered as the facts card on the
  song's `TrackDetail` page. A dated `singleReleaseDate` implies single
  status.
- **A dossier** — `dossier: { whyItMatters, meaning: { confirmed, supported,
  fanTheories }, connections, live, voices, sources }` (shape: `TrackDossier`
  in `types.ts`). The generator DROPS a dossier whose `sources` is empty.
  Meaning tiers are structurally separated and render with the site's
  existing pill language (accent fill = confirmed, solid border = supported,
  dashed border = fan theory) — never blend a fan reading into a confirmed
  tier. `connections` entries are `{ relatedId, label, why }`, where `why`
  must explain the relationship; `song:<slug>` ids resolve against the whole
  track guide (slugs must stay globally unique — tested), `moment:<id>`
  against era content, and unresolvable ids are skipped silently (also
  tested against real data, so a typo fails CI rather than shipping dead).

**Mark a moment as rumored / add rumor entries (the rumor tier, 2026-07-19):**
for a hot topic where solid sourcing is thin (the MSG wedding was the pilot),
never let reported claims read as fact and never leave the page quietly thin.
Two structural tools, both authored on the seed row in
`supabase/seed/content/<era-slug>.mjs` and piped through
`scripts/sync-longlive-content.mjs`:
- **Whole item rests on unconfirmed reporting** → set `confidence` to one of
  the 8 shared levels (below `official`/`confirmed_interview`, the
  `CONFIRMED_TIER` in `types.ts`). `MomentDetail` renders an UNMISSABLE
  banner — "Reported — not confirmed" / "Rumor — unconfirmed" / "Debunked" —
  naming the first source's outlet (keep the outlet that reported the claim
  FIRST in `moment.sources` on sub-confirmed items). The qualifier follows
  the item to its other surfaces too: an "Unconfirmed" chip on the era-feed
  card (`MomentMeta`) and a `[reported — not confirmed]` marker in outbound
  share copy (`momentShareCopy`). Confirmed items (no `confidence`) are
  unchanged everywhere.
- **Confirmed core + a rumor cloud around it** → keep the confirmed narrative
  in `moment.context` and add `moment.rumors` entries (`claim` ≤400 +
  `reportedBy` + `reportedOn` ISO date + `status` + `url`, optional `note`
  ≤400 — shape: `RumorNote` in `types.ts`). They render in the visually
  distinct dashed "What's rumored" section after the narrative (which gains a
  "What's confirmed" header), each badged by `status`
  (`unconfirmed` / `partially_confirmed` / `confirmed` / `debunked`) — update
  the status as facts land instead of deleting the entry. Every rumor names
  who reported it; estimates say so in `note`; nothing is ever fabricated.
  The 2026-07-04 hard ban carries over verbatim: NO speculation about
  sexuality, family, or identity — a rumor entry is an outlet-reported claim
  about a public event, never the app's own private-life speculation. Rumor
  `claim`/`note` prose flows into the content engine's text checks like any
  other prose (corpus `texts`).
  The generator drops an unattributed/undated entry and
  `npm run validate:content` makes that a hard error. The content engine's
  `content.rumor-gap` checker flags high-visibility moments that are thin on
  sourcing and have neither treatment.

**Add/edit a theory or easter egg (era guide):** author it in
`supabase/seed/theories/<era-slug>.mjs` (content track owns those files; a
valid `confidence` + `outcome` + ≥1 source are REQUIRED or the record is
dropped), then `node scripts/sync-longlive-theories.mjs` regenerates
`theories.generated.ts` (also runs on `prebuild`). Rendered by `TheoryGuide`.

**Add/edit an official video (era rail):** author it in
`supabase/seed/videos/<era-slug>.mjs` (≥1 source REQUIRED; the YouTube id is
extracted from the oEmbed media entry / `officialUrl` — verify per §5.5), then
`node scripts/sync-longlive-videos.mjs` regenerates `videos.generated.ts`
(also runs on `prebuild`). Rendered in the chronological era feed
(`era-feed.ts` → `EraSection`, §7) and, when its title exact-matches a
track-guide song, inline in `TrackGuide` (`track-video.ts`, §7 Track guide
row) — the dedicated era-bottom videos rail component was deleted 2026-08-13
(its rail duplicated what the feed already showed). A work with no verified
embed does not render at all — it is hidden until an upload is added (§7,
playable-first). So if a card you authored isn't showing
up, check its `media` / `officialUrl` first.

**Add an APPEARANCE (talk show, award speech, speech, press event):** same file,
same pipeline — use the `appearance()` helper in
`supabase/seed/videos/_appearance-helpers.mjs` and pick the `kind` by what the
viewer sees, not what the event was called (full semantics in
`videos/_example.mjs`; the two families are documented on `VIDEO_KINDS` in
`packages/shared/src/vault-types.ts`). Five rules that are not negotiable:
- **Taylor herself must be the on-screen participant** (Joey, 2026-08-12: "it
  should only be Taylor"). An announcement or news segment ABOUT her — however
  big the news, however honest the card — is a timeline moment, never a
  Videos-rail record. The Time Person of the Year TODAY reveal was removed on
  exactly this line; a test bans its video id from the rail.
- **Official uploads only.** The upload must belong to whoever owns the footage
  — the show, the network, the awards body, or the outlet that filmed it. A fan
  archive can be a timeline *source*; it is never an `officialUrl`. If the only
  surviving copy is a re-upload, the appearance stays a timeline moment and off
  this rail. (10 of the 31 researched in PR #2035 are in exactly that state.)
- **Verify before commit** (§5.5), and record oEmbed's real `author_name` as the
  channel — several manifest "official" labels turned out to be fan archives.
- **Don't duplicate the moment.** An appearance usually already exists as a
  timeline moment; the video record is the watchable half. The Videos filter
  de-dupes the two by `youtubeId`.
- Seed files must stay **provably inert** (`scripts/check-content-inert.mjs`) —
  no array spread, no member access. That is why `appearance()` takes a complete
  `sources` list instead of merging one in.

**Add/edit an Era Secret (#688):** author it in
`supabase/seed/era-secrets/<era-slug>.mjs` (`{ eraSlug, secrets: [...] }`; each
secret needs a kebab `slug`, `title`, `secret`, and **≥1 real source** — the
generator DROPS any secret with no source, and `npm run validate:content` makes
a missing source a hard error, so no invented fact can ship), then
`node scripts/sync-longlive-era-secrets.mjs` regenerates
`era-secrets.generated.ts` (also runs on `prebuild`). Rendered by
`EraSecretCard` at the top of every `EraSection`, one per era entry, rotating on
a deterministic daily cycle (`dailyEraSecret`). Optional `deeperLink`
(`song:<slug>` / `moment:<id>` / `egg:<id>`) is resolved by
`resolveEraSecretLink` — `song:`/`moment:` navigate, anything unresolvable
(including `egg:`) degrades to no link rather than a dead one.

**Add a new thread:** add its data + a `ThreadMeta` entry to `THREADS`, add a
`case` to `threadPoints()` returning `ThreadPoint[]` (§5.1), render its cards
inside `<ThreadItem>` (§5.2), and add it to `CROSSING_THREADS` if it should
appear in pivots/crossings (§5.4).

**Add an Easter egg:** add an `EggNode` to `EGG_NODES`, classify it in
`MOTIF_MEMBERSHIP` (§5.3), and optionally add `EGG_LINKS` to connect it on the
constellation.

**Add a clue pair (The Decode):** add a `CluePair` to `CLUE_PAIRS` in
`lenses.ts` (plant + payoff, `confirmed` flag, sources).

---

## 9. Current state / known gaps

- Content in `content.ts` is a mix of hand-curated items plus a generated
  sync (`content-vault.generated.ts`, `VAULT_RAW`) produced by
  `scripts/sync-longlive-content.mjs`, which runs automatically as a
  `prebuild` step (`apps/web/package.json`) on every build/deploy. It reads
  the **local `supabase/seed/content/**` files** — the repo is the source of
  truth, so a merged content PR is live on the next deploy with no
  credentials or re-seed step (see `docs/decisions.md` 2026-07-17, which
  supersedes the 2026-07-08 DB-first order after it served stale content).
  Setting `LONGLIVE_SYNC_SOURCE=db` makes the build read the live Supabase
  `month_item` table first instead (seeds as fallback) — only useful if the
  DB ever carries content the repo doesn't. Either way the UI stays static
  (build-time read, no live per-request DB call — see cost discipline in
  `CLAUDE.md`). The per-album track guide follows the same pattern:
  `scripts/sync-longlive-tracks.mjs` (also a `prebuild` step) reads
  `supabase/seed/tracks/**` (opt-in: live `track_note` table) and writes
  `tracks.generated.ts` (rendered by the `TrackGuide` overlay). The
  theories and videos pipelines follow the same pattern (audit T1):
  `scripts/sync-longlive-theories.mjs` (`supabase/seed/theories/**`, opt-in
  live `theory` table) writes `theories.generated.ts` (rendered by
  `TheoryGuide`), and `scripts/sync-longlive-videos.mjs`
  (`supabase/seed/videos/**`, opt-in live `video_work` table) writes
  `videos.generated.ts` (rendered in the era feed and, per-song, in
  `TrackGuide` — see §7 and §8; there is no dedicated videos-rail component
  any more). The Era Secret pipeline
  (#688) follows the same shape but is **seed-only** — there is no `era_secret`
  DB table today, so `scripts/sync-longlive-era-secrets.mjs` reads
  `supabase/seed/era-secrets/**` and writes `era-secrets.generated.ts`
  (rendered by `EraSecretCard`). Coverage: **11 of 12 eras** carry 5 sourced
  secrets each (55 total); **the Life of a Showgirl (`tloas`) has no
  era-secrets seed yet** — that's the authoring residue (a content gap, not
  fabricated filler), and the card renders nothing for that era until it's
  authored. The tours and releases seed pipelines
  (`supabase/seed/{tours,releases}/**`) are **not yet synced at all** —
  that's still a gap, tracked as follow-up.
- The `lib/vault.ts` / two-tier Supabase serving path in
  `docs/architecture.md` (live DB reads, not a static sync) is **not**
  wired into this experience yet.
- Media coverage: all 12 eras carry `Era.media` Spotify album metadata, but it
  is unrendered as of 2026-08-13 (decision 2, `docs/decisions.md` — the era
  page has no first-party Spotify playback by design; see §5.5/§7/§8). 10
  signature moments have YouTube videos. 1989 + folklore point at
  original/deluxe (not Taylor's Version) pending a product call.
- Track-video pairing (`lib/longlive/track-video.ts`): 48 of 244 track-guide
  songs pair with an official video today, all `music_video` kind — an exact
  title match against `VideoNote.relatedSongs` (or the video's own title), no
  fuzzy matching. The rest show no play control in `TrackGuide` (#2051 — no
  control beats a wrong one).
- Clue Web "explore" constellation label overlap in dense clusters is a known
  polish item (collision-avoidance not yet implemented).

Keep this file current in the same change that alters behavior here — it is the
handoff contract for the next AI (v0, Claude Code, or Codex).

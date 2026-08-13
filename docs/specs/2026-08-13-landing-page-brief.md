# Spec: Landing page rethink — design brief for approval (DoD item 1)

**Date:** 2026-08-13 · **Author:** Claude (product-design session, for Joey) ·
**Status:** DRAFT — awaiting Joey's approval. **This brief is the approval
artifact: nothing here gets built until Joey signs off** (per
`docs/definition-of-done.md` item 1: "Founder-approved design BEFORE
implementation"). It supersedes the 2026-07-15 "Choose an era becomes the
landing page" decision **once approved** — that decision itself anticipated
this ("holds only as the fallback if this doesn't work").

## TL;DR

The front door today is a menu: a wordmark, a four-tab toggle that is already
at its physical limit, and twelve era tiles — no content to scroll, no photo
of Taylor, no explanation of what a "thread" is. This brief proposes landing
the visitor **directly in a scrollable front page built from content the site
already has** (today's era secret, on-this-day moments, one thread item, one
Mood chip), with a navigation rail that names all sections and has room for
Marketplace and Community to slot in without a redesign. Three directional
concepts are sketched; **"The Front Page" is recommended.** Five decisions for
Joey are enumerated at the end.

---

## 1. Problem statement — what the current front door fails to do

Verified against the shipped code (`apps/web/components/longlive/
LandingPage.tsx`, `TopBar.tsx` `ModeToggle`, `LongLive.tsx`), not assumed.
What a first-time visitor to longlivets.com sees today, top to bottom:

1. eyebrow "The Taylor Swift time machine" + the **Long Live** wordmark
2. one line: "Real-time updates on her whole life, or step back into any era."
3. a 4-tab segmented toggle: **Eras · Threads · Mood · Clownbot**
4. heading "Choose an era — Twelve chapters, newest first. Tap one to step
   inside."
5. the twelve-era tile grid. End of page.

What fails, for the cold visitor the social pipeline is now sending here:

- **There is nothing to scroll.** The page is a chooser, not content. DoD
  item 1's direction (Wyatt) is explicit: land *directly in scrollable
  content*, like any modern feed app. Today the visitor's first required act
  is a decision — pick one of twelve eras or one of four unexplained tabs —
  before seeing a single real thing the site knows about Taylor. Sixteen
  doors, zero rooms.
- **The section names don't gloss themselves.** "Threads", "Mood", "Clownbot"
  are bare words on tabs. The DoD's own words: "Nobody arriving cold knows
  what a 'thread' is." There is no first-touch explanation anywhere on the
  page — the one sentence of copy describes eras only.
- **The toggle is at capacity — it structurally cannot take item 4.** The
  `ModeToggle` code says so itself: with four labelled tabs the landing
  variant "has no room for icons on a narrow phone" and overflows a 360px
  screen at fixed width. The sliding indicator is hard-coded to quarters.
  Six sections (Marketplace + Community are peers per DoD item 4) do not fit
  a segmented control at any font size a human can read. This is the
  load-bearing reason item 4 is blocked on item 1.
- **A Taylor Swift fan site whose front door has no photograph of Taylor.**
  The grid is era *art* tiles. Joey's own verdict on social (2026-08-12
  Taylor-photo standard) applies verbatim here: the grid's job is to show
  Taylor; the product is the byline. The repo has a 1,000+ entry credited
  photo corpus and the landing page uses none of it.
- **No evidence of depth.** The site holds ~1,300 sourced moments, track
  dossiers, 55 era secrets, six narrative threads, 65+ videos, a Mood
  matcher — and the front door signals none of it. A cold visitor from an
  IG bio link has no reason to believe this is different from any fan wiki.
- **The back-gesture landing is cold too.** Deep-linked visitors (`?item=`,
  `?lens=` — the marginal user per `docs/marketing/social-strategy.md`)
  bypass the landing, which is right; but their first *back* gesture drops
  them onto this same context-free chooser. The front door is also the
  second screen for every social visitor, and it orients nobody.

**What today's page gets right — keep it:**

- **No marketing splash.** Joey's standing ethos (2026-07-15 decision): an
  explanatory landing page is "against the ethos of good web design." Every
  concept below lands the visitor *inside the product*, in real content.
- **The era grid itself.** Twelve tiles genuinely communicate "twelve eras,
  pick where to start" in one glance. It should survive — demoted from being
  the entire page to being one block of it.
- The wordmark-goes-home convention, the share affordance on the most-seen
  screen (#707), deep links, the nav stack, and the era theming pipeline all
  keep working unchanged.

## 2. Audience & jobs — the first 10 seconds

| Visitor | Arrives via | Needs in the first 10 seconds |
|---|---|---|
| **Cold, mobile, from social** (the marginal user — IG/X posts now drive here daily) | a deep link (`?item=`, `?lens=`) or the bio's bare `longlivets.com` | Proof this is a real, deep, loved thing — one specific, dated, sourced piece of content and a photo of Taylor; then a legible map: what else is here, in plain words, without tapping anything. |
| **Cold, desktop, from search / a share** | `/` | Same as above plus crawlable substance: a page that *is* something, not a menu that might lead to something (#653). |
| **Returning fan** | `/` from memory or the home-screen icon | The fastest path back in: what's new/today, jump to *their* era, and their reading position preserved (the era-stream scroll snapshot already does this — don't break it). |

The controlling insight: **the cold visitor doesn't need to choose — they
need to be shown.** Choosing is the returning fan's job. Today's page serves
only the chooser.

## 3. Information architecture — six sections, one contract

### 3.1 The real pill count is six, not five

Joey's framing was "five pills, not three" — Eras, Threads, Mood +
Marketplace + Community. But **Clownbot shipped as a fourth top-level surface
on 2026-08-11** (same day the DoD was written; see `docs/decisions.md`
"Clownbot: a fourth surface"). So the honest plan is **six peers**:

> **Eras · Threads · Mood · Clownbot · Marketplace · Community**

This brief designs the navigation for six and flags the count as **Decision
D2** — if Joey wants Clownbot demoted (folded under another section or an
overflow), that's a one-line change to the design, but it should be chosen,
not drifted into.

### 3.2 The navigation: a glossed pill rail, two densities

Replace the segmented `ModeToggle` with one component in two states:

- **On the front door (expanded):** all section pills laid out in full —
  wrapping to two rows on a narrow phone so **every section is visible
  without any interaction** (DoD acceptance criterion, met literally). Each
  pill carries icon + name, and on the front door only, a one-line gloss in
  the site's voice (see §5). This is where "Threads" gets explained at first
  touch.
- **Inside a section (compact):** the same pills as one sticky row — icon +
  short label, active pill highlighted (`aria-current`), 44px targets. Six
  icon+label tabs fit 360px at compact sizing; on mobile this row lives at
  the **bottom** of the viewport (thumb reach, the modern-feed-app
  convention Wyatt pointed at), on desktop at the top. The wordmark always
  returns to the front door; browser back always unwinds the nav stack —
  entering and leaving any section never strands the user (already true via
  `store.tsx`; the criterion carries over).

### 3.3 The extension contract — how Marketplace and Community slot in

A top-level section, forever after, is exactly three things:

1. **a pill** in the rail (name + icon + one-line gloss),
2. **a feed block** on the front page (its best real item, rendered by that
   section, linking in), and
3. **a mode** in the store (`mode: 'marketplace' | 'community' | …`), same as
   the four that exist.

Item 4's builders add those three things and touch nothing else. No
redesign, no layout shift, no new navigation pattern. Until a section
exists, its pill and block simply aren't rendered — the front page never
shows placeholders or "coming soon."

## 4. Three directional concepts

All three are mobile-first, land in scrollable content, keep the no-splash
ethos, and use the §3 nav. They differ in **what the visitor lands in**.

### Concept A — "The Front Page" ★ RECOMMENDED

The site opens like the front page of a very good fan paper: a scrollable
feed **assembled at build time from content the site already has**. No new
content is authored; every block is a doorway into the section it came from.

```
┌──────────────────────────────┐  mobile, 390px
│ Long Live            [share] │  compact masthead, one line of
│ her whole life, in order     │  tagline — not a splash
├──────────────────────────────┤
│ [ Eras ] [ Threads ] [ Mood ]│  expanded pill rail, wraps to
│ [ Clownbot ] ( +Marketplace  │  two rows; every pill glossed
│   +Community when built )    │  in one line on first touch
├──────────────────────────────┤
│ ████ REAL TAYLOR PHOTO ████ │  TODAY block: the current era's
│ The Life of a Showgirl · NOW │  latest moment — dated, sourced,
│ <latest sourced moment>      │  credited photo → opens era mode
├──────────────────────────────┤
│ ⭑ Era secret of the day      │  dailyEraSecret() — already
│ <one obscure sourced fact>   │  rotates deterministically
├──────────────────────────────┤
│ ON THIS DAY · aug 13, 2013   │  date-matched Vault moments
│ <moment card>       → era    │  (falls back to nearest date)
├──────────────────────────────┤
│ FROM THE THREADS             │  one thread item, rotating
│ The Decode · one clue, one   │  daily through the six threads
│ payoff  <item>  → thread     │
├──────────────────────────────┤
│ MOOD · "crying in the car,   │  one starter chip (approved
│ cinematically" → tap Mood    │  copy, verbatim) → Mood
├──────────────────────────────┤
│ THE TWELVE ERAS              │  the existing EraGrid, kept,
│ [tile][tile][tile][tile]     │  demoted to a block
│ [tile][tile][tile][tile]...  │
├──────────────────────────────┤
│ footer                       │
└──────────────────────────────┘
```

- **Optimizes for:** the doom-scroll requirement, literally — the visitor is
  scrolling real content one swipe in. Teaches every section by *showing its
  content*, not describing it. Zero new content cost: every block reads
  existing generated data (`content.ts`, `era-secrets.ts`, `lenses.ts`,
  `mood-starters.ts`) and the two daily-rotation mechanisms already shipped
  (Era Secret daily cycle; the social calendar's on-this-day logic has a
  client-side twin here). Gives social posts a warm landing: the front page
  *is* the same kind of artifact as the posts that drove the click.
- **Main risk:** *perceived staleness.* The site is static; blocks change
  only on content merges plus the deterministic daily rotations. If the
  TODAY block shows the same moment for a week, the "front page" framing
  overpromises. Mitigations: date-stamp blocks honestly (never "breaking",
  always "on this day" / "from the vault"), lean on the two real daily
  rotations, and let content merges (which land continuously via auto-merge)
  refresh the top block. Second risk: the front door becomes a seventh
  surface to maintain — bounded by making every block a dumb selection over
  existing data (selection rules in `lib/longlive/`, pure and tested, per
  the era-feed precedent).

### Concept B — "The Time Machine"

No home surface at all: the visitor lands **directly in era mode, current era
first** — the existing `EraStream`, which is already an excellent immersive
scroll — with a one-screen masthead grafted on top: wordmark, tagline, the
expanded pill rail, then the current era's hero flows in and you're inside
the product. The era grid lives behind the Eras pill and the scrubber.

```
┌──────────────────────────────┐
│ Long Live            [share] │
│ [ Eras ][ Threads ][ Mood ]  │  expanded rail w/ glosses
│ [ Clownbot ] …               │
├──────────────────────────────┤
│ THE LIFE OF A SHOWGIRL  ·NOW │  ← the real EraSection hero,
│ ████ era hero / lyric ████  │    exactly as shipped
│ <era secret card>            │
│ <moment grid, videos, …>     │  …continuous scroll through
│         ⋮                    │  all twelve eras, as today
└──────────────────────────────┘
```

- **Optimizes for:** depth-first immersion — the visitor is inside the
  site's single best surface in zero taps; almost no new UI to build or
  maintain (a masthead + the rail); the "time machine" identity is the
  landing experience itself.
- **Main risk:** *one era is not the site.* The cold visitor sees Showgirl
  content and may never learn that Threads/Mood/Marketplace exist — the rail
  scrolls away with the masthead unless made sticky, and a sticky expanded
  rail eats the immersive theming that makes era mode good. It also welds
  "home" to "eras": back-gesture and wordmark semantics get muddier (goHome
  lands you… where you already are?), and the era-scroll snapshot contract
  (`§5.6` of the experience doc) has to distinguish "landed here cold" from
  "returned here" forever after.

### Concept C — "Twelve Doors"

Today's chooser, kept but made alive: the era grid stays the landing's
centerpiece, with each tile upgraded to show a live peek (the era's secret
of the day, its latest moment count, a real photo), and glossed section
cards for the non-era surfaces above the grid.

- **Optimizes for:** continuity — it's the approved 2026-07-15 decision,
  polished; lowest build cost; the grid's one-glance "twelve eras" pitch
  survives undiluted.
- **Main risk:** *it's still a menu.* However alive the tiles get, the
  visitor still can't scroll content on arrival — it fails the DoD's
  "lands in content they can immediately scroll" criterion by construction
  unless the definition of "content" is stretched to mean tiles. Presented
  for completeness and as evidence the middle ground was considered, not
  recommended.

### Recommendation — Concept A, "The Front Page"

It is the only concept that satisfies every written acceptance criterion in
DoD item 1 at once: scrollable real content on arrival, every section
visible and glossed without interaction, and a structural slot (pill +
block) for Marketplace and Community that makes item 4 additive instead of
another redesign. It keeps what today's page does well (the grid, no
splash) and fixes what it doesn't (no content, no photos, no gloss, no
room). Concept B is the strongest *feeling* experience but teaches the
site's breadth worst — and breadth is the stated problem. A is also the
cheapest concept that still moves: ~90% of its blocks render components
that already exist.

## 5. Content & imagery plan

- **Photography, not tiles, above the fold.** The TODAY block leads with a
  real photograph of Taylor from the repo's credited corpus
  (`moment.photos`, 1,000+ entries with url + credit), credit line rendered
  on or under the image. Era-art tiles remain the era grid's identity —
  correct there, insufficient as the door. Hard bars carry over from the
  photo policy (2026-08-12 + 2026-07-09 decisions): **no AI-generated
  images ever**, no watermarked images, no uncredited use; takedown on
  request without argument.
- **Copy register:** the site's existing voice — lowercase-warm, a fan
  telling a fan; **Taylor**, never bare "Swift"; no AI-tell phrases, none of
  the banned openers. The model is the THREADS kickers already shipped in
  `lenses.ts` ("A love story, in real time" · "The secrets she plants" ·
  "One clue, one payoff"). Pill glosses are written in exactly that
  register, one line each, e.g. (draft, for Joey's edit, not final copy):
  - **Eras** — twelve chapters of her life, newest first
  - **Threads** — one storyline at a time, across every era
  - **Mood** — tell it how you feel, it hands you the songs
  - **Clownbot** — the theories, graded for delulu
  - **Marketplace** — the looks and the merch, era by era *(when built)*
  - **Community** — where the fans actually are *(when built)*
- **Section blocks show real items verbatim** — a moment card is the same
  moment card era mode renders, sourced and dated; nothing is written *for*
  the landing page, so the no-fabrication bar is inherited rather than
  re-policed. Rumor-tier and confidence chips render exactly as they do in
  the feed.
- **Thread copy dependency:** the FROM THE THREADS block displays whatever
  card copy `lenses.ts` carries — DoD items 2/3 (differentiating the twin
  cards) land there and this page inherits the fix automatically. This brief
  does not solve items 2/3 and does not block on them.

## 6. Acceptance criteria

Mobile AND desktop, each testable:

**Experience**
1. A first-time visitor on a 390×844 viewport sees, without any interaction:
   the wordmark, every existing top-level section pill with its one-line
   gloss, and the start of a real, dated content block. One swipe scrolls
   real content.
2. Every pill navigates to its section; wordmark returns to the front page;
   browser back from any section returns to the previous surface (never a
   dead end, never a stranded state). Deep links (`?item=`, `?lens=`,
   `?era=`) bypass the front page exactly as today.
3. Adding a new section (rehearsed with a stub in review, since Marketplace/
   Community don't exist yet) requires only: a pill entry, a feed block, a
   store mode. No layout or nav redesign. No placeholder/"coming soon" is
   ever rendered for an unbuilt section.
4. The TODAY block leads with a credited real photograph of Taylor; the
   credit is visible; no AI or watermarked imagery anywhere on the page
   (existing image checks apply).
5. The era grid remains reachable within one scroll on the front page and
   one tap via the Eras pill.
6. Returning-visitor behavior: the era-stream scroll snapshot contract
   (experience doc §5.6) still holds — a plain toggle away and back
   restores position; explicit jumps land at the top.

**Performance (the Tier-0 discipline)**
7. The front page adds **zero** to the Tier-0 data budget beyond selection
   over already-resident data; `npm run check:budget` stays green.
8. No third-party iframe mounts on the front page without a click
   (2026-08-11 click-to-load decision, no exceptions). Images below the fold
   are lazy; the hero image is prioritized.
9. Mobile Lighthouse on the front page: LCP ≤ 2.5s (throttled), CLS < 0.1 —
   every block reserves its aspect ratio.

**A11y (the repo's gate)**
10. The rail is a labeled nav landmark; active section exposed via
    `aria-current`; every target ≥ 44px; icon-only compact tabs carry
    explicit accessible names (#656 lesson); no nested interactive elements;
    heading order is sane (one h1); visible focus throughout; daily-rotation
    blocks are inert content, no motion without `prefers-reduced-motion`
    respected.

**SEO / discoverability basics (#653, Nils's lens)**
11. The front page's blocks are server-renderable text in the initial HTML
    (the current landing is fully client-rendered — this is the single
    biggest crawlability win available); real `<title>` + meta description +
    OG image for `/`; the h1 is the site name, block headings are h2s.
    (Path-based URLs per section are noted as the *next* SEO step and are
    out of scope here — see §8.)

**Process**
12. Joey verifies on his own phone before item 1 closes (the DoD's own bar).

## 7. Decisions for Joey — what approving this brief means

Approving this brief approves D1–D5 as written unless Joey overrides them
inline. A build session should be able to implement from this section alone.

| # | Decision | Recommendation | Alternatives |
|---|---|---|---|
| **D1** | Direction | **Concept A, "The Front Page"** (§4) | B "Time Machine" / C "Twelve Doors" |
| **D2** | Top-level section count | **Six pills** — Clownbot stays a peer (§3.1) | Fold Clownbot under another section (say which) |
| **D3** | Mobile nav position (compact state, inside sections) | **Bottom tab bar** on mobile, top rail on desktop (§3.2) | Top rail everywhere (closer to today) |
| **D4** | "Threads" naming | **Keep "Threads", add the gloss** — the gloss does the explaining | Rename; candidate options if wanted: "Storylines" / "Story Arcs" (DoD says a rename is a founder call, so it's only ever offered, never done unilaterally) |
| **D5** | Front-door imagery | **Lead with credited real photos of Taylor** in content blocks; era art stays on the grid tiles (§5) | Era art everywhere (status quo) |

Per project convention, the approved decisions get propagated verbatim into
the implementation ticket(s) so no build session re-asks them, and a
`docs/decisions.md` entry records D1/D2 (they supersede the 2026-07-15
landing decision).

## 8. Out of scope — deliberately not covered here

- **Marketplace and Community themselves** — item 4 gets its own specs;
  this brief only reserves their slots (§3.3).
- **Thread card differentiation** (DoD items 2/3) — lands in `lenses.ts`
  independently; this page inherits it.
- **Video playback consistency and inert cards** (#2051, #2050) — the front
  page renders existing card components and takes whatever fix those tickets
  land; nothing here depends on or preempts them. No video block ships on
  the front page in v1 (avoids designing against #2051's open option).
- **Path-based section URLs / full SEO restructure** (#653 beyond basics),
  notifications, accounts, personalization ("your era" memory), Mood scoring
  coverage gaps, the Clownbot scope decision (DoD item 7), and any content
  authoring.
- **Copy finalization** — glosses and taglines in §5 are drafts for Joey's
  edit; the register is the spec, the words are placeholders.

## 9. Contested points — from the design debate

*(This section records material disagreements from the Claude-proposes /
Codex-attacks debate per CLAUDE.md rule 5 — surfaced, not settled. Filled in
below after the debate run; see PR body for whether Codex was reachable.)*

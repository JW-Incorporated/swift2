# Spec: Landing page rethink — design brief for approval (DoD item 1)

**Date:** 2026-08-13 · **Author:** Claude (product-design session, for Joey) ·
**Status:** DRAFT — awaiting Joey's approval. **This brief is the approval
artifact: nothing here gets built until Joey signs off on it** (per
`docs/definition-of-done.md` item 1: "Founder-approved design BEFORE
implementation"). Approval here approves the *direction*; rendered mockups on
real labels follow before any code (§7, D6). Once approved, this supersedes
the 2026-07-15 "Choose an era becomes the landing page" decision — that
decision itself anticipated this ("holds only as the fallback if this
doesn't work").

**Pressure-tested:** one Codex adversarial round ran against this brief
(2026-08-13); six findings, all addressed — four accepted into the text, two
partially rebutted and recorded in §9 "Contested points" per CLAUDE.md
("disagreements surface, not settle"). A second round was skipped under the
debate's 15-minute cap.

## TL;DR

The front door today is a menu: a wordmark, a four-tab toggle that is already
at its physical limit, and twelve era tiles — no content to scroll, no photo
of Taylor, no explanation of what a "thread" is. This brief proposes landing
the visitor **directly in a scrollable front page built from content the site
already has** (the latest sourced moment with a credited Taylor photo, the
era secret of the day, an on-this-day match when one exists, one thread item,
one Mood chip), with a navigation rail that names all sections and has room
for Marketplace and Community to slot in without a redesign. Three
directional concepts are sketched; **"The Front Page" is recommended.** Six
decisions for Joey are enumerated in §7.

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
| **Returning fan** | `/` from memory or the home-screen icon | The fastest path back in: what's new, jump to *their* era, and their reading position preserved (the era-stream scroll snapshot already does this — don't break it). |

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

This brief sizes the navigation for six and flags the count as **Decision
D2** — if Joey wants Clownbot demoted (folded under another section), that's
a one-line change to the design, but it should be chosen, not drifted into.
(Clownbot's own *scope* remains DoD item 7's separate founder decision; its
pill exists today regardless.)

### 3.2 The navigation: a pill rail, two densities, glosses in the blocks

Replace the segmented `ModeToggle` with one component in two states:

- **On the front door (expanded):** all section pills laid out in full —
  icon + name only, wrapping to two rows on a narrow phone so **every
  section is visible without any interaction** (DoD acceptance criterion,
  met literally). Six one-word pills wrap comfortably at 390px; sentence
  glosses do NOT live inside the pills (they don't fit — Codex finding 6,
  accepted). Instead, **each section's front-page block carries the gloss as
  its kicker line** ("THREADS — one storyline at a time, across every era"),
  so the explanation sits next to a real example of the thing it explains.
  The pills and the blocks are cross-wired: tapping either enters the
  section.
- **Inside a section (compact):** the same pills as one sticky **top** rail
  — icon + short label, active pill highlighted (`aria-current`), 44px
  targets, horizontally scrollable only if a seventh section ever appears
  (with edge-fade affordance; six fit 390px at compact sizing).
  **Deliberately not a bottom tab bar:** a prior on-device, CTO-approved
  test already rejected a bottom-edge control for colliding with mobile
  browser chrome and the home indicator; the FeedbackButton is fixed
  bottom-right; Mood's textarea raises the keyboard over the bottom edge.
  A bottom bar could only come back via a device-tested prototype and
  Wyatt's explicit approval (Codex finding 3, accepted — this flipped the
  draft's recommendation).
- The wordmark always returns to the front door; browser back always
  unwinds the nav stack — entering and leaving any section never strands
  the user (already true via `store.tsx`; the criterion carries over).

### 3.3 The extension contract — how Marketplace and Community slot in

A top-level section, forever after, registers exactly one entry in a
**section registry**, which carries:

1. **a pill** (name + icon) for the rail,
2. **a front-page block** (its best real item, rendered by that section,
   linking in, gloss as kicker),
3. **a mode + deep-link namespace** — the store mode plus URL params that
   can address an *item inside* the section (as `?item=`/`?lens=`/`?era=` do
   today). This matters because DoD item 4 requires item-level cross-links
   both directions (era ↔ marketplace item); a bare mode switch can't
   address a product or a community — the registry entry must (Codex
   finding 5, accepted in part),
4. **its theming, share target, and search participation** — the seams the
   four existing sections already thread through `LongLive.tsx`/`TopBar`/
   `ShareSheet`/`SearchOverlay`.

Item 4's builders add one registry entry and their section's own surfaces —
no nav redesign, no layout shift on the front page. Until a section exists,
its pill and block simply aren't rendered — the front page never shows
placeholders or "coming soon." The *full* registry field list is
implementation detail for the item-4 specs; what this brief locks is the
shape: **new section = one registry entry, and the front door absorbs it
without redesign.**

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
│ [Eras] [Threads] [Mood]      │  expanded pill rail: icon+name,
│ [Clownbot]                   │  wraps to two rows; every pill
│                              │  visible, zero interaction
├──────────────────────────────┤
│ ████ REAL TAYLOR PHOTO ████ │  LATEST FROM THE VAULT ·
│ <credit line>                │  the newest sourced moment that
│ oct 3, 2025 · <moment title> │  HAS a credited photo — honest
│ → step into the era          │  date always shown (§4A rules)
├──────────────────────────────┤
│ ⭑ ERA SECRET OF THE DAY      │  dailyEraSecret() — already
│ <one obscure sourced fact>   │  rotates deterministically
├──────────────────────────────┤
│ ON THIS DAY · aug 13, 2013   │  exact month/day Vault match
│ <moment card>       → era    │  ONLY — block omitted when
│                              │  today has no match
├──────────────────────────────┤
│ THREADS — one storyline at a │  gloss as kicker; one thread
│ time, across every era       │  item, rotating daily through
│ The Decode: <item> → thread  │  the six threads
├──────────────────────────────┤
│ MOOD — tell it how you feel  │  one starter chip (approved
│ "crying in the car,          │  copy, verbatim) → Mood
│  cinematically"   → Mood     │
├──────────────────────────────┤
│ THE TWELVE ERAS              │  the existing EraGrid, kept,
│ [tile][tile][tile][tile]     │  demoted to a block
│ [tile][tile][tile][tile]...  │
├──────────────────────────────┤
│ footer                       │
└──────────────────────────────┘
```

**Freshness rules — the honesty contract** (Codex finding 1, accepted; these
are part of the design, not polish):

- The hero block is titled **"Latest from the vault"** and always shows the
  moment's real date. It may call itself "TODAY" only when the moment is
  genuinely recent (≤14 days old). A static site must never cosplay a
  newsroom — the vision's "recent news" job is real but lands with the news
  pipeline, not with this page pretending.
- **ON THIS DAY renders only on an exact month/day match** in the Vault, and
  is omitted entirely otherwise — never a "nearest date" stand-in labeled as
  today.
- The hero's selection rule is "newest moment **that has a credited real
  photo**" — era-art fallback images never lead the front door.
- Every block states its real date; nothing is ever labeled fresher than it
  is. The two deterministic daily rotations (era secret, thread item) are
  honestly framed as "of the day" — they are that.
- Empty states: any block whose selection comes up empty is not rendered.
  The page degrades by getting shorter, never by showing filler.

- **Optimizes for:** the doom-scroll requirement, literally — the visitor is
  scrolling real content one swipe in. Teaches every section by *showing its
  content* next to its gloss, not describing it in the abstract. No new
  *content* cost: every block is a selection over existing generated data
  (`content.ts`, `era-secrets.ts`, `lenses.ts`, `mood-starters.ts`), with
  selection rules as pure tested functions in `lib/longlive/` (the
  `era-feed.ts` precedent). Gives social posts a warm landing: the front
  page is the same kind of artifact as the posts that drove the click.
- **Main risk:** *perceived staleness* — bounded by the honesty contract
  above, but a quiet content month still means a slow-moving hero; the
  mitigation is honest dating, not fake motion. Second risk: *a real
  seventh surface to build and own.* The draft's "~90% reuse" claim was
  fair-challenged (Codex finding 2): the existing cards (`MomentCard`,
  `EraSecretCard`, thread renderers) are file-private and coupled to their
  surfaces, so Concept A needs **preview variants** of them plus selection
  rules and tests — a real, if modest, build; the honest claim is "zero new
  content, zero new data, one new presentation layer." Ownership: the front
  page belongs to ENGINE (it's code, not authored content); its blocks can
  never go stale editorially because they render whatever the content
  pipeline last merged.

### Concept B — "The Time Machine"

No home surface at all: the visitor lands **directly in era mode, current era
first** — the existing `EraStream`, which is already an excellent immersive
scroll — with a one-screen masthead grafted on top: wordmark, tagline, the
expanded pill rail, then the current era's hero flows in and you're inside
the product. The era grid lives behind the Eras pill and the scrubber.

```
┌──────────────────────────────┐
│ Long Live            [share] │
│ [Eras] [Threads] [Mood]      │  expanded rail (masthead only;
│ [Clownbot]                   │  compact sticky rail after)
├──────────────────────────────┤
│ THE LIFE OF A SHOWGIRL  ·NOW │  ← the real EraSection hero,
│ ████ era hero / lyric ████  │    exactly as shipped
│ <era secret card>            │
│ <moment grid, videos, …>     │  …continuous scroll through
│         ⋮                    │  all twelve eras, as today
└──────────────────────────────┘
```

- **Optimizes for:** depth-first immersion — the visitor is inside the
  site's single best surface in zero taps; the least new UI of any concept
  (a masthead + the rail); the "time machine" identity is the landing
  experience itself; no freshness promise to keep, because an era stream
  never claims to be news.
- **Main risk:** *one era is not the site.* The cold visitor sees Showgirl
  content and may never learn Threads/Mood/Marketplace exist — the expanded
  rail scrolls away with the masthead (the compact rail persists, but
  compact pills carry no gloss and no example). It also welds "home" to
  "eras": wordmark/back semantics get muddier (goHome lands you… where you
  already are?), and the era-scroll snapshot contract (experience doc §5.6)
  must distinguish "landed cold" from "returned" forever after. **Codex's
  counter-recommendation is a hybrid of exactly this concept — see §9,
  contested point 1.**

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
  unless "content" is stretched to mean tiles. Presented for completeness
  and as evidence the middle ground was considered; not recommended.

### Recommendation — Concept A, "The Front Page"

It is the only concept that satisfies every written acceptance criterion in
DoD item 1 at once: scrollable real content on arrival, every section
visible without interaction *and* explained beside a live example, and a
structural slot (registry entry: pill + block) that makes item 4 additive
instead of another redesign. It keeps what today's page does well (the
grid, no splash) and fixes what it doesn't (no content, no photos, no
gloss, no room). Concept B is the strongest *feeling* experience but
teaches the site's breadth worst — and breadth is the stated problem.
Codex disagrees with this weighing and prefers a B hybrid; both positions
are laid out in §9 for Joey to judge — **D1 is genuinely contested.**

## 5. Content & imagery plan

- **Photography, not tiles, above the fold.** The hero block leads with a
  real photograph of Taylor from the repo's credited corpus
  (`moment.photos`, 1,000+ entries with url + credit), credit line rendered
  on or under the image, selection rule guaranteeing a photo-carrying
  moment (§4A). Era-art tiles remain the era grid's identity — correct
  there, insufficient as the door. Hard bars carry over from the photo
  policy (2026-08-12 + 2026-07-09 decisions): **no AI-generated images
  ever**, no watermarked images, no uncredited use; takedown on request
  without argument.
- **Copy register:** the site's existing voice — lowercase-warm, a fan
  telling a fan; **Taylor**, never bare "Swift"; no AI-tell phrases, none of
  the banned openers. The model is the THREADS kickers already shipped in
  `lenses.ts` ("A love story, in real time" · "The secrets she plants" ·
  "One clue, one payoff"). Block-kicker glosses are written in exactly that
  register, one line each, e.g. (draft, for Joey's edit, not final copy):
  - **Eras** — twelve chapters of her life, newest first
  - **Threads** — one storyline at a time, across every era
  - **Mood** — tell it how you feel, it hands you the songs
  - **Clownbot** — the theories, graded for delulu
  - **Marketplace** — the looks and the merch, era by era *(when built)*
  - **Community** — where the fans actually are *(when built)*
- **Section blocks show real items verbatim** — a moment preview renders
  the same underlying data era mode renders, sourced and dated; nothing is
  written *for* the landing page, so the no-fabrication bar is inherited
  rather than re-policed. Rumor-tier and confidence chips render exactly as
  they do in the feed.
- **Thread copy dependency:** the THREADS block displays whatever card copy
  `lenses.ts` carries — DoD items 2/3 (differentiating the twin cards) land
  there and this page inherits the fix automatically. This brief does not
  solve items 2/3 and does not block on them.

## 6. Acceptance criteria

Mobile AND desktop, each testable:

**Experience**
1. A first-time visitor on a 390×844 viewport sees, without any
   interaction: the wordmark, every existing top-level section pill, and
   the start of a real, dated content block. One swipe scrolls real
   content. Every section's gloss is on the page (as its block kicker)
   within the scroll.
2. Every pill navigates to its section; wordmark returns to the front page;
   browser back from any section returns to the previous surface (never a
   dead end, never a stranded state). Deep links (`?item=`, `?lens=`,
   `?era=`) bypass the front page exactly as today.
3. Adding a new section (rehearsed with a stub in review, since
   Marketplace/Community don't exist yet) requires only one section-registry
   entry (§3.3) — no nav or layout redesign. No placeholder/"coming soon"
   is ever rendered for an unbuilt section. The compact rail is exercised
   with 5, 6, and 7 stub entries in review (the 7th proves the overflow
   affordance).
4. The hero block shows a credited real photograph of Taylor with visible
   credit; no AI or watermarked imagery anywhere on the page. Freshness
   honesty (§4A): dates always real and shown; "on this day" only on exact
   match; empty blocks omitted, never filled.
5. The era grid block's heading enters the viewport within 4 viewport
   heights of scroll on 390×844 at default font scale, and the Eras pill
   reaches the grid in one tap from anywhere.
6. Returning-visitor behavior: the era-stream scroll snapshot contract
   (experience doc §5.6) still holds — a plain toggle away and back
   restores position; explicit jumps land at the top.

**Performance (the Tier-0 discipline)**
7. The front page adds **zero** to the Tier-0 data budget beyond selection
   over already-resident data; `npm run check:budget` stays green.
8. No third-party iframe mounts on the front page without a click
   (2026-08-11 click-to-load decision, no exceptions). Images below the
   fold are lazy; the hero image is prioritized.
9. Mobile Lighthouse on the front page: LCP ≤ 2.5s (throttled), CLS < 0.1 —
   every block reserves its aspect ratio.

**A11y (the repo's gate)**
10. The rail is a labeled nav landmark; active section exposed via
    `aria-current`; every target ≥ 44px; icon-only compact tabs carry
    explicit accessible names (#656 lesson); no nested interactive
    elements; heading order is sane (one h1); visible focus throughout;
    daily-rotation blocks are inert content; `prefers-reduced-motion`
    respected.

**SEO / discoverability basics (#653, Nils's lens) — written as an output
test** (Codex finding 4, accepted: `'use client'` components still
prerender; the requirement is on the served HTML, not the architecture):
11. Fetching `/` with JavaScript disabled yields HTML containing: the h1,
    every rendered block's heading, at least one stable dated moment with
    its source/credit text, the page `<title>` + meta description (already
    supplied by layout metadata — keep them accurate), and an **OG image**
    (the actual gap today). Client-side daily rotations are NOT required in
    the initial HTML — the crawler sees the stable build-time fallback, and
    that is fine; do not introduce request-time rendering for rotation.

**Process**
12. After this brief is approved, rendered mockups (390×844 + desktop, real
    six labels, real content) go to Joey **before implementation starts**,
    and Joey verifies the built page on his own phone before item 1 closes
    (the DoD's own bar, twice).

## 7. Decisions for Joey — what approving this brief means

Approving this brief approves D1–D6 as written unless Joey overrides them
inline. A build session should be able to implement from this section alone.

| # | Decision | Recommendation | Alternatives |
|---|---|---|---|
| **D1** | Direction — **contested, see §9** | **Concept A, "The Front Page"** with the §4A freshness honesty contract | Codex recommends: Concept B hybrid (land in current era, glossed masthead). Also open: C "Twelve Doors" |
| **D2** | Top-level section count | **Six pills** — Clownbot stays a peer (§3.1); nav sized for six, overflow affordance proven for seven | Fold Clownbot under another section (say which) |
| **D3** | Compact nav position | **Sticky top rail, mobile and desktop** (§3.2 — bottom bar rejected on prior on-device evidence) | Bottom tab bar, only via device-tested prototype + Wyatt sign-off |
| **D4** | "Threads" naming | **Keep "Threads", gloss does the explaining** (as block kicker) | Rename; candidates if wanted: "Storylines" / "Story Arcs" (DoD: a rename is a founder call, offered, never unilateral) |
| **D5** | Front-door imagery | **Lead with credited real photos of Taylor** in content blocks; era art stays on the grid tiles (§5) | Era art everywhere (status quo) |
| **D6** | Approval path | **Two-step: this brief locks direction → rendered mockups (real labels, real content, both viewports) get Joey's approval before code** | One-step (build from this brief directly — not recommended; DoD item 1 asks for mockups) |

Per project convention, the approved decisions get propagated verbatim into
the implementation ticket(s) so no build session re-asks them, and a
`docs/decisions.md` entry records D1/D2 (they supersede the 2026-07-15
landing decision).

## 8. Out of scope — deliberately not covered here

- **Marketplace and Community themselves** — item 4 gets its own specs;
  this brief only reserves their slots (§3.3). The full section-registry
  field list is those specs' implementation detail.
- **Thread card differentiation** (DoD items 2/3) — lands in `lenses.ts`
  independently; this page inherits it.
- **Video playback consistency and inert cards** (#2051, #2050) — the front
  page renders existing data through preview components and takes whatever
  fix those tickets land; nothing here depends on or preempts them. No
  video block ships on the front page in v1 (avoids designing against
  #2051's open option).
- **Path-based section URLs / full SEO restructure** (#653 beyond §6.11),
  notifications, accounts, personalization ("your era" memory), Mood
  scoring coverage gaps, the Clownbot scope decision (DoD item 7), and any
  content authoring.
- **Copy finalization** — glosses and taglines in §5 are drafts for Joey's
  edit; the register is the spec, the words are placeholders.

## 9. Contested points — what the debate did not settle

One Codex adversarial round ran 2026-08-13. Four findings were accepted and
are already folded in above (freshness honesty §4A; top rail not bottom bar
D3; SEO criterion as an output test §6.11; glosses moved out of pills +
rendered-mockups gate D6). Two disagreements survive, unsettled, for Joey:

**1. Concept A vs a Concept B hybrid (decision D1).**
- *Codex's position:* A "front page" on a static site overpromises freshness
  and adds a seventh surface with real build/test cost the draft
  understated; Concept B lands the visitor in the site's best existing
  surface (the era stream) with a glossed masthead, needs almost no new UI,
  and makes no freshness promise at all. Prefer B.
- *Claude's position (the brief's recommendation):* the stated problem is
  breadth — "a new user may not get it" — and B teaches breadth worst: its
  glossed masthead scrolls away one swipe in, after which the cold visitor
  is deep in one era with no example of Threads, Mood, or anything else.
  A's staleness risk is real but bounded by the §4A honesty contract
  (labels never claim more freshness than the data has), while B's
  breadth-blindness has no equivalent mitigation. The extra surface cost is
  real and now stated honestly; it buys the only concept that meets every
  DoD criterion.
- *For Joey:* this is a taste-level product call — "show them everything
  honestly dated" (A) vs "drop them into the deepest single experience"
  (B). Pick A or B; either is buildable from this brief (B inherits the
  same rail, glosses, freshness honesty where applicable, and registry
  contract).

**2. How much IA to lock before Marketplace/Community are specced
(decision D2).**
- *Codex's position:* don't approve a permanent six-section IA while
  Marketplace, Community, and Clownbot's scope are all undecided; a
  transient store mode can't serve item-level cross-links, so defer D2
  until a route-capable section registry is designed against real specs.
- *Claude's position:* deferring D2 recreates the deadlock item 1 exists to
  break — item 4 explicitly waits on the landing page knowing its pill
  count. The brief therefore locks only the *shape* (registry entry =
  pill + block + mode + deep-link namespace + theming/share/search seams,
  §3.3) and the *sizing* (six, with a proven overflow affordance for
  seven), and leaves every registry field beyond that to the item-4 specs.
  The deep-link requirement Codex raised is accepted and already in the
  contract.
- *For Joey:* approve D2 as "six slots + the contract shape" (recommended),
  or hold the nav at four and accept that item 4's design re-opens the
  landing page.

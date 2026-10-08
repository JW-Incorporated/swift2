# v0 Prompt — "Long Live" (Vault V1)

> **Historical artifact.** This is the original generation brief pasted into
> v0 to bootstrap the shipped experience. Kept for provenance/rationale, not
> as current documentation — **`docs/longlive-experience.md` is the source of
> truth** for what actually shipped and has since diverged from this prompt:
> "Lens Mode" here became **Threads mode**; the app shipped with **12 eras**
> (this prompt specs 11 — TTPD was "current" here; *The Life of a Showgirl*
> era was added later); the "peek strip" scrubber described below was replaced
> by a persistent era rail (see `docs/decisions.md`, 2026-07-04); and the Clue
> Web / Crossings features in the current build didn't exist in this prompt.
> Don't implement against this doc — implement against `longlive-experience.md`.

Paste everything below the line into Vercel v0. It's written as a single
generation brief. If v0 asks to split it, let it build the shell + Era Mode
first, then add Lens Mode.

---

You are the best product designer and front-end engineer in the world, and you're building the flagship experience for a Taylor Swift super-fan app. Go all-in on the UX. I want people to open this and go "oh my god." Build the whole thing.

## What we're building

**"Long Live"** — an interactive time machine through Taylor Swift's entire career, era by era. It's an unofficial, independent fan project (not affiliated with or endorsed by Taylor Swift or her team — include a small, tasteful "unofficial fan project" note in the footer). The goal is to let a fan *step into* any moment of Taylor's life and discover things they never knew: the music, fashion, tours, relationships, business battles, and the Easter eggs and lore that superfans obsess over.

Audience: real Swifties and curious newcomers. Tone: made-by-fans, editorial, reverent but playful — never corporate. This is V1, unmonetized; the goal is delight and engagement so people stay for long sessions and share it.

**No login. Guest browsing only.** The user lands straight into the experience.

## Tech + constraints

- Next.js (App Router) + TypeScript + Tailwind + shadcn/ui.
- **Mobile-first**, but must be equally polished on desktop.
- Use tasteful placeholder/representative imagery and mock data throughout — structure the mock data cleanly (an array of eras, each with milestones and content items) so it's trivial to swap for a real API later.
- Implement **per-era theming as swappable design tokens** — one theme object per era (colors, typography, texture/mood) applied via CSS variables at the root, so the *entire UI* re-skins when the era changes. This is central, not decorative.
- The signature timeline interaction must feel 60fps-smooth. Drive it with CSS transforms + requestAnimationFrame, not React state per pointer-move.
- Design for 2026: modern, clean, confident. Cinematic but never cheesy or skeuomorphic. Think Apple-keynote restraint applied to fan culture.

## The core idea: TWO navigation modes

A prominent, elegant mode toggle switches the whole app between:

### 1) ERA MODE (default) — travel *within* one era at a time

- On load, the user is **immediately inside the current era: "The Tortured Poets Department" (2024–2025)**. Make it visually unmistakable that this is the present — e.g. a "You are here / Now" marker on the timeline and a subtle "Current era" label.
- A beautiful, tactile **era selector** lets them jump to any of the 11 eras (visual chips/cards, each previewing that era's color + mood). Switching eras triggers a smooth, theatrical-but-tasteful transition as the whole UI morphs to the new era's theme.
- **The signature timeline scrubber** (most important interaction):
  - A persistent thin **"peek strip"** sits at the top, always discoverable.
  - **Grabbing/dragging** it expands it into a full timeline navigator for the *current era only* (not all eras at once).
  - The bar is **linear across the era's date range**, with **milestone markers** (album release, tour, major life events) placed where the big moments happened — denser markers = more to explore.
  - **Thumbing/hovering** along the bar shows a live **preview** (thumbnail + date + headline) of that moment.
  - Snap to era boundaries. Show a "Now / You are here" indicator when in the current era.
- **Content within an era is chronological, newest-first at the top, scrolling *down* goes back in time.** Rich content cards: hero image, date, a short original summary, and tags (Music / Fashion / Tour / Relationship / Lore). Everything is presented **on our site** — the user should never need to click out to consume content. Tapping a card opens an immersive in-app detail view, not an external link.
- Weave in **lore and Easter eggs**: a recurring "hidden clue" treatment (e.g. a subtle glint/marker on certain cards) that expands to reveal the clue and its payoff. Superfans should feel rewarded for looking closely.

### 2) LENS MODE — cross-era visual timelines (this is the wow-differentiator)

Instead of one era, the user picks a **Lens** and the whole app reshapes into a single beautiful data-visual spanning *all* eras. Build these 4 lenses, each as a distinct, gorgeous visualization:

1. **Love Story (relationships).** A horizontal life-line across all eras. Each relationship is a bar whose *length = its duration*; single stretches show as gaps between bars. Each bar expands to reveal the era it happened in and the songs widely believed to be about it. Make durations and gaps genuinely readable at a glance.
2. **The Fashion Runway.** Taylor's signature looks laid across the eras like a runway/gallery (curly hair + cowboy boots → red lip → cottagecore cardigan → sharp bodysuits, etc.). Each look is a rich image card. **Design "Shop this look" affordances into the cards (visually present but inert for now)** — a subtle button/tag that would later hold affiliate links, without cluttering or hurting the browsing experience.
3. **Taylor's Version (the masters battle).** The saga of Taylor re-recording and reclaiming her catalog. Visualize it as a dramatic progress story: originals vs. reclaimed, a "how much of the catalog she's won back" progress indicator, and the "From the Vault" unlock moments along the way.
4. **The Easter Egg Web.** Not a linear timeline but a *constellation/network* graph: clues she planted connected by lines to their later payoffs across years. Nodes expand to explain the clue → reveal. This is the superfan's playground — make it feel like uncovering a secret map.

Design the Lens toggle UI so more lenses can be added later — show these 4 as active and leave room for a "more coming" state.

## Sharing (growth engine — build this in)

Any era card, era view, or lens view can be **shared to social**. Generate a share-card image that captures the **exact styling of that era or lens**, so what lands on social is unmistakably from "Long Live" and carries the magic of the app. Include a visible Share affordance and a nice preview of the generated card.

## The 11 eras + theme direction

Land on #11 by default. Give each its own token set (colors, typography feel, texture/mood):

1. **Debut** (2006–2008, *Taylor Swift*) — teenage Nashville country; curly hair, cowboy boots. Warm golds, denim, sunlit; friendly serif / handwritten accents.
2. **Fearless** (2008–2010) — sparkly gold, fairy-tale, teenage heartbreak turned anthemic. Gold shimmer, warm; romantic display type.
3. **Speak Now** (2010–2012) — written solo; ballgowns, purple stage light, theatrical. Deep violets/purples; elegant script.
4. **Red** (2012–2014) — red lips, autumn, heartbreak across every genre. Reds + rust + fall tones; bold confident type.
5. **1989** (2014–2017) — full pop reinvention; New York, Polaroids, seagulls. Clean pastels + sky blue; crisp modern sans.
6. **reputation** (2017–2019) — snakes, black-and-white, armored, defiant. High-contrast monochrome; sharp industrial type.
7. **Lover** (2019–2020) — pastel skies, glitter hearts, romance loud again. Pink/purple/blue gradients; soft rounded type.
8. **folklore** (2020) — surprise pandemic album; cottagecore, cardigans, literary, woods. Muted grayscale/sepia; classic serif, lowercase.
9. **evermore** (2020–2022) — folklore's sister; flannel, autumn woods, piano ballads. Warm rust/brown, muted; serif.
10. **Midnights** (2022–2024) — late-night, diaristic, moody blues & purples; run-up to the Eras Tour. Deep navy/indigo/purple; retro-70s type.
11. **The Tortured Poets Department** (2024–2025, **CURRENT / default**) — bruised, word-heavy, black-and-white, typewriter, literary. Monochrome + ink; typewriter/serif type.

## Accessibility

Themes get wild, but keep body text readable — maintain a sensible contrast floor for content even inside dramatically-styled eras. Support keyboard navigation for the timeline and reduced-motion preferences (offer a calmer transition when `prefers-reduced-motion`).

## Deliver

Build the full experience: the era-mode reader with the morph-on-grab timeline scrubber, the era selector, all 11 themed eras, both Lens Mode with the 4 lenses, the share-card generator, and the guest-first landing that drops the user into the current era. Make it feel like a finished, jaw-dropping product — not a wireframe.

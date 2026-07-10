# The Proposal thread — handoff for Claude

This is the sourced Taylor × Travis Kelce story thread (first game → engagement → the
2026 wedding). It's the emotional high point of the Threads section — the "Love Story"
thread resolves INTO this one, ending at the wedding.

Built in the **"Feed design exploration"** v0 workspace. Two files:

- `components/threads/the-proposal-thread.tsx` — the experience component (drop-in, `'use client'`).
- `app/page.tsx` — demo harness with sample beats + per-era palettes (reference only; replace with real data).

> NOTE: this exploration workspace is a fresh scaffold, NOT the swift2 repo. When porting into
> `apps/web`, wire the component to the REAL sourced Threads content — do not ship the placeholder
> copy in `app/page.tsx`. The data shape and grouping are built to drop straight in.

---

## What's already built (ship-ready layout, content is the remaining work)

**Structure.** Beats are grouped into named **acts/chapters** (The Setup → Going Public →
The Championship Season → A Life In View → The Proposal → The Wedding). A sticky top **chapter
rail** navigates by act (NOT by beat — that would overflow) with a live scroll-progress fill and
click-to-jump. IntersectionObserver tracks the in-view beat.

**Why NOT the right-edge career scrubber:** the shared 2006→today scrubber is a *chronology*
instrument for threads that fan across her whole career. The Proposal is a tight 2023→2026 arc;
a full-career axis would crush the whole climax into the bottom ~15% of the rail. So this thread
uses a horizontal chapter rail + progress fill instead. Keep the career scrubber for genuinely
timeline-spanning threads.

**Data model** (`ProposalBeat` in the component):
`{ id, date, dateLabel, eraId, chapterId?, title, body, source?, quote?, image?, decode?, songConnections?, links?, finale? }`

Three "experience" features already implemented and wired:

1. **`decode`** — tap-to-reveal "did you catch this?" Easter egg (`{ prompt, reveal }`). Renders as
   a dashed accent card that expands on tap. This is the re-read/"WAIT did you know" hook.
2. **`songConnections`** — the life→song "learn something new" cards
   (`{ song, album?, eraId?, note, confidence, href? }`). **CONTENT-INTEGRITY RULE (hard, not
   optional):** `confidence: 'confirmed'` renders a solid accent pill; `confidence: 'fan-theory'`
   renders a dashed outline "Fan theory" pill. A fan reading is NEVER dressed up as fact — this
   mirrors the reference-image rule. Preserve this distinction when filling real data.
3. **`links`** — weave chips that deep-link into the rest of the app (song meaning pages, the Love
   Story thread, era pages). Threads must link into existing content, never restate it.

**Image integrity:** `image.kind: 'reference'` renders dashed + desaturated + a persistent
"Reference — not the actual moment" badge + "Reference image." caption prefix. `'primary'` gets a
subtle "Photo" tag. There is no code path where a reference image renders like the real one.
The proposal + wedding beats currently use `REF(...)` placeholders — swap for the couple's own
RELEASED photos (set `kind: 'primary'` + real `credit`).

**Immersion feature shipped — scroll-driven era re-theming (the big one):**
`EraAccent` can now carry a full `theme` (`bg / ink / inkSoft / surface / surface2 / line / font`)
that maps 1:1 to the app's `--era-*` tokens. The component tracks the in-view beat's `eraId` and
morphs the container's CSS vars over a 700ms transition (`motion-reduce:transition-none`). So
Midnights beats glow navy, TTPD fades to washed ink, Lover blushes pink, the finale settles into
Showgirl gold. Missing tokens gracefully inherit the global theme, so partial palettes are safe.
=> When porting, feed the REAL per-era `--era-*` values from the app's era theme system into
`eraAccents[eraId].theme` instead of the demo approximations in `app/page.tsx`.

---

## Superfan verdict / guiding principle

A timeline is skimmed in 90 seconds. The goal is a thread fans RE-READ and SHARE (10+ min):
they should LOVE it, LEARN something new, and DRAW CONNECTIONS they didn't have before. The
decode + song-connection + weave layers are the engine for that — keep pushing content depth
(verified receipts, more life→song links, more cross-links), do NOT thicken card chrome to fake
depth.

---

## Next steps (v0's 5 immersion ideas — ranked, DO THESE)

Ranked by emotional return. #1 and #2 are the highest-value.

### 1. Real media, inline  ← highest priority
- Spotify **track** embeds on the `songConnections` cards (So High School, The Alchemy, Karma,
  You're On Your Own Kid). Hearing the song while reading its beat is the unlock color can't give.
- The couple's ACTUAL released photos on the proposal + wedding beats (replace the `REF()`
  placeholders; set `kind: 'primary'`).
- **MEDIA ID DISCIPLINE (from user memory — do not skip):** never trust memory/search for Spotify
  album/track IDs or YouTube video IDs. ALWAYS verify via oEmbed
  (`open.spotify.com/oembed`, `youtube.com/oembed`) with curl before hardcoding. Multiple
  hallucinated IDs have been caught this way. `next.config.mjs` already allows `i.ytimg.com` for
  YT poster thumbnails. Prefer click-to-play facades (no autoplay, no re-hosting) — matches the
  existing MomentVideo pattern.

### 2. Cinematic cold open
- A short full-bleed hero BEFORE Act 1: one hero image, the kicker, and a single priming line
  (e.g. "It started with a friendship bracelet he never got to give her") to set the emotional
  read before the timeline starts. Should feel like a book's title page.

### 3. Scroll-reveal choreography
- Fade/rise each beat in as it enters the viewport so the story feels like it UNFOLDS rather than
  arriving pre-rendered. Must respect `prefers-reduced-motion` (the era re-theme already does).
- The component already has an IntersectionObserver tracking beats — extend it, don't add a second.

### 4. "You are here in her discography" micro-map
- Since we dropped the full career scrubber, add a tiny era ribbon that fills as the reader passes
  each era — the cross-era payoff without the dead vertical space. Should read alongside the
  existing chapter rail, not replace it.

### 5. Ambient era audio hook (opt-in)
- A few seconds of the era's signature track on a beat. MUST be opt-in, muted by default, and
  accessibility-gated. Lowest priority / nice-to-have; don't let it compromise the a11y baseline.

---

## Content-fill checklist (verify against primary sources before shipping)
- [ ] Replace ALL placeholder copy in `app/page.tsx` with the real sourced Threads beats from `apps/web`.
- [ ] Verify every `songConnections[].confidence` tag — confirmed only if Taylor/official-source
      stated or a lyric unambiguously names it; everything else is `fan-theory`. This is the trust signal.
- [ ] Verify every `decode.reveal` against a primary source (same discipline as the Decode thread handoff).
- [ ] Fill real per-era `theme` palettes from the app's `--era-*` token sets.
- [ ] Swap `REF()` proposal + wedding images for the couple's released photos (`kind: 'primary'` + credit).
- [ ] Wire `links[].href` to the real routes (song meaning pages, `/threads/love-story`, era pages).
- [ ] Confirm the "Love Story" thread's terminal state links forward into this thread (the resolve-into handoff).

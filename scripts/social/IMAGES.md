# Social images — tools, library, and naming convention

Why this exists: Instagram media must be a URL on the deployed site
(`https://www.longlivets.com` + a path), so every image a post references has
to already be committed to `apps/web/public/**` before the post can go out.
Before this, the only committed images were 12 generic era tiles
(`apps/web/public/eras/*.png`), so every IG post used one of the same 12
pictures regardless of what it was about. These two tools fix that:

- **`render-card.mjs`** — designs a card (text hook, photo + scrim, or quote)
  in the site's own visual language.
- **`capture-screens.mjs`** — screenshots an actual live surface of the site
  (a thread, an era, a moment, the Mood chat) as its own post image.

Founder's standing rule for what's allowed as media (2026-08): (1) site
screenshots and designed text cards, (2) clearly-safe real photos — Wikimedia
Commons free-license is the sanctioned source (`upload.wikimedia.org/
wikipedia/commons/...`; **not** `.../wikipedia/en/...`, which is English
Wikipedia's non-free fair-use path and is not safe to redistribute as our own
asset) — with some risk tolerance elsewhere where clickability demands it.
Every image must make the post's subject obvious at a glance.

## `render-card.mjs` — designed cards

```
npx tsx scripts/social/render-card.mjs \
  --variant text --era midnights --icon sparkles \
  --eyebrow "The Threads" --headline "Feral about a bridge" \
  --kicker "Tell it how you feel. Get the song." \
  --out apps/web/public/social/library/mood-feature.png
```

Also available as `npm run social:card -- <args>`.

Must run under `tsx` (not plain `node`): it imports
`apps/web/lib/longlive/eras.ts` directly for palette data — one source of
truth, so a color tweak on the site is picked up automatically instead of
drifting out of sync with a duplicated palette. See
`scripts/social/lib/era-palette.mjs`.

**Variants** (`--variant`):

- `text` — the default. Era-bg card, gold/era-accent eyebrow, big serif
  headline, optional kicker line, a low-opacity oversized watermark icon
  (`--icon sparkles|layers|compass`, matching the app's own Mood/Threads/Eras
  nav icons) to fill the negative space above a bottom-anchored composition.
- `photo` — full-bleed background photo (`--photo <path-or-url>`) with a dark
  scrim tinted in the era's own background color, same headline treatment in
  white, `--credit` renders small at the bottom.
- `quote` — centered composition with an oversized decorative quote mark,
  italic headline, `--kicker` as the attribution line.

**Sizes** (`--size`): `portrait` (1080×1350, default — IG feed 4:5, most
room for a hook) or `square` (1080×1080).

Output is always PNG. resvg's default PNG encoder doesn't compress hard
(a 1080×1350 photo card came out ~1.5MB); every render is re-encoded
losslessly through `sharp` at max effort before being written, which cut that
same file to ~390KB with zero quality loss — see the comment in
`lib/card-render.mjs`.

### Design system

Modeled on `apps/web/app/opengraph-image.tsx`'s look (dark warm background,
gold serif eyebrow, era-palette accent) but built for feed posts instead of a
single 1200×630 link-preview size. Fonts are the exact two the live site uses
(`apps/web/app/layout.tsx`): Playfair Display for headlines, Inter for
everything else, loaded from `@fontsource/*` static files (no network fetch
at render time — deterministic in CI). Deliberately **not** centered-text-on-
a-flat-color, which is the generic-template look this exists to avoid: the
`text` and `photo` variants are bottom-anchored and asymmetric; `quote` is
the one centered layout, which is enough variation that the library doesn't
read as one template stamped three times.

## `capture-screens.mjs` — live site screenshots

```
node scripts/social/capture-screens.mjs --lens the-proposal \
  --out apps/web/public/social/library/thread-the-proposal-screen.png

node scripts/social/capture-screens.mjs --mood \
  --out apps/web/public/social/library/mood-chat-screen.png
```

Also available as `npm run social:capture -- <args>`. Runs under plain
`node` (Playwright only, no TypeScript imports).

**Targets** (pass exactly one): `--lens <id>` (`/?lens=<id>`), `--era <id>`
(`/?era=<id>`), `--item <id>` (`/?item=<id>`), `--mood` (clicks the Mood tab
— there's no deep link for it, see `apps/web/components/longlive/TopBar.tsx`'s
`ModeToggle`), or `--url <path>` as an escape hatch for anything else.

**Options**: `--viewport mobile|desktop` (default `mobile`, 390×844 @2x — a
common modern-phone CSS viewport, IG-friendly; `desktop` is 1280×800 @2x),
`--base-url` (default `https://www.longlivets.com`).

Captures the exact viewport (`fullPage: false`) — no browser chrome, no
arbitrarily-tall scroll capture. Waits for the target surface to be visibly
settled before shooting (see `waitForReady` in the script — same
role/label locators already proven out in `e2e/vault.spec.ts`), and
dismisses the first-visit "Got it" timeline hint that would otherwise always
fire in a fresh Playwright context with no local storage history.

## `seed-library.mjs` — regenerating the reusable library

```
npx tsx scripts/social/seed-library.mjs            # everything
npx tsx scripts/social/seed-library.mjs --cards     # cards only (fast, no browser/network)
npx tsx scripts/social/seed-library.mjs --screens   # screenshots only (hits the live site)
```

Also available as `npm run social:seed-library`. One declarative list of
every reusable library asset (`scripts/social/seed-library.mjs`) instead of
re-typing each `render-card.mjs`/`capture-screens.mjs` call by hand — run
this again after a copy or palette change instead of hand-rolling the
individual commands.

## Naming convention

- **Dated one-off assets** (tied to a specific queued post, won't be reused):
  `apps/web/public/social/<YYYY-MM-DD>-<slug>.png`
- **Reusable library assets** (referenced by more than one post over time):
  `apps/web/public/social/library/<category>-<slug>.png`, where `<category>`
  is one of:
  - `thread-` — one of the six threads (`the-proposal`, `love-story`,
    `fashion`, `taylors-version`, `easter-eggs`, `hidden-clues`)
  - `mood-` — the Mood feature
  - `era-` — an era timeline
  - `feature-` — anything else app-level (e.g. quote-card demos)

Keep each asset under ~1.5MB — a soft budget for fast-loading IG media, not
a hard technical limit (Instagram's publish API accepts PNG; the pipeline's
existing `apps/web/public/eras/*.png` tiles already exceed it in a couple of
cases). `render-card.mjs` output stays comfortably under this by construction
(see the sharp re-encode note above); screenshots vary with page content but
have all landed under 900KB in practice.

## Current library (`apps/web/public/social/library/`)

| File | What |
|---|---|
| `thread-<id>-screen.png` × 6 | Mobile screenshot of each thread (`/?lens=<id>`) |
| `thread-<id>-intro.png` × 6 | Designed intro card, one per thread |
| `thread-the-proposal-photo.png` | Photo-variant demo — Commons photo + scrim, End Game thread |
| `mood-chat-screen.png` | Mobile screenshot of the Mood chat with starter chips visible |
| `mood-feature.png` | Designed card for the Mood feature |
| `era-midnights-screen.png`, `era-tloas-screen.png` | Mobile screenshots of two visually strong eras |
| `feature-quote-demo-kelce.png` | Quote-card demo — a real, sourced quote already used in the site's own content (`content-vault.generated.ts`'s `pullQuote` on the friendship-bracelet moment, sourced to Billboard/E! Online) |
| `feature-quote-demo-theory.png` | Quote-card demo — openly-framed speculation attributed to Long Live itself, not to any real person or community |

Regenerate all of the above with `npm run social:seed-library`.

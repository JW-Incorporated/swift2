# PLAN.md — Merch page redesign to the marquee mockup

**Status:** ready. Written 2026-08-16. Source of truth for the design is Joey's
mockup, uploaded and read in full:
`C:/Users/Fourtys/.claude/uploads/251c92ba-8b68-437c-bca5-5bf9086c0788/dfff5d5b-longlivetsmerchmockup.html`

Joey: "I want the merch page to look like this… the color, the look and feel, the
flashing yellow lights, the way there's three sections, the navigation between
them. I want to keep all that… anywhere that we have something that's better,
keep that."

**Ignore from the mockup:** its logo and top nav (we have our own), and its
placeholder gradient "photography".

## The mapping that makes this work

`apps/web/lib/longlive/merch.ts:46-50` already defines THREE buckets. The
mockup's three sections are exactly these:

| Mockup section | Accent | Our bucket | State |
|---|---|---|---|
| From Taylor's shop | gold | `officialStore` | **EMPTY** (`merch.ts:78`) → placeholder |
| Made by Swifties | rose | `fanMade` | **EMPTY** (`merch.ts:79`) → placeholder |
| Seen on Taylor | lilac | `shopTheLook` | **156 real items** → the good stuff |

Joey: "you likely don't have links for a lot of the content in the sections that
we don't have content for, just leave placeholders for those for now."

## THREE RULINGS — do not re-litigate, do not improvise around

**R1. The garment-type filter row is NOT buildable and must not be faked.**
The mockup's Outerwear/Knitwear/Dresses/Shoes/Jewelry/Bags/Eyewear row has no
data behind it — `merch-filters.ts:1-10` states there is no `kind` field on
`Product`, deliberately. **Do not add a disabled or decorative filter row.** A
control that looks live and does nothing is the exact defect we removed from
this page yesterday. Instead, that row's POSITION and STYLING carry our real,
working filters: All / In stock / The exact piece / Under $50 / $50–200 / $200+.

**R2. Fonts: add Bodoni Moda only; reuse Inter for body.**
`layout.tsx` already loads Inter, Playfair Display, Special Elite, Dancing
Script via `next/font/google`. Bodoni Moda is the mockup's signature and is
distinct from Playfair, so it is worth one new family. Karla is close enough to
Inter that a second new family is not worth the weight on a mobile-first site.
Expose as `--font-bodoni`.

**R3. The merch palette is PAGE-SCOPED and overrides era skinning.**
The site re-skins per era through nine `--era-*` vars set on `.era-shell`
(`globals.css:25-35`). The mockup is a fixed identity. Merch opts out inside its
own wrapper. **Define these tokens once and every agent uses these exact names:**

```
--merch-ink:        #17102B
--merch-ink-2:      #1F1638
--merch-panel:      #271B47
--merch-panel-2:    #2E2153
--merch-line:       rgba(246,239,228,.14)
--merch-line-strong:rgba(246,239,228,.28)
--merch-cream:      #F6EFE4
--merch-muted:      #B0A2CB
--merch-gold:       #EBC97F
--merch-rose:       #E4578F
--merch-lilac:      #B49BEE
```
Per-section accent is `--acc`, set on the section element (gold / rose / lilac),
exactly as the mockup does.

## Component contracts — these are FIXED so work can run in parallel

Every agent builds against these signatures. Do not change them; if one is
wrong, stop and report rather than improvising a different shape.

```ts
// components/longlive/merch/MerchMarquee.tsx
export function MerchMarquee(props: {
  eyebrow: string;      // "Three racks · One page"
  title: React.ReactNode;
  lede: string;
  bulbCount?: number;   // default 34 per rail
}): JSX.Element;

// components/longlive/merch/MerchSectionRail.tsx
export interface MerchRailSection { id: string; label: string; count: number; accent: string; }
export function MerchSectionRail(props: { sections: readonly MerchRailSection[] }): JSX.Element;

// components/longlive/merch/EraSpine.tsx
export interface EraSpineEntry { key: string; name: string; year: string; color: string; count: number; }
export function EraSpine(props: {
  entries: readonly EraSpineEntry[];
  activeKey: string;                 // 'all' | era key
  onSelect: (key: string) => void;
}): JSX.Element;
```

## WORK SPLIT — four parallel agents, then one integrator

Wave 1 agents create NEW FILES ONLY under
`apps/web/components/longlive/merch/`. **No two agents touch the same file.**
None of them may edit `MerchSection.tsx` — that is the integrator's file.

- **A — `MerchMarquee.tsx`.** The signature hero: bordered panel, inset shadow,
  top and bottom rails of gold bulbs that flicker on a staggered delay
  (`@keyframes flick`, `animationDelay: i*0.11s`), eyebrow, display headline with
  an italic gold span, lede. **Must honour `prefers-reduced-motion: reduce` by
  disabling the animation** — the mockup already does this and it is not
  optional.
- **B — `MerchSectionRail.tsx`.** Sticky three-up rail with per-section accent
  dot, active underline, and IntersectionObserver scrollspy.
  **CRITICAL: it must call `measureChromeHeight()` / `measureChromeBottom()`
  from `lib/longlive/chrome-offset.ts` for its sticky offset — never a
  hardcoded constant.** That file measures `[data-ll-topbar]` and
  `[data-ll-filterbar]` live. "A sum of heights is not a position" is a
  documented trap in this repo; read `docs/engineering-lessons.md` first.
- **C — `EraSpine.tsx`.** Horizontal snap-scrolling era spine: year, name,
  count, colour bar; left/right arrow buttons; an "All eras" entry with a
  gradient bar; active era fills with its own colour; **an era with count 0 is
  disabled, and shows an em-dash, never "0"** (same honesty rule as the
  Community null counts). Keyboard accessible, real `<button>`s.
- **D — palette + font foundation.** `layout.tsx` (add Bodoni Moda per R2) and
  `globals.css` (add the R3 tokens under a `.merch-shell` class). Nothing else.

**Wave 2 — integrator (single agent, owns `MerchSection.tsx`):** compose the
three sections, wire the real filters into the mockup's filter-bar chrome, and
add placeholder treatments for the two empty buckets.

## KEEP — things of ours that are better than the mockup

The mockup is placeholder-grade in these places. Do not regress them:

- **Real product images** — 97 of 156 carry `imageUrl` from Shopify. The mockup
  uses CSS gradients. Keep ours.
- **The "Her look, not the product" label** on fallback cards, and the split
  card treatment (On Taylor | the piece) which our data genuinely supports.
- **"The exact piece" vs "We found something similar"** with the authored
  `altNote` rendered inline. The mockup's flat "Exact match / Close alternative"
  label is weaker — keep ours, restyled to fit.
- **The in-app "Her look" button** (`openItem(item.source.momentId)`), which
  opens MomentDetail. The mockup links nowhere.
- **`SuggestLinkBanner`** (shipped yesterday) — keep it; it satisfies the
  mockup's "submit strip" intent. Restyle to the dashed-border treatment if it
  fits.
- **`SubmitLinkForm`** and its Turnstile gate — do not touch its logic.
- **Real filters** per R1.

## Placeholders for the two empty buckets

Both sections must render, look deliberate, and be honest that they are not yet
populated. **They must not fabricate products, prices, makers or links.** An
empty-state panel in the section's accent colour explaining what will live there,
consistent with the mockup's `.empty` treatment. Section counts in the rail show
the real number (0), never an invented one.

## Definition of done

- Three sections, three accents, sticky rail navigates between them with scrollspy
- Flashing bulbs, with `prefers-reduced-motion` honoured
- The mockup's palette and Bodoni display type
- Era spine filters the 156 real shop-the-look items; counts real; 0 → disabled + em-dash
- Real filters in the type-row position; no fake controls
- Empty buckets render honest placeholders
- Product images, exact/similar badges, "Her look" button, SuggestLinkBanner all preserved
- No horizontal overflow at 360px; verified in a BROWSER, not from the suite
- `npm run typecheck --workspace=@swift2/web` clean; full `npm test` green
- Files under ~300 lines each (MerchSection.tsx is already 316 — the split is
  part of this work, not optional)

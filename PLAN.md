# PLAN.md — Community + Merch become one section, redesigned

Branch: `feature/community-social-merch`, cut from `main` at `22314d5b`.
**GitHub Actions is down (billing), so this stays local and committed until it
returns.** The worktree's objects live in the real repo, so local commits are
durable.

Joey, 2026-08-14: "we're going to drop merch from nav and combine community and
merch… a 50/50 split button that goes all the way across the screen that lets
you select between social and merch… we also need images on every single piece
of merch… at the top of that page there needs to be some sort of way to jump to
the various sections. that also acts as a sort of preview… same for merch. merch
has to be organized in some way… Taylor Swift official merch should be its own
selector, fan-made merch should be its own selector… filters similar to the eras
filters."

## STATUS: STEPS 1–5 READY. ONE OPEN QUESTION LEFT.

The design has landed and the image blocker is **resolved** — 150 of 156
products can use their source moment's photo, verified by execution. **Only the
official/fan-made selector still needs Joey**, and the design answers it well
enough to build without him (render-gate on a non-empty bucket), so nothing is
actually stalled. Steps 1–5 can all proceed.

---

## The facts, measured (scout, 2026-08-14)

These are counted, not assumed. Every design decision below rests on them.

| Fact | Value | Consequence |
|---|---|---|
| `Product` image field | **Does not exist** | No product carries its own image |
| **`shopTheLook` products** | **156** (NOT 151 — that is the moment count) | Two agents and my first report got this wrong; 151 is `distinctMoments` |
| **Products whose source moment has a REAL photo** | **150 of 156 (96%)** | **The image ask is UNBLOCKED** — use the moment photo (the look as worn) |
| Products needing the fallback tile | **6** | Brand-monogram tile, never a photo that isn't the look |
| Distinct source moments | 151 (145 real photo, 6 era-art only) | Several products share one moment |
| `officialStore` | **0** | Selector would ship empty |
| `fanMade` | **0** | Selector would ship empty |
| Filterable fields on `Product` | `brand` (151 distinct), `retailer` (40+), `price?`, `inStock?` | Neither brand nor retailer is a usable filter at that cardinality |
| **`MerchItem.source`** | carries an **`EraId`** + moment slug/title | **The one real filter dimension we have today** |
| `FilterBar` reusability | **None.** Hard-wired to `FilterId`, `ALL_FILTERS`, `TAG_COLORS`, `FILTER_ICON` | Needs a generic extraction; do not fork it |
| Generic segmented control | **Does not exist** | The 50/50 toggle is a new component |
| Community page height | **~6,600px, ~11 mobile screenfuls** | Confirms Joey's complaint quantitatively |
| Platform render order | Discord (10), Reddit (3), Forum (4), Facebook (4), Tumblr (2), AO3 (2), Steam (1), Wattpad (1) | Facebook is 4th of 8 — the "too far down" case |
| Files touched by removing a mode | **14** (11 components + `store.tsx`, `share.ts`, `gloss-rotation.ts`) | Bigger than it looks; own it in one step |

## Open questions — Joey's calls, blocking the merch half

1. ~~**Merch images**~~ — **RESOLVED, no longer blocking.** Verified by running
   `hasRealPrimaryImage()` over the real catalogue (not by grep — see the
   warning in `types.ts` that "has images alone proves nothing"): **150 of 156
   products can show their source moment's photo**, the look as worn. Those
   images already render in the era feed, so there is no new sourcing and no
   hotlink risk. **6 get the brand-monogram fallback.** Build it.
2. **Official / fan-made selectors (blocks that part of the ask).** Both buckets
   are empty. Options: **(a)** don't ship the selector until there is data;
   **(b)** ship it with an explicit empty state that says what is coming.
   Shipping a silently-dead tab is not an option.
3. **Does "filters similar to the eras filters" mean era filters?** If yes it is
   buildable off `MerchItem.source.era`. If he meant category filters
   (clothing / vinyl / jewellery), **that field does not exist** and is another
   content task.

## The design (Fable evaluation, 2026-08-14) — build from this, don't improvise

Measured on the running site: **Community 7,961px with Facebook 4.6 screens
down; Merch 15,477px as one flat list** (~25k on a phone). Desktop numbers are
measured; mobile is projected from the single-column breakpoint (the viewport
could not be resized — treat mobile figures as conservative estimates).

**The chrome rule that makes this work — one sticky element, ever.** H1 →
big 50/50 toggle (48px) → rich index all sit in NORMAL FLOW and scroll away.
A single **44px rail** then pins under the TopBar, holding a compact
Social/Merch mini-toggle + the jump chips in one row. The rail appears exactly
when the big toggle leaves the viewport (IntersectionObserver), so there is
never a frame showing both. Total pinned chrome ≈ 96px. **Never two sticky bars.**

**The index — counts are the preview.** Chips carry their number
(`Discord 11`, `Midnights 23`) plus a summary line (`30 communities · 8
platforms` / `151 shoppable looks · 12 eras`), all computed from data, never
hardcoded. Tap = jump. Numbers = depth. Deliberately NOT the filter-chip
language: these are quiet **outline** chips (anchors), never solid-fill pills
(filters). Scroll-spy marks the in-view section via `aria-current`.
Social chips order by **descending count** (today's order is arbitrary
data-file order); Merch chips order **newest era first** with an 8px dot in
that era's own accent, read from `ERAS` theme data, not literals.

**Merch organisation:** 12 era sections, newest first, each headed with a
`13 looks` sub-line; within an era sort by moment date. Filters use the
FilterBar language (solid-fill = filter): `All`, `In stock` (14 sold out),
`The exact piece` (~18 — the rare, high-value bucket), and three price bands.
**No garment-type filter** — there is no `kind` field and inferring type from
item names misfiles things ("Flat Iron Hair Straightener" is not apparel).
Spec `kind?` as a content task; add the chips when coverage reaches ~80%.
Filtered-out era sections keep their header with `0 of 13 match` rather than
vanishing.

**Merch card:** horizontal row, image left (72px mobile / 88px desktop,
lazy-loaded), text right — brand overline → item name (2-line clamp) → price.
**Flip the badge salience:** "Similar style" is on **88% of cards**, so it is
noise at full volume — restyle it quiet, and give the accent to the ~18
`The exact piece` products. Keep it visible regardless (the 2026-07-20
honesty decision). Replace the centered orange `From <moment>` with a
left-aligned soft `Her look · <moment title>`.

**Official / fan-made:** render-gate it. A source chip appears only when its
bucket has ≥1 item, and the row only when ≥2 buckets are non-empty. **Delete
the two "Nothing curated here yet" stubs** currently sitting at 14,721px depth.

**Also worth doing** (ranked, from the evaluation): clamp community
descriptions to 3 lines with an expander — cards average 311px and the page is
hostile even with an index — but **never truncate flags**, they are safety
signals; promote member count to a scannable stat and mark `verified-live`
positively, since today only distrust is marked; add a `+ Suggest a link`
anchor chip so the submit form is reachable from the top; order community
groups by size; cross-link era → merch.

## Files touched

| Path | Change |
|---|---|
| `apps/web/lib/longlive/store.tsx` | `AppMode` loses `'merch'`; add sub-tab state for Social/Merch |
| `apps/web/components/longlive/BottomNav.tsx` | Remove the Merch tab (five remain) |
| `apps/web/lib/longlive/bottom-nav-layout.ts` | `BOTTOM_NAV_ICON_ONLY_THRESHOLD` 5 → 6 so five tabs keep labels |
| `apps/web/components/longlive/{LongLive,TopBar,EraStream,LandingMasthead,FeedbackButton,OverlayNav,TheoryCard,TheoryGuide}.tsx` | Mode-removal fallout (14 files total per scout) |
| `apps/web/lib/longlive/{share,gloss-rotation}.ts` | Same |
| `apps/web/components/longlive/SegmentedToggle.tsx` | **New** — the full-width 50/50 control, generic |
| `apps/web/components/longlive/SectionJumpBar.tsx` | **New** — jump + preview-of-depth control |
| `apps/web/components/longlive/CommunitySection.tsx` | Becomes the Social pane; gains the jump bar |
| `apps/web/components/longlive/MerchSection.tsx` | Becomes the Merch pane; organisation + filters |
| `apps/web/lib/longlive/merch-filters.ts` | **New** — era filter derived from `MerchItem.source` |
| `apps/web/lib/longlive/filter-chips.ts` | **New** — generic extraction so `FilterBar` and merch share one implementation, per the repo's "two mechanisms for one fact" trap |

## Steps

Steps 1–3 are unblocked and can run in parallel now. 4–5 wait on § Open questions.

1. [ ] **Nav: six modes → five, labels back.** Remove `'merch'` from `AppMode`,
   drop the tab, bump the threshold to 6. Own all 14 files in one step.
   - Verify: `npm test -- bottom-nav`, `npm run typecheck --workspace=@swift2/web`,
     and **a real browser check that five labels render at 320/390** — the 320px
     margin is ~1.2px, so this is the one that must be seen, not asserted.
2. [ ] **`SegmentedToggle` + section shell.** Full-width 50/50 Social/Merch under
   the "Community" title; sub-tab state in the store; deep-link safe.
   - Verify: unit tests for state + a browser check at 320/390/desktop.
3. [ ] **`SectionJumpBar` for Social.** Jump to platform + convey how much is
   below. Design comes from the Fable evaluation — **do not improvise it.**
   - Verify: tap each target actually scrolls to that platform, checked with a
     real tap and `elementFromPoint`, not by asserting the container moved.
4. [ ] **Merch organisation + era filters** (blocked on Q3). Extract
   `filter-chips.ts` first so `FilterBar` and merch share one implementation.
   - Verify: filter counts match a hand-count of `MerchItem.source.era`.
5. [ ] **Merch images — UNBLOCKED.** Render the source moment's primary photo as
   a 72/88px inline thumbnail, `loading="lazy"` (156 thumbnails must not block
   the page). **Resolve it through `hasRealPrimaryImage()`, never by checking
   `images.length`** — 6 products' moments carry only the era-art stand-in and
   must get the brand-monogram tile instead. Never show era album art in a
   shopping row: a picture that isn't the item reads as the item.
   - Verify: count rendered thumbnails vs monogram tiles in a browser; expect
     150 / 6. A mismatch means the predicate was bypassed.
6. [ ] Orchestrator: full suite, Fable review, then hold for Actions.

## Do not

- Don't ship a selector with an empty bucket and no explanation.
- Don't fork `FilterBar` — extract the shared piece (two mechanisms for one fact
  is this repo's recurring defect).
- Don't hotlink retailer images without a real-browser load test; some CDNs
  serve a 1×1 placeholder to browsers via Referer checks.
- Don't render anything user-submitted (issue #36).
- Don't add a cart or checkout — the site links out only.
- Don't let any nav label exceed "Community" in width; it breaks 320px.
- Don't push while Actions is down; commit locally.

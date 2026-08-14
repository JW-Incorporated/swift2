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

## STATUS: NOT READY TO BUILD

Two of the six asks are blocked on content Joey has to supply or waive, and the
Fable design evaluation has not landed. **Do not dispatch executors until § Open
questions is answered.** Steps below are written so the unblocked ~70% can
proceed independently of the blocked 30%.

---

## The facts, measured (scout, 2026-08-14)

These are counted, not assumed. Every design decision below rests on them.

| Fact | Value | Consequence |
|---|---|---|
| `Product` image field | **Does not exist** | "Images on every merch item" needs a schema change AND 151 sourced images |
| Products with an image | **0 of 151** | Not a rendering task. Cannot be built from what we have |
| `shopTheLook` | 151 | The only populated bucket |
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

1. **Merch images (blocks "images on every item").** There is no image field and
   no images. Options, in order of my preference:
   - **(a) Ship merch without images now**, add the field + images later. The
     rest of the redesign lands today.
   - **(b) Source images for all 151** — real work, and hotlinking retailer
     images is fragile (see `curl` vs real-browser hotlink trap) and legally
     murkier than linking out.
   - **(c) Use each product's era as a visual** — a colour block / era mark
     instead of a photo. Cheap, honest, ships now, looks deliberate rather than
     broken. **My recommendation if he wants visual weight immediately.**
2. **Official / fan-made selectors (blocks that part of the ask).** Both buckets
   are empty. Options: **(a)** don't ship the selector until there is data;
   **(b)** ship it with an explicit empty state that says what is coming.
   Shipping a silently-dead tab is not an option.
3. **Does "filters similar to the eras filters" mean era filters?** If yes it is
   buildable off `MerchItem.source.era`. If he meant category filters
   (clothing / vinyl / jewellery), **that field does not exist** and is another
   content task.

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
5. [ ] **Merch images** (blocked on Q1). Schema + rendering + fallback.
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

# PLAN.md — land in the Eras scroll; retire the landing page

Joey, 2026-08-14, first device review of the shipped era reader: "when I visit
longlivets.com I land on this page, which is incorrect. this page no longer has
a role. I'm supposed to land directly into the Eras scroll (meaning when I hit
the 'eras' nav button, that page)."

A correction to how the era-reader rework shipped, not a new feature. The
mockup he approved put the masthead ON TOP of the era stream, scrolling away
into the era nav bar; the shipped build put it on a separate landing page and
kept `landing` as the initial mode. That is the whole bug.

(The previous contents of this file — the merged Clownbot rebuild plan — are
in git history at `main`. Nothing was lost.)

## Goal

A visitor to longlivets.com lands directly in the Eras scroll, in the current
era. The masthead they liked (wordmark, tagline, rotating gloss line) sits at
the top of that scroll and scrolls away into the shipped compact era nav bar.
There is no separate front-door surface, and `landing` stops existing as a mode.

## The design calls, and where each comes from

- **Masthead moves to the top of the era stream.** The artifact's own words:
  "The masthead is the only new furniture… It scrolls away and never comes
  back," and "the masthead collapses into the top bar we already ship." Joey
  separately: "we want the top portion to shrink down to the current Era's nav
  bar, which looks awesome. We should not lose that." Shipping it on a separate
  page is what broke that.
- **The wordmark means "top of the current era", not "home".** Artifact call
  #8: "Wordmark scrolls to top of current era, not a separate home screen — in
  this direction there is no separate home screen. 'Home' is now."
- **The twelve-era grid is NOT lost.** `EraGrid` already renders inside the
  `EraSelector` overlay, opened by the era-name button in the top bar. Deleting
  `LandingPage` costs no surface — it removes a duplicate.
- **`landing` is removed from `AppMode` entirely, not merely defaulted away
  from.** A mode nothing renders is dead state that later code trips over —
  this repo's recurring defect is two mechanisms for one fact.

## Out of scope

- Any change to era content, filters, doorways, the scrubber, or the bottom nav
  beyond what removing `landing` forces.
- The remaining device-review bugs Joey is reporting one at a time. This fixes
  ONE.

## Files touched

| Path | Change |
|---|---|
| `apps/web/lib/longlive/store.tsx` | Initial `mode` → `'era'`; drop `'landing'` from `AppMode`; `goHome()` → current era + top |
| `apps/web/components/longlive/LongLive.tsx` | Drop `onLanding`; `TopBar` always renders; `LandingPage` gone |
| `apps/web/components/longlive/EraStream.tsx` | Render `LandingMasthead` once above the first era section |
| `apps/web/components/longlive/TopBar.tsx` | Drop the `landing` guard; wordmark → top of current era |
| `apps/web/components/longlive/LandingPage.tsx` | **Delete** |
| `apps/web/components/longlive/LandingMasthead.tsx` | Keep; now mounted by `EraStream` |
| `apps/web/components/longlive/BottomNav.tsx` | Drop the `landing → era` mapping (now unreachable) |
| `apps/web/lib/longlive/share.ts` | Drop the landing branch |
| `apps/web/lib/longlive/deepLink.ts` | Comments only — the front door is now the era stream |
| `deepLink.test.ts`, `share.test.ts`, `BottomNav.test.ts`, `LandingMasthead.test.ts` | Update the assertions that encode `landing` |
| `docs/longlive-experience.md` | Record the new front door |

## Steps

1. [ ] Remove `'landing'` from `AppMode`; initial mode `'era'`; rewrite
   `goHome()` to reset to the current era and scroll to top. (executor)
   - Verify: `npm run typecheck --workspace=@swift2/web` → every dead
     `landing` reference becomes a compile error. Fix each at its site.
2. [ ] Mount `LandingMasthead` at the top of `EraStream`, above the first era
   section, so it scrolls away and the compact bar takes over. Delete
   `LandingPage.tsx`. (executor)
   - Verify: `npm test` green; masthead renders once, not per era.
3. [ ] Update the four tests that encode `landing`, and the experience doc.
   (executor)
   - Verify: `npm test` green.

## Known risks

- **The masthead must render ONCE, not per era section.** `EraStream` maps era
  sections; putting the masthead inside that map repeats it twelve times.
- **`EraStream` scrolls to top on mount** unless a restore snapshot exists.
  With a masthead above the first era, "top" is now the masthead — intended,
  but check the era-scroll snapshot round-trip still lands where it should.
- **Deep links must still bypass the masthead** and land on their target.
- The bottom nav's Eras tab must still read as current on first load.

## Do not

- Don't delete `EraGrid` — `EraSelector` renders it.
- Don't change the masthead's copy, the tagline, or the gloss rotation.
- Don't add URL routing.
- Don't fix other device-review bugs here.
- Don't proceed past a failed verification — report it and stop.

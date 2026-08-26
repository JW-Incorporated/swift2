# Store listing copy — ready to paste

Copy for both stores, written to their field limits. Voice: concise, fan-aware,
no hype-bombing, and the UNOFFICIAL disclaimer stays prominent (2026-07-08
media-policy decision — the disclaimer is non-negotiable in every listing).

App name: "LongLive" (decided 2026-08-25). Package/bundle id `ai.jwlabs.longlive`.
Must not imply endorsement — never lead with "Taylor Swift" as the app name;
both stores flag that, and so would her lawyers.

---

## Apple App Store

**App name** (30 chars max)

> LongLive

**Subtitle** (30 chars max)

> A time machine for the eras

**Category:** Primary — Entertainment. Secondary — Reference.

**Description** (4000 chars max)

> The Vault is a time machine through Taylor Swift's eras.
>
> Pick a moment — any month since 2006 — and see what was actually happening
> then: the album taking shape, the tour on the road, the outfits, the
> milestones. Scrub the timeline and the whole app re-skins to the era you
> land on.
>
> WHAT'S INSIDE
>
> - Every era, debut to now, as one continuous timeline
> - Month-by-month entries: releases, tours, moments that mattered
> - Era-themed design — the app changes with the era you're reading
> - Built for the scrub: smooth, fast era navigation is the whole point
>
> BUILT BY FANS, DONE PROPERLY
>
> Every dated entry links back to where the information came from. Original
> summaries, real sources, no guessing, no reposted articles, no lyrics.
>
> No account. No ads. No tracking. Open the app, pick a year, fall in.
>
> UNOFFICIAL: LongLive is an independent fan project. It is not
> affiliated with, endorsed by, sponsored by, or officially connected to
> Taylor Swift, her management, or her record labels. Names and titles are
> used only to identify and describe the subject matter.

**Keywords** (100 chars max, comma-separated, no spaces needed after commas)

> taylor,swift,eras,era,timeline,fan,swiftie,albums,discography,history,vault,tour

(97 chars. Note: keyword fields naming a public figure are usually fine for
fan apps, but Apple review can be picky — if rejected on 2.3.7/metadata, drop
"taylor,swift" and rely on the description.)

**Promotional text** (170 chars max, editable without a new build)

> Scrub through every era, month by month — releases, tours, outfits, and
> milestones, each one sourced. An unofficial, fan-made time machine.

**What's New — v1.0.0** (4000 chars max)

> First release: the Vault. Every era on one timeline — scrub to any month
> since 2006 and see what was happening. Sourced entries, era-themed design,
> no account needed.

**Age rating questionnaire:** all "No" (no violence, no gambling, no
unrestricted web, no UGC) → expect 4+ / Everyone.
**Copyright field:** © 2026 JW Incorporated — unofficial fan project.

---

## Google Play

**App name** (30 chars max)

> LongLive

**Short description** (80 chars max)

> An unofficial fan time machine through the eras — sourced, month by month.

(75 chars.)

**Full description** (4000 chars max)

> The Vault is a time machine through Taylor Swift's eras.
>
> Pick a moment — any month since 2006 — and see what was actually happening
> then: the album taking shape, the tour on the road, the outfits, the
> milestones. Scrub the timeline and the whole app re-skins to the era you
> land on.
>
> WHAT'S INSIDE
>
> • Every era, debut to now, as one continuous timeline
> • Month-by-month entries: releases, tours, moments that mattered
> • Era-themed design — the app changes with the era you're reading
> • Built for the scrub: smooth, fast era navigation is the whole point
>
> BUILT BY FANS, DONE PROPERLY
>
> Every dated entry links back to where the information came from. Original
> summaries, real sources, no guessing, no reposted articles, no lyrics.
>
> No account. No ads. No tracking. Open the app, pick a year, fall in.
>
> UNOFFICIAL: LongLive is an independent fan project. It is not
> affiliated with, endorsed by, sponsored by, or officially connected to
> Taylor Swift, her management, or her record labels. Names and titles are
> used only to identify and describe the subject matter.

**Category:** Entertainment. **Tags:** Entertainment, Music & Audio-adjacent
(pick from Play's suggested tags at listing time).

**Release notes — v1.0.0** (500 chars max)

> First release: the Vault. Every era on one timeline — scrub to any month
> since 2006 and see what was happening. Sourced entries, era-themed design,
> no account needed.

---

## Shared listing facts (paste into forms as asked)

- **Privacy policy URL:** `https://<production-web-domain>/privacy`
  (route exists in `apps/web/app/privacy/page.tsx`; goes live with the next
  web deploy — fill in the real domain).
- **Support email:** wjduvall@gmail.com (swap for a project address if one
  is created later).
- **Ads:** none. **In-app purchases:** none. **Accounts:** none.
- **Data collection:** none — see
  `apps/mobile/docs/privacy-and-data-safety.md` for the exact questionnaire
  answers.

## Graphics still needed (design gap — see shipping checklist)

Current `assets/*.png` are deterministic placeholders (lavender "vault dial"),
valid for builds but not launch branding:

- App icon 1024×1024 (opaque; iOS + Play hi-res icon at 512×512 derives from it)
- Android adaptive-icon foreground (1024×1024, mark inside central ~61%)
- Splash image
- Play feature graphic 1024×500
- Screenshots: Play needs ≥2 phone screenshots; App Store needs 6.9" and 6.5"
  iPhone sets (iPad set too since `supportsTablet` is true — or ship iPhone-only
  by flipping `supportsTablet` to false before the store build)

Original artwork only — no album art or photos we don't own (media policy).

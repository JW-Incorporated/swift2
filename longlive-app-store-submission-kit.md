# Long Live — Apple App Store submission kit
Prepared from the Swift2 repo, 2026-08-31.

## 1. What's already in place
- **App identity**: name "LongLive", bundle ID `ai.jwlabs.longlive` (apps/mobile/app.json)
- **App icon**: `apps/mobile/assets/icon.png` — 1024×1024 RGBA. This is the correct size for
  the App Store icon field (Apple wants exactly 1024×1024, no transparency — confirm it has
  no alpha channel before upload, since App Store Connect rejects icons with transparency).
- **Build config**: `apps/mobile/eas.json` has a `production` profile and a
  `submit.production` block — but **`ios: {}` is empty**, meaning no Apple ID, App Store
  Connect App ID (ascAppId), or Apple Team ID are configured yet.
- **Privacy policy**: live at https://www.longlivets.com/privacy — but it's still marked
  `LEGAL_STATUS: 'draft'` in `apps/web/lib/longlive/legal.ts` pending counsel review. It DOES
  already have a dedicated "The mobile app" section verified against the Android build
  (2026-08-30), so the content is accurate for iOS too (same shared codebase, no
  Android-only claims in that section).
- **No permissions requested**: the app makes 3 anonymous read-only Supabase calls, has no
  forms/camera/mic/location, no ads/analytics/crash SDKs — this makes the App Privacy /
  "Data Not Collected" questionnaire trivial.

## 2. What's missing before you can submit (in order)
1. **Apple Developer Program enrollment** — $99/year, tied to an Apple ID. Nobody has done
   this in the repo (no `appleId`/`ascAppId`/`appleTeamId` anywhere in eas.json or app.json).
   **This needs a human decision** — real recurring cost, requires an actual Apple ID +
   payment method.
2. **App Store Connect app record** — created inside the Apple Developer account once #1 is
   done. Needs: app name, primary language, bundle ID (already have it), SKU.
3. **iOS credentials for the build** — EAS can auto-generate the signing certificate + push
   key during `eas build --platform ios` IF it's logged into an Apple ID with Developer
   Program access. This happens automatically once #1 exists; no separate cert wrangling
   needed thanks to EAS.
4. **Screenshots** — see below. These need an actual iOS Simulator or device; this sandbox
   is Linux and can't run one. Someone needs a Mac (Xcode Simulator) or the physical iPhone
   with a TestFlight/dev build installed.
5. **Support URL** — the repo doesn't have a dedicated `/support` page yet, only `/privacy`
   and `/terms`. Apple requires a support URL. Recommend pointing it at
   `https://www.longlivets.com/privacy` (which lists contact emails) until a real support
   page exists, OR I can add a minimal `/support` page in a follow-up PR — your call.

## 3. Screenshot sizes Apple requires (App Store Connect, 2026 requirements)
You only need ONE full set at the largest required size per device family — Apple
auto-scales down for the older sizes it still lists, so this is the minimum real captures:

| Device family | Required resolution | Notes |
|---|---|---|
| iPhone 6.9" (iPhone 16 Pro Max / 15 Pro Max class) | 1320 x 2868 px (portrait) | Mandatory — this is the current "iPhone" bucket |
| iPhone 6.5" (older, if still supported) | 1284 x 2778 px | Optional if 6.9" set covers all supported devices |
| iPad 13" (iPad Pro) | 2064 x 2752 px (portrait) | Required because `supportsTablet: true` is set in app.json |

Between 3-10 screenshots per size, PNG or JPEG, no alpha channel, RGB.
Capture method: run the app in the iOS Simulator (Xcode) at the matching device (e.g.
iPhone 16 Pro Max, iPad Pro 13"), Cmd+S to save native-resolution screenshots — no manual
resizing needed since the simulator renders at true device resolution.

## 4. Draft text fields (from repo copy — review before pasting into App Store Connect)
- **App name** (30 char max): `Long Live`
- **Subtitle** (30 char max): `A Taylor Swift eras journey`
- **Promotional text** (170 char max, editable anytime without review):
  `An interactive, unofficial journey through every era of Taylor Swift's career -- the music, fashion, tours, and lore.`
- **Description** (4000 char max):
  > Long Live is an interactive, unofficial fan journey through every era of Taylor Swift's
  > career -- the music, fashion, tours, lore, and Easter eggs.
  >
  > Scroll through a timeline built era by era, from Taylor Swift through today. Discover
  > moments, dig into track-by-track notes, and explore the threads that connect one era to
  > the next.
  >
  > Long Live is a fan project. It is not affiliated with, endorsed by, sponsored by, or
  > connected to Taylor Swift, her management, record labels, or publishers.
  >
  > No account, no sign-in, no ads, no tracking -- just a scrolling timeline built for fans.
- **Keywords** (100 char max, comma-separated):
  `taylor swift,eras,timeline,fan,music,lore,easter eggs,tour,albums,swiftie`
- **Category**: Primary `Entertainment` (or `Music` -- your call; Entertainment fits the
  "lore/timeline" framing better than Music, which skews toward streaming/audio tools)
- **Age rating**: General audience content, no objectionable material in-app -> straightforward
  4+ rating in the questionnaire (no user-generated content visible to others, no gambling,
  no mature themes)
- **Support URL**: `https://www.longlivets.com/privacy` (placeholder -- see item 5 above)
- **Marketing URL** (optional): `https://www.longlivets.com`
- **Privacy Policy URL**: `https://www.longlivets.com/privacy`
- **Copyright**: `(c) 2026 JW Labs LLC`
- **Contact info for review**: use `privacy@longlivets.com` or a JW Labs contact of your
  choice -- App Review may email this if they have questions.

## 5. Build command (once Apple Developer account + eas.json ios block exist)
```
cd apps/mobile
eas build --platform ios --profile production
eas submit --platform ios --latest
```
EAS will prompt for Apple ID login on first run and store credentials in your EAS account,
not in the repo.

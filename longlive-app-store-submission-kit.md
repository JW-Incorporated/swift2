# Long Live — Apple App Store submission kit

Prepared from the Swift2 repo 2026-08-31; re-verified and rewritten 2026-09-05
(App Store Connect record now exists; privacy answers corrected; support page
added). Paste from here into App Store Connect.

## 1. Done — verified in the repo / on EAS on 2026-09-05

- **Apple Developer Program + App Store Connect record** — done by Joey (PRs
  #3668/#3669, 2026-09-01). Team `D9N628AFHS`, ASC app id `6807657306`,
  bundle id `ai.jwlabs.longlive`, all wired into `apps/mobile/eas.json`
  `submit.production.ios`. The ASC API key `.p8` lives only on Joey's
  machine (`apps/mobile/credentials/`, gitignored).
- **EAS project** `@wjduvall/swift2-vault` (id `a4ff0e9b-…`), production
  env vars `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` set.
- **App icon** `apps/mobile/assets/icon.png` — 1024×1024, real branding
  (heart-hands on purple). Has an alpha channel but every pixel is opaque;
  Expo flattens it for iOS anyway. Nothing to do.
- **`usesNonExemptEncryption: false`** — export-compliance question is
  pre-answered on every upload.
- **Privacy policy** https://www.longlivets.com/privacy — "The mobile app"
  section rewritten 2026-09-05 to match the shipped app (device id + opt-in
  push). Still `LEGAL_STATUS: 'draft'` pending counsel.
- **Support page** https://www.longlivets.com/support — added 2026-09-05
  (`apps/web/app/support/page.tsx`).
- **iPad stays in** (`supportsTablet: true`, Wyatt 2026-09-05) → an iPad
  13" screenshot set is required in addition to iPhone.

## 2. Still missing — in order

1. **The iOS build.** Zero iOS builds exist on EAS (`eas build:list -p ios`
   → `[]`). First build must create the distribution certificate and
   provisioning profile, which needs Apple authentication once. Two ways:
   - **Interactive (Apple ID + 2FA):** the Apple ID must be a member of team
     `D9N628AFHS` with Admin or App Manager role. Run in a normal terminal:
     ```sh
     cd apps/mobile
     eas build --platform ios --profile production
     ```
     Say **yes** to "let EAS manage credentials". ~15–25 min in the cloud.
   - **Non-interactive (ASC API key):** copy Joey's `.p8` into
     `apps/mobile/credentials/`, then:
     ```sh
     cd apps/mobile
     export EXPO_ASC_API_KEY_PATH=./credentials/AuthKey_QU7P2WC49Z.p8
     export EXPO_ASC_KEY_ID=QU7P2WC49Z
     export EXPO_ASC_ISSUER_ID=26d1ad10-af24-431a-a9bb-d097ca96e9bc
     export EXPO_APPLE_TEAM_ID=D9N628AFHS
     export EXPO_APPLE_TEAM_TYPE=COMPANY_OR_ORGANIZATION   # or INDIVIDUAL
     eas build --platform ios --profile production --non-interactive
     ```
2. **Upload to App Store Connect / TestFlight** (needs the `.p8` present at
   the path in `eas.json`, or answer the prompt with it once — EAS stores it):
   ```sh
   eas submit --platform ios --latest
   ```
   Processing on Apple's side: 10–30 min. The build then appears under the
   app's **Build** section in App Store Connect and in TestFlight.
3. **Screenshots** — no Mac in the loop, so pick one:
   - **TestFlight on a real iPhone/iPad:** install the build from step 2,
     screenshot with the hardware buttons, send the PNGs to Claude to resize
     to the exact ASC dimensions (any modern iPhone's aspect is within a
     crop of 1284×2778; any modern iPad within 2048×2732).
   - **Appetize.io (browser iOS simulator):** `eas build -p ios --profile
     simulator`, upload the resulting `.tar.gz` to appetize.io, pick
     "iPhone 13 Pro Max" (1284×2778) and "iPad Pro 12.9"" (2048×2732), and
     screenshot. Needs an Appetize account (free tier is enough).
   - **Any Mac with Xcode:** Simulator → Cmd+S saves at native resolution.
4. **App Store Connect forms** — paste §4 below; App Privacy per §5; age
   rating questionnaire all "No" → 4+; select the build; Submit for Review.

## 3. Screenshot sizes (what ASC is asking for on this record)

| Slot | Accepted pixel sizes | Min count |
| --- | --- | --- |
| iPhone 6.5" | 1242×2688, 2688×1242, 1284×2778, 2778×1284 | 3 |
| iPad 13" | 2064×2752, 2752×2064, 2048×2732, 2732×2048 | 3 |

Up to 10 per slot. PNG or JPEG, RGB, **no alpha channel**. Screens to
capture, in order: (1) the era hero with the timeline scrubber, (2) a
month's rows / milestones, (3) a different era so the re-skin is visible,
(4) optional: the notification settings behind the bell.

## 4. Text fields — paste-ready (lengths verified 2026-09-05)

| Field | Limit | Value |
| --- | --- | --- |
| Name | 30 | `LongLive` |
| Subtitle | 30 | `A time machine for the eras` |
| Promotional text | 170 | `Scrub through every era, month by month — releases, tours, outfits, and milestones, each one sourced. An unofficial, fan-made time machine.` |
| Keywords | 100 | `taylor,swift,eras,era,timeline,fan,swiftie,albums,discography,history,vault,tour` |
| Support URL | — | `https://www.longlivets.com/support` |
| Marketing URL | — | `https://www.longlivets.com` |
| Privacy Policy URL | — | `https://www.longlivets.com/privacy` |
| Copyright | — | `© 2026 JW Labs LLC` |
| Primary category | — | Entertainment (secondary: Reference) |
| Version | — | `1.0.0` |
| Review contact | — | `privacy@longlivets.com` + a founder phone number (required field) |
| Sign-in for review | — | Not required (no accounts) |

**Description** (4000 max; this is 1063):

```
The Vault is a time machine through Taylor Swift's eras.

Pick a moment — any month since 2006 — and see what was actually happening then: the album taking shape, the tour on the road, the outfits, the milestones. Scrub the timeline and the whole app re-skins to the era you land on.

WHAT'S INSIDE

- Every era, debut to now, as one continuous timeline
- Month-by-month entries: releases, tours, moments that mattered
- Era-themed design — the app changes with the era you're reading
- Built for the scrub: smooth, fast era navigation is the whole point

BUILT BY FANS, DONE PROPERLY

Every dated entry links back to where the information came from. Original summaries, real sources, no guessing, no reposted articles, no lyrics.

No account. No ads. No tracking. Open the app, pick a year, fall in.

UNOFFICIAL: LongLive is an independent fan project. It is not affiliated with, endorsed by, sponsored by, or officially connected to Taylor Swift, her management, or her record labels. Names and titles are used only to identify and describe the subject matter.
```

**What's New (1.0.0):**

```
First release: the Vault. Every era on one timeline — scrub to any month since 2006 and see what was happening. Sourced entries, era-themed design, no account needed.
```

## 5. App Privacy (App Store Connect → App Privacy)

"Data Not Collected" is **wrong** for the shipped app and must not be
selected — since 2026-08-30 the app mints a random device id and sends it
(with platform, time zone, locale, app version) to `/api/devices/register`
on every start, and sends an Expo push token if the user opts in. Answers:

| Question | Answer |
| --- | --- |
| Do you collect data from this app? | **Yes** |
| Data types | **Identifiers → Device ID** only |
| Used for tracking? | **No** |
| Linked to the user's identity? | **No** |
| Purpose | **App Functionality** |

Resulting label: *Data Not Linked to You — Identifiers*. Full rationale and
the matching Play answers: `apps/mobile/docs/privacy-and-data-safety.md`.

## 6. Review risks to expect

- **Guideline 5.2.1 / 2.3.7 (fan app using a public figure's name).** The
  UNOFFICIAL disclaimer is in the description, on /support and /privacy. If
  rejected on keywords, drop `taylor,swift` from the keyword field and
  resubmit metadata only.
- **Guideline 2.1 (app completeness).** The reviewer will tap the bell;
  notifications must not crash without permission. `/api/devices/register`
  currently returns **503** on production (service-role key not configured
  on Vercel) — the app treats that as non-fatal, but set
  `SUPABASE_SERVICE_ROLE_KEY` on the Vercel project before review so the
  notification settings screen actually saves.

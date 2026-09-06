# Privacy: policy + store data-safety answers

> ## ✅ CURRENT ANSWERS (2026-09-05, App Store release) — use THIS block
>
> Re-verified against `apps/mobile/**` on 2026-09-05. Since 2026-08-30 the app
> mints a random device id (`lib/device-id.ts`), POSTs it with platform, time
> zone, locale and app version to `/api/devices/register` on every cold start
> (`lib/push-registration.ts`), and — only after the user opts in via the bell
> — sends an Expo push token to the same route. Preferences round-trip through
> `/api/devices/:id/prefs`. So **"Data Not Collected" is false** and must not
> be selected on either store. The `/privacy` page's "The mobile app" section
> was rewritten to match in the same PR.
>
> <!-- GENERATED:mobile-privacy-inventory:start — produced by
> `npm run privacy:mobile-doc` from `apps/web/lib/longlive/data-inventory.ts`
> (OS-042). Do not hand-edit the lines below; edit the inventory and
> regenerate. `data-inventory.test.ts` fails the build if this block drifts
> from what the inventory would produce, or if the inventory ever disagrees
> with the `/privacy` policy prose. -->
>
> **App Store Connect → App Privacy** (paste-ready):
>
> | Question | Answer |
> | --- | --- |
> | Do you or your third-party partners collect data from this app? | **Yes** |
> | **Identifiers → Device ID** | the app's UUID + push token. Purpose: App Functionality. Not linked, not tracking. |
> | **Identifiers → User ID** | an anonymous Clownbot identity — a bearer device token for the native chat screen, or the website's own session cookie on the three legal WebView pages. Purpose: App Functionality. Not linked, not tracking. |
> | **User Content → Other User Content** | feedback-box text (to GitHub) and mood-chat / Clownbot text (to the Claude API) typed inside the in-app site. Purpose: App Functionality. Not linked, not tracking. |
> | **Usage Data → Product Interaction** | Vercel Web Analytics page views inside the in-app site. Purpose: Analytics. Not linked, not tracking. |
> | Every other data type | **not collected** |
> | Resulting label | **"Data Not Linked to You: Identifiers, User Content, Usage Data"** |
>
> **Google Play → Data safety** (paste-ready): Collects data: **Yes**. Data type:
> **Device or other IDs**. Collected, not shared. Not processed ephemerally.
> Required (needed for notifications to work). Purpose: **App functionality**.
> Encrypted in transit: **Yes**. Deletion request: **Yes** — email
> privacy@longlivets.com (documented at /support and /privacy).
>
> <!-- GENERATED:mobile-privacy-inventory:end -->
>
> Everything below this block predates the notifications work and is kept for
> the content-rating / age-rating answers, which are unchanged (all "No", 4+).


> ## ⚠️ STALE — DO NOT SUBMIT EITHER STORE FORM FROM THIS DOC (2026-08-11, #800)
>
> Everything below was verified on 2026-07-08 and describes a **web + mobile**
> pair that collected nothing. That is no longer true of the **web** app: the
> in-app feedback button (#427), the mood chat (which sends typed text to the
> Anthropic API), and Vercel Web Analytics (#799) all shipped afterwards, and
> none of them updated this file or the privacy page — exactly the failure the
> callout further down warns about.
>
> The **mobile** app itself may still collect nothing — it is unreleased and
> was not re-audited in that pass. Re-verify it against the shipped code before
> answering either store questionnaire, and read the current, code-verified
> inventory in `apps/web/lib/longlive/legal.ts` (rendered at `/privacy`) first.
> That page is itself a **draft pending counsel review**. Lying on a store
> data-safety form is a removal-grade violation on both stores, so this is not
> a paperwork detail.

The apps collect **nothing**. No accounts, no analytics, no crash reporting,
no ads, no device permissions. The only network traffic is anonymous HTTPS
reads of published Vault content from Supabase (anon key + public RLS).
Verified against the codebase 2026-07-08: no analytics/crash SDKs present
(`grep -ri 'sentry|analytics|posthog|amplitude|mixpanel|firebase' apps/` is
empty), and `app.json` requests no permissions.

**Hosted policy:** `apps/web/app/privacy/page.tsx` → will be live at
`https://<production-web-domain>/privacy` after the next web deploy. Both
stores require this URL in the app record.

> If ANY collection is ever added (analytics, crash reporting, accounts,
> push tokens), update: (1) the privacy page, (2) Play Data safety form,
> (3) App Store nutrition label — in the same release. Lying on these forms
> is a removal-grade violation on both stores.

---

## Google Play — Data safety form (paste-ready answers)

| Question | Answer |
| --- | --- |
| Does your app collect or share any of the required user data types? | **No** |
| Is all of the user data collected by your app encrypted in transit? | (not asked when "No" above; if asked: **Yes** — HTTPS only) |
| Do you provide a way for users to request that their data is deleted? | (not asked — nothing collected) |

That's the whole form when you answer "No" to collection. Notes for the
adjacent Play questionnaires:

- **Ads declaration:** app contains no ads.
- **Content rating (IARC questionnaire):** Reference/Entertainment; no
  violence, sexuality, gambling, drugs, hate speech, or user interaction; no
  unrestricted web browsing (external links open in the system browser);
  no digital purchases. Expected rating: **Everyone / PEGI 3**.
- **Target audience:** 13+ (pick "13-15, 16-17, 18+"); do NOT target
  under-13 (avoids Families policy requirements). App is not "designed for
  children" but is acceptable for all ages.
- **News app declaration:** No (curated historical reference, not news).
- **Government app / Financial features / Health:** No / None / None.
- **Login credentials for review:** none needed (no login).

Rationale Play accepts for "No collection": IP addresses and request logs
processed ephemerally by the hosting provider (Vercel/Supabase) for security
and reliability are exempt as "collected" data under Play's definitions
(ephemeral processing exemption).

## Apple App Store — Privacy nutrition label (App Store Connect → App Privacy)

| Question | Answer |
| --- | --- |
| Do you or your third-party partners collect data from this app? | **No — "Data Not Collected"** |

That single answer produces the "Data Not Collected" label. Supporting
details if Apple review asks:

- No third-party SDKs that collect data (dependency list is Expo/React
  Native UI runtime + Supabase JS client used anonymously).
- Supabase anon reads are not "collection": no identifiers are sent or
  stored; server request logs are ephemeral operational logs by the
  provider.
- **Required-reason APIs (privacy manifests):** Expo SDK 57 ships privacy
  manifests for the standard APIs it touches (UserDefaults etc.); EAS build
  aggregates them automatically. Nothing to declare manually.
- **App uses non-exempt encryption:** No — already set in `app.json`
  (`ios.config.usesNonExemptEncryption: false`, HTTPS only), so TestFlight
  won't ask the export-compliance question every upload.
- **Age rating questionnaire:** all "None/No" → **4+**.
- **Content rights:** check "I confirm I have the rights…" only after
  branding assets are original artwork (they are — placeholder or final);
  app contains no third-party media, only links out.

## What to say if a reviewer asks about the subject matter

The app is an unofficial fan reference. All text is original summaries with
source links; no lyrics, no reproduced articles, no rehosted third-party
photos (2026-07-08 media policy). The UNOFFICIAL disclaimer is in the
listing, in the privacy policy, and (should be) in the app's About surface.

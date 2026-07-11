# Privacy: policy + store data-safety answers

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

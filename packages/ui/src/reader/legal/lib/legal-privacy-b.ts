import { LEGAL_FACTS } from './legal-types';
import type { LegalSection } from './legal-types';

export const PRIVACY_SECTIONS_B: LegalSection[] = [
  {
    id: 'third-parties',
    heading: 'Third parties involved in running the site',
    blocks: [
      {
        kind: 'p',
        text: 'Loading a page or using a feature means your browser or our server talks to the following services. Each has its own privacy policy, which governs what it does with what it receives.',
      },
      {
        kind: 'table',
        caption: 'Third-party services and what reaches them',
        head: ['Service', 'Role', 'What reaches it'],
        rows: [
          [
            'Vercel',
            'Hosting and analytics',
            'Every request to the site, including your IP address, in ordinary server logs; plus the anonymous analytics events described above.',
          ],
          [
            'Supabase',
            'Content database; Clownbot anonymous identity and conversation storage',
            'Most site content is baked in when the site is built, not fetched while you browse — one illustrative image, and a pair of machine-readable content endpoints the site itself does not call, are the only content paths that reach it. Separately, and only once the anonymous-identity system described in the Clownbot section is switched on, your Clownbot messages, replies, and anonymous id are stored here for up to 180 days.',
          ],
          [
            'GitHub',
            'Where feedback tickets are stored',
            'Only what a feedback submission contains, and only if you send one.',
          ],
          [
            'Anthropic (Claude API)',
            'Reads the feeling in mood-chat text; answers Clownbot questions',
            'The text you type into the mood chat, only if you type instead of tapping a preset chip; and every message (plus recent conversation turns) you send to Clownbot.',
          ],
          [
            'YouTube (via the privacy-enhanced youtube-nocookie.com domain)',
            'Music-video playback',
            "A thumbnail image while you browse. The player itself only loads when you press play — and on YouTube's privacy-enhanced domain, which does not set tracking cookies before playback.",
          ],
          [
            'Spotify',
            'Album playback',
            'On most pages, nothing until you press play. On the "Taylor\'s Version" comparison, two Spotify players load with the page. Once a player loads, Spotify sees your IP address and may set its own cookies.',
          ],
          [
            'Instagram (Meta)',
            'Embedded posts',
            'Where a moment quotes an Instagram post, the post is embedded and loads with the page rather than on a click. That means Meta sees your IP address, your browser, and the page you were on, and may set its own cookies, without you doing anything.',
          ],
          [
            'Image hosts — around a hundred of them (Wikimedia, news publishers, photo agencies, their CDNs)',
            'Photographs illustrating the content',
            'Most photographs load directly from the site that published them rather than being copied to our servers. Loading one tells that host your IP address, your browser, and that you were on a Long Live page.',
          ],
        ],
      },
      {
        kind: 'p',
        text: 'Fonts are served from our own domain — they are bundled into the site when it is built, so no request goes to a font provider while you browse. Links out to news articles and sources are ordinary links; following one takes you to a site with its own policy.',
      },
      {
        kind: 'p',
        text: "We set one first-party cookie of our own — the anonymous Clownbot session id described in the Clownbot section above — and only once that feature's memory system is switched on; while it is off, we set none. Spotify, YouTube and Instagram may set their own cookies once one of their embeds loads, and we have no control over those — your browser settings do. Blocking third-party cookies, or using a content blocker, does not stop you reading the site.",
      },
    ],
  },
  {
    id: 'mobile-app',
    heading: 'The mobile app',
    blocks: [
      {
        // Rewritten 2026-09-06 for OS-039 (docs/specs/2026-09-05-one-
        // source-three-surfaces.md): SiteShell is retired as the app's
        // default surface. The app now renders native screens for eras,
        // threads, Clownbot, community, and merch
        // (apps/mobile/App.tsx + BottomTabBar.tsx), each reading the same
        // published content bundle as the website (D2: two renderers, one
        // headless core) — so the DATA and its handling are identical to
        // the website even though the UI is native, not a WebView. Only
        // three static pages — Privacy, Terms, and Support — still open in
        // a WebView (apps/mobile/components/SiteShell.tsx), since they
        // have no native screen. On top of that the app has its own
        // device registry and opt-in push notifications
        // (apps/mobile/lib/device-id.ts, push-registration.ts,
        // prefs-client.ts, inbox-client.ts; apps/web/app/api/devices/**;
        // migration 20260909000000_notifications_devices.sql). Whoever
        // changes the app changes this section in the same release, and
        // both stores' data-safety forms with it.
        kind: 'p',
        text: 'There is also a Long Live mobile app for iPhone and Android — listed as "LongLive", bundle and package id ai.jwlabs.longlive. The app renders its own native screens for eras, threads, Clownbot, community, and merch, all built from the exact same content and the exact same rules described in every section above — nothing about what is collected or how it is handled changes because the screen is native instead of a web page. Only three pages — Privacy, Terms, and Support (this page among them) — still open inside the app as the website itself, unchanged. The feedback button, the mood chat, Clownbot, the analytics, and the server logs all behave in the app exactly as they do in a browser, and the sections above are the description of them.',
      },
      {
        kind: 'p',
        text: 'Two things are specific to the app. The first is a device id. On first launch the app creates a random device id — a UUID, not derived from your phone, your Apple or Google account, or any advertising identifier — and stores it in the device’s secure storage. Each time the app starts it sends that id to our server together with the platform (iPhone or Android), your device’s time zone and language setting, and the app version. We keep those in a devices table in our Supabase database so that notification preferences can be saved and so that notifications, if you turn them on, can be delivered at a sensible local hour. None of it names you, and we do not link it to anything that could, including your anonymous Clownbot identity (a device-bound token in the native chat screen, or the website’s own anonymous session cookie on the Privacy/Terms/Support pages).',
      },
      {
        kind: 'p',
        text: 'The second is notifications, which are off until you ask for them. The app never shows the system permission prompt on its own; you reach it by tapping the bell and choosing to turn notifications on. If you allow them, the app obtains a push token from Expo’s push notification service — the relay that hands messages to Apple or Google for delivery — and stores that token against your device id so we can send to that device. Your choices in the bell menu (off, muted types, quiet hours, a daily cap) are saved to the same devices row. The in-app inbox is a public feed of recent notifications and is fetched without your device id. You can withdraw notification permission in your phone’s settings at any time; the token then stops working and is pruned.',
      },
      {
        kind: 'p',
        text: 'Apart from internet access and — only if you grant it — permission to notify you, the app asks for no device permissions: not your camera, your microphone, your location, your contacts, your photos, or your storage. It carries no advertising SDK, no crash-reporting SDK, no in-app purchases, no account, and no sign-in of its own. Links that lead away from longlivets.com open in your phone’s browser, not inside the app.',
      },
      {
        kind: 'p',
        text: 'Uninstalling the app discards the device id and the website’s cookies held inside the app. Write to us at the address in Contact and we will delete the matching devices row; rows whose tokens stop working are pruned on their own. Our Google Play Data safety declaration and our App Store privacy label describe the same app as this section does — the website’s collection described above, plus an anonymous device id and, if you opt in, a push token, used for app functionality only, not linked to your identity and not used for tracking. If the app ever starts collecting something else, all three change in the release that ships it.',
      },
    ],
  },
  {
    id: 'server-logs',
    heading: 'Server logs',
    blocks: [
      {
        kind: 'p',
        text: "Like any website, the infrastructure serving Long Live keeps short-lived operational logs — IP address, time, request path, user agent — for security, abuse prevention, and reliability. These are our hosting provider's standard logs, kept under its retention policy. We do not use them to build a profile of you and we do not combine them with anything else.",
      },
    ],
  },
  {
    id: 'legal-bases',
    heading: 'Why we are allowed to do this',
    blocks: [
      {
        kind: 'p',
        text: 'If you are in the UK, the EU, or another region with similar rules, our legal bases are: your consent, where you choose to send feedback, type into the mood chat, or use Clownbot; and our legitimate interest in running a secure, working, comprehensible website, for rate limiting, server logs, and aggregate analytics. We do not ask for or knowingly process special-category data.',
      },
    ],
  },
  {
    id: 'your-rights',
    heading: 'Your rights',
    blocks: [
      {
        kind: 'p',
        text: 'Depending on where you live, you may have the right to access, correct, delete, or restrict the use of personal information about you, to object to processing, to receive a copy in a portable form, and to complain to your data-protection regulator. Californian residents additionally have rights of access, deletion, correction, and to opt out of sale or sharing — we do not sell or share personal information, so there is nothing to opt out of.',
      },
      {
        kind: 'p',
        text: `In practice we hold almost nothing that could be tied to you. The realistic case is a feedback ticket you sent. Write to ${LEGAL_FACTS.privacyEmail} — quote roughly when you sent it and what it was about — and we will find it and delete it. A Clownbot conversation, once its memory system is switched on, works differently: see the Clownbot section above for why we generally cannot match a request to a specific one, and how it expires on its own instead. We will not retaliate against you for exercising any of these rights.`,
      },
      {
        kind: 'p',
        text: "To erase what is stored on your device, clear this site's data in your browser.",
      },
    ],
  },
  {
    id: 'children',
    heading: 'Children',
    blocks: [
      {
        kind: 'p',
        text: 'Long Live is a general-audience site and is not directed to children under 13. We do not knowingly collect personal information from children under 13, we have no accounts, and we ask for no personal details anywhere on the site.',
      },
      {
        kind: 'p',
        text: `If you believe a child has sent us personal information through the feedback box, write to ${LEGAL_FACTS.privacyEmail} and we will delete it.`,
      },
      {
        // Founder/counsel determination 2026-08-24 (Joey): confirmed not
        // directed to children under 13 under COPPA. Revisit if the
        // product later adds anything that changes that (an age gate,
        // marketing aimed at a younger audience, etc.).
        kind: 'p',
        text: 'We have determined, with counsel, that Long Live is not "directed to children" under COPPA.',
      },
    ],
  },
  {
    id: 'international',
    heading: 'Where your information goes',
    blocks: [
      {
        kind: 'p',
        text: 'Our hosting, our issue tracker, our content and Clownbot database, and the AI service used by the mood chat and Clownbot are all operated by companies based in the United States, and information sent to them may be processed there and in other countries. Each provides its own safeguards for international transfers under its terms.',
      },
    ],
  },
  {
    id: 'security',
    heading: 'Security',
    blocks: [
      {
        kind: 'p',
        text: "The site is served over HTTPS. Feedback tickets sit in a private repository behind the founders' accounts. The honest framing is that our best protection is holding almost nothing: there is no account database, no password store, and no payment data to lose.",
      },
    ],
  },
  {
    id: 'changes',
    heading: 'Changes to this policy',
    blocks: [
      {
        kind: 'p',
        text: 'If a feature ever starts collecting something new, we update this page in the same change that ships the feature — that rule is written into the source file this page is generated from, so it is a build-time habit rather than a good intention. The effective date at the top of the page tells you when the current version took effect.',
      },
    ],
  },
];

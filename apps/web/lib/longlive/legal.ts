/**
 * Long Live — legal surface (privacy policy + terms of use). Issue #800, the
 * LEGAL launch gate.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * ⚠️  DRAFT. NOT LEGAL ADVICE. NOT COUNSEL-APPROVED.
 * ─────────────────────────────────────────────────────────────────────────
 * This copy was drafted by an AI agent from a read of the shipped code. It is
 * a drafting aid to make an engagement with qualified counsel cheap — it is
 * NOT a substitute for that review. Nothing here has been reviewed by a
 * lawyer. Do not treat these pages as approved policy until `LEGAL_STATUS`
 * below is flipped to `'approved'` with a `docs/decisions.md` entry linking
 * counsel's sign-off (the rule `docs/launch-readiness.md` sets for every gate:
 * a colour change is claimable only with a link).
 *
 * WHY THE COPY LIVES HERE AND NOT IN JSX. Three reasons, all load-bearing:
 *   1. It is testable. `legal.test.ts` asserts the invariants that matter
 *      (every unanswered question is a tracked placeholder; an `approved`
 *      document cannot contain one; heading structure can't jump a level).
 *   2. The founders have ONE file to edit — `LEGAL_FACTS` below — rather than
 *      hunting blanks across two pages of markup.
 *   3. The factual sections are a description of what the code actually does.
 *      Keeping them next to `lib/longlive/**` means the next person changing
 *      a data path sees them. **If you add or change ANY data collection,
 *      update `PRIVACY_POLICY` in the same change** — the same standing rule
 *      the old privacy page carried, and which was missed twice (the feedback
 *      button and the mood chat both shipped while the page still said "we
 *      collect nothing").
 *
 * Source inventory behind the factual claims (verified 2026-08-11; Clownbot
 * row added 2026-08-24, issue #3251 — the mood-chat/feedback/analytics/
 * on-device/content rows above were not re-verified in that pass):
 *   - feedback:  apps/web/components/longlive/FeedbackButton.tsx
 *                apps/web/app/api/feedback/route.ts
 *   - mood chat: apps/web/components/longlive/MoodChat.tsx
 *                apps/web/app/api/mood/route.ts
 *                apps/web/lib/longlive/mood-client.ts
 *   - analytics: apps/web/app/layout.tsx (`<Analytics />`, @vercel/analytics)
 *   - on-device: packages/experience/src/progress.ts (`ll-progress-v1`,
 *                persisted on web via apps/web/lib/longlive/local-storage-adapter.ts)
 *                apps/web/components/longlive/TimelineScrubber.tsx
 *   - content:   supabase/migrations/** (14 editorial tables, zero personal)
 *   - Clownbot:  apps/web/components/longlive/ClownChat.tsx
 *                apps/web/app/api/clown/route.ts
 *                apps/web/lib/longlive/clown-client.ts (Anthropic call, model)
 *                apps/web/lib/longlive/clown-route-helpers.ts (IP rate limit)
 *                apps/web/lib/longlive/clown-session.ts (anon identity, cookie)
 *                apps/web/lib/longlive/clown-memory.ts (Supabase writes, 180-day
 *                retention, rolling-summary fold)
 *                PLAN.md Stage 11 (feature spec); docs/decisions.md 2026-08-23
 *                item 6 (the 180-day retention figure)
 *   - Android app (verified 2026-08-30, ahead of the Google Play release):
 *                apps/mobile/app.json (name "LongLive", package
 *                ai.jwlabs.longlive, no `android.permissions` declared)
 *                apps/mobile/App.tsx (the only data call is one loadSkeleton()
 *                on mount; no TextInput anywhere in apps/mobile)
 *                apps/mobile/lib/vault.ts → packages/core/src/vault.ts
 *                (three anon SELECTs — era, milestone, month_item — and
 *                `auth: { persistSession: false, autoRefreshToken: false }`)
 *                apps/mobile/package.json (runtime deps are Expo, React
 *                Native, gesture-handler, reanimated, url-polyfill and the
 *                workspace packages — no ad, analytics, or crash SDK)
 */

/**
 * The one switch. `'draft'` renders the review banner on both pages and marks
 * them `noindex`. Counsel signs off → founders flip this to `'approved'`,
 * fill in every `[FOUNDERS: …]` blank, and log the decision. A test refuses
 * to let `'approved'` ship while any placeholder remains.
 */
export const LEGAL_STATUS: 'draft' | 'approved' = 'draft';

/** Marker for a blank only a human can fill. Scanned by `legalPlaceholders()`. */
const FOUNDERS = (question: string): string => `[FOUNDERS: ${question}]`;

/**
 * Every fact an AI agent must not invent. Each value is either a verified fact
 * from the repo or a `FOUNDERS(...)` blank. Nothing in this object may be
 * guessed — a wrong legal entity or a wrong governing law is worse than a
 * visible blank.
 */
export const LEGAL_FACTS = {
  /** The product name. Verified: apps/web/app/layout.tsx metadata. */
  siteName: 'Long Live',
  /** Production host. Verified: apps/web/app/layout.tsx `metadataBase`, docs/deploy.md. */
  siteUrl: 'https://www.longlivets.com',
  /**
   * The operating entity. Provided by Wyatt (founder) on 2026-08-12 — not
   * derivable from the repo, so it is a founder-supplied fact, not a guess.
   */
  entity: 'JW Labs LLC',
  /**
   * Where the entity is formed / whose law governs. Founder-supplied
   * 2026-08-24 (Joey, in chat): California.
   */
  jurisdiction: 'the State of California, USA — JW Labs LLC is formed under California law',
  /**
   * Contact for privacy questions and rights requests. Founder-approved
   * 2026-08-24 (Joey): use the suggested role alias. The retired privacy
   * page published a founder's personal Gmail; this replaces it.
   */
  privacyEmail: 'privacy@longlivets.com',
  /** Where rights-holders send takedown notices. Founder-approved 2026-08-24 (Joey). */
  legalEmail: 'legal@longlivets.com',
  /**
   * Postal address. Founder call 2026-08-24 (Joey): omit per counsel's
   * advice rather than publish one at this project stage.
   */
  postalAddress:
    "not published at this project's stage, per counsel's advice — write to the email addresses above instead",
  /** The date these pages take effect. Founder-set 2026-08-24 (Joey): today, counsel already signed off. */
  effectiveDate: 'August 24, 2026',
} as const;

/** Blocks a legal document is built from. Deliberately small — prose, lists, tables. */
export type LegalBlock =
  | { kind: 'p'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'table'; caption: string; head: string[]; rows: string[][] };

/** One `<h2>` section. There is no `h3` tier by construction — no level can be skipped. */
export type LegalSection = {
  /** Stable anchor id, also the React key. */
  id: string;
  heading: string;
  blocks: LegalBlock[];
};

export type LegalDoc = {
  slug: 'privacy' | 'terms';
  /** The `<h1>` and the `<title>`. */
  title: string;
  /** One-line description for `metadata.description`. */
  description: string;
  /** The plain-language summary rendered directly under the h1. */
  summary: string;
  sections: LegalSection[];
};

// ───────────────────────────────────────────────────────────────────────────
// Privacy policy
// ───────────────────────────────────────────────────────────────────────────

export const PRIVACY_POLICY: LegalDoc = {
  slug: 'privacy',
  title: 'Privacy Policy',
  description: 'What Long Live collects, what it does not, and which third parties are involved.',
  summary:
    'Long Live has no accounts, no logins, no passwords, and no payments, and it never asks you for your name or email. Three features do send something: the feedback button sends what you type to our private issue tracker; the mood chat sends what you type to an AI service so it can read the feeling; and Clownbot sends your questions to an AI service to answer them, and — only once an identity system described below is switched on — remembers the conversation in our database for up to 180 days. Everything else on this page is detail.',
  sections: [
    {
      id: 'who-we-are',
      heading: 'Who we are',
      blocks: [
        {
          kind: 'p',
          text: `${LEGAL_FACTS.siteName} (${LEGAL_FACTS.siteUrl}) is an independent, unofficial fan project about Taylor Swift's career. It is operated by ${LEGAL_FACTS.entity}. It is not affiliated with, endorsed by, sponsored by, or connected to Taylor Swift, her management, her record labels, or her publishers.`,
        },
        {
          kind: 'p',
          text: `Questions about this policy, or a request about your information, go to ${LEGAL_FACTS.privacyEmail}.`,
        },
      ],
    },
    {
      id: 'no-accounts',
      heading: 'There are no accounts',
      blocks: [
        {
          kind: 'p',
          text: 'You browse Long Live anonymously. There is no sign-up, no sign-in, no profile, no password, no payment, and no newsletter. We never ask for your name, email address, phone number, postal address, date of birth, photos, contacts, or precise location, and there is no way to give them to us through a form.',
        },
        {
          kind: 'p',
          text: 'Because there is no account, there is also no account to delete. The only information we ever hold that could be traced back to you is whatever you choose to type into the feedback box, or — if its memory feature is switched on — into Clownbot. See below for both.',
        },
      ],
    },
    {
      id: 'feedback',
      heading: 'The feedback button',
      blocks: [
        {
          kind: 'p',
          text: 'Every page carries a feedback button. If you open it and send a message, we receive what you typed plus a small amount of context describing where in the site you were when you sent it. Sending is entirely optional — the button does nothing until you press send.',
        },
        {
          kind: 'table',
          caption: 'What a feedback submission contains',
          head: ['What', 'Why'],
          rows: [
            ['The message you typed (up to 5,000 characters)', 'It is the feedback.'],
            [
              'Where you were in the site: the era, view, and the ids of any open moment, song, guide, or thread',
              'So a report about "this page" can be traced to an actual page.',
            ],
            [
              'The page address (URL) and page title at the moment you sent it',
              'Same reason — it is the most reliable pointer to what you were looking at.',
            ],
            [
              "Your browser window size and your browser's user-agent string (browser and operating system name and version)",
              'Layout and rendering bugs are usually specific to a browser or a screen size.',
            ],
            ['The date and time you sent it', 'Ordering and triage.'],
          ],
        },
        {
          kind: 'p',
          text: `A submission is filed as a ticket in our private source-code repository on GitHub. That repository is private: it is readable by the project's founders, by the automated agents that triage tickets, and by GitHub as the service provider. It is not published, and feedback is not displayed anywhere on this site.`,
        },
        {
          kind: 'p',
          text: 'Please do not type anything into the feedback box that you would not want kept — it is a free-text field, so it will faithfully record a name, an email address, or anything else you put in it. We do not ask you for any of that and we do not need it to act on a bug report.',
        },
        {
          kind: 'p',
          text: 'Retention: a feedback ticket stays in that tracker indefinitely unless it is deleted. There is no automatic expiry today.',
        },
        {
          kind: 'p',
          text: 'Your IP address is read when you send feedback, purely to enforce a short-term rate limit (a few submissions per minute) that keeps automated abuse off the endpoint. It is held in memory for about a minute, is not written into the ticket, and is not stored anywhere by us.',
        },
      ],
    },
    {
      id: 'mood-chat',
      heading: 'The mood chat',
      blocks: [
        {
          kind: 'p',
          text: 'The mood feature recommends songs from how you say you are feeling. You can use it two ways: by tapping one of the preset mood chips, which sends no text at all, or by typing in your own words.',
        },
        {
          kind: 'p',
          text: "If you type your own words, that text is sent to our server and, from there, to Anthropic's Claude API, whose only job is to score the feeling on eight numeric mood axes. The AI model is never given our song catalogue and never chooses a song; the actual song matching is ordinary code running on our server against the numbers it returns.",
        },
        {
          kind: 'p',
          text: 'We do not store what you type. Our server keeps a log line recording only the resulting numeric mood scores and which song slugs were returned — never your words. If the message trips our crisis check, the feature responds with support resources instead of songs, does not call the AI service, and logs nothing at all.',
        },
        {
          kind: 'p',
          text: 'Anthropic processes the text as a service provider under its own commercial terms and privacy policy, which govern how long it retains an API request. As with feedback, your IP address is read only to rate-limit the endpoint and is not stored.',
        },
        {
          kind: 'p',
          text: 'People sometimes describe genuinely painful things to a feature like this. That is exactly why we do not keep the text. Please still treat it as you would any message typed into a website: send it thoughtfully.',
        },
      ],
    },
    {
      id: 'clownbot',
      heading: 'Clownbot',
      blocks: [
        {
          kind: 'p',
          text: "Clownbot is a chat assistant, separate from the mood chat above, that answers questions about the site's content. Every question you send it — plus the recent turns of that conversation, so it has context — is sent to our server and, from there, to Anthropic's Claude API to generate the answer. Your IP address is read only to enforce a short-term rate limit (at most 15 messages per minute) and is not stored.",
        },
        {
          kind: 'p',
          text: 'Unlike the mood chat, Clownbot\'s server can remember a conversation across visits, using an anonymous identity system built on Supabase (the same third party named in the table below). That system requires a setting ("allow anonymous sign-ins") to be switched on in a dashboard outside this codebase, and as of this policy\'s effective date it has not been switched on — while it is off, nothing else in this section happens: no cookie is set, no message is stored, and Clownbot answers from the current conversation only. We are describing the capability here, as it is built into our code, rather than only its moment-to-moment on/off state, because that switch can be flipped without a new release of the site and we do not want this page to fall out of date the moment it is.',
        },
        {
          kind: 'p',
          text: "Once that identity system is switched on: sending Clownbot a message assigns your browser (or, in the app, your device) an anonymous id — no name, email, or other identifying detail, just a randomly generated identifier — held in a first-party cookie scoped to the chat feature on the website, or in the app's own secure on-device storage, marked so it cannot be read by page scripts and only sent over HTTPS, and set to expire after 180 days. Every message you send and every reply Clownbot gives is then stored against that anonymous id in our Supabase database for up to 180 days since the conversation was last used. Once a stored conversation passes 20 messages, the oldest ones are folded into a short running summary (capped at a few thousand characters) and deleted individually; the summary and the most recent messages are what persists. There is also a limit of 200 messages per day per anonymous id, to control cost and abuse.",
        },
        {
          kind: 'p',
          text: "Because the identity behind a stored Clownbot conversation is anonymous, we generally have no way to match an email from you to a specific one, so we cannot offer the same manual delete-on-request process described for feedback below. A stored conversation is deleted automatically once it has gone unused for 180 days. Clearing your browser's cookies for this site, or the app's storage for it, starts you on a fresh anonymous identity going forward, but does not reach back and delete rows already stored under the old one — those still expire on their own schedule. If you have a concern about a specific conversation, write to us anyway; we will do what we can.",
        },
        {
          kind: 'p',
          text: 'As with the mood chat, please treat Clownbot as you would any message typed into a website: it is processed by us and by Anthropic, and, once the memory system above is active, may be held for a period of time.',
        },
      ],
    },
    {
      id: 'analytics',
      heading: 'Analytics',
      blocks: [
        {
          kind: 'p',
          text: 'We use Vercel Web Analytics to count visits and see which parts of the site people actually use. It runs on every page.',
        },
        {
          kind: 'p',
          text: 'It does not set cookies, does not assign you a persistent identifier, and does not follow you to other websites. What it records is aggregate: page views, the referring site, the device type, the browser and operating system, and the country the request came from. We cannot use it to identify you, and we do not try to.',
        },
        {
          kind: 'p',
          text: 'We run no advertising, no advertising or marketing pixels, no cross-site trackers, and no session-replay tools. We do not sell or share personal information, and we do not engage in targeted advertising or profiling.',
        },
      ],
    },
    {
      id: 'on-your-device',
      heading: 'What stays on your device',
      blocks: [
        {
          kind: 'p',
          text: "The site sets no cookies of its own, except the one described in the Clownbot section above, and only once that feature's memory system is switched on. It does keep two small entries in your browser's local storage, which never leave your device and are never sent to us or to anyone else:",
        },
        {
          kind: 'list',
          items: [
            'A record of what you have explored — the moments you have opened, the Easter eggs you have read, the clue trails you have started, and anything you have favourited — so your progress and favourites are still there when you come back.',
            'A flag remembering that you have already seen the timeline-scrubber hint, so it is not shown to you twice.',
          ],
        },
        {
          kind: 'p',
          text: "Clearing your browser's site data for this site erases both, which resets your progress and your favourites. Nothing else is affected, because we hold no copy.",
        },
      ],
    },
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
  ],
};

// ───────────────────────────────────────────────────────────────────────────
// Terms of use
// ───────────────────────────────────────────────────────────────────────────

export const TERMS_OF_USE: LegalDoc = {
  slug: 'terms',
  title: 'Terms of Use',
  description:
    'The terms for using Long Live, an unofficial Taylor Swift fan project — including our rights position and how to send a takedown notice.',
  summary:
    "Long Live is a free, unofficial fan project. It is not Taylor Swift's site and has nothing to do with her or her team. Use it, enjoy it, do not scrape or misuse it, and if you own something we have published and want it taken down, there is an address below that reaches a human.",
  sections: [
    {
      id: 'unaffiliated',
      heading: 'This is a fan site, not an official one',
      blocks: [
        {
          kind: 'p',
          text: `${LEGAL_FACTS.siteName} is an independent, unofficial, non-commercial fan project created by people who like the music. It is not affiliated with, endorsed by, sponsored by, licensed by, or connected to Taylor Swift, Taylor Nation, her management, her record labels, her publishers, her tour promoters, or any of her business partners. Nothing on this site is an official statement, and no part of it should be read as speaking for her.`,
        },
        {
          kind: 'p',
          text: '"Taylor Swift", the album and tour names, and the associated logos and marks belong to their respective owners. We use them only to refer to the works and events we are writing about — the ordinary way any publication names its subject — and not as branding of our own.',
        },
      ],
    },
    {
      id: 'acceptance',
      heading: 'Accepting these terms',
      blocks: [
        {
          kind: 'p',
          text: `By using ${LEGAL_FACTS.siteUrl} you agree to these terms. If you do not agree, please do not use the site. There is nothing to sign up for and nothing to cancel — you can stop at any time by closing the page.`,
        },
        {
          kind: 'p',
          text: 'Your privacy is covered separately, in our Privacy Policy, which forms part of these terms.',
        },
      ],
    },
    {
      id: 'editorial',
      heading: 'What the content is, and what it is not',
      blocks: [
        {
          kind: 'p',
          text: 'Everything written here is fan commentary, history, and analysis, assembled from published reporting and from what Taylor and her team have said publicly. We write in our own words and cite our sources.',
        },
        {
          kind: 'p',
          text: "We label how confident we are. Anything presented as a fan theory, an Easter-egg reading, a rumour, or an unconfirmed report is exactly that, and is marked as such on the page — it is one reading of the evidence, not a statement of fact, and not a claim about anyone's private life. Where a claim rests on someone else's reporting, we name who reported it and when.",
        },
        {
          kind: 'p',
          text: 'We may be wrong. Dates, details, and interpretations can be mistaken or become out of date, and the site is provided as reference and entertainment, not as an authoritative record. If you spot an error, the feedback button on any page reaches us.',
        },
      ],
    },
    {
      id: 'our-content',
      heading: 'Our own writing',
      blocks: [
        {
          kind: 'p',
          text: 'The original text, structure, design, and code of this site belong to the project. You are welcome to read it, quote a reasonable extract with credit and a link, and share links to it. Please do not copy the site wholesale, republish substantial parts of it as your own, or use automated tools to scrape it in bulk.',
        },
      ],
    },
    {
      id: 'third-party-material',
      heading: 'Photographs, music, and other third-party material',
      blocks: [
        {
          kind: 'p',
          text: 'Photographs, album art, video, and song lyrics quoted on this site are the property of their respective owners — photographers, agencies, labels, publishers, and the artist. We claim no ownership of any of it.',
        },
        {
          kind: 'p',
          text: 'Our position on how it is used here:',
        },
        {
          kind: 'list',
          items: [
            'We credit the source of a photograph wherever the credit is known to us, and many images are loaded directly from the site that published them rather than copied.',
            "Music and official videos play through the rights-holders' own embedded players — Spotify and YouTube — so playback happens on their terms, and we host no audio or video ourselves.",
            'We do not reproduce full song lyrics. Songs are discussed in our own words, quoting at most a line or two to illustrate a point, the way music journalism does.',
            'We do not publish AI-generated images presented as real photographs. Where a stand-in or comparable image is used to illustrate something, it is labelled as one.',
            'The site is a non-commercial work of fan commentary and criticism. We believe this use is fair, but fair use is a defence decided case by case, not a licence — so if you own something here and disagree, tell us and we will act rather than argue.',
          ],
        },
      ],
    },
    {
      id: 'takedown',
      heading: 'Copyright and takedown requests',
      blocks: [
        {
          kind: 'p',
          text: `If you own or represent the owner of material published here and you want it removed, write to ${LEGAL_FACTS.legalEmail}. We take these seriously and we would rather remove something quickly than debate it.`,
        },
        {
          kind: 'p',
          text: 'To let us act fast, please include:',
        },
        {
          kind: 'list',
          items: [
            'The exact address (URL) of the page, and enough description to identify which image or passage you mean.',
            'A description of the work you say is infringed, and your relationship to it.',
            'Your name and contact details.',
            'A statement that you believe in good faith that the use is not authorised by the owner, its agent, or the law.',
            'A statement, made under penalty of perjury, that the information in your notice is accurate and that you are the owner or authorised to act for the owner.',
            'Your physical or electronic signature.',
          ],
        },
        {
          kind: 'p',
          text: 'We will remove or disable access to properly identified material promptly. If you believe your material was removed by mistake, write to the same address and say why.',
        },
        {
          // Founder call 2026-08-24 (Joey): register a DMCA agent. Filing
          // itself needs Joey's own Copyright Office account/payment — see
          // HUMAN-ACTIONS.md. Update this line to say "is registered" once
          // that filing is actually complete — do not claim it early.
          kind: 'p',
          text: 'We are in the process of registering a designated DMCA agent with the U.S. Copyright Office to receive these notices.',
        },
        {
          kind: 'p',
          text: `Notices about trademarks, publicity rights, or anything else you believe is wrong on the site go to the same address: ${LEGAL_FACTS.legalEmail}.`,
        },
      ],
    },
    {
      id: 'acceptable-use',
      heading: 'Using the site responsibly',
      blocks: [
        {
          kind: 'p',
          text: 'There is no account to lose, so this is short. Please do not:',
        },
        {
          kind: 'list',
          items: [
            'Scrape, crawl, or bulk-download the site beyond what a normal reader does, or try to get around our rate limits.',
            "Use the feedback box, the mood chat, or Clownbot to send abusive, threatening, unlawful, or deliberately misleading messages, to send other people's personal information, or to try to make our systems misbehave.",
            'Attempt to break into, disrupt, or probe the site or the services behind it.',
            "Republish the site's content as your own, or present anything from it as an official statement by Taylor Swift or her team.",
          ],
        },
        {
          kind: 'p',
          text: 'Anything you send us through the feedback box, you give us permission to use to fix and improve the site. Please do not send anything confidential, and please do not send anything you do not have the right to send.',
        },
      ],
    },
    {
      id: 'mood-not-advice',
      heading: 'The mood chat is a song recommender, not support',
      blocks: [
        {
          kind: 'p',
          text: 'The mood feature exists to pick songs. It is not counselling, therapy, medical or mental-health advice, or a crisis service, and it must not be relied on as any of those. If you are struggling or in danger, please contact your local emergency number or a crisis line — the feature will show you resources rather than songs if it recognises a message of that kind, but it can miss, and it is not a substitute for a person.',
        },
      ],
    },
    {
      id: 'external-links',
      heading: 'Links to other sites',
      blocks: [
        {
          kind: 'p',
          text: 'We link out to news articles, official posts, and other sources, and we embed players from Spotify and YouTube. We do not control those sites and are not responsible for their content, their availability, or their handling of your data. Their terms and privacy policies apply once you are there.',
        },
      ],
    },
    {
      id: 'availability',
      heading: 'Availability and changes',
      blocks: [
        {
          kind: 'p',
          text: 'The site is free and provided as-is. We may change, suspend, or discontinue any part of it — including the feedback button and the mood chat — at any time and without notice. We may update these terms; the effective date at the top of the page tells you when the current version took effect, and continuing to use the site after a change means you accept it.',
        },
      ],
    },
    {
      id: 'disclaimer',
      heading: 'Disclaimer and limitation of liability',
      blocks: [
        {
          kind: 'p',
          text: 'To the fullest extent the law allows, the site is provided "as is" and "as available", without warranties of any kind, express or implied, including any warranty of accuracy, merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that the site will be uninterrupted, error-free, or free of harmful components.',
        },
        {
          kind: 'p',
          text: 'To the fullest extent the law allows, we are not liable for any indirect, incidental, special, consequential, or exemplary damages arising from your use of the site. Nothing in these terms excludes any liability that cannot lawfully be excluded, and some jurisdictions do not allow some of these exclusions, in which case they apply to you only as far as the law permits.',
        },
      ],
    },
    {
      id: 'governing-law',
      heading: 'Governing law',
      blocks: [
        {
          kind: 'p',
          text: `These terms are governed by the laws of ${LEGAL_FACTS.jurisdiction}, and the courts there have exclusive jurisdiction over any dispute, without regard to conflict-of-law rules. If any provision of these terms is held unenforceable, the rest remains in force.`,
        },
      ],
    },
    {
      id: 'contact',
      heading: 'Contact',
      blocks: [
        {
          kind: 'p',
          text: `Takedown and legal notices: ${LEGAL_FACTS.legalEmail}. Privacy questions and data requests: ${LEGAL_FACTS.privacyEmail}. Postal notices: ${LEGAL_FACTS.postalAddress}. Everything else — corrections, bugs, "you got this wrong" — is best sent through the feedback button on any page, which reaches us fastest.`,
        },
        {
          kind: 'p',
          text: `${LEGAL_FACTS.siteName} is operated by ${LEGAL_FACTS.entity}.`,
        },
      ],
    },
  ],
};

/** Both documents, in the order they appear in the footer. */
export const LEGAL_DOCS: LegalDoc[] = [PRIVACY_POLICY, TERMS_OF_USE];

/** Footer links to the legal pages. Kept here so the pages can never be orphaned. */
export const LEGAL_LINKS: { href: string; label: string }[] = LEGAL_DOCS.map((doc) => ({
  href: `/${doc.slug}`,
  label: doc.title,
}));

/** Every string in a document, flattened — the corpus placeholder scanning reads. */
function docStrings(doc: LegalDoc): string[] {
  const out = [doc.title, doc.description, doc.summary];
  for (const section of doc.sections) {
    out.push(section.heading);
    for (const block of section.blocks) {
      if (block.kind === 'p') out.push(block.text);
      else if (block.kind === 'list') out.push(...block.items);
      else out.push(block.caption, ...block.head, ...block.rows.flat());
    }
  }
  return out;
}

const PLACEHOLDER_RE = /\[FOUNDERS:[^\]]*\]/g;

/**
 * Every unanswered question across `LEGAL_FACTS` and both documents, deduped.
 * This is the founders' to-do list, and the test that stops an `approved`
 * document shipping with a blank still in it.
 */
export function legalPlaceholders(): string[] {
  const corpus = [...Object.values(LEGAL_FACTS), ...LEGAL_DOCS.flatMap(docStrings)];
  const found = new Set<string>();
  for (const text of corpus) {
    for (const match of text.matchAll(PLACEHOLDER_RE)) found.add(match[0]);
  }
  return [...found];
}

/** True when a string still carries an unfilled `[FOUNDERS: …]` blank. */
export function hasPlaceholder(text: string): boolean {
  return new RegExp(PLACEHOLDER_RE.source).test(text);
}

/**
 * A draft must not be indexed: an unreviewed policy ranking in search results
 * reads as settled policy to anyone who lands on it. Flipping `LEGAL_STATUS`
 * to `'approved'` lets the crawlers in.
 */
export function legalRobots(status: typeof LEGAL_STATUS = LEGAL_STATUS): {
  index: boolean;
  follow: boolean;
} {
  return status === 'approved' ? { index: true, follow: true } : { index: false, follow: true };
}

/**
 * Sitemap entries for the legal pages — empty while they are drafts, because a
 * draft renders `noindex` and listing a `noindex` URL contradicts itself.
 */
export function legalSitemapEntries(status: typeof LEGAL_STATUS = LEGAL_STATUS): { url: string }[] {
  if (status !== 'approved') return [];
  return LEGAL_DOCS.map((doc) => ({ url: `${LEGAL_FACTS.siteUrl}/${doc.slug}` }));
}

/** The dateline under the page title. */
export function legalEffectiveLine(status: typeof LEGAL_STATUS = LEGAL_STATUS): string {
  return status === 'approved'
    ? `Effective ${LEGAL_FACTS.effectiveDate}.`
    : 'Not yet in effect — this draft takes effect on the date counsel approves it.';
}

/** Copy for the review banner shown on every draft page. */
export const LEGAL_DRAFT_BANNER = {
  title: 'Draft — not yet reviewed by a lawyer',
  body: 'This page is a working draft prepared to describe what the site actually does. It has not been reviewed or approved by qualified counsel, it is not legal advice, and it is not yet in effect. Sections marked [FOUNDERS: …] are open questions awaiting a human answer.',
} as const;

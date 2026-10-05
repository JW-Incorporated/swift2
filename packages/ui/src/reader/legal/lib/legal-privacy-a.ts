import { LEGAL_FACTS } from './legal-types';
import type { LegalSection } from './legal-types';

export const PRIVACY_SECTIONS_A: LegalSection[] = [
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
            'The page path (for example /era/lover) and page title at the moment you sent it. The query string and anything after a # are removed before sending and are never included',
            'Same reason — it is the most reliable pointer to what you were looking at.',
          ],
          [
            "Your window size and a coarse platform label (\"iOS app\", \"Android app\", \"web: mobile\" or \"web: desktop\"). Your browser's user-agent string is not sent",
            'Layout and rendering bugs are usually specific to a screen size or to the app versus the web.',
          ],
          ['The date and time you sent it', 'Ordering and triage.'],
        ],
      },
      {
        kind: 'p',
        text: `A submission is filed as a ticket in our source-code repository on GitHub. That repository is public, so a ticket, including what you typed, can be read by anyone on GitHub; please do not put personal details in it. Feedback is not displayed anywhere on this site itself.`,
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
        text: 'We use Vercel Web Analytics to count visits and see which parts of the site people actually use. It runs on every page of the website. The mobile apps do not include it: the app shows these same pages inside the app itself, and analytics does not run there.',
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
        text: "The site sets no cookies of its own, except the one described in the Clownbot section above, and only once that feature's memory system is switched on. It does keep two small entries in your browser's local storage (in the app, a small file on your device instead). We never receive them and never send them to anyone else; in the app, your phone's own iCloud or Google backup may include that file:",
      },
      {
        kind: 'list',
        items: [
          'A record of what you have explored — the moments you have opened, the Easter eggs you have read, the clue trails you have started, and anything you have favourited — so your progress and favourites are still there when you come back.',
          'A flag remembering that you have already seen the swipe-between-songs hint on a song page, so it is not shown to you twice.',
        ],
      },
      {
        kind: 'p',
        text: "Clearing your browser's site data for this site (or, in the app, clearing the app's data) erases both on that device, which resets your progress and your favourites; a copy in your own phone backup, if any, is yours to manage. Nothing else is affected, because we hold no copy.",
      },
    ],
  },
];

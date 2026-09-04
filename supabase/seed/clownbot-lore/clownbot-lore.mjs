// Clownbot no-DB fallback — SEED source (Fable ruling FR-t_2745eb60-1, #3515).
//
// This is now the authored source of truth for Clownbot's status-tagged
// rumor/lore fallback. `apps/web/lib/longlive/clownbot-lore.ts` is GENERATED
// from this file by `scripts/sync-clownbot-lore.mjs` (wired into
// `npm run sync:content`) — it is no longer hand-edited. This mirrors the
// two existing generated-vault-file exceptions (theories, era-secrets, etc.):
// the seed-only Vault Run lane edits THIS file, never the `.ts` output.
//
// Lives in its own `supabase/seed/clownbot-lore/` directory (a sibling of
// `supabase/seed/content/`) rather than inside `content/` — the content sync
// (scripts/sync-longlive-content.mjs) directory-scans every `.mjs` under
// `content/` and would otherwise try to parse this as a Vault moment file.
//
// THE RULE THAT GOVERNS THIS FILE: no source, no ship. Every item carries at
// least one named outlet with a real https URL and a real date. Nothing in
// here may be written from memory, inferred, or "probably about right" — a
// bot asserting a debunked rumor as live is instant credibility death
// (research finding #8), and a bot asserting a *fabricated* rumor is worse.
// `clownbot-lore.test.ts` enforces the shape on the generated output; a
// human (or frontier model, per the refresh doc) enforces the truth here.
//
// PRIVACY: every item must be checked against docs/content-ops/privacy-redlines.md
// BEFORE it is written down, not after. No location beyond L0/L1, no
// body/health/sexuality speculation, no relationship prognosis, no private
// individuals.
//
// REFRESH PATH: docs/content-ops/clownbot-rumor-refresh.md. Edit items below,
// bump `updatedOn`, then run `npm run sync:content` to regenerate
// `clownbot-lore.ts` (`LORE_UPDATED_ON` / `lastCheckedOn` come straight from
// this seed).
//
// Schema per item (mirrors `LoreItem` in apps/web/lib/longlive/clownbot-lore.ts):
//   id            stable id; the model cites this as a receipt
//   status        'rumor' | 'reported' | 'confirmed' | 'debunked'
//   date          ISO — when it happened, or when it was reported
//   lastCheckedOn ISO — when a human/frontier-model last verified the status
//   headline      one line, our words
//   detail        1-3 sentences, our words, never asserting past `status`
//   sources       [{ outlet, url }], at least one, real https URL
//   prompts       optional suggested-prompt seeds
//   ledger        optional { theory, verdict: 'clowned'|'confirmed', on }
//   evergreen     optional — stays in the prompt pool once the fresh window empties
//   tags          optional string[]

export default {
  // ISO date of the last editorial sweep. Surfaced to the reader as
  // LORE_UPDATED_ON. Bump this on every sweep, whether or not any item's
  // status changed.
  updatedOn: '2026-08-31',

  items: [
    {
      id: 'masters-buyback',
      status: 'confirmed',
      date: '2025-05-30',
      lastCheckedOn: '2026-08-11',
      headline: 'She bought her masters back',
      detail:
        'On 30 May 2025 Taylor announced on her own website that she had purchased the master recordings of her first six albums from Shamrock Capital — "All of the music I\'ve ever made now belongs to me." Six years, four Taylor\'s Versions, and one very public fight, over.',
      sources: [
        {
          outlet: 'Billboard',
          url: 'https://www.billboard.com/pro/taylor-swift-regains-control-master-recordings-shamrock/',
        },
        {
          outlet: 'Variety',
          url: 'https://variety.com/2025/music/news/taylor-swift-buys-rights-first-six-albums-shamrock-1236413964/',
        },
        {
          outlet: 'The Washington Post',
          url: 'https://www.washingtonpost.com/entertainment/music/2025/05/30/taylor-swift-masters-shamrock-capital/',
        },
      ],
      prompts: [
        'She owns the masters now — so what is the actual argument for ever finishing the re-records? Take a side.',
        'Decode the timing: masters in May, album announcement in August. Coincidence, or a plan? Commit.',
      ],
      evergreen: true,
      tags: ['business', 're-records'],
    },
    {
      id: 'rep-tv-debut-tv',
      status: 'rumor',
      date: '2025-05-30',
      lastCheckedOn: '2026-08-31',
      headline: "Reputation (Taylor's Version) and the debut re-record: still unreleased",
      detail:
        'Alongside the masters announcement Taylor said she has not re-recorded even a quarter of Reputation, and that those two albums could re-emerge "when the time is right" — not from sadness, but "a celebration now." Neither has been released or dated. This is the fandom\'s longest-running open question and its most reliable source of clowning.',
      sources: [
        {
          outlet: 'Rolling Stone',
          url: 'https://www.rollingstone.com/music/music-news/taylor-swift-reputation-taylors-version-not-releasing-1235351379/',
        },
        {
          outlet: 'Billboard',
          url: 'https://www.billboard.com/music/music-news/reputation-taylors-version-taylor-swift-will-she-release-it-1235985800/',
        },
        {
          outlet: 'Associated Press',
          url: 'https://apnews.com/article/672dc24782f5b0f04c864a6fd86665d8',
        },
      ],
      prompts: [
        "Decode this: she said she hasn't re-recorded a quarter of REPUTATION. She said nothing about the debut. What does that omission mean?",
        'Rank the odds: Reputation TV, debut TV, or neither ever. Commit to a number.',
      ],
      evergreen: true,
      tags: ['re-records', 'open-question'],
    },
    {
      id: 'tloas-countdown-announcement',
      status: 'confirmed',
      date: '2025-08-12',
      lastCheckedOn: '2026-08-11',
      headline: 'The Life of a Showgirl, announced by countdown at 12:12am',
      detail:
        'A countdown appeared on taylorswift.com and hit zero at 12:12am ET on 12 August 2025, announcing her twelfth studio album. She confirmed it the next day on the New Heights podcast. Twelfth album, 12:12, 12 August — the numerology was doing overtime and, for once, the fandom was right about all of it.',
      sources: [
        {
          outlet: 'Wikipedia — The Life of a Showgirl',
          url: 'https://en.wikipedia.org/wiki/The_Life_of_a_Showgirl',
        },
      ],
      prompts: [
        "The countdown hit zero at 12:12 on 8/12 for album 12. Draft the case that the number twelve is now a permanent part of her cipher — or tell me I'm reaching.",
        'Rank her announcement methods by how hard they made us work. Countdown, podcast, liner note, orange door — take a side.',
      ],
      ledger: {
        theory:
          'That a countdown on her own website meant an album, not a tour leg, a merch drop, or a re-record',
        verdict: 'confirmed',
        on: '2025-08-12',
      },
      evergreen: true,
      tags: ['tloas', 'countdown', 'numerology'],
    },
    {
      id: 'orange-doors-hunt',
      status: 'confirmed',
      date: '2025-10-03',
      lastCheckedOn: '2026-08-11',
      headline: 'Twelve orange doors in twelve cities',
      detail:
        'The Life of a Showgirl promo ran as a real-world scavenger hunt built with Google: twelve orange doors hidden in twelve cities, each with a QR code leading to a short stylised video of album clues. Peak modern egg-hunt — and, as it turned out, the thing that started the biggest fight the fandom has had with her team.',
      sources: [
        {
          outlet: 'NBC News',
          url: 'https://www.nbcnews.com/pop-culture/pop-culture-news/taylor-swift-gen-ai-accusations-fans-promo-videos-rcna236025',
        },
        {
          outlet: 'PetaPixel',
          url: 'https://petapixel.com/2025/10/09/taylor-swift-accused-of-using-ai-for-life-of-a-showgirl-promo-videos/',
        },
      ],
      prompts: [
        'Twelve doors, twelve cities, one QR code each. Rank the door videos by how much actual signal they carried.',
      ],
      evergreen: true,
      tags: ['tloas', 'easter-eggs', 'promo'],
    },
    {
      id: 'swifties-against-ai',
      status: 'reported',
      date: '2025-10-09',
      lastCheckedOn: '2026-08-31',
      headline: '#SwiftiesAgainstAI: the orange-door videos and the generative-AI accusations',
      detail:
        "Fans spotted artefacts in the orange-door promo videos — a bartender's finger blending into a napkin, gym equipment whose handles did not line up — and accused her team of using generative AI. The hashtag #SwiftiesAgainstAI came largely from inside the fandom, not from detractors. Reported widely; her team has neither confirmed nor denied it. Status stays `reported`, not `confirmed`: the accusation is documented, the AI use is not.",
      sources: [
        {
          outlet: 'NBC News',
          url: 'https://www.nbcnews.com/pop-culture/pop-culture-news/taylor-swift-gen-ai-accusations-fans-promo-videos-rcna236025',
        },
        {
          outlet: 'PetaPixel',
          url: 'https://petapixel.com/2025/10/09/taylor-swift-accused-of-using-ai-for-life-of-a-showgirl-promo-videos/',
        },
        {
          outlet: 'WIRED',
          url: 'https://www.wired.com/story/taylor-swift-swifties-against-ai-viral/',
        },
      ],
      prompts: [
        'The orange-door videos and #SwiftiesAgainstAI — take a side, and be honest about what a bot is doing in this argument.',
      ],
      evergreen: true,
      tags: ['ai', 'promo', 'fandom'],
    },
    {
      id: 'green-ts-next-era',
      status: 'reported',
      date: '2026-08-20',
      lastCheckedOn: '2026-08-31',
      headline: 'The green “TS” clue: debut, Reputation, TS13 — or a skyscraper trolling',
      detail:
        'The Empire State Building posted itself lit green with “WhaTS happening?” while a separate green TS logo circulated online. Coverage documented fans splitting among a debut anniversary release, Reputation vault tracks, and TS13. Nothing from Taylor or her team connects either image to a release, so the clue remains fandom interpretation, not an announcement.',
      sources: [
        {
          outlet: 'Us Weekly',
          url: 'https://www.usmagazine.com/entertainment/news/is-taylor-swift-teasing-her-13th-album-fan-theories-clues/',
        },
        {
          outlet: 'Creative Bloq',
          url: 'https://www.creativebloq.com/design/branding/swifties-calm-down-not-everything-is-a-taylor-swift-easter-egg',
        },
        {
          outlet: 'CinemaBlend',
          url: 'https://www.cinemablend.com/streaming-news/the-empire-state-building-trolled-swifties-as-they-freaked-out-over-taylor-swift-taylors-version',
        },
      ],
      prompts: [
        'Green TS logo, green Empire State Building, and a 20th anniversary coming: debut, Reputation, TS13, or pure trolling? Pick one.',
      ],
      tags: ['re-records', 'ts13', 'easter-eggs'],
    },
    {
      id: 'ts13-lilac-cipher',
      status: 'reported',
      date: '2026-08-21',
      lastCheckedOn: '2026-08-31',
      headline: 'The lilac TS13 cipher is back in circulation',
      detail:
        'Fans have linked a run of lavender styling to the lilac thirteenth-floor button in the “Bejeweled” video and argued that it sketches a TS13 palette. The visual details and the fan theory are documented; an album title, color system, and release plan are not confirmed.',
      sources: [
        {
          outlet: 'Us Weekly',
          url: 'https://www.usmagazine.com/entertainment/news/is-taylor-swift-teasing-her-13th-album-fan-theories-clues/',
        },
        {
          outlet: 'Elle',
          url: 'https://www.elle.com/culture/music/a71338882/taylor-swift-13th-album-easter-eggs-explained/',
        },
      ],
      prompts: [
        'Lavender dress, lilac thirteenth-floor button, TS13: build the strongest version of the color theory, then tell me where it breaks.',
      ],
      tags: ['ts13', 'color-coding', 'easter-eggs'],
    },
    {
      id: 'writing-new-music-post-wedding',
      status: 'reported',
      date: '2026-08-27',
      lastCheckedOn: '2026-08-31',
      headline: 'Reportedly "writing new music" and "incredibly inspired" since the wedding',
      detail:
        'A Page Six insider said Taylor has been "pouring herself into writing new music" and is "incredibly inspired creatively" in the weeks after her July wedding, with songwriting "her main focus." Reported across outlets, all tracing to that single Page Six sourcing; Taylor and her team have announced no album, title, or timeline. Status stays `reported`, not `confirmed` — an unnamed-insider report is not an announcement.',
      sources: [
        {
          outlet: 'Page Six (via Just Jared)',
          url: 'https://www.justjared.com/2026/08/27/taylor-swift-is-reportedly-working-on-new-music/',
        },
        {
          outlet: 'Rolling Stone',
          url: 'https://www.rollingstone.com/music/music-news/taylor-swift-color-theory-explained-new-music-1235617057/',
        },
      ],
      prompts: [
        'An insider says she is "writing new music" weeks after the wedding. Real TS13 signal, or just what insiders always say? Commit.',
      ],
      tags: ['ts13', 'next-era'],
    },
    {
      id: 'engagement-announcement',
      status: 'confirmed',
      date: '2025-08-26',
      lastCheckedOn: '2026-08-11',
      headline: '"Your English teacher and your gym teacher are getting married"',
      detail:
        "Taylor and Travis Kelce announced their engagement on Instagram on 26 August 2025 with that caption. The post broke Instagram's record for fastest to a million likes. Included here because they published it themselves — canon-level fact only; this file carries no relationship speculation, prognosis, or private detail beyond what the two of them posted.",
      sources: [
        {
          outlet: 'NFL.com',
          url: 'https://www.nfl.com/news/chiefs-te-travis-kelce-taylor-swift-announce-engagement-on-social-media',
        },
        {
          outlet: 'Rolling Stone',
          url: 'https://www.rollingstone.com/music/music-news/taylor-swift-travis-kelce-engagement-broke-instagram-record-1235416530/',
        },
      ],
      tags: ['canon'],
    },
    {
      id: 'superbowl-lx-halftime',
      status: 'confirmed',
      date: '2026-02-08',
      lastCheckedOn: '2026-08-11',
      headline: 'Super Bowl LX halftime was Bad Bunny',
      detail:
        "Bad Bunny headlined the Super Bowl LX halftime show at Levi's Stadium on 8 February 2026, with guests including Lady Gaga and Ricky Martin — the first halftime show performed primarily in Spanish. It was, notably, not Taylor Swift.",
      sources: [
        {
          outlet: 'ABC News',
          url: 'https://abcnews.com/GMA/Culture/bad-bunny-announced-super-bowl-lx-halftime-performer/story?id=125629986',
        },
        {
          outlet: 'Wikipedia — Super Bowl LX halftime show',
          url: 'https://en.wikipedia.org/wiki/Super_Bowl_LX_halftime_show',
        },
      ],
      prompts: [
        "Bad Bunny played Levi's Stadium in February 2026 and so did the Eras Tour. Tell me why that is not a clue, because I still think it is.",
      ],
      tags: ['superbowl'],
    },
    {
      id: 'superbowl-lx-swiftie-theory',
      status: 'debunked',
      date: '2026-02-08',
      lastCheckedOn: '2026-08-11',
      headline: 'The Super Bowl LX theory, and how thoroughly it died',
      detail:
        "Through late 2025 the fandom assembled a genuinely impressive board for Taylor headlining Super Bowl LX: Levi's Stadium had hosted an Eras Tour show, the 49ers' mascot is Sourdough Sam, and every outfit was read as a hint. Then Bad Bunny walked out on 8 February 2026. The receipts were real. The conclusion was not. This is the house exhibit for how clowning works.",
      sources: [
        {
          outlet: 'Newsweek',
          url: 'https://www.newsweek.com/taylor-swift-super-bowl-2026-travis-kelce-sourdough-49ers-easter-egg-2114466',
        },
        {
          outlet: 'ABC News',
          url: 'https://abcnews.com/GMA/Culture/bad-bunny-announced-super-bowl-lx-halftime-performer/story?id=125629986',
        },
      ],
      ledger: {
        theory:
          "That the Levi's Stadium / Sourdough Sam / show-number-47 trail meant Taylor was headlining the Super Bowl LX halftime show",
        verdict: 'clowned',
        on: '2026-02-08',
      },
      prompts: [
        'Autopsy the Super Bowl LX theory with me. Which receipt was actually load-bearing, and which one were we just enjoying?',
      ],
      evergreen: true,
      tags: ['superbowl', 'clowned'],
    },
  ],
};

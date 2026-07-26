// Per-song dossiers for the folklore era (issue #440 / #726 pattern), keyed by
// track slug and attached in folklore.mjs. Researched and fact-checked
// 2026-07-25 in answer to cross-link candidate #1391 (cardigan ↔ willow), which
// needed the cardigan side of the sister-album link authored as a real sourced
// dossier rather than a connections-only stub. No lyric quotations. Confirmed
// tier = Swift's own statements / a collaborator on the record / hard
// documented facts (charts, credits). Supported = well-documented critical
// consensus. Internal song:<slug> connection ids resolve globally across the
// tracks seeds and are asserted by apps/web/lib/longlive/tracks.test.ts.

export default {
  cardigan: {
    whyItMatters: [
      'cardigan is the lead single that recontextualized Swift’s whole career. Released with a self-directed video at folklore’s surprise midnight drop on July 24, 2020, it debuted at No. 1 on the Billboard Hot 100 (chart dated August 8, 2020) the same week folklore entered the Billboard 200 at No. 1 — making Swift the first artist ever to debut atop both charts simultaneously, a feat "willow" would repeat four months later. All sixteen standard-edition folklore tracks charted on the Hot 100 that week.',
      'It is also the anchor of the album’s central fiction. cardigan is the adult Betty looking back on a teenage love triangle Swift invented and told across three songs — cardigan (Betty’s memory), "august" (the other girl’s summer), and "betty" (James’s apology). Its self-directed video (cinematography by Rodrigo Prieto) sends Swift through a portal in a mossy piano into a forest and a storm-tossed sea, following a golden thread of light that the "willow" video then picks up exactly where this one ends — literalizing the folklore–evermore sister-album bond.',
    ],
    meaning: {
      confirmed: [
        'Written by Taylor Swift and Aaron Dessner and produced by Dessner, cut remotely during the 2020 lockdown for folklore, the surprise album that traded confession for character-driven fiction.',
        'Swift confirmed that cardigan, "betty" and "august" form one invented love triangle told from three perspectives, with cardigan as Betty’s adult vantage; she has said the character names (James, Betty, Inez) were borrowed from the children of friends.',
        'Swift self-directed the video (premiered July 24, 2020; cinematography by Rodrigo Prieto), which the "willow" video later continues on the same piano and golden thread.',
      ],
      supported: [
        'Critics read cardigan as Swift’s most indie turn to date — a muted piano-and-atmosphere lead single built with the National’s Aaron Dessner rather than a radio-first pop play — and treated the choice of it as the album’s opening statement of intent.',
        'The title metaphor (being someone’s favorite old comfort object, rescued from under the bed) was a frequent point of praise as a compressed image for being discarded and chosen again.',
      ],
    },
    connections: [
      {
        relatedId: 'song:willow',
        label: 'willow',
        why: 'evermore’s lead single and cardigan’s twin: the willow video opens on the same piano cardigan’s ended on and follows the same golden thread, and both debuted at No. 1 on the Hot 100 and Billboard 200 at once — the clearest link between the sister albums.',
      },
      {
        relatedId: 'song:august',
        label: 'august',
        why: 'the same teenage love triangle from the other side — cardigan is Betty remembering, "august" is the girl who lived for a single summer she never quite owned.',
      },
      {
        relatedId: 'song:betty',
        label: 'betty',
        why: 'the triangle’s third voice: James’s public apology to Betty, the plea cardigan answers from years down the line.',
      },
    ],
    live: [
      {
        date: '2021-03-14',
        event: '63rd Annual Grammy Awards',
        note: 'Performed in the cottagecore forest medley with "august" and "willow" — the first televised airing of the folklore/evermore material, the night folklore won Album of the Year.',
      },
      {
        event: 'The Eras Tour — folklore act',
        note: 'Anchors the folklore section, staged around the moss-covered cabin that stands in for the album’s woodland world.',
      },
    ],
    voices: [
      {
        who: 'Taylor Swift',
        context: 'on the folklore love triangle',
        note: 'Publicly framed cardigan, "betty" and "august" as one story told from three viewpoints — the clearest key she has given to the album’s fiction, with cardigan as the grown Betty’s recollection.',
      },
    ],
    sources: [
      { name: 'cardigan (song) — Wikipedia', url: 'https://en.wikipedia.org/wiki/Cardigan_(song)' },
      { name: 'Billboard: Taylor Swift’s “Cardigan” Debuts Atop Hot 100', url: 'https://www.billboard.com/pro/taylor-swift-cardigan-folklore-debut-number-one/' },
      { name: 'Billboard: 16 songs from folklore hit the Hot 100', url: 'https://www.billboard.com/pro/taylor-swift-charts-16-songs-from-folklore-on-hot-100/' },
      { name: 'Billboard: Taylor Swift’s 2021 Grammys medley', url: 'https://www.billboard.com/music/awards/taylor-swift-performs-2021-grammy-awards-medley-9540356/' },
    ],
  },
};

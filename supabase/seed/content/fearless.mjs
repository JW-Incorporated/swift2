// Vault content — Fearless era.
//
// Two wavetop months: Nov 2008 (album release) and Apr 2009 (tour opens).
// Every claim verified against its cited source directly. See
// docs/marketing/content-framework-2026-07-03.md for the no-fabrication
// rule and the light-touch (link-first) authoring model this follows.

export default {
  eraSlug: 'fearless',
  items: [
    {
      year: 2008,
      month: 9,
      category: 'music',
      title: "Love Story, and the boy her family didn't approve of",
      snippet:
        "Inspired by a boy she never actually dated — her family and friends \"all said they didn't like him,\" which she said reminded her of Romeo and Juliet, minus the tragic ending.",
      sourceUrl: 'https://en.wikipedia.org/wiki/Love_Story_(Taylor_Swift_song)',
      thumbnailUrl: null,
      moment: {
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Love_Story_(Taylor_Swift_song)' }],
        photos: [],
      },
    },
    {
      year: 2008,
      month: 11,
      category: 'business',
      title: 'Fearless makes her the youngest Album of the Year winner — for a decade',
      snippet:
        '592,000 copies in week one, debuting at No. 1 — then at the Grammys, 20-year-old Swift became the youngest Album of the Year winner ever, a record that stood until Billie Eilish broke it a decade later.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Fearless_(Taylor_Swift_album)',
      thumbnailUrl: null,
      moment: {
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Fearless_(Taylor_Swift_album)',
          },
          {
            outlet: 'Guinness World Records',
            url: 'https://www.guinnessworldrecords.com/world-records/607151-youngest-solo-artist-to-win-album-of-the-year-at-the-grammy-awards',
          },
        ],
        photos: [],
      },
    },
    {
      year: 2009,
      month: 4,
      category: 'tour',
      title: 'The Fearless Tour opens to a sold-out crowd in 30 seconds',
      snippet:
        "Evansville, Indiana gave her the key to the city and declared it \"Taylor Swift Day\" — the start of her first-ever headlining tour.",
      sourceUrl: 'https://en.wikipedia.org/wiki/Fearless_Tour',
      thumbnailUrl: null,
      moment: {
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Fearless_Tour' }],
        photos: [],
      },
    },
  ],
};

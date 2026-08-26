// Vault theories/easter eggs — folklore era. Woodvale, the love triangle, and
// William Bowery: the era that turned theorizing into a lockdown sport.
// All URLs verified 2026-07-08.

const wiki = (article, title, notes) => ({
  source_url: `https://en.wikipedia.org/wiki/${article}`,
  source_title: title,
  publisher: 'Wikipedia',
  source_type: 'wiki',
  accessed_at: '2026-08-08',
  reliability_score: 2,
  excerpt: null,
  notes: notes ?? null,
});

export default {
  eraSlug: 'folklore',
  theories: [
    {
      slug: 'woodvale',
      kind: 'theory',
      title: 'Woodvale: the third sister album that never was',
      claim:
        'Fans spotted the word "Woodvale" hidden in a folklore promo image and concluded a THIRD surprise sister album was coming after evermore. It never did.',
      evidence:
        'The word really was there — Taylor later explained on late-night TV that "Woodvale" was a working codename for folklore that mistakenly survived on a mock-up. A perfect case study: real artifact, real pattern-matching, wrong conclusion, official debunk.',
      confidence: 'strong_fan_consensus',
      outcome: 'debunked',
      relatedSlugs: ['evermore:thirteen-backwards'],
      sources: [wiki('Evermore_(Taylor_Swift_album)', 'Evermore (Taylor Swift album)', 'the Woodvale codename accident and her explanation are documented in the album article')],
    },
    {
      slug: 'teenage-love-triangle',
      kind: 'theory',
      title: 'The teenage love triangle',
      claim:
        'Fans mapped "cardigan," "august," and "betty" as one story told by three narrators — Betty, Augustine, and James — and were right: Taylor confirmed the Teenage Love Triangle by name.',
      evidence:
        'Decoded within hours of release from shared names and mirrored details across the three lyrics; Taylor confirmed the intended triangle in interviews and the Long Pond sessions. The characters are explicitly fictional — which is what makes this the fandom\'s cleanest confirmed close-read.',
      confidence: 'official',
      outcome: 'confirmed',
      relatedSlugs: ['evermore:dorothea-and-the-love-triangle'],
      sources: [
        wiki('Folklore_(Taylor_Swift_album)', 'Folklore (Taylor Swift album)'),
        wiki('Cardigan_(song)', 'cardigan (song)'),
      ],
    },
    {
      slug: 'william-bowery',
      kind: 'theory',
      title: 'Who is William Bowery?',
      claim:
        'A never-before-seen co-writer named William Bowery appeared in the folklore credits. Fans immediately suspected a pseudonym — and in the Long Pond film Taylor confirmed it on camera.',
      evidence:
        'The credits were the entire clue: no such songwriter existed anywhere. The confirmation came in folklore: the long pond studio sessions, where she named the person behind the pen name. Textbook fandom arc — anomaly, theory, on-record resolution within months.',
      confidence: 'confirmed_interview',
      outcome: 'confirmed',
      relatedSlugs: [],
      sources: [wiki('Folklore:_The_Long_Pond_Studio_Sessions', 'Folklore: The Long Pond Studio Sessions', 'the on-camera confirmation is documented in the film article')],
    },
  ],
};

// Vault theories/easter eggs — debut era. The founding lore: 13 and the
// liner-note codes. All URLs verified reachable 2026-07-08.

const wiki = (article, title, notes) => ({
  source_url: `https://en.wikipedia.org/wiki/${article}`,
  source_title: title,
  publisher: 'Wikipedia',
  source_type: 'wiki',
  accessed_at: '2026-07-08',
  reliability_score: 2,
  excerpt: null,
  notes: notes ?? null,
});

export default {
  eraSlug: 'debut',
  theories: [
    {
      slug: 'lucky-number-13',
      kind: 'easter_egg',
      title: '13, the number that runs through everything',
      claim:
        'Taylor treats 13 as her lucky number — born December 13, she drew it on her hand for early shows, and fans hunt for it in track sequencing, dates, and clue-drops to this day.',
      evidence:
        'On the record from the start: she has repeatedly explained the number (her birthday, her first album going gold in 13 weeks, seat rows and awards-show coincidences) and wore a hand-painted 13 at Fearless-era shows. Decoding-by-13 became the founding grammar of Swiftie lore.',
      confidence: 'official',
      outcome: 'confirmed',
      relatedSlugs: [],
      sources: [
        wiki('Taylor_Swift', 'Taylor Swift', 'the 13 lore is documented in her main biography article'),
        wiki('Cultural_impact_of_Taylor_Swift', 'Cultural impact of Taylor Swift'),
      ],
    },
    {
      slug: 'liner-notes-hidden-messages',
      kind: 'easter_egg',
      title: 'The liner-note code: capital letters spell secrets',
      claim:
        'From the debut album onward, the lyric booklets hid messages: read only the capitalized letters in each printed lyric and they spell out a secret line about the song.',
      evidence:
        'A confirmed, deliberate practice — the booklet codes ran from the 2006 debut through the Big Machine albums and trained the fandom to decode everything that followed. She later said the clue-planting simply moved from liner notes into videos, posts, and performances.',
      confidence: 'official',
      outcome: 'confirmed',
      relatedSlugs: [],
      sources: [
        wiki('Cultural_impact_of_Taylor_Swift', 'Cultural impact of Taylor Swift', 'documents the hidden-message liner notes as the origin of easter-egg culture'),
        wiki('Swifties', 'Swifties'),
      ],
    },
  ],
};

// Vault theories/easter eggs — debut era. The founding lore: 13 and the
// liner-note codes, plus the two songs Taylor has named as her earliest —
// "The Outside" and "A Place in This World." Egg URLs verified 2026-07-08;
// the two song-origin theories verified 2026-07-31.

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

const songfacts = (path, title, notes) => ({
  source_url: `https://www.songfacts.com/facts/taylor-swift/${path}`,
  source_title: title,
  publisher: 'Songfacts',
  source_type: 'reputable_press',
  accessed_at: '2026-07-31',
  reliability_score: 4,
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
        'A confirmed, deliberate practice — the booklet codes ran from the 2006 debut through 1989 (2014) and trained the fandom to decode everything that followed. She later said the clue-planting simply moved from liner notes into videos, posts, and performances.',
      confidence: 'official',
      outcome: 'confirmed',
      relatedSlugs: [],
      sources: [
        {
          source_url: 'https://www.today.com/today/amp/rcna51887',
          source_title: "A Complete History of Taylor Swift's Best Easter Eggs",
          publisher: 'Today.com',
          source_type: 'reputable_press',
          accessed_at: '2026-07-08',
          reliability_score: 4,
          excerpt: null,
          notes: 'documents the capital-letter liner-note codes running from the 2006 debut through 1989 (2014)',
        },
        wiki('Swifties', 'Swifties'),
      ],
    },
    {
      slug: 'the-outside-first-song-outcast',
      kind: 'theory',
      title: '"The Outside": the outcast anthem that started the songwriting',
      claim:
        'Fans read "The Outside" as Taylor\'s origin story as a songwriter — a song about being a complete outcast at school that doubles as the reason she ever picked up a pen at all.',
      evidence:
        'Taylor has confirmed exactly that reading. She has called it one of the first songs she ever wrote and said it "talks about the very reason I ever started to write songs. It was when I was twelve years old, and a complete outcast at school." She told Entertainment Weekly the song is about "the scariest feeling I\'ve ever felt: going to school, walking down the hall, looking at all those faces, and not knowing who you\'re gonna talk to that day." The isolation traced to a country-music obsession her classmates didn\'t share — the same difference that later became her whole brand.',
      confidence: 'confirmed_interview',
      outcome: 'confirmed',
      relatedSlugs: [],
      sources: [
        songfacts(
          'the-outside',
          'Taylor Swift — "The Outside" (Songfacts)',
          'carries Taylor\'s own account: written at 12, one of her first songs, and the Entertainment Weekly "scariest feeling" quote',
        ),
        wiki(
          'The_Outside_(Taylor_Swift_song)',
          'The Outside (Taylor Swift song)',
          'confirms she wrote it at age 12 about the loneliness of a country-music passion that isolated her from peers',
        ),
      ],
    },
    {
      slug: 'a-place-in-this-world-mission-statement',
      kind: 'theory',
      title: '"A Place in This World": the thirteen-year-old\'s mission statement',
      claim:
        'A common reading holds "A Place in This World" as the thesis of the whole debut — a newly-transplanted teenager measuring the gap between where she was and where she was determined to end up.',
      evidence:
        'Taylor\'s own account backs the reading. She wrote it at thirteen, just after the family moved to Nashville, with co-writers Robert Ellis Orrall and Angelo Petraglia: "It was tough trying to find out how I was going to get where I wanted to go. I knew where I wanted to be, but I just didn\'t know how to get there." She has traced the ambition itself to a television special about Faith Hill leaving for Nashville — the move Taylor then made herself.',
      confidence: 'confirmed_interview',
      outcome: 'confirmed',
      relatedSlugs: [],
      sources: [
        songfacts(
          'a-place-in-this-world',
          'Taylor Swift — "A Place in This World" (Songfacts)',
          'carries Taylor\'s quote about writing it at 13 after moving to Nashville, not yet knowing how to get where she wanted to be',
        ),
        wiki(
          'A_Place_in_This_World',
          'A Place in This World',
          'confirms co-writers Robert Ellis Orrall and Angelo Petraglia, written November 2003, and the Faith Hill TV-special inspiration',
        ),
      ],
    },
  ],
};

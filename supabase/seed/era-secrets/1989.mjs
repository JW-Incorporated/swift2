// Era Secrets pool — 1989. Raw material for the Era Secret card (#688)
// per the founder decision 2026-07-15 (docs/proposals/2026-07-15-era-secrets.md)
// and ticket #690: 5–10 sourced, genuinely-obscure facts per era, each with a
// deeper link into the site. Batch 2 of the wave (after midnights/tortured-poets).
//
// PROVISIONAL SHAPE (v0) — same as era-secrets/midnights.mjs (see that file's
// header for the field definitions). No seeder/validator consumes this dir yet;
// the #688 build wires it up. All URLs verified 2026-07-17.
export default {
  eraSlug: '1989',
  secrets: [
    {
      slug: '1989-lowercase-inversion',
      title: 'She flipped her own cipher',
      secret:
        'Fans spent five albums decoding messages hidden in the CAPITALIZED letters of her printed lyrics. On 1989 she inverted the trick — the hidden messages moved to the lowercase letters — and read in track order they tell one continuous story of the two years before the album.',
      deeperLink: 'egg:1989-lowercase-liner-codes',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://www.billboard.com/music/music-news/taylor-swift-1989-liner-notes-6296676/',
          source_title: "Taylor Swift's '1989' Liner Note Messages & Reference Guide",
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
        },
        {
          source_url: 'https://www.today.com/popculture/music/taylor-swift-easter-eggs-hidden-messages-rcna51887',
          source_title: 'Liner notes and easter eggs: How Taylor Swift turned fandom into a scavenger hunt',
          publisher: 'Today',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
        },
      ],
    },
    {
      slug: '1989-65-polaroids',
      title: 'Sixty-five Polaroids, five albums deep',
      secret:
        'Every 1989 CD came with 13 Polaroids of Taylor, lyrics scrawled in marker along the bottom. What most fans never clocked: there were 65 different Polaroids in circulation, packed in five random sets of 13 — completing the collection meant buying the album five times over.',
      deeperLink: 'moment:vault-1989-a-yahoo-livestream-announces-1989-her-first-documented-offic',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://en.wikipedia.org/wiki/1989_(album)',
          source_title: '1989 (album)',
          publisher: 'Wikipedia',
          source_type: 'wiki',
          accessed_at: '2026-07-17',
          reliability_score: 2,
          notes: 'documents the 13-Polaroid packet per CD, drawn from 65 photos in five sets',
        },
        {
          source_url: 'https://www.thelineofbestfit.com/features/articles/beyond-1989-taylor-swift-and-polaroids',
          source_title: 'Beyond 1989: Taylor Swift and Polaroids',
          publisher: 'The Line of Best Fit',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 3,
        },
      ],
    },
    {
      slug: '1989-stay-came-from-a-dream',
      title: 'The "stay!" is from an actual dream',
      secret:
        "That high, almost operatic 'stay!' on 'All You Had to Do Was Stay' isn't a studio trick — it came from a dream. Taylor dreamed she opened the door to an ex and the only sound that came out was that weird high note. She woke up, recorded it into her phone, and built the hook around it.",
      deeperLink: 'song:all-you-had-to-do-was-stay',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://www.ibtimes.com/taylor-swift-reveals-1989-song-all-you-had-do-was-stay-about-dream-her-ex-boyfriend-2147005',
          source_title: "Taylor Swift Reveals '1989' Song 'All You Had To Do Was Stay' Is About A Dream",
          publisher: 'International Business Times',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 3,
        },
        {
          source_url: 'https://en.wikipedia.org/wiki/All_You_Had_to_Do_Was_Stay_(Taylor_Swift_song)',
          source_title: 'All You Had to Do Was Stay',
          publisher: 'Wikipedia',
          source_type: 'wiki',
          accessed_at: '2026-07-17',
          reliability_score: 2,
        },
      ],
    },
    {
      slug: '1989-ootw-voice-memo',
      title: 'Thirty minutes, one voice memo',
      secret:
        "Jack Antonoff sent her the 'Out of the Woods' instrumental and got a voice memo back with the melody and lyrics roughly thirty minutes later. It was the first time Taylor had ever written a song over someone else's finished track — the working method that would carry through folklore and beyond.",
      deeperLink: 'song:out-of-the-woods',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://www.billboard.com/articles/news/6281680/taylor-swift-out-of-the-woods-jack-antonoff',
          source_title: "Taylor Swift's 'Out Of The Woods': Jack Antonoff Reveals Inspiration",
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
        },
        {
          source_url: 'https://www.hollywoodreporter.com/earshot/taylor-swifts-woods-jack-antonoff-inspiration-new-1989-song-title-740605',
          source_title: "Taylor Swift's 'Out of the Woods': Jack Antonoff on Inspiration",
          publisher: 'The Hollywood Reporter',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
        },
      ],
    },
    {
      slug: '1989-starbucks-lovers',
      title: 'There are no Starbucks lovers',
      secret:
        'The lyric is "got a long list of ex-lovers" — but "all the lonely Starbucks lovers" was misheard so universally that even her mom heard it wrong. Taylor eventually leaned in, tweeting: "Sending my love to all the lonely Starbucks lovers out there this Valentine\'s Day."',
      deeperLink: 'song:blank-space',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://www.eonline.com/news/659883/even-taylor-swift-s-mom-thought-she-was-singing-starbucks-lovers-in-blank-space',
          source_title: 'Even Taylor Swift\'s Mom Thought She Was Singing "Starbucks Lovers" in "Blank Space"',
          publisher: 'E! News',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
        },
        {
          source_url: 'https://time.com/3895936/taylor-swift-blank-space-lyrics-starbucks-lovers/',
          source_title: "Taylor Swift's Blank Space Lyrics Not About Starbucks Lovers",
          publisher: 'Time',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
        },
      ],
    },
  ],
};

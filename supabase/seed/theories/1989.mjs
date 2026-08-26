// Vault theories/easter eggs — 1989 era. All URLs verified reachable 2026-07-08.

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
  eraSlug: '1989',
  theories: [
    {
      slug: 'no-its-becky',
      kind: 'theory',
      title: '"no it\'s becky"',
      claim:
        'The 2014 Tumblr joke: a photo of Taylor captioned as a girl named Becky who "snorted marijuana at a party and died," answered with "no it\'s becky." Fans ran with Becky as Taylor\'s alter ego — and Taylor got the joke.',
      evidence:
        'Born as a Tumblr exchange during her famously online 1989-era presence. Taylor canonized the meme herself by wearing a "no its becky" T-shirt, turning a fandom in-joke into official-adjacent lore.',
      confidence: 'joke_meme',
      outcome: 'confirmed',
      relatedSlugs: [],
      sources: [
        {
          source_url: 'https://time.com/3430491/taylor-swift-internet-meme-no-its-becky-tshirt/',
          source_title: "Taylor Swift Wears 'no its becky' T-Shirt",
          publisher: 'Time',
          source_type: 'reputable_press',
          accessed_at: '2026-08-08',
          reliability_score: 4,
          excerpt: null,
          notes: 'documents the original Tumblr post and the meme\'s spread — the meme itself is the subject here',
        },
        wiki('Swifties', 'Swifties', 'covers her 1989-era Tumblr fluency that made the meme land'),
      ],
    },
    {
      slug: '1989-lowercase-liner-codes',
      kind: 'easter_egg',
      title: 'The lowercase inversion',
      claim:
        "1989's booklet flips her oldest trick: after five albums of hidden messages spelled in capitalized letters, the codes moved to the lowercase letters — and read in track order, the thirteen messages tell one continuous story.",
      evidence:
        'Billboard decoded and published the full 1989 set the week the album dropped — it opens "We begin our story in New York" and runs as a single arc through all thirteen tracks, a two-year autobiography threaded through the lyric sheets. The inversion mattered to code-watchers: new sound, new cipher. It was also the finale — the booklet codes stop entirely at reputation.',
      confidence: 'official',
      outcome: 'confirmed',
      relatedSlugs: ['debut:liner-notes-hidden-messages', 'red:twenty-two-liner-note-code'],
      sources: [
        {
          source_url: 'https://www.billboard.com/music/music-news/taylor-swift-1989-liner-notes-6296676/',
          source_title: "Taylor Swift's '1989' Liner Note Messages & Reference Guide",
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
          excerpt: null,
          notes: 'the full decoded set, message by message',
        },
        {
          source_url: 'https://www.today.com/popculture/music/taylor-swift-easter-eggs-hidden-messages-rcna51887',
          source_title: 'Liner notes and easter eggs: How Taylor Swift turned fandom into a scavenger hunt',
          publisher: 'Today',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
          excerpt: null,
          notes: 'documents the capital-letter practice, the 1989 lowercase inversion, and the stop after 1989',
        },
      ],
    },
    {
      slug: '1989-polaroid-cover',
      kind: 'easter_egg',
      title: 'The cropped Polaroid',
      claim:
        "1989's cover is a real Polaroid — Taylor's face cut off at the eyes on purpose, so no expression could give away whether the album was happy or sad. Every deluxe CD hid a packet of 13 more: one of five sets drawn from 65 numbered Polaroids, each front scrawled with a line of handwritten lyric.",
      evidence:
        "Taylor told ABC News the album photos were shot on an instant camera — \"that photo you are seeing is a Polaroid we took… it was kind of an accident, so I figured why not make that photo the album cover?\" — and cropped the frame at her eyes so fans couldn't immediately read the record's emotional tone. The physical release turned that instant-photo motif into a scavenger hunt: each 1989 CD shipped with a packet of 13 Polaroids drawn from 65 numbered shots (#01–#65), five different sets in all, every one captioned with a scrap of lyric in her handwriting. Completists needed all five copies to assemble the full 65 — and the concept is credited with helping spark a real-world revival of instant film.",
      confidence: 'official',
      outcome: 'confirmed',
      relatedSlugs: ['1989:1989-lowercase-liner-codes'],
      sources: [
        {
          source_url: 'https://abcnews.com/Entertainment/meaning-cover-taylor-swifts-album-1989/story?id=25028609',
          source_title: "Taylor Swift Explains Meaning Behind Cover of New Album '1989'",
          publisher: 'ABC News',
          source_type: 'reputable_press',
          accessed_at: '2026-07-26',
          reliability_score: 4,
          excerpt: null,
          notes: "Taylor's own words on the Polaroid cover and cropping at the eyes",
        },
        wiki(
          '1989_(Taylor_Swift_album)',
          '1989 (Taylor Swift album)',
          'documents the cropped-Polaroid cover and the deluxe packaging: one of five sets of 13 Polaroids from 65 total',
        ),
      ],
    },
    {
      slug: '1989-deluxe-voice-memos',
      kind: 'easter_egg',
      title: 'The voice memos',
      claim:
        "The Target deluxe edition tucked three phone voice memos among the bonus tracks — early, unfinished recordings of \"I Know Places,\" \"I Wish You Would\" and \"Blank Space\" — letting fans eavesdrop on the songs mid-build, straight off Taylor's phone.",
      evidence:
        "Alongside three extra songs, the deluxe 1989 hid a rarer bonus: raw voice memos Taylor had recorded on her phone while the songs were still forming — piano-and-vocal for \"I Know Places,\" a rough track-and-vocal for \"I Wish You Would,\" guitar-and-vocal for \"Blank Space.\" You hear her humming a melody into the phone, talking through the writing, catching an idea before it is finished. It made the songwriting process itself a bonus track — a behind-the-curtain move she liked enough to bring back for the Taylor's Version re-records years later.",
      confidence: 'official',
      outcome: 'confirmed',
      relatedSlugs: [],
      sources: [
        {
          source_url: 'https://www.bustle.com/articles/47243-taylor-swifts-songwriting-memos-reveal-secrets-about-1989-tracks',
          source_title: "Taylor Swift's Songwriting Memos Reveal Secrets About '1989' Tracks",
          publisher: 'Bustle',
          source_type: 'reputable_press',
          accessed_at: '2026-07-26',
          reliability_score: 3,
          excerpt: null,
          notes: 'describes the three Target-deluxe voice memos and what they show of the process',
        },
        wiki(
          '1989_(Taylor_Swift_album)',
          '1989 (Taylor Swift album)',
          'confirms the Target deluxe voice memos for "I Know Places", "I Wish You Would", and "Blank Space"',
        ),
      ],
    },
    {
      slug: 'blank-space-media-caricature',
      kind: 'theory',
      title: '"Blank Space" is the joke on the tabloids',
      claim:
        "The reading — which Taylor confirmed — that \"Blank Space\" isn't a confession but a satire: she plays the boy-crazy, unhinged \"man-eater\" the media invented for her, so straight-faced that half the audience missed that it was a bit.",
      evidence:
        "Fans and critics heard \"Blank Space\" as Taylor performing the caricature the press had drawn of her, and she said as much. She told NME the song was deliberately ironic — \"It's so opposite my actual life. Half the people got the joke, half the people really think that I was like really owning the fact that I'm a psychopath\" — framing it as a reply to a media that \"every few years… finds something that they unanimously feel is annoying about me.\" She described the character elsewhere as \"a girl who's crazy but seductive but glamorous but nuts but manipulative.\" The theory is squarely about the media narrative she was skewering, not any real relationship.",
      confidence: 'confirmed_interview',
      outcome: 'confirmed',
      relatedSlugs: [],
      sources: [
        {
          source_url: 'https://www.nme.com/blogs/nme-blogs/taylor-swift-explained-to-us-the-story-and-misconceptions-of-blank-space-14783',
          source_title: "Taylor Swift explained to us the story and misconceptions of 'Blank Space'",
          publisher: 'NME',
          source_type: 'reputable_press',
          accessed_at: '2026-07-26',
          reliability_score: 4,
          excerpt: null,
          notes: "Taylor's direct quotes calling the song an intentional, ironic send-up of her media image",
        },
        wiki(
          'Blank_Space',
          'Blank Space',
          'documents the satire/self-referential reading and her "crazy but seductive… manipulative" description',
        ),
      ],
    },
    {
      slug: 'blank-space-starbucks-lovers',
      kind: 'theory',
      title: 'The "Starbucks lovers" mishearing',
      claim:
        "Radio listeners heard the \"Blank Space\" line \"got a long list of ex-lovers\" as \"all the lonely Starbucks lovers\" — a mondegreen so pervasive that even Taylor's own mother fell for it, and Taylor leaned all the way in.",
      evidence:
        "The real lyric is \"got a long list of ex-lovers,\" but \"all the lonely Starbucks lovers\" became one of 2014–15's defining misheard lines. Taylor acknowledged the mix-up on Valentine's Day 2015, and that May she posted her mom's verdict — \"hahah it really does sound like Starbucks Lovers… -my mom just now who is SUPPOSED TO BE ON MY SIDE,\" with a resigned \"Smh\" (May 25, 2015). Starbucks eventually built a 122-track \"Starbucks Lovers\" playlist off the joke. Like \"no it's becky,\" it's 1989-era proof of how online the era was — a slip of the ear the fandom, and the artist, adopted on purpose.",
      confidence: 'joke_meme',
      outcome: 'confirmed',
      relatedSlugs: ['1989:no-its-becky'],
      sources: [
        {
          source_url: 'https://time.com/3895936/taylor-swift-blank-space-lyrics-starbucks-lovers/',
          source_title: 'Taylor Swift’s Blank Space Lyrics Not About Starbucks Lovers',
          publisher: 'Time',
          source_type: 'reputable_press',
          accessed_at: '2026-08-25',
          reliability_score: 4,
          excerpt: null,
          notes: 'confirms the real lyric and documents the mondegreen as one of the year\'s biggest',
        },
        {
          source_url: 'https://abcnews.com/Entertainment/taylor-swifts-mom-mishears-starbucks-lovers/story?id=31289081',
          source_title: "Taylor Swift's Mom Misheard 'Starbucks Lovers' Too",
          publisher: 'ABC News',
          source_type: 'reputable_press',
          accessed_at: '2026-08-25',
          reliability_score: 4,
          excerpt: null,
          notes: 'the May 25, 2015 post about her mom mishearing the lyric, quoted verbatim',
        },
      ],
    },
  ],
};

// Vault theories/easter eggs — Red era. Liner-note friendship code, the
// "From the Vault" word-puzzle reveal, the "22"-shirt clue vehicle, the
// Blake-Lively video egg trove, the confirmed 10-minute "All Too Well"
// songwriting legend, and the video's next-re-record reads.
// New records verified 2026-07-20 (#685 theories / #686 eggs density wave);
// the original two verified 2026-07-08.
// HARD BAN observed: no speculation about relationships, private life,
// sexuality, family, or identity — every entry sticks to documented puzzle
// mechanics, songwriting history, re-record rollout, and video easter eggs,
// never romantic-subject guessing. ("All Too Well" appears only as a
// songwriting/length fact; the song's subject is deliberately out of scope.)

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
  eraSlug: 'red',
  theories: [
    {
      slug: 'twenty-two-liner-note-code',
      kind: 'easter_egg',
      title: 'A liner-note code names the friends behind "22"',
      claim:
        'The 2012 Red CD booklet hid a capitalization code inside "22" that decodes to "ASHLEY DIANNA CLAIRE SELENA" — a shout-out to the real friends the song\'s carefree night was inspired by.',
      evidence:
        'Following the same hidden-capital-letters technique used on her earlier album booklets, the "22" lyric sheet\'s decoded message names four friends rather than a romantic subject, matching the song\'s own framing as a friendship anthem about a birthday night out.',
      confidence: 'official',
      outcome: 'confirmed',
      relatedSlugs: [],
      sources: [
        {
          source_url: 'https://www.billboard.com/music/music-news/taylor-swift-liner-note-secret-messages-6296379/',
          source_title: "Taylor Swift's 13 Best Liner Note Secret Messages",
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: '2026-07-08',
          reliability_score: 4,
          notes: 'catalogs the confirmed liner-note codes across her early albums, including Red',
        },
      ],
    },
    {
      slug: 'vault-track-word-puzzle-reveal',
      kind: 'easter_egg',
      title: 'A word puzzle unlocks the Red (Taylor\'s Version) vault tracks',
      claim:
        'On Aug. 5, 2021, Taylor posted an interactive word-puzzle video across social media that, once solved, revealed the "From the Vault" collaborators and titles — including Chris Stapleton, Phoebe Bridgers, "Babe," "Better Man," and the All Too Well (10 Minute Version) — ahead of the album\'s release.',
      evidence:
        'The puzzle format built on the anagram-teaser approach from the Fearless re-record, this time rewarding fans who solved it with a bonus image. All of the revealed information — the featured artists and track titles — matched the official track list confirmed at release.',
      confidence: 'official',
      outcome: 'confirmed',
      relatedSlugs: ['fearless:vault-track-anagram-reveal'],
      sources: [
        wiki('Red_(Taylor%27s_Version)', "Red (Taylor's Version)", 'documents the word-puzzle reveal of vault tracks and features'),
      ],
    },
    {
      slug: 'not-a-lot-going-on-shirt',
      kind: 'easter_egg',
      title: 'The "22" video T-shirt became a years-long clue vehicle',
      claim:
        'In the 2013 "22" video Taylor wears a tee reading "Not a lot going on at the moment." Fans have tracked the phrase ever since: she revives it as a caption before big moves, and on the Eras Tour her "22" tees carried red letters that scramble to "Speak Now (Taylor\'s Version)" — the album she announced next.',
      evidence:
        'The shirt debuts in the Red-era "22" video (2012 album, 2013 single), then takes on a life of its own. On April 27, 2020 Taylor captioned a selfie with the same words and fans went hunting for a reveal — early guesses ran to a "Cruel Summer" single (Refinery29) — months before folklore surprise-dropped that July. On the Eras Tour "22" set she wore variants ("A lot going on at the moment") whose red-highlighted words — "A lot," "never," "ever," "ew" — fans unscrambled on April 1, 2023 to "Speak Now Taylor\'s Version," weeks before she announced that re-record. Read honestly: the recurring-caption sightings are fan tracking, not a confirmed cipher, but the Eras Tour anagram was staged deliberately and did precede the announcement.',
      confidence: 'strong_fan_consensus',
      outcome: 'partially_confirmed',
      relatedSlugs: ['speak-now:speak-now-tv-tracklist-reveal'],
      sources: [
        {
          source_url: 'https://www.refinery29.com/en-us/2020/04/9746793/taylor-swift-not-a-lot-going-on-photo-theories-clues',
          source_title: "Taylor Swift Is Not Being Subtle With Her Clues Anymore",
          publisher: 'Refinery29',
          source_type: 'reputable_press',
          accessed_at: '2026-07-20',
          reliability_score: 4,
          notes: 'traces the April 27, 2020 "not a lot going on at the moment" caption back to the 2013 "22" video shirt',
        },
        {
          source_url: 'https://www.iheart.com/content/2023-04-01-taylor-swift-fans-seemingly-decode-hidden-message-in-eras-tour-outfits/',
          source_title: "Taylor Swift Fans Seemingly Decode Hidden Message In 'Eras Tour' Outfits",
          publisher: 'iHeartRadio',
          source_type: 'reputable_press',
          accessed_at: '2026-08-24',
          reliability_score: 3,
          notes: 'documents the Eras Tour "22" tees whose red letters were read as "Speak Now Taylor\'s Version," April 1, 2023',
        },
      ],
    },
    {
      slug: 'i-bet-you-think-about-me-video-eggs',
      kind: 'easter_egg',
      title: 'Blake Lively\'s "I Bet You Think About Me" video is stuffed with self-referential eggs',
      claim:
        'Blake Lively\'s directorial debut for "I Bet You Think About Me" (November 2021) tucks Taylor\'s own catalog into the frame: she wears the red diamond-shaped ring from the Red (Taylor\'s Version) cover, gives the bride a red scarf nodding to "All Too Well," and the reception light shifts to deep blue as a wink to the song "Red."',
      evidence:
        'Released alongside Red (Taylor\'s Version) and co-treated by Taylor and Lively, the video became an egg hunt. Reporters cataloged them: the RED-cover ring; the red scarf handed over mid-toast, a direct callback to "All Too Well"; a lighting change from bright to dark blue during the dance, read as a nod to the track "Red"; and a tiered cake carrying 13 (Taylor\'s number) and 26 (her age when 1989 released), its birds echoing the 1989 cover, with a white-roses-turning-red set piece mirroring Alice in Wonderland ("Wonderland" is a 1989 deluxe track). Those 1989-leaning details also fuel the separate next-re-record reading.',
      confidence: 'reputable_reporting',
      outcome: 'confirmed',
      relatedSlugs: ['red:i-bet-you-think-about-me-rerecord-clues'],
      sources: [
        {
          source_url: 'https://www.newsweek.com/taylor-swift-i-bet-you-think-about-me-easter-eggs-1989-speak-now-miles-teller-1649696',
          source_title: "8 'I Bet You Think About Me' Easter Eggs",
          publisher: 'Newsweek',
          source_type: 'reputable_press',
          accessed_at: '2026-07-20',
          reliability_score: 4,
          notes: 'itemizes the RED ring, red-scarf callback, cake 13/26, 1989 birds, and Alice-in-Wonderland roses',
        },
        {
          source_url: 'https://variety.com/2021/music/news/taylor-swift-blake-lively-i-bet-you-think-about-me-music-video-miles-teller-1235111991/',
          source_title: 'Taylor Swift, Blake Lively Debut I Bet You Think About Me Music Video',
          publisher: 'Variety',
          source_type: 'reputable_press',
          accessed_at: '2026-08-24',
          reliability_score: 4,
          notes: 'confirms Blake Lively\'s directorial debut, the November 2021 release, and Miles Teller casting',
        },
      ],
    },
    {
      slug: 'all-too-well-original-ten-minutes',
      kind: 'theory',
      title: 'Fans were right: "All Too Well" was born a 10-minute song',
      claim:
        'Years before the 2021 release, fans traded the legend that "All Too Well" began as a much longer song, cut down for Red. Taylor confirmed it: she first wrote a roughly ten-minute version and phoned co-writer Liz Rose to help "filter it down" to the album\'s five-and-a-half minutes.',
      evidence:
        'Taylor has recounted (Good Morning America) that the song poured out at about ten minutes and that she called Liz Rose — "Come over, we\'ve gotta filter this down" — to pare it for Red (2012); the original even carried profanity later scrubbed for the album cut. The full "All Too Well (10 Minute Version)" arrived on Red (Taylor\'s Version) on November 12, 2021, with the short film a day later, vindicating the long-held fan belief that a longer "real" version existed. Kept strictly to songwriting history — the song\'s subject is out of scope.',
      confidence: 'confirmed_interview',
      outcome: 'confirmed',
      relatedSlugs: ['red:vault-track-word-puzzle-reveal'],
      sources: [
        {
          source_url: 'https://www.wideopencountry.com/all-too-well/',
          source_title: "'All Too Well': Behind Taylor Swift's Ten Minute Long Heartbreak Anthem",
          publisher: 'Wide Open Country',
          source_type: 'reputable_press',
          accessed_at: '2026-07-20',
          reliability_score: 4,
          notes: "quotes Taylor's GMA account of writing ~10 minutes and calling Liz Rose to filter it down",
        },
        {
          source_url: 'https://en.wikipedia.org/wiki/All_Too_Well_(10_Minute_Version)',
          source_title: 'All Too Well (10 Minute Version)',
          publisher: 'Wikipedia',
          source_type: 'wiki',
          accessed_at: '2026-07-20',
          reliability_score: 2,
          notes: 'documents the November 12, 2021 release of the full-length version on Red (Taylor\'s Version)',
        },
      ],
    },
    {
      slug: 'i-bet-you-think-about-me-rerecord-clues',
      kind: 'theory',
      title: 'The "I Bet You Think About Me" video was read as a map to the next re-records',
      claim:
        'Fans combed "I Bet You Think About Me" for hints about the next re-records: the cake\'s seagulls and its 13/26 numbers pointed to 1989, while the wedding setting and her billowing red gown echoed Speak Now. Both albums did follow in 2023 — though Taylor never confirmed the clues were planted.',
      evidence:
        'November 2021 coverage (Newsweek, E!) laid out the competing reads: birds on the cake mirroring the 1989 cover, "26" for her age when 1989 released, and Alice-in-Wonderland roses tied to 1989\'s "Wonderland"; against that, the wedding theme and a voluminous red dress resembling the Speak Now deluxe gown argued Speak Now was up next. In the event, both were re-recorded in 2023 — Speak Now (Taylor\'s Version) in July, 1989 (Taylor\'s Version) in October — so both reads landed, in that order. Marked partially confirmed: the sequencing bore out, but whether any single frame was an intentional clue stays fan speculation.',
      confidence: 'strong_fan_consensus',
      outcome: 'partially_confirmed',
      relatedSlugs: ['red:i-bet-you-think-about-me-video-eggs', 'speak-now:speak-now-tv-tracklist-reveal'],
      sources: [
        {
          source_url: 'https://www.newsweek.com/taylor-swift-i-bet-you-think-about-me-easter-eggs-1989-speak-now-miles-teller-1649696',
          source_title: "8 'I Bet You Think About Me' Easter Eggs That Prove Taylor's Next Re-Record",
          publisher: 'Newsweek',
          source_type: 'reputable_press',
          accessed_at: '2026-07-20',
          reliability_score: 4,
          notes: 'lays out the 1989 (seagulls, 26, Wonderland roses) and Speak Now (wedding, red gown) next-re-record reads',
        },
        {
          source_url: 'https://www.eonline.com/news/1309712/all-the-easter-eggs-in-taylor-swifts-i-bet-you-think-about-me-music-video-with-miles-teller',
          source_title: "All the Easter Eggs in Taylor Swift's \"I Bet You Think About Me\" Music Video",
          publisher: 'E! News',
          source_type: 'reputable_press',
          accessed_at: '2026-08-24',
          reliability_score: 4,
          notes: 'independent catalog of the same video easter eggs and next-album fan theories',
        },
      ],
    },
  ],
};

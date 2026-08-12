// Vault theories/easter eggs — Speak Now era. Liner-note codes and the
// (Taylor's Version) track-list reveal. All URLs verified 2026-07-08.
// HARD BAN observed: no speculation about relationships, private life,
// sexuality, family, or identity — coverage of songs widely rumored to be
// about specific exes (e.g. "Dear John") is deliberately excluded here;
// these entries stick to documented puzzle mechanics and her own
// life events, not romantic-subject guessing.

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
  eraSlug: 'speak-now',
  theories: [
    {
      slug: 'never-grow-up-liner-note-code',
      kind: 'easter_egg',
      title: 'A liner-note code confirms when she moved out',
      claim:
        'The 2010 Speak Now CD booklet hid a capitalization code inside "Never Grow Up" that decodes to "MOVED OUT IN JULY" — a real detail about Taylor leaving her family\'s home, matching the song\'s own coming-of-age theme.',
      evidence:
        'Using the same hidden-capital-letters technique found across her early album booklets, the "Never Grow Up" lyric sheet\'s decoded phrase lines up with Taylor\'s own account of moving into her first apartment that July, turning a lyric-sheet puzzle into a factual footnote on the song.',
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
          notes: 'catalogs the confirmed liner-note codes across her early albums, including Speak Now',
        },
      ],
    },
    {
      slug: 'speak-now-tv-tracklist-reveal',
      kind: 'easter_egg',
      title: 'The Speak Now (Taylor\'s Version) track list drops on social media',
      claim:
        'Taylor unveiled the full Speak Now (Taylor\'s Version) track list, including its "From the Vault" songs, directly via social media on June 5, 2023, ahead of the album\'s July 7, 2023 release — continuing her established pattern of announcing re-record vault tracks in a dedicated reveal moment rather than a traditional press release.',
      evidence:
        'Fearless and Red (Taylor\'s Version) vault tracks had each been revealed through a cryptic scrambled-word "vault" puzzle video fans had to decode. Speak Now (TV) skipped the puzzle: a single, fan-facing announcement post named every vault track and its guest directly, rather than a label press cycle — a simplification of the earlier playbook, not a repeat of it.',
      confidence: 'official',
      outcome: 'confirmed',
      relatedSlugs: ['fearless:vault-track-anagram-reveal', 'red:vault-track-word-puzzle-reveal'],
      sources: [
        wiki("Speak_Now_(Taylor%27s_Version)", "Speak Now (Taylor's Version)", 'documents the June 5, 2023 track-list announcement and July 7 release date'),
      ],
    },
    {
      slug: 'mine-leak-rush-release',
      kind: 'easter_egg',
      title: 'A leak forced "Mine" out early',
      claim:
        'Lead single "Mine" was not meant to arrive on August 4, 2010 — a low-quality MP3 leaked online that day, and Big Machine rush-released the finished song to country radio and iTunes within hours, roughly two weeks ahead of its planned mid-August debut.',
      evidence:
        'Taylor had been teasing the single with a countdown when the leak collapsed the timeline; rather than let a bootleg define the song, the label pushed the official version out the same afternoon. Taylor said the leak left her in tears, but the rushed release still shot to No. 1 on iTunes, and Speak Now followed on October 25, 2010. It is an early, accidental version of the rollout chaos her later eras would stage on purpose.',
      confidence: 'official',
      outcome: 'confirmed',
      relatedSlugs: [],
      sources: [
        {
          source_url: 'https://www.cbsnews.com/news/taylor-swift-rush-releases-mine-to-radio-after-internet-leak-speak-now-album-in-october/',
          source_title: "Taylor Swift Rush Releases \"Mine\" to Radio After Internet Leak, \"Speak Now\" Album in October",
          publisher: 'CBS News',
          source_type: 'reputable_press',
          accessed_at: '2026-08-01',
          reliability_score: 4,
          excerpt: null,
          notes: 'documents the August 4, 2010 leak and same-day rush release ahead of the planned date',
        },
        {
          source_url: 'https://www.rollingstone.com/music/music-news/taylor-swift-unleashes-new-single-mine-78726/',
          source_title: 'Taylor Swift Unleashes New Single "Mine"',
          publisher: 'Rolling Stone',
          source_type: 'reputable_press',
          accessed_at: '2026-08-01',
          reliability_score: 4,
          excerpt: null,
          notes: 'contemporaneous report on the early release of "Mine" following the leak',
        },
      ],
    },
    {
      slug: 'speak-now-tour-surprise-covers',
      kind: 'easter_egg',
      title: 'The surprise-song tradition was born on this tour',
      claim:
        'The Speak Now World Tour (February 2011–March 2012) is where Taylor first began slipping a different acoustic cover into the set city by city — often a song by a local or homegrown artist — the ritual that later hardened into the Eras Tour\'s nightly "surprise song."',
      evidence:
        'Seated under a lit tree with a ukulele or guitar, she used the acoustic segment to break from the otherwise-rehearsed show: Alanis Morissette and Avril Lavigne in Toronto, the Beach Boys and Kim Carnes\' "Bette Davis Eyes" in Los Angeles, the Fray\'s "How to Save a Life" in Denver. "You\'ll have a lot of people who will come to more than one show," she explained, "and I want them to get a different experience every time." By the Red Tour the surprise slot had become a permanent fixture of the setlist, and the Eras Tour turned it into two songs a night.',
      confidence: 'official',
      outcome: 'confirmed',
      relatedSlugs: [],
      sources: [
        {
          source_url: 'https://en.wikipedia.org/wiki/Speak_Now_World_Tour',
          source_title: 'Speak Now World Tour',
          publisher: 'Wikipedia',
          source_type: 'wiki',
          accessed_at: '2026-08-01',
          reliability_score: 2,
          excerpt: null,
          notes: 'documents the acoustic segment, the city-by-city covers, and Taylor\'s "different experience every time" quote',
        },
        {
          source_url: 'https://www.capitalfm.com/artists/taylor-swift/eras-tour-surprise-songs-setlist/',
          source_title: "Taylor Swift Eras Tour: Every Surprise Song From Taylor's Setlist So Far",
          publisher: 'Capital FM',
          source_type: 'reputable_press',
          accessed_at: '2026-08-01',
          reliability_score: 3,
          excerpt: null,
          notes: 'traces the surprise-song tradition\'s roots to the Speak Now World Tour, permanent by the Red Tour',
        },
      ],
    },
    {
      slug: 'speak-now-written-entirely-alone',
      kind: 'theory',
      title: 'She wrote the whole album alone — on purpose',
      claim:
        'Fans read Speak Now (2010) as Taylor answering the critics who doubted she wrote her own songs: every track on the 14-song standard edition is credited to her and her alone, with no co-writers — a point she has said was deliberate. The lone asterisk is a deluxe-only bonus, "If This Was a Movie," co-written with Martin Johnson.',
      evidence:
        'Swift has framed the solo writing as a reaction to critics\' doubts about her songwriting, and described finishing songs on the road with no collaborator on hand: "I\'d get my best ideas at 3:00 a.m. in Arkansas, and I didn\'t have a co-writer around so I would just finish it." Released Oct. 25, 2010 and co-produced with Nathan Chapman, the standard album carries only her name in every writing credit — the claim is verifiable from the credits themselves, not a reading of the lyrics.',
      confidence: 'confirmed_interview',
      outcome: 'confirmed',
      relatedSlugs: ['speak-now:long-live-band-and-fans-tribute'],
      sources: [
        wiki('Speak_Now', 'Speak Now', 'documents the entirely solo-written standard edition as a reaction to critics\' doubts, the "If This Was a Movie" co-write with Martin Johnson, the 3 a.m. writing anecdote, and the Oct. 25, 2010 release'),
      ],
    },
    {
      slug: 'long-live-band-and-fans-tribute',
      kind: 'theory',
      title: 'The closer is a love song — to her band and her fans',
      claim:
        'Fans read the Speak Now closer "Long Live" not as a romance but as a thank-you to the people who built the era with her — her band, her crew, and her audience. It is a reading Taylor confirmed, calling it "the first love song that I\'ve written to my team."',
      evidence:
        'Introducing the song, Swift described it as being "about my band, and my producer, and all the people who have helped us build this brick by brick," and cast it as replaying a photo album of award-show and stadium moments shared with her collaborators and crowd. The royalty-and-graduation imagery is universal enough that it also reads as a graduation anthem, but her stated intent — the closing track of the 14-song standard edition — was gratitude to her team.',
      confidence: 'confirmed_interview',
      outcome: 'confirmed',
      relatedSlugs: ['speak-now:speak-now-written-entirely-alone'],
      sources: [
        wiki('Long_Live_(Taylor_Swift_song)', 'Long Live (Taylor Swift song)', 'documents the song as dedicated to her bandmates and fans, closing track of the 2010 standard edition'),
        {
          source_url: 'https://www.songfacts.com/facts/taylor-swift/long-live',
          source_title: 'Long Live by Taylor Swift',
          publisher: 'Songfacts',
          source_type: 'reputable_press',
          accessed_at: '2026-08-08',
          reliability_score: 3,
          excerpt: null,
          notes: 'carries Taylor\'s quote calling it "the first love song that I\'ve written to my team"',
        },
      ],
    },
  ],
};

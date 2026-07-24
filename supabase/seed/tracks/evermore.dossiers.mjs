// Per-song dossiers for the evermore era (issue #440 / #726 pattern), keyed by
// track slug and attached in evermore.mjs. Researched and fact-checked
// 2026-07-24 in answer to curiosity ledgers #1390 (willow), #1406 (evermore),
// #1412 (right where you left me), #1433 (ivy) and #1446 (tolerate it). Every
// source URL below was fetched or verified in that pass. No lyric quotations.
// Confirmed tier = Swift's own statements / a collaborator on the record /
// hard documented facts (charts, credits). Supported = well-documented
// critical consensus. fanTheories = explicitly-unconfirmed readings. Internal
// song:<slug> connection ids resolve globally across the tracks seeds and are
// asserted by apps/web/lib/longlive/tracks.test.ts.

const RS_DESSNER =
  'https://www.rollingstone.com/music/music-features/aaron-dessner-interview-taylor-swift-evermore-1105853/';
const WIKI_ALBUM = 'https://en.wikipedia.org/wiki/Evermore_(Taylor_Swift_album)';

export default {
  willow: {
    whyItMatters: [
      'willow is evermore’s thesis statement disguised as a lead single. Released on the album’s surprise drop day, December 11, 2020, it debuted at No. 1 on the Billboard Hot 100 (chart dated December 26, 2020) the very same week evermore entered the Billboard 200 at No. 1 — making Swift the first act ever to debut atop both charts simultaneously on two separate occasions, after folklore’s "cardigan" had done it four months earlier. It led the Hot 100 for a single week before dropping to No. 38, at the time the steepest fall a song had ever taken from a No. 1 debut.',
      'It is also the clearest expression of how the sister albums were built. Aaron Dessner sent Swift a finished instrumental sketch he had titled "Westerly" — after her home town of Westerly, Rhode Island — and she wrote the full melody and lyric to it almost immediately. The self-directed video then picks up literally where "cardigan" ended, on the same mossy piano, following a golden thread through a witches’ coven and a carnival before a reunion in golden light: the wanting rendered as witchcraft.',
    ],
    meaning: {
      confirmed: [
        'Written by Taylor Swift and Aaron Dessner and produced by Dessner; cut at his Long Pond Studio in the Hudson Valley in September 2020, with Bryce Dessner contributing orchestration and Dessner’s late-’50s rubber-bridge guitar figure defining the arrangement.',
        'Swift self-directed the video (premiered December 11, 2020; cinematography by Rodrigo Prieto) as a direct continuation of the "cardigan" video — the same piano, the golden/invisible thread — making the folklore–evermore sister-album link explicit.',
        'To bolster the launch week, three themed remixes were released across the debut week: the "Dancing Witch" (Elvira Anderfjärd) remix on December 13, 2020, the "Lonely Witch" acoustic version on December 14, and the "Moonlit Witch" version on December 15; a "90s Trend" remix followed on June 14, 2021.',
      ],
      supported: [
        'Critics received willow as a graceful, low-key opener that extended the Dessner partnership rather than announcing itself as a blockbuster; the intertwined rubber-bridge guitar picking was a frequent point of praise and the song landed on various year-end lists.',
        'The instrumental’s working title "Westerly" ties the song to Swift’s Rhode Island home, and its release framed it as evermore’s answer to folklore’s "cardigan" — the two sister-album lead singles built to rhyme.',
      ],
    },
    connections: [
      {
        relatedId: 'song:cardigan',
        label: 'cardigan',
        why: 'folklore’s lead single and willow’s twin: the willow video opens on the same piano cardigan’s ended on and follows the same golden thread, and both debuted at No. 1 to make Swift the first act to top both charts at once.',
      },
      {
        relatedId: 'song:invisible-string',
        label: 'invisible string',
        why: 'the "golden thread" of the willow video literalizes invisible string’s central image — fate as a single line connecting two people — and both lean on Dessner’s warm rubber-bridge guitar.',
      },
      {
        relatedId: 'song:the-1',
        label: 'the 1',
        why: 'the other Dessner-built opener of the sister albums; heard together, folklore starts on wistful hindsight and evermore starts on willow’s spell-casting devotion.',
      },
    ],
    live: [
      {
        date: '2021-03-14',
        event: '63rd Annual Grammy Awards',
        note: 'Performed as part of a cottagecore forest medley with "cardigan" and "august," the first televised airing of the evermore material.',
      },
      {
        event: 'The Eras Tour — evermore act opener',
        note: 'willow opens the evermore section: Swift and cloaked dancers move through a misty stage carrying glowing orbs, echoing the video’s coven imagery — the staging that later seeded a fan orb tradition beginning in Europe in 2024.',
      },
    ],
    voices: [
      {
        who: 'Aaron Dessner',
        context: 'on the evermore sessions',
        note: 'Has described sending Swift instrumental sketches — willow’s was labeled "Westerly" — to which she returned finished songs almost immediately, the working method behind most of the record.',
      },
    ],
    sources: [
      { name: 'willow (Taylor Swift song) — Wikipedia', url: 'https://en.wikipedia.org/wiki/Willow_(Taylor_Swift_song)' },
      { name: 'Billboard: willow debuts at No. 1 on the Hot 100', url: 'https://www.billboard.com/pro/taylor-swift-willow-debut-number-one-hot-100/' },
      { name: 'Sound on Sound: Inside Track — Taylor Swift “willow”', url: 'https://www.soundonsound.com/techniques/inside-track-taylor-swift-willow' },
      { name: 'Rolling Stone: Aaron Dessner on making evermore', url: RS_DESSNER },
      { name: 'Billboard: Taylor Swift’s 2021 Grammys medley', url: 'https://www.billboard.com/music/awards/taylor-swift-performs-2021-grammy-awards-medley-9540356/' },
    ],
  },

  'tolerate-it': {
    whyItMatters: [
      'tolerate it is evermore’s track five — the slot Swift has said she reserves for her most emotionally raw song — and it earns the placement as a portrait of a woman lavishing devotion on a partner who merely permits it. It debuted at No. 45 on the Billboard Hot 100 as an album cut and became one of the record’s most-cited standouts, later turned into the single most iconic visual of the evermore act on the Eras Tour.',
      'Its unease is built into the rhythm. Aaron Dessner wrote the piano part in an unusual 10/8 time and briefly worried it was too experimental to send; the lopsided meter is why some listeners and critics instead hear it as 5/4. On top of that odd pulse, Swift set a marriage modeled on the nameless narrator of Daphne du Maurier’s Rebecca.',
    ],
    meaning: {
      confirmed: [
        'Written and produced by Taylor Swift and Aaron Dessner; recorded at Long Pond Studio with orchestration by Bryce Dessner and session players including Clarice Jensen (cello), Yuki Numata Resnick (violin) and James McAlister and Jason Treuting (percussion/keys); mixed by Jonathan Low, mastered at Sterling Sound.',
        'Swift has confirmed the Rebecca inspiration directly (Apple Music, December 2020): reading Daphne du Maurier’s novel, she fixed on a husband who simply tolerates a wife trying desperately to please him, and folded a feeling from her own past into the song.',
        'Aaron Dessner has confirmed the song is in 10/8 — "an odd time signature" he thought might be too experimental to send her — which is the source of the meter’s off-kilter feel.',
      ],
      supported: [
        'Critics singled it out as an evermore high point: Rolling Stone called it one of Swift’s "most damning relationship vignettes," The Guardian likened its disillusioned-wife mood to The Smiths’ "Asleep," and Entertainment Weekly praised it as a "masterful portrayal" of a marriage curdling — though at least one dissent (Slate) found it among Dessner’s draggiest.',
        'Swift has acknowledged the fan "track five" tradition — that she places her most vulnerable song fifth — and began doing so deliberately once fans noticed; tolerate it sits at evermore’s track five, consistent with that pattern.',
      ],
    },
    connections: [
      {
        relatedId: 'song:champagne-problems',
        label: 'champagne problems',
        why: 'evermore’s other early-album Dessner gut-punch and its immediate neighbor in the Eras evermore act — both piano-driven character studies of a relationship failing from the inside.',
      },
      {
        relatedId: 'song:marjorie',
        label: 'marjorie',
        why: 'the album’s two most orchestrally tender Dessner productions, each carrying a Bryce Dessner string arrangement and a woman’s interior grief.',
      },
      {
        relatedId: 'song:willow',
        label: 'willow',
        why: 'both stage the evermore act on the Eras Tour, and both are Long Pond songs Swift wrote to a finished Dessner instrumental.',
      },
    ],
    live: [
      {
        date: '2023-03-17',
        event: 'The Eras Tour — opening night, Glendale, AZ',
        note: 'Live debut inside a fixed five-song evermore act; staged at a stark candlelit dinner table set for two, Swift performing to a seated dancer and climbing across the long table at the emotional peak. It stayed a fixed part of the set until the post-TTPD setlist overhaul removed it in mid-2024.',
      },
    ],
    voices: [
      {
        who: 'Aaron Dessner',
        context: 'on writing the piano part',
        note: 'Recalled composing tolerate it in 10/8 and hesitating to send Swift something so rhythmically odd — before she wrote to it anyway.',
      },
      {
        who: 'Taylor Swift',
        context: 'Apple Music, December 2020',
        note: 'Traced the song to reading du Maurier’s Rebecca and to a husband who tolerates a wife straining to be loved — a dynamic she said she had felt at a point in her own life.',
      },
    ],
    sources: [
      { name: 'tolerate it — Wikipedia', url: 'https://en.wikipedia.org/wiki/Tolerate_It' },
      { name: 'Rolling Stone: Aaron Dessner interview (10/8 meter)', url: RS_DESSNER },
      { name: 'Rolling Stone: evermore review (Claire Shaffer)', url: 'https://www.rollingstone.com/music/music-album-reviews/taylor-swift-evermore-folklore-1101778/' },
      { name: 'Time: Taylor Swift’s track fives', url: 'https://time.com/6969042/taylor-swift-track-five-songs-tortured-poets-department/' },
      { name: 'setlist.fm: The Eras Tour opening night (Glendale)', url: 'https://www.setlist.fm/setlist/taylor-swift/2023/state-farm-stadium-glendale-az-bbb91ce.html' },
    ],
  },

  ivy: {
    whyItMatters: [
      'ivy is the fandom’s favorite evermore deep cut: a married woman’s affair told entirely in garden metaphor, its cottagecore texture built from banjo, sleigh bells and layered harmonies. It debuted at No. 61 on the Billboard Hot 100 among all fifteen standard-edition evermore tracks that charted at once, and though never a single it has become a critical touchstone — Rolling Stone’s Rob Sheffield ranked it No. 44 among all of Swift’s songs.',
      'It is also the album’s deepest Bon Iver collaboration after the title track: Justin Vernon plays guitar and banjo and sings on it, and Jack Antonoff shares the writing credit with Swift and Aaron Dessner. Its fan-beloved Emily Dickinson reading — fueled by evermore being announced on Dickinson’s birthday — is fan interpretation, never confirmed by Swift, though it later carried the song into the Apple TV+ series Dickinson.',
    ],
    meaning: {
      confirmed: [
        'Written by Taylor Swift, Aaron Dessner and Jack Antonoff and produced by Dessner during the evermore sessions; Justin Vernon of Bon Iver plays guitar and banjo and adds backing vocals, per Dessner.',
        'Debuted at No. 61 on the Billboard Hot 100 (chart dated December 26, 2020) as an album cut; it was never released as a single and has no individual RIAA certification, though the album is multi-platinum.',
        'The Apple TV+ series Dickinson used "ivy" in its third and final season, in the episode "Grief is a Mouse," scoring an intimate Emily/Sue scene; showrunner Alena Smith has said the placement required Swift’s personal sign-off, which she gave.',
      ],
      supported: [
        'Reviewers praised its production and doomed-romance intensity — Sheffield likened its guitar to Jerry Garcia’s — and it recurs near the top of published "every evermore song, ranked" lists.',
        'Critics and fans commonly file "ivy" with folklore’s "illicit affairs" as a companion affair narrative, and within evermore’s forbidden-love cluster alongside "tolerate it" and "champagne problems."',
      ],
      fanTheories: [
        'The Emily Dickinson reading — that "ivy" voices a Dickinson/Sue Gilbert love — is fan interpretation, encouraged by evermore’s December 13 announcement landing on Dickinson’s birthday and by Dickinson’s creative team embracing the sync. Swift has never stated the song is about Dickinson; approving a placement is not a statement of authorial intent.',
      ],
    },
    connections: [
      {
        relatedId: 'song:illicit-affairs',
        label: 'illicit affairs',
        why: 'folklore’s clear-eyed anatomy of an affair; ivy is its evermore companion, the same transgression dressed in period-drama foliage instead of parking-lot secrecy.',
      },
      {
        relatedId: 'song:champagne-problems',
        label: 'champagne problems',
        why: 'part of evermore’s cluster of doomed-love character studies, and another track carrying a Bon Iver/Bowery-era collaborator fingerprint.',
      },
      {
        relatedId: 'song:tolerate-it',
        label: 'tolerate it',
        why: 'the two evermore songs most often paired as portraits of a marriage under strain — one of a wife merely tolerated, one of a wife looking outside the marriage entirely.',
      },
    ],
    live: [
      {
        date: '2023-07-01',
        event: 'The Eras Tour — Cincinnati, OH (Paycor Stadium)',
        note: 'Live debut as an acoustic surprise song, performed with Aaron Dessner on guitar in his home city — one of three surprise songs Swift played that night.',
      },
    ],
    voices: [
      {
        who: 'Aaron Dessner',
        context: 'Rolling Stone, on evermore’s credits',
        note: 'Noted that Justin Vernon plays guitar and banjo and sings on "ivy," making it one of the album’s central Bon Iver collaborations.',
      },
    ],
    sources: [
      { name: 'evermore (album) — Wikipedia', url: WIKI_ALBUM },
      { name: 'Rolling Stone: Aaron Dessner interview', url: RS_DESSNER },
      { name: 'Rolling Stone: All of Taylor Swift’s songs, ranked — “ivy”', url: 'https://au.rollingstone.com/music/music-lists/-33908/ivy-2020-34071/' },
      { name: 'The Hollywood Reporter: Taylor Swift’s “ivy” on Dickinson', url: 'https://www.hollywoodreporter.com/tv/tv-features/taylor-swift-ivy-dickinson-apple-show-explained-1235065287/' },
      { name: 'setlist.fm: The Eras Tour — Cincinnati, July 1, 2023', url: 'https://www.setlist.fm/setlist/taylor-swift/2023/paycor-stadium-cincinnati-oh-1ba7914c.html' },
    ],
  },

  evermore: {
    whyItMatters: [
      'The title track closes the sister albums with the second Swift–Bon Iver duet, after folklore’s "exile." It begins as a hushed piano ballad about a November spent assuming pain is permanent, then Justin Vernon’s frantic bridge tears in at a sharply faster tempo before the song resolves into the first sight of a way out. Aaron Dessner has said it was the moment the two-album concept crystallized — the record’s namesake and its final word.',
      'It is also a William Bowery song. Joe Alwyn, writing under that pseudonym, co-wrote it and played the piano remotely; Vernon wrote and sang the bridge from a distance, the pandemic-era method that also produced "exile." All fifteen standard evermore tracks charted on the Hot 100 at once, with "evermore" peaking at No. 57.',
    ],
    meaning: {
      confirmed: [
        'Written by Taylor Swift, William Bowery (Joe Alwyn) and Justin Vernon and produced by Swift and Aaron Dessner; Bon Iver is the featured artist. Alwyn plays the piano (recorded remotely) and Vernon wrote and sang the bridge.',
        'Swift has described the arrangement’s dramatic tempo shift — the piano part Alwyn wrote speeds up and the music changes into a different tempo for the bridge — which is the song’s defining structural move.',
        'Debuted on the Billboard Hot 100 at No. 57 (chart dated December 26, 2020) as an album cut; it was not released as a single.',
        'William Bowery was revealed as Joe Alwyn in the November 2020 film folklore: the long pond studio sessions; his folklore/evermore co-writes are "exile" and "betty" (folklore) and "champagne problems," "coney island" and "evermore" (evermore).',
      ],
      supported: [
        'Critics routinely frame "evermore" as the bookend to "exile" — the pair of Swift/Vernon duets that close each sister album; Variety’s review drew the contrast directly.',
        'Aaron Dessner has said that when Swift wrote "evermore" with Bowery and it was sent to Vernon for the bridge, it became clear the project was a sister record to folklore.',
      ],
    },
    connections: [
      {
        relatedId: 'song:exile',
        label: 'exile',
        why: 'the first Swift–Bon Iver duet; "evermore" is its deliberate bookend, the two collaborations that close folklore and evermore respectively — one all blame, one finding the way out.',
      },
      {
        relatedId: 'song:willow',
        label: 'willow',
        why: 'evermore’s opening and closing statements, released the same day: willow casts devotion as a spell, "evermore" carries the record out of winter.',
      },
      {
        relatedId: 'song:champagne-problems',
        label: 'champagne problems',
        why: 'the other headline William Bowery (Joe Alwyn) co-write on evermore, both piano songs central to the album’s emotional weather.',
      },
    ],
    live: [
      {
        date: '2023-06-30',
        event: 'The Eras Tour — Cincinnati, OH (Paycor Stadium)',
        note: 'Performed as a surprise song, solo at the piano — Swift covered Vernon’s bridge herself — paired that night with an acoustic "I’m Only Me When I’m With You." No documented live performance of the duet with Bon Iver exists.',
      },
    ],
    voices: [
      {
        who: 'Aaron Dessner',
        context: 'Rolling Stone, on the song’s making',
        note: 'Said Swift wrote "evermore" with William Bowery and they sent it to Justin Vernon, who wrote the bridge — the point at which the sister-album idea came into focus.',
      },
    ],
    sources: [
      { name: 'evermore (Taylor Swift song) — Wikipedia', url: 'https://en.wikipedia.org/wiki/Evermore_(Taylor_Swift_song)' },
      { name: 'Rolling Stone: Aaron Dessner interview', url: RS_DESSNER },
      { name: 'Billboard: All 15 evermore songs debut on the Hot 100', url: 'https://www.billboard.com/pro/taylor-swift-15-songs-evermore-hot-100/' },
      { name: 'Variety: evermore album review', url: 'https://variety.com/2020/music/reviews/taylor-swift-evermore-album-review-1234851525/' },
      { name: 'Rolling Stone: “Evermore” surprise song in Cincinnati', url: 'https://www.rollingstone.com/music/music-news/taylor-swift-surprise-songs-evermore-im-only-me-when-im-with-you-cincinnati-1234782131/' },
    ],
  },

  'right-where-you-left-me': {
    whyItMatters: [
      'right where you left me is evermore’s most acclaimed hidden track: the portrait of a woman who fossilizes at the restaurant table where a breakup ended her, staying twenty-three while everyone else’s life moves on. Rolling Stone’s Rob Sheffield ranked it No. 12 among all of Swift’s songs and called it "maybe even criminal" that so strong a track was buried as a bonus cut, praising its obsessive production and Aaron Dessner’s banjo hook.',
      'It was a last-minute addition. Swift wrote it to a Dessner instrumental in the final days of the evermore cycle — finished so close to the deadline that the engineer worried about mixing the two extra songs in time — and it arrived on streaming a month after the album, on January 7, 2021, when Swift released the digital deluxe edition.',
    ],
    meaning: {
      confirmed: [
        'Music by Aaron Dessner, lyric by Swift, written and recorded very late in the evermore sessions (the album came out December 11, 2020); it was a genuine last-minute addition rather than a later re-recording.',
        'Released to streaming on January 7, 2021 as part of evermore’s digital deluxe edition, alongside "it’s time to go" — already-recorded deluxe material Swift announced herself; it debuted at No. 14 on Billboard’s Digital Song Sales chart.',
        'Swift has described the song as being about a woman who stays forever in the exact spot where her heart was broken, completely frozen in time.',
      ],
      supported: [
        'Reporting placed it in the top ten of Billboard’s Hot Rock & Alternative Songs chart after the deluxe release, and it registered on the UK singles listings; no Hot 100 or Bubbling Under entry is documented.',
        'Aaron Dessner’s banjo is the one confirmable instrumental detail (via Sheffield); the song has no standalone credits page, so a full per-instrument list is not publicly documented. Listeners frequently describe a waltzing, music-box lilt, but no interview documents that meter as a deliberate arrangement choice — treat it as how the track is heard, not a stated intention.',
      ],
      fanTheories: [
        'The narrator is often read as a Miss Havisham figure — Dickens’s bride frozen at the moment of her heartbreak — a critical and fan interpretation grounded in the dust-and-stopped-time imagery, not a reference Swift or Dessner has stated.',
      ],
    },
    connections: [
      {
        relatedId: 'song:marjorie',
        label: 'marjorie',
        why: 'evermore’s other study of a person held in suspended time — one a grief that keeps a grandmother present, one a heartbreak that keeps the narrator frozen at a restaurant table.',
      },
      {
        relatedId: 'song:its-time-to-go',
        label: 'it’s time to go',
        why: 'the paired evermore deluxe bonus track, written in the same final days and released together on January 7, 2021 — its mirror image, arguing for leaving where this one is stuck staying.',
      },
      {
        relatedId: 'song:happiness',
        label: 'happiness',
        why: 'both were finished in evermore’s last days from Dessner instrumentals, and both sit in the aftermath of a relationship — one refusing to move on, one insisting it eventually will.',
      },
    ],
    live: [
      {
        date: '2023-07-28',
        event: 'The Eras Tour — Santa Clara, CA (Levi’s Stadium)',
        note: 'Live debut as the guitar surprise song, performed with Aaron Dessner on guitar; Swift restarted after flubbing a line, joking it is one of her wordiest songs. "Castles Crumbling" was the piano debut the same night.',
      },
    ],
    sources: [
      { name: 'Songfacts: right where you left me', url: 'https://www.songfacts.com/facts/taylor-swift/right-where-you-left-me' },
      { name: 'Rolling Stone: Taylor Swift’s songs ranked (Sheffield) — right where you left me', url: 'https://www.rollingstone.com/music/music-lists/taylor-swift-songs-ranked-rob-sheffield-201800/right-where-you-left-me-2021-1245547/' },
      { name: 'Consequence: evermore deluxe bonus tracks arrive', url: 'https://consequence.net/2021/01/stream-taylor-swift-evermore-deluxe-edition-bonus-tracks/' },
      { name: 'Billboard: right where you left me Eras debut with Aaron Dessner', url: 'https://www.billboard.com/music/music-news/taylor-swift-right-where-you-left-me-debut-aaron-dessner-santa-clara-1235381549/' },
    ],
  },
};

// Vault track guide — Fearless era (Fearless 2008 / Platinum 2009 / Taylor's
// Version 2021, including From The Vault). Original prose only — never lyrics;
// unconfirmed readings are labeled. Provenance per
// docs/content/content-audit-2026-07-08.md §5 (URLs verified 2026-07-08).
import DOSSIERS from './fearless.dossiers.mjs';

const ACCESSED = '2026-07-08';
const wiki = (title, path, notes) => ({
  source_url: `https://en.wikipedia.org/wiki/${path}`,
  source_title: `${title} — Wikipedia`,
  publisher: 'Wikipedia',
  source_type: 'wiki',
  accessed_at: ACCESSED,
  reliability_score: 2,
  notes,
});
const ALBUM = wiki(
  'Fearless (Taylor Swift album)',
  'Fearless_(Taylor_Swift_album)',
  'album article: release facts, credits, and cited interviews',
);
const TV = wiki(
  "Fearless (Taylor's Version)",
  "Fearless_(Taylor's_Version)",
  're-recording article: vault-track credits and release facts',
);

const TRACKS = [
    {
      slug: 'fearless',
      trackNumber: 1,
      trackTitle: 'Fearless',
      youtubeId: '7lLigiVgJsE', // oEmbed-verified official Taylor Swift channel
      release: 'Fearless',
      releaseDate: '2008-11-11',
      writers: ['Taylor Swift', 'Liz Rose', 'Hillary Lindsey'],
      producers: ['Nathan Chapman', 'Taylor Swift'],
      isSingle: true,
      note: 'The title track and thesis statement: fearless is not being unafraid, it is driving into the storm anyway.',
      summary:
        'A first date written as a leap of faith — dancing in a parking lot in the rain because the feeling is worth the risk.',
      inspiration:
        'Swift said she wrote it on tour about the best first date she had not had yet — an idea of fearlessness in love rather than a specific person.',
      themes: ['fearlessness', 'first dates', 'optimism in love'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Fearless_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Fearless (Taylor Swift song)',
          'Fearless_(Taylor_Swift_song)',
          'song article: writing background',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'fifteen',
      trackNumber: 2,
      trackTitle: 'Fifteen',
      youtubeId: 'rLCol1C3ouc', // oEmbed-verified official Taylor Swift channel
      release: 'Fearless',
      releaseDate: '2008-11-11',
      writers: ['Taylor Swift'],
      producers: ['Nathan Chapman', 'Taylor Swift'],
      isSingle: true,
      note: 'Freshman year in four minutes — starring her real best friend Abigail, whose heartbreak gets the most devastating line on the album.',
      summary:
        'Advice from a slightly older self to a girl starting high school: the boy who says he loves you probably is not the whole story, and who you become matters more.',
      inspiration:
        'Confirmed autobiography: Swift wrote it about meeting best friend Abigail Anderson in ninth grade and the heartbreaks that followed both of them.',
      themes: ['growing up', 'friendship', 'hindsight'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Fifteen_(song)',
      sources: [
        wiki('Fifteen (song)', 'Fifteen_(song)', 'song article: autobiographical background'),
        ALBUM,
      ],
    },
    {
      slug: 'love-story',
      trackNumber: 3,
      trackTitle: 'Love Story',
      youtubeId: 'aXzVF3XeS8M', // oEmbed-verified official Taylor Swift channel
      release: 'Fearless',
      releaseDate: '2008-11-11',
      writers: ['Taylor Swift'],
      producers: ['Nathan Chapman', 'Taylor Swift'],
      singleReleaseDate: '2008-09-12',
      note: 'Written on her bedroom floor in roughly 20 minutes — Romeo and Juliet, except she overrules Shakespeare and writes the happy ending herself.',
      summary:
        'A forbidden-romance fantasy sparked by a boy her family disapproved of, recast through Romeo and Juliet — with the tragedy swapped for a proposal.',
      inspiration:
        'Swift confirmed it began with a boy her parents did not approve of; she reached for the most famous forbidden-love story and rewrote its ending.',
      themes: ['forbidden love', 'fairy-tale rewrites', 'defiance'],
      easterEggs:
        "Love Story (Taylor's Version) was the first re-recorded song she ever released (February 2021) — the opening move of the whole Taylor's Version project.",
      sourceUrl: 'https://en.wikipedia.org/wiki/Love_Story_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Love Story (Taylor Swift song)',
          'Love_Story_(Taylor_Swift_song)',
          'song article: writing story and TV rollout',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'hey-stephen',
      trackNumber: 4,
      trackTitle: 'Hey Stephen',
      youtubeId: 'tMhiHrL7rPE', // oEmbed-verified official Taylor Swift channel
      release: 'Fearless',
      releaseDate: '2008-11-11',
      writers: ['Taylor Swift'],
      producers: ['Nathan Chapman', 'Taylor Swift'],
      note: 'The flirtiest track on Fearless, addressed by name to a real musician — Stephen Barker Liles of Love and Theft, who got a heads-up text from Taylor herself ("Hey, Track 4") while fans decoded the liner-note code.',
      summary:
        'A confession disguised as a serenade: she lists all the girls who might like the boy, then makes her own case with a wink.',
      inspiration:
        'Confirmed to be about Stephen Barker Liles of the band Love and Theft, who once opened for Swift; the hidden message in the booklet spelled out the giveaway.',
      themes: ['crushes', 'flirtation', 'shooting your shot'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Hey_Stephen',
      sources: [wiki('Hey Stephen', 'Hey_Stephen', 'song article: subject confirmation'), ALBUM],
    },
    {
      slug: 'white-horse',
      trackNumber: 5,
      trackTitle: 'White Horse',
      youtubeId: '9-rKvhsjwKU', // oEmbed-verified official Taylor Swift channel
      release: 'Fearless',
      releaseDate: '2008-11-11',
      writers: ['Taylor Swift', 'Liz Rose'],
      producers: ['Nathan Chapman', 'Taylor Swift'],
      isSingle: true,
      note: 'The anti-fairy tale — no prince, no rescue — which won her Grammys for Best Country Song and Best Female Country Vocal.',
      summary:
        'The moment after the apology when you realize the story is not a fairy tale: she leaves the small town and the boy who was never going to change.',
      inspiration:
        'Swift and Liz Rose wrote it as the disillusioned counterpart to Love Story; its early placement in a Grey’s Anatomy premiere was a milestone Swift celebrated publicly.',
      themes: ['disillusionment', 'self-rescue', 'leaving'],
      sourceUrl: 'https://en.wikipedia.org/wiki/White_Horse_(Taylor_Swift_song)',
      sources: [
        wiki(
          'White Horse (Taylor Swift song)',
          'White_Horse_(Taylor_Swift_song)',
          'song article: Grammy wins and background',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'you-belong-with-me',
      trackNumber: 6,
      trackTitle: 'You Belong with Me',
      youtubeId: 'vwp8Ur6tO-8', // oEmbed-verified official Taylor Swift channel
      release: 'Fearless',
      releaseDate: '2008-11-11',
      writers: ['Taylor Swift', 'Liz Rose'],
      producers: ['Nathan Chapman', 'Taylor Swift'],
      isSingle: true,
      note: 'Bleachers-versus-cheer-captain, the biggest pop crossover of the era — and the video whose VMA win triggered the most consequential interruption in award-show history.',
      summary:
        'The girl next door watches her crush waste his time on someone who does not get him; the whole song is her closing argument.',
      inspiration:
        'Sparked when Swift overheard a male friend on a defensive phone call with his girlfriend — she started riffing on being the easier person to love.',
      themes: ['unrequited love', 'girl-next-door underdog', 'longing'],
      easterEggs:
        'Its 2009 VMA Best Female Video win was the night of the Kanye West stage-crash — the fault line that later feeds Innocent, and eventually the reputation era.',
      sourceUrl: 'https://en.wikipedia.org/wiki/You_Belong_with_Me',
      sources: [
        wiki('You Belong with Me', 'You_Belong_with_Me', 'song article: origin and VMA history'),
        ALBUM,
      ],
    },
    {
      slug: 'breathe',
      trackNumber: 7,
      trackTitle: 'Breathe',
      youtubeId: 'qsUK-BG5OQQ', // oEmbed-verified official Taylor Swift channel
      release: 'Fearless',
      releaseDate: '2008-11-11',
      writers: ['Taylor Swift', 'Colbie Caillat'],
      producers: ['Nathan Chapman', 'Taylor Swift'],
      note: 'A duet with Colbie Caillat about the breakup nobody writes about — losing a friend, with no villain to blame.',
      summary:
        'A goodbye where no one did anything wrong: two people who simply cannot stay in each other’s lives, and the guilt of being the one who leaves.',
      inspiration:
        'Swift has described it as being about losing a close friendship rather than a romance — one of the album’s few non-boy heartbreaks.',
      themes: ['lost friendship', 'guilt', 'gentle goodbyes'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Breathe_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Breathe (Taylor Swift song)',
          'Breathe_(Taylor_Swift_song)',
          'song article: collaboration background',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'tell-me-why',
      trackNumber: 8,
      trackTitle: 'Tell Me Why',
      youtubeId: 'cwFbq-70EwE', // oEmbed-verified official Taylor Swift channel
      release: 'Fearless',
      releaseDate: '2008-11-11',
      writers: ['Taylor Swift', 'Liz Rose'],
      producers: ['Nathan Chapman', 'Taylor Swift'],
      note: 'Born from a venting session in Liz Rose’s writing room — Taylor described the guy, Rose told her to say it in a song.',
      summary:
        'Frustration set to a stomp: a boy who runs hot and cold, and a narrator done guessing which version of him shows up today.',
      inspiration:
        'Swift recounted arriving at a session furious about a mixed-signals almost-relationship; the song is essentially that rant, structured.',
      themes: ['mixed signals', 'frustration', 'self-respect'],
      sourceUrl: 'https://taylorswiftswitzerland.jimdoweb.com/album-eras/fearless/the-songs/',
      sources: [
        {
          source_url: 'https://taylorswiftswitzerland.jimdoweb.com/album-eras/fearless/the-songs/',
          source_title: 'Fearless — The Songs',
          publisher: 'Taylor Swift Switzerland',
          source_type: 'fan_site',
          accessed_at: ACCESSED,
          reliability_score: 2,
          notes: "Swift's cut-by-cut commentary on the Liz Rose writing session",
        },
        ALBUM,
      ],
    },
    {
      slug: 'youre-not-sorry',
      trackNumber: 9,
      trackTitle: "You're Not Sorry",
      youtubeId: 'DNaSlUYIXBg', // oEmbed-verified official Taylor Swift channel
      release: 'Fearless',
      releaseDate: '2008-11-11',
      writers: ['Taylor Swift'],
      producers: ['Nathan Chapman', 'Taylor Swift'],
      note: 'The album’s darkest ballad — an apology refused, because the apologies were never real. A CSI episode later used a remixed version.',
      summary:
        'She stops accepting the same apology on repeat; the piano ballad is the sound of someone finally hanging up.',
      inspiration:
        'Swift said it was written about a boy who turned out to have secrets stacked on secrets; a remix soundtracked her 2009 CSI guest appearance.',
      themes: ['broken trust', 'boundaries', 'finality'],
      sourceUrl: "https://en.wikipedia.org/wiki/You're_Not_Sorry",
      sources: [
        wiki("You're Not Sorry", "You're_Not_Sorry", 'song article: background and CSI remix'),
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          'Fearless’s darkest ballad and its clearest kiss-off: an apology refused, delivered as a piano ballad that sounds like someone finally hanging up. It gave a 19-year-old Swift one of her first genuinely dramatic vocal performances and — unusually for a non-single — a second life on network television.',
        ],
        meaning: {
          confirmed: [
            'Written solo by Swift and produced with Nathan Chapman, it debuted and peaked at No. 11 on the Billboard Hot 100 in November 2008 on download strength during Fearless’s release week (also No. 11 in Canada, No. 21 on the Pop 100); it is certified Platinum by the RIAA.',
            'An electronic remix soundtracked Swift’s acting debut: she guest-starred as murdered teenager Haley Jones in the CSI: Crime Scene Investigation season-nine episode “Turn, Turn, Turn,” which aired March 5, 2009. The remix hit iTunes the same day and pushed the song back onto the Hot 100 at No. 67.',
            'The re-recording on Fearless (Taylor’s Version) (April 9, 2021) charted at No. 165 on the Billboard Global 200, No. 90 in Canada and No. 11 on the US Bubbling Under Hot 100; reviewers noted a fuller, less-nasal vocal.',
          ],
          supported: [
            'Swift has said the song grew out of a relationship with someone who “came across as Prince Charming” but “had a lot of secrets that he didn’t tell me about.”',
            'Reception has always split on it: Brittany Spanos (Rolling Stone) credited it as “one of her first truly dramatic vocal deliveries,” while Rob Sheffield (in Blender) called it “drippy” and later critics found it overwrought — the divide that follows a big, unguarded ballad swing.',
          ],
        },
        connections: [
          {
            relatedId: 'song:white-horse',
            label: 'White Horse',
            why: 'Fearless’s other disillusionment ballad — “White Horse” watches the fairy tale collapse, “You’re Not Sorry” refuses the apology that comes after.',
          },
          {
            relatedId: 'song:dear-john',
            label: 'Dear John',
            why: 'The same refused-apology lineage two albums on: “You’re Not Sorry” is the early piano kiss-off that “Dear John” expands into a six-minute indictment.',
          },
        ],
        live: [
          {
            date: '2009-04-05',
            event: '44th Academy of Country Music Awards',
            note: 'Live debut, introduced with a David Copperfield illusion.',
          },
          {
            event: 'Fearless Tour (2009–10)',
            note: 'A regular set piece performed at a baby grand piano, medleyed with Justin Timberlake’s “What Goes Around... Comes Around.”',
          },
          {
            event: 'Speak Now World Tour (2011–12)',
            note: 'Reworked as a mashup with “Back to December” and OneRepublic’s “Apologize.”',
          },
          {
            date: '2023-04-21',
            event: 'The Eras Tour',
            note: 'Returned as a surprise song in Houston, and again in Sydney on February 23, 2024.',
          },
        ],
        voices: [
          {
            who: 'Brittany Spanos',
            context: 'Rolling Stone',
            note: 'Her voice “pierces through the sound of her band for one of her first truly dramatic vocal deliveries.”',
          },
        ],
        sources: [
          { name: 'You’re Not Sorry — Wikipedia', url: 'https://en.wikipedia.org/wiki/You%27re_Not_Sorry' },
          { name: '“Turn, Turn, Turn” (CSI episode) — Wikipedia', url: 'https://en.wikipedia.org/wiki/Turn,_Turn,_Turn_(CSI_episode)' },
        ],
      },
    },
    {
      slug: 'the-way-i-loved-you',
      trackNumber: 10,
      trackTitle: 'The Way I Loved You',
      youtubeId: 'DlexmDDSDZ0', // oEmbed-verified official Taylor Swift channel
      release: 'Fearless',
      releaseDate: '2008-11-11',
      writers: ['Taylor Swift', 'John Rich'],
      producers: ['Nathan Chapman', 'Taylor Swift'],
      note: 'Co-written with John Rich — the safe, polite boyfriend loses to the memory of a screaming-in-the-rain love.',
      summary:
        'A perfect-on-paper relationship that feels like nothing, held against a chaotic past love that felt like everything: the album’s case that intensity beats comfort.',
      inspiration:
        'Swift said she wanted to capture wanting the frustrating, passionate love while dating its calm opposite; Rich helped frame the two-boys contrast.',
      themes: ['passion versus comfort', 'nostalgia', 'self-sabotage'],
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Way_I_Loved_You',
      sources: [
        wiki('The Way I Loved You', 'The_Way_I_Loved_You', 'song article: co-writing background'),
        ALBUM,
      ],
    },
    {
      slug: 'forever-and-always',
      trackNumber: 11,
      trackTitle: 'Forever & Always',
      youtubeId: 'T-41vMWQTUA', // oEmbed-verified official Taylor Swift channel
      release: 'Fearless',
      releaseDate: '2008-11-11',
      writers: ['Taylor Swift'],
      producers: ['Nathan Chapman', 'Taylor Swift'],
      note: 'Added to the album at the last possible minute after a very public, very short phone-call breakup — the piano version on Platinum twists the knife slower.',
      summary:
        'A promise of forever revoked in real time: she replays the moment someone’s feelings changed and demands to know where the person she knew went.',
      inspiration:
        'Confirmed to be about Joe Jonas — Swift said she added it late in production after the breakup, and famously described the 27-second phone call on Ellen.',
      themes: ['broken promises', 'whiplash heartbreak', 'anger'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Forever_%26_Always',
      sources: [
        wiki('Forever & Always', 'Forever_%26_Always', 'song article: late addition and subject'),
        ALBUM,
      ],
    },
    {
      slug: 'the-best-day',
      trackNumber: 12,
      trackTitle: 'The Best Day',
      youtubeId: 'KZeI9I875Ig', // oEmbed-verified official Taylor Swift channel
      release: 'Fearless',
      releaseDate: '2008-11-11',
      writers: ['Taylor Swift'],
      producers: ['Nathan Chapman', 'Taylor Swift'],
      note: 'Written and recorded in secret as a gift for her mom, who first heard it set to home movies — still the go-to Taylor Mother’s Day song.',
      summary:
        'A thank-you letter to her mother (with a verse for her dad and brother): the parent who drove her away from the mean girls and never said anything but kind words.',
      inspiration:
        'Confirmed: Swift wrote it for Andrea Swift and kept it secret until it was finished, premiering it with a home-video montage.',
      themes: ['family', 'gratitude', 'childhood memory'],
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Best_Day_(Taylor_Swift_song)',
      sources: [
        wiki(
          'The Best Day (Taylor Swift song)',
          'The_Best_Day_(Taylor_Swift_song)',
          'song article: family background',
        ),
        ALBUM,
      ],
      // Depth ledger #1364 (2026-07-28): the video/reveal story, live history,
      // chart/cert record, and the Taylor's Version re-recording — the stub's
      // "kept secret" line already covered the writing, so this fills in the
      // documented specifics around it.
      discussion: [
        'Swift has said the song was a "complete secret session" written from a five-year-old\'s perspective — "the way that I used to talk when I was 5" — down to lines like "getting cold and I\'ve got my big coat on." She revealed it to Andrea Swift on Christmas, synced to a home-video montage she\'d edited herself; Andrea "had no idea that it was me singing for the first half of the song" and "just broke down crying" once she realized. Beyond the mother-daughter verses, the song also thanks her father directly ("I have an excellent father") and recalls a specific childhood memory of Andrea driving her to a different town to help her forget a run of mean girls at school.',
        'A self-edited music video using the same childhood home-movie footage went out May 1, 2009 as a Big Machine Mother\'s Day promotion; the original track reached No. 3 on Bubbling Under Hot 100 Singles and No. 56 on Hot Country Songs despite never going to country radio, and was RIAA-certified Gold in July 2018. Swift performed it on the Fearless Tour (Evansville, April 2009; Moline, May 2010), an acoustic Red Tour set (Cleveland, April 2013) and the Reputation Stadium Tour (Santa Clara, May 2018, dedicated to mothers) — but has said she eventually dropped it from rotation because Andrea "kept breaking down" backstage whenever she heard it; it resurfaced once more as a surprise song on the Eras Tour, in Philadelphia on May 14, 2023, Mother\'s Day weekend.',
        'The 2021 Taylor\'s Version, produced with Christopher Rowe, charted lower (No. 19 Bubbling Under Hot 100, No. 45 Hot Country Songs) and arrived April 9, 2021 with its own new video on April 30 — a longer, four-minute cut spanning Swift\'s childhood into young adulthood, still built from family footage and still starring her parents and brother Austin. Critics have long singled it out among Fearless\'s deep cuts: The Boston Globe called it "the best song on Fearless," and Paste cited it as proof Swift\'s writing extended past romance into a plainly stated love song for her mother — the reputation that has made it her de facto Mother\'s Day standard ever since.',
      ],
      discussionSources: [
        {
          source_url: 'https://www.eonline.com/news/1257438/taylor-swift-pays-tribute-to-mom-andrea-with-unseen-home-movies-in-the-best-day-lyric-video',
          source_title: "Taylor Swift Pays Tribute to Mom Andrea With Unseen Home Movies in 'The Best Day' Lyric Video",
          publisher: 'E! News',
          source_type: 'reputable_press',
          accessed_at: '2026-07-28',
          reliability_score: 3,
          notes: 'the 2021 Taylor\'s Version video',
        },
        {
          source_url: 'https://www.songfacts.com/facts/taylor-swift/the-best-day',
          source_title: 'The Best Day by Taylor Swift',
          publisher: 'Songfacts',
          source_type: 'reputable_press',
          accessed_at: '2026-07-28',
          reliability_score: 3,
          notes: 'the Christmas reveal, five-year-old narrative voice, mean-girls memory, and the dropped-from-rotation account',
        },
        {
          source_url: 'https://en.wikipedia.org/wiki/The_Best_Day_(Taylor_Swift_song)',
          source_title: 'The Best Day (Taylor Swift song)',
          publisher: 'Wikipedia',
          source_type: 'wiki',
          accessed_at: '2026-07-28',
          reliability_score: 2,
          notes: 'chart peaks, RIAA certification, live-performance dates, and critical reception',
        },
      ],
    },
    {
      slug: 'change',
      trackNumber: 13,
      trackTitle: 'Change',
      youtubeId: 'jwWR1cQTKyw', // oEmbed-verified official Taylor Swift channel
      release: 'Fearless',
      releaseDate: '2008-11-11',
      writers: ['Taylor Swift'],
      producers: ['Nathan Chapman', 'Taylor Swift'],
      isSingle: true,
      note: 'Written as an underdog anthem for her tiny label — released early as an AT&T Team USA song for the 2008 Beijing Olympics.',
      summary:
        'A fight song about believing the scrappy operation you belong to will win someday — the closing promise that these walls will come down.',
      inspiration:
        'Swift confirmed it was inspired by being on Big Machine, then a startup label competing against giants; its Olympics placement made it the album’s advance single.',
      themes: ['underdogs', 'perseverance', 'victory'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Change_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Change (Taylor Swift song)',
          'Change_(Taylor_Swift_song)',
          'song article: Big Machine and Olympics background',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'jump-then-fall',
      trackNumber: 14,
      trackTitle: 'Jump Then Fall',
      youtubeId: 'vUHDR6Rg3Y4', // oEmbed-verified official Taylor Swift channel
      release: 'Fearless (Platinum Edition)',
      releaseDate: '2009-10-26',
      writers: ['Taylor Swift'],
      producers: ['Nathan Chapman', 'Taylor Swift'],
      note: 'The sunniest of the Platinum Edition additions — all butterflies, no warnings.',
      summary:
        'An invitation to skip the cautious phase entirely: she promises to catch someone who is willing to fall first.',
      inspiration: null,
      themes: ['infatuation', 'trust', 'joy'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Fearless_(Taylor_Swift_album)',
      sources: [ALBUM],
    },
    {
      slug: 'untouchable',
      trackNumber: 15,
      trackTitle: 'Untouchable',
      youtubeId: '8bNlGwnEUAs', // oEmbed-verified official Taylor Swift channel
      release: 'Fearless (Platinum Edition)',
      releaseDate: '2009-10-26',
      writers: ['Cary Barlowe', 'Nathan Barlowe', 'Tommy Lee James', 'Taylor Swift'],
      producers: ['Nathan Chapman', 'Taylor Swift'],
      note: 'The rare Taylor cover: a Luna Halo rock song she rearranged so completely into a dreamy waltz that she earned a writing credit.',
      summary:
        'Longing for someone permanently out of reach, rendered as a starlit trance — distance as the whole romance.',
      inspiration:
        'Originally by the band Luna Halo; Swift’s radical rearrangement is the documented story here — her version bears little resemblance to the original.',
      themes: ['unattainable love', 'yearning', 'dream logic'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Fearless_(Taylor_Swift_album)',
      sources: [ALBUM, TV],
    },
    {
      slug: 'come-in-with-the-rain',
      trackNumber: 17,
      trackTitle: 'Come In with the Rain',
      youtubeId: 'ePjcjLRHPOo', // oEmbed-verified official Taylor Swift channel
      release: 'Fearless (Platinum Edition)',
      releaseDate: '2009-10-26',
      writers: ['Taylor Swift', 'Liz Rose'],
      producers: ['Nathan Chapman', 'Taylor Swift'],
      note: 'A Platinum Edition slow-burner about leaving the window open for someone you have stopped chasing.',
      summary:
        'She is done fighting for someone’s attention but not done hoping — surrender that still leaves a door unlocked.',
      inspiration: null,
      themes: ['resignation', 'quiet hope', 'letting go'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Fearless_(Taylor_Swift_album)',
      sources: [ALBUM],
    },
    {
      slug: 'superstar',
      trackNumber: 18,
      trackTitle: 'Superstar',
      youtubeId: 'IsCik8wznlU', // oEmbed-verified official Taylor Swift channel
      release: 'Fearless (Platinum Edition)',
      releaseDate: '2009-10-26',
      writers: ['Taylor Swift', 'Liz Rose'],
      producers: ['Nathan Chapman', 'Taylor Swift'],
      note: 'A fan-in-the-front-row daydream about loving someone famous — written before she became the superstar in everyone else’s version.',
      summary:
        'A crush on a rock star from the crowd: invisible to him by definition, devoted anyway — an inversion fans love given how her own fame turned out.',
      inspiration: null,
      themes: ['celebrity crushes', 'distance', 'daydreams'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Fearless_(Taylor_Swift_album)',
      sources: [ALBUM],
    },
    {
      slug: 'the-other-side-of-the-door',
      trackNumber: 19,
      trackTitle: 'The Other Side of the Door',
      youtubeId: '425n1NoRtgA', // oEmbed-verified official Taylor Swift channel
      release: 'Fearless (Platinum Edition)',
      releaseDate: '2009-10-26',
      writers: ['Taylor Swift'],
      producers: ['Nathan Chapman', 'Taylor Swift'],
      note: 'The Platinum cut about saying leave when you mean stay — with a bridge that explodes exactly the way the argument did.',
      summary:
        'A post-fight standoff where pride says one thing and the heart means the opposite; she wants the grand gesture, not the silence.',
      inspiration: null,
      themes: ['stubbornness', 'push and pull', 'grand gestures'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Fearless_(Taylor_Swift_album)',
      sources: [ALBUM],
    },
    {
      slug: 'today-was-a-fairytale',
      trackNumber: 20,
      trackTitle: 'Today Was a Fairytale',
      youtubeId: 'xSWVPqnKcXQ', // oEmbed-verified official Taylor Swift channel
      release: "Valentine's Day soundtrack / Fearless (Taylor's Version)",
      releaseDate: '2010-01-19',
      writers: ['Taylor Swift'],
      producers: ['Nathan Chapman', 'Taylor Swift'],
      singleReleaseDate: '2010-01-19',
      note: 'Cut for the Valentine’s Day movie (which she also acted in), it debuted at No. 2 on the Hot 100 — then finally joined the album family on Fearless (Taylor’s Version).',
      summary:
        'A perfect ordinary date replayed in storybook terms — the thesis that magic is a Tuesday afternoon with the right person.',
      inspiration:
        'Recorded for the 2010 film Valentine’s Day, in which Swift had a cameo; its Hot 100 debut set a then-record for her.',
      themes: ['storybook romance', 'living in the moment', 'giddiness'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Today_Was_a_Fairytale',
      sources: [
        wiki(
          'Today Was a Fairytale',
          'Today_Was_a_Fairytale',
          'song article: soundtrack origin and chart debut',
        ),
        TV,
      ],
    },
    {
      slug: 'you-all-over-me',
      trackNumber: 21,
      trackTitle: 'You All Over Me',
      youtubeId: '1uKi3ZD75RE', // oEmbed-verified official Taylor Swift - Topic channel
      release: "Fearless (Taylor's Version) — From The Vault",
      releaseDate: '2021-04-09',
      writers: ['Taylor Swift', 'Scooter Carusoe'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      isFromTheVault: true,
      isSingle: true,
      note: 'The first From The Vault song ever released — a 2008 castoff with Maren Morris harmonies, previewing the whole re-recording project.',
      summary:
        'Being clean but not new: a breakup leaves a residue no amount of moving on scrubs off. Wiser and wearier than anything that made the 2008 cut.',
      inspiration:
        'Written for the original Fearless and left off; released March 2021 with Maren Morris as the debut vault track.',
      themes: ['lingering heartbreak', 'memory', 'experience as scar tissue'],
      sourceUrl: 'https://en.wikipedia.org/wiki/You_All_Over_Me',
      sources: [
        wiki('You All Over Me', 'You_All_Over_Me', 'song article: vault release details'),
        TV,
      ],
    },
    {
      slug: 'mr-perfectly-fine',
      trackNumber: 22,
      trackTitle: 'Mr. Perfectly Fine',
      youtubeId: 'rFjJs6ZjPe8', // oEmbed-verified official Taylor Swift channel
      release: "Fearless (Taylor's Version) — From The Vault",
      releaseDate: '2021-04-09',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      isFromTheVault: true,
      isSingle: true,
      note: 'The vault’s sharpest 2008-era kiss-off — a boy who moved on suspiciously fast, skewered with the Mr.-titles gimmick.',
      summary:
        'A catalog of a casually cruel ex’s personas, from charming to checked-out — teenage Swift already perfecting the receipts-song format.',
      inspiration:
        'Written in the Fearless era and shelved until 2021; fans widely time-stamp it to the Joe Jonas breakup (unconfirmed), and Sophie Turner’s playful public endorsement of the song became part of its story.',
      themes: ['double standards in moving on', 'wit as armor', 'receipts'],
      fanLore:
        'Fan reading (unconfirmed): the Jonas-era timing; Turner posting the song with a wink is the documented moment fans cite.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Mr._Perfectly_Fine',
      sources: [
        wiki(
          'Mr. Perfectly Fine',
          'Mr._Perfectly_Fine',
          'song article: vault context and reception',
        ),
        TV,
      ],
    },
    {
      slug: 'we-were-happy',
      trackNumber: 23,
      trackTitle: 'We Were Happy',
      youtubeId: 'seU5y5EgIwk', // oEmbed-verified official Taylor Swift channel
      release: "Fearless (Taylor's Version) — From The Vault",
      releaseDate: '2021-04-09',
      writers: ['Taylor Swift', 'Liz Rose'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      isFromTheVault: true,
      note: 'A Liz Rose co-write from the vault that grieves the good version of a relationship — the happiness itself is what hurts to remember.',
      summary:
        'Instead of cataloging the ending, she catalogs the golden middle: farm fields, big plans, a love that worked right up until it did not.',
      inspiration: null,
      themes: ['grieving the good times', 'nostalgia', 'quiet loss'],
      sourceUrl: "https://en.wikipedia.org/wiki/Fearless_(Taylor's_Version)",
      sources: [TV],
    },
    {
      slug: 'thats-when',
      trackNumber: 24,
      trackTitle: "That's When",
      youtubeId: 'aOa6D6ku3dM', // oEmbed-verified official Taylor Swift channel
      release: "Fearless (Taylor's Version) — From The Vault",
      releaseDate: '2021-04-09',
      writers: ['Taylor Swift', 'Brad Warren', 'Brett Warren'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      isFromTheVault: true,
      note: 'A conversation duet with Keith Urban — an apology and its answer, traded verse by verse.',
      summary:
        'Two people who asked for space negotiate the way back: he asks when he can return, she answers with every when she has.',
      inspiration:
        'Recorded with Keith Urban for the vault; Urban had been an opener on the Speak Now tour, closing an old loop.',
      themes: ['reconciliation', 'forgiveness', 'timing'],
      sourceUrl: "https://en.wikipedia.org/wiki/That's_When",
      sources: [wiki("That's When", "That's_When", 'song article: Urban collaboration'), TV],
    },
    {
      slug: 'dont-you',
      trackNumber: 25,
      trackTitle: "Don't You",
      youtubeId: 'dHdAN4FXzmc', // oEmbed-verified official Taylor Swift channel
      release: "Fearless (Taylor's Version) — From The Vault",
      releaseDate: '2021-04-09',
      writers: ['Taylor Swift', 'Tommy Lee James'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      isFromTheVault: true,
      note: 'The dreamiest vault production — running into an ex who acts like nothing happened, and hating how well it works on you.',
      summary:
        'A chance encounter with someone who broke her heart, and the unfair chemistry that survives the breakup; she asks him not to smile at her like that.',
      inspiration: null,
      themes: ['unresolved feelings', 'chance encounters', 'self-protection'],
      sourceUrl: "https://en.wikipedia.org/wiki/Fearless_(Taylor's_Version)",
      sources: [TV],
    },
    {
      slug: 'bye-bye-baby',
      trackNumber: 26,
      trackTitle: 'Bye Bye Baby',
      youtubeId: 'yuFuwXd-B9E', // oEmbed-verified official Taylor Swift channel
      release: "Fearless (Taylor's Version) — From The Vault",
      releaseDate: '2021-04-09',
      writers: ['Taylor Swift', 'Liz Rose'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      isFromTheVault: true,
      note: 'The vault’s closing exhale — a goodbye that is sadder than it is angry, ending the expanded Fearless on acceptance.',
      summary:
        'The relationship is over and nobody is screaming; she watches the whole future they planned drive away and lets it.',
      inspiration: null,
      themes: ['acceptance', 'goodbyes', 'what might have been'],
      sourceUrl: "https://en.wikipedia.org/wiki/Fearless_(Taylor's_Version)",
      sources: [TV],
    },
];

// Per-song dossiers (issue #726 / #440 pattern) live in the .dossiers.mjs side
// file; attach them by slug. A dossier keyed to a slug that doesn't exist here
// is an authoring typo — fail loudly.
{
  const slugs = new Set(TRACKS.map((t) => t.slug));
  for (const key of Object.keys(DOSSIERS)) {
    if (!slugs.has(key)) throw new Error(`dossier for unknown track slug: ${key}`);
  }
}

export default {
  eraSlug: 'fearless',
  tracks: TRACKS.map((t) => (DOSSIERS[t.slug] ? { ...t, dossier: DOSSIERS[t.slug] } : t)),
};

// Vault track guide — evermore era (evermore, 2020). Original prose only —
// never lyrics; unconfirmed readings are labeled. Provenance per
// docs/content/content-audit-2026-07-08.md §5 (URLs verified 2026-07-08).
// Era context: folklore's surprise "sister album," released nine months later
// on 2020-12-11 — deeper into fiction, released around her 31st birthday.
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
  'Evermore',
  'Evermore',
  'album article: release facts, credits, and cited interviews',
);

const RS_REVIEW = {
  source_url: 'https://www.rollingstone.com/music/music-album-reviews/taylor-swift-evermore-folklore-1101778/',
  source_title: "Taylor Swift's 'Evermore': Album Review",
  publisher: 'Rolling Stone',
  source_type: 'reputable_press',
  accessed_at: '2026-10-09',
  reliability_score: 4,
  notes: 'album review: Marjorie as a portrait of her grandmother; Happiness recorded a week before release',
};
const BB_DESSNER = {
  source_url: 'https://www.billboard.com/music/pop/aaron-dessner-taylor-swift-evermore-interview-9502756/',
  source_title: "Aaron Dessner Interview: 'Evermore' & Taylor Swift",
  publisher: 'Billboard',
  source_type: 'reputable_press',
  accessed_at: '2026-10-09',
  reliability_score: 4,
  notes: "Dessner on Taylor writing 'Tis the Damn Season at Long Pond",
};

const RS_DESSNER =
  'https://www.rollingstone.com/music/music-features/aaron-dessner-interview-taylor-swift-evermore-1105853/';
const WIKI_ALBUM = 'https://en.wikipedia.org/wiki/Evermore_(Taylor_Swift_album)';

const TRACKS = [
    {
      slug: 'willow',
      trackNumber: 1,
      trackTitle: 'willow',
      youtubeId: 'RsEZmictANA', // oEmbed-verified official Taylor Swift channel
      release: 'evermore',
      releaseDate: '2020-12-11',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Aaron Dessner'],
      singleReleaseDate: '2020-12-11',
      note: 'The lead single written to a Dessner instrumental in under ten minutes of listening — wanting someone rendered as witchcraft, with a glowing-string video to match.',
      summary:
        'Devotion that bends like the tree it is named for: she casts the wanting as a spell, follows the golden thread from cardigan’s video, and made witch-titled remixes an official joke.',
      inspiration:
        'Dessner has said Swift wrote it to his track almost immediately; the video picks up the literal thread where cardigan’s left off.',
      themes: ['longing as magic', 'pliancy and devotion', 'pursuit'],
      easterEggs:
        'The video begins exactly where cardigan’s ended — same piano, same thread — making the sister-album link literal.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Willow_(song)',
      sources: [
        wiki('Willow (song)', 'Willow_(song)', 'song article: writing speed and video continuity'),
        ALBUM,
      ],
      dossier: {
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
            note: 'willow opens the evermore section: Taylor and cloaked dancers move through a misty stage carrying glowing orbs, echoing the video’s coven imagery — the staging that later seeded a fan orb tradition beginning in Europe in 2024.',
          },
        ],
        voices: [
          {
            who: 'Aaron Dessner',
            context: 'on the evermore sessions',
            note: 'Has described sending Taylor instrumental sketches — willow’s was labeled "Westerly" — to which she returned finished songs almost immediately, the working method behind most of the record.',
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
    },
    {
      slug: 'champagne-problems',
      trackNumber: 2,
      trackTitle: 'champagne problems',
      youtubeId: 'wMpqCRF7TKg', // oEmbed-verified official Taylor Swift channel
      release: 'evermore',
      releaseDate: '2020-12-11',
      writers: ['Taylor Swift', 'William Bowery'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      note: 'The Bowery co-write about a proposal that gets a no — fiction, per Taylor, and the era’s biggest gut-punch bridge.',
      summary:
        'She turns down a ring in front of everyone and narrates her own condemnation: his mid-sentence stall, the gossiping town, her unnamed reasons. Written with Joe Alwyn, about invented people.',
      inspiration:
        'Widely read as fiction: the couple’s backstory is invented; Alwyn co-wrote under the Bowery pseudonym.',
      themes: ['rejected proposals', 'mental health whispered about', 'self-blame'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Champagne_Problems_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Champagne Problems (Taylor Swift song)',
          'Champagne_Problems_(Taylor_Swift_song)',
          'song article: Bowery credit and fiction framing',
        ),
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "\"Champagne Problems\" is the second track on evermore, the surprise sister album Taylor Swift released in December 2020 less than five months after folklore, and it functions as a keystone example of the character-driven songwriting mode she was refining across both records. Co-written with her then-partner Joe Alwyn under his pseudonym William Bowery and produced with Aaron Dessner, the song imagines a college couple whose relationship collapses at the exact moment a marriage proposal goes wrong, told from the point of view of the woman who says no rather than the man who is rejected.",
          "The song matters to Swift's broader story because it demonstrates her turn toward fiction-adjacent narrative songwriting during the folklore/evermore era, moving away from strictly autobiographical material toward invented (or semi-invented) characters and situations, while still working in devastating emotional specificity. Its placement as track two, its inclusion in the Eras Tour setlist, and its accumulation of tens of millions of lyric-video views all point to it becoming one of the most enduring and critically praised songs from the evermore era."
        ],
        meaning: {
          confirmed: [
            "Taylor Swift described 'Champagne Problems' as a song about two college sweethearts when she revealed evermore's track list and teased imagery associated with each song ahead of the album's release.",
            "The song was written during the September 2020 sessions at Long Pond Studio in upstate New York, the same cabin sessions documented in the Folklore: The Long Pond Studio Sessions film, and was co-written with Joe Alwyn under the pseudonym William Bowery.",
            "Swift produced the track with Aaron Dessner, and it was recorded partly at Dessner's Long Pond studio and partly at Swift's Kitty Committee studio in Beverly Hills."
          ],
          supported: [
            "Critics and outlets covering the song have generally read the lyrics as depicting a woman who turns down her boyfriend's proposal at a Christmas gathering because she does not feel emotionally ready, then spends the rest of the song processing guilt, grief, and the fallout of disappointing a partner who had seemingly already told his family the engagement was coming.",
            "Multiple reviewers, including writers at Billboard, Entertainment Weekly, and The Sydney Morning Herald, praised the song specifically for its detailed, novelistic characterization — building out a couple's entire emotional history and breakup in a few short verses rather than relying on generic breakup language.",
            "Several critics noted stylistic or tonal echoes between 'Champagne Problems' and earlier Swift songs: The Guardian's Alexis Petridis linked the bridge's depiction of mental unraveling to 'Blank Space,' while NME's Hannah Mylrea felt the song's romantic sincerity had more in common with 'Love Story.'"
          ]
        },
        connections: [
          {
            relatedId: "song:right-where-you-left-me",
            label: "Right Where You Left Me",
            why: "Also from evermore, this bonus track shares Champagne Problems' interest in a single devastating moment (here, a jilted-at-the-altar breakup) freezing a character in time, and both songs were framed by Swift as connected character studies from the same emotional universe."
          },
          {
            relatedId: "song:willow",
            label: "Willow",
            why: "As evermore's opening track, Willow establishes the folklore/evermore aesthetic of romantic longing and cinematic imagery that Champagne Problems, the very next song, extends into a story about love curdling instead of blooming."
          },
          {
            relatedId: "song:tolerate-it",
            label: "Tolerate It",
            why: "Both songs are evermore-era character studies centered on the imbalance and ache of a relationship, showcasing the same narrative, third-person-adjacent songwriting approach Swift leaned into for the album."
          },
          {
            relatedId: "song:this-is-me-trying",
            label: "This Is Me Trying",
            why: "Another evermore track dealing with guilt, self-blame, and the aftermath of personal failure in a relationship, mirroring the self-recrimination the narrator of Champagne Problems expresses after rejecting the proposal."
          }
        ],
        sources: [
          { name: "Champagne Problems (Taylor Swift song) — Wikipedia", url: "https://en.wikipedia.org/wiki/Champagne_Problems_(Taylor_Swift_song)" },
          { name: "Evermore (Taylor Swift album) — Wikipedia", url: "https://en.wikipedia.org/wiki/Evermore_(Taylor_Swift_album)" },
          { name: "Champagne Problems — Taylor Swift Wiki (Fandom)", url: "https://taylorswift.fandom.com/wiki/Champagne_Problems" }
        ]
      },
    },
    {
      slug: 'gold-rush',
      trackNumber: 3,
      trackTitle: 'gold rush',
      youtubeId: 'Pz-f9mM3Ms8', // oEmbed-verified official Taylor Swift channel
      release: 'evermore',
      releaseDate: '2020-12-11',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The lone Antonoff production on evermore — a daydream inside a daydream about wanting someone everyone else wants too.',
      summary:
        'Jealousy at the fantasy stage: the whole crush happens and dies inside her head because loving someone universally desired sounds exhausting. The production literally fades in and out of the reverie.',
      inspiration: null,
      themes: ['jealousy', 'daydream romance', 'self-protective retreat'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Evermore',
      sources: [ALBUM],
      dossier: {
        whyItMatters: [
          "Aaron Dessner told Billboard that Swift wrote 'gold rush' with Jack Antonoff, in the burst of writing that followed folklore: 'by the end there were 17 songs, and it was only a couple months after Folklore came out.'",
          "Variety's review of evermore called it 'one of the standout songs on the new album.'"
        ],
        meaning: {
          confirmed: [
            "Introducing the song in Philadelphia on May 12, 2023, Swift addressed the debate over the 'Eagles T-shirt hanging from the door' lyric, saying people had wondered whether it meant the band or the team: 'I love the band the Eagles, but guys, like, come on, I'm from Philly,' as Billboard quotes her. She did not spell out an answer beyond that."
          ],
          supported: [
            "Billboard's critics heard Swift rapidly spilling jealous feelings and longstanding insecurities, asking what it must be like to grow up that beautiful, over drums, horns and violins.",
            "Variety's review read it as being about falling out of love with someone even prettier and more magnetic than the narrator, and expected it to spark fan speculation."
          ],
          fanTheories: [
            "As Variety anticipated, fans have speculated about who the song describes. Swift has not named a subject in the sources cited here, and this guide does not either."
          ]
        },
        live: [
          {
            date: "May 12, 2023",
            event: "The Eras Tour, Philadelphia",
            note: "Played as a surprise song, introduced with a joke about the Eagles lyric, per Billboard's list of Eras Tour surprise songs."
          }
        ],
        connections: [
          {
            relatedId: "song:mirrorball",
            label: "mirrorball",
            why: "Billboard's critics said the song begins with layered vocals that immediately recall this folklore standout."
          }
        ],
        voices: [
          {
            who: "Aaron Dessner",
            context: "Speaking to Billboard, December 2020",
            note: "He listed 'gold rush' among the songs from the writing stretch after folklore, and said Swift wrote it with Antonoff."
          },
          {
            who: "Taylor Swift",
            context: "On stage in Philadelphia, May 12, 2023, as quoted by Billboard",
            note: "She said she loves the band the Eagles but, being from Philly, felt she had to address the debate over the lyric."
          }
        ],
        sources: [
          {
            name: "Aaron Dessner on the 'Weird Avalanche' That Resulted in Taylor Swift's 'Evermore' - Billboard",
            url: "https://www.billboard.com/music/pop/aaron-dessner-taylor-swift-evermore-interview-9502756/"
          },
          {
            name: "Every Song Ranked on Taylor Swift's 'Evermore' Deluxe Edition: Critic's Picks - Billboard",
            url: "https://www.billboard.com/music/pop/taylor-swift-evermore-songs-ranked-9498113/"
          },
          {
            name: "Taylor Swift Has Her Second Great Album of 2020 With 'Evermore': Album Review - Variety",
            url: "https://variety.com/2020/music/reviews/taylor-swift-evermore-album-review-1234851525/"
          },
          {
            name: "All the Surprise Songs Taylor Swift Performed on The Eras Tour - Billboard",
            url: "https://www.billboard.com/lists/taylor-swift-eras-tour-surprise-songs/"
          }
        ]
      },
    },
    {
      slug: 'tis-the-damn-season',
      trackNumber: 4,
      trackTitle: "'tis the damn season",
      youtubeId: 'WuvhOD-mP8M', // oEmbed-verified official Taylor Swift channel
      release: 'evermore',
      releaseDate: '2020-12-11',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Aaron Dessner'],
      note: 'The hometown-for-the-holidays hookup — Dorothea’s side of evermore’s own two-song pairing, written in one night after a dinner party.',
      summary:
        'An actress back home for Christmas offers an old flame the weekend, no strings, honesty included: the road not taken looks warm every December. Pairs with dorothea, the same story from the boy who stayed.',
      inspiration:
        'Dessner told Billboard Taylor wrote it in the middle of the night at Long Pond and sang it to him the next morning; the Dorothea character is widely read as the link to the later song.',
      themes: ['hometown nostalgia', 'temporary love', 'choices and Decembers'],
      sourceUrl: "https://en.wikipedia.org/wiki/'Tis_the_Damn_Season",
      sources: [
        wiki(
          "'Tis the Damn Season",
          "'Tis_the_Damn_Season",
          'song article: overnight writing and character link',
        ),
        ALBUM,
        BB_DESSNER,
      ],
      dossier: {
        whyItMatters: [
          "Evermore's homecoming-for-the-holidays song, and by Aaron Dessner's account one of the album's quickest. He told Billboard that Swift wrote it when she arrived for the first day of rehearsal for the Long Pond Studio Sessions: they stayed up late, and the next morning at about nine she came to him and said she had to sing him a song, which she then did in his kitchen.",
          "The music underneath is older. Dessner told Billboard he wrote it many years earlier and hid it away because he loved it so much, and told Rolling Stone it is a track that is very special to him. Billboard quotes him saying the feeling in it, an ache in one person put there by an ache in another, is one everyone can relate to, and Rolling Stone quotes him calling the song Swift wrote 'instantly relatable.'"
        ],
        meaning: {
          confirmed: [
            "Swift teased the song's title before the album was announced: Teen Vogue reported that, in the week Entertainment Weekly published her cover shoot and interview, she captioned one of the photos on her Instagram story with the title."
          ],
          supported: [
            "Dessner told Rolling Stone that Swift wrote the lyrics overnight during The Long Pond Studio Sessions, and that hearing her sing it to him was a highlight of the whole period of working together.",
            "Dessner told Rolling Stone that a wintry nostalgia in much of the evermore music was intentional on his part. The interviewer heard it in this song's icy guitar line, and Dessner replied that the guitar part is simply how he sounds when he fingerpicks an electric guitar.",
            "Teen Vogue pointed out that the song shares lyric echoes with two folklore songs: the road less traveled and the lingering perfume with 'illicit affairs', and the school reference with 'it's nice to have a friend'. That is the outlet's reading of the connections, not something Swift has said."
          ],
          fanTheories: [
            "Fans commonly pair this song with 'dorothea' as two halves of one story, the one who left and the one who stayed. None of the sources cited here has Swift confirming the link, so treat it as a fan reading."
          ]
        },
        connections: [
          {
            relatedId: "song:peace",
            label: "peace",
            why: "Dessner told Rolling Stone that hearing Swift sing this one in his kitchen felt much like the moment she wrote 'peace', 'but even more so'."
          },
          {
            relatedId: "song:its-nice-to-have-a-friend",
            label: "it's nice to have a friend",
            why: "Teen Vogue noted the school reference in this song as an echo of that Lover track."
          },
          {
            relatedId: "song:illicit-affairs",
            label: "illicit affairs",
            why: "Teen Vogue pointed to two pairs of matching lyric images between this song and 'illicit affairs'."
          }
        ],
        voices: [
          {
            who: "Aaron Dessner",
            context: "Speaking to Billboard in December 2020",
            note: "He said Swift showed up the morning after rehearsal and told him she had to sing him a song, and that it was a moment where his brain exploded."
          }
        ],
        sources: [
          {
            name: "Aaron Dessner on the 'Weird Avalanche' That Resulted in Taylor Swift's 'Evermore' - Billboard",
            url: "https://www.billboard.com/music/pop/aaron-dessner-taylor-swift-evermore-interview-9502756/"
          },
          {
            name: "Aaron Dessner on How His Collaborative Chemistry With Taylor Swift Led to 'Evermore' - Rolling Stone",
            url: "https://www.rollingstone.com/music/music-features/aaron-dessner-interview-taylor-swift-evermore-1105853/"
          },
          {
            name: "Taylor Swift's \"evermore\" Hidden Meanings - Teen Vogue",
            url: "https://www.teenvogue.com/story/taylor-swift-evermore-hidden-meanings"
          }
        ]
      },
    },
    {
      slug: 'tolerate-it',
      trackNumber: 5,
      trackTitle: 'tolerate it',
      youtubeId: 'ukxEKY_7MOc', // oEmbed-verified official Taylor Swift channel
      release: 'evermore',
      releaseDate: '2020-12-11',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Aaron Dessner'],
      note: 'Track 5, in 10/8 time — inspired by Daphne du Maurier’s Rebecca, a young wife performing devotion for a man who merely permits it.',
      summary:
        'She sets the table, learns his favorite everything, and watches it register as furniture: love received as tolerance. The Rebecca influence is widely noted — an age-gap marriage where worship goes unreturned.',
      inspiration:
        'Widely cited as inspired by Rebecca and the image of a wife whose lavish attention is merely endured — the track-5 slot did the rest.',
      themes: ['unreciprocated devotion', 'age-gap imbalance', 'quiet rebellion brewing'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Tolerate_It',
      sources: [wiki('Tolerate It', 'Tolerate_It', 'song article: Rebecca inspiration'), ALBUM],
      dossier: {
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
            note: 'Live debut inside a fixed five-song evermore act; staged at a stark candlelit dinner table set for two, Taylor performing to a seated dancer and climbing across the long table at the emotional peak. It stayed a fixed part of the set until the post-TTPD setlist overhaul removed it in mid-2024.',
          },
        ],
        voices: [
          {
            who: 'Aaron Dessner',
            context: 'on writing the piano part',
            note: 'Recalled composing tolerate it in 10/8 and hesitating to send Taylor something so rhythmically odd — before she wrote to it anyway.',
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
    },
    {
      slug: 'no-body-no-crime',
      trackNumber: 6,
      trackTitle: 'no body, no crime',
      youtubeId: 'IEPomqor2A8', // oEmbed-verified official Taylor Swift channel
      release: 'evermore',
      releaseDate: '2020-12-11',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      isSingle: true,
      note: 'The solo-written country-noir murder ballad with HAIM — Este gets killed off by name, her sisters get the harmonies, and the narrator gets away with it.',
      summary:
        'A whodunit where everyone did it: a cheating husband, a vanished friend named Este, and a narrator with an alibi and a boating license. Swift invented the whole crime, casting her real friends as the fictional victims.',
      inspiration:
        'An invented infidelity-murder plot written solo and recorded with the HAIM sisters, with the victim named for Este.',
      themes: ['murder ballad', 'infidelity and comeuppance', 'female solidarity, armed'],
      sourceUrl: 'https://en.wikipedia.org/wiki/No_Body%2C_No_Crime',
      sources: [
        wiki(
          'No Body, No Crime',
          'No_Body%2C_No_Crime',
          'song article: HAIM collaboration and fiction',
        ),
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "Evermore's country murder ballad, and Swift's first recorded collaboration with Haim. Teen Vogue reported, citing what Swift said in the YouTube chat before the 'willow' video premiere, that she wrote it entirely by herself, that it was inspired by her 'obsession with true crime podcasts/documentaries', and that she borrowed the name of her friend Este Haim for the main character. Este, Danielle and Alana Haim sing on the track.",
          "Vulture called it Swift's first-ever Haim collaboration and noted that Haim had opened for her in 2015, so the song grew out of a friendship that predates the album. The sisters joined her on stage to perform it live for the first time on the Eras Tour in 2023."
        ],
        meaning: {
          confirmed: [
            "Swift said she wrote the song entirely by herself, per Teen Vogue's account of her comments in the YouTube chat before the 'willow' video premiere.",
            "She said it was inspired by her love of true crime podcasts and documentaries, and that she used the name of one of her best friends, Este Haim, for the central character (same Teen Vogue report)."
          ],
          supported: [
            "Aaron Dessner told Rolling Stone that Swift wrote it alone on a rubber-bridge guitar he had given her, sent him a voice memo of it, and that he then built the track around that memo. He added that she wanted the Haim sisters to sing on it from the start; they recorded their parts in Los Angeles and the track was assembled when Swift was at Long Pond.",
            "Teen Vogue observed that the verses shift point of view, from the narrator suspecting someone else, to others suspecting her, to a third person suspecting the narrator.",
            "Vulture heard the song as an attempt at a classic revenge song drawing on Swift's country roots, and its headline verdict was that it tries to be cold-blooded but mostly comes off cold. That is a critic's verdict, not a statement of meaning."
          ]
        },
        live: [
          {
            date: "July 22, 2023",
            event: "The Eras Tour, Seattle",
            note: "NME reported that Swift and Haim gave the song its live debut during the evermore segment of the show; Haim were supporting on that leg of the tour."
          }
        ],
        connections: [
          {
            relatedId: "song:invisible-string",
            label: "invisible string",
            why: "Dessner told Rolling Stone she wrote this song on the same kind of rubber-bridge guitar he plays on 'invisible string'."
          },
          {
            relatedId: "song:the-last-great-american-dynasty",
            label: "the last great american dynasty",
            why: "Teen Vogue connected the shifting narrator in this song to the perspective-switching device Swift described to Entertainment Weekly in relation to 'the last great american dynasty'."
          }
        ],
        voices: [
          {
            who: "Taylor Swift",
            context: "In the YouTube chat before the 'willow' video premiere, as reported by Teen Vogue",
            note: "She named true crime podcasts and documentaries as the spark for the song."
          },
          {
            who: "Aaron Dessner",
            context: "Speaking to Rolling Stone in December 2020",
            note: "He said the music he has listened to most in his life is roots, folk and country, which is not the National's sound but 'feels like a warm blanket.'"
          }
        ],
        sources: [
          {
            name: "Taylor Swift's \"evermore\" Hidden Meanings - Teen Vogue",
            url: "https://www.teenvogue.com/story/taylor-swift-evermore-hidden-meanings"
          },
          {
            name: "Aaron Dessner on How His Collaborative Chemistry With Taylor Swift Led to 'Evermore' - Rolling Stone",
            url: "https://www.rollingstone.com/music/music-features/aaron-dessner-interview-taylor-swift-evermore-1105853/"
          },
          {
            name: "Watch Taylor Swift debut 'No Body No Crime' live with Haim in Seattle - NME",
            url: "https://www.nme.com/news/music/watch-taylor-swift-debut-no-body-no-crime-live-with-haim-in-seattle-3472129"
          },
          {
            name: "Taylor Swift's Long-Overdue Haim Collab Tries to Be Cold-Blooded But Is Mostly Just Cold - Vulture",
            url: "https://www.vulture.com/2020/12/song-review-taylor-swift-haim-no-body-no-crime-lyrics.html"
          }
        ]
      },
    },
    {
      slug: 'happiness',
      trackNumber: 7,
      trackTitle: 'happiness',
      youtubeId: 'tP4TTgt4nb0', // oEmbed-verified official Taylor Swift channel
      release: 'evermore',
      releaseDate: '2020-12-11',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Aaron Dessner'],
      note: 'Finished a week before release — a divorce song written from the exact middle of the grief, where both truths still hold.',
      summary:
        'There was happiness, and there will be happiness again — but right now she is standing between the two, refusing to rewrite seven years as villainy. The Gatsby green light drifts through it.',
      inspiration:
        'Recorded about a week before release, per Rolling Stone’s review; widely read as the rare breakup song written before the dust settles.',
      themes: ['divorce and dignity', 'both things being true', 'grief mid-stream'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Happiness_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Happiness (Taylor Swift song)',
          'Happiness_(Taylor_Swift_song)',
          'song article: late writing',
        ),
        ALBUM,
        RS_REVIEW,
      ],
      dossier: {
        whyItMatters: [
          "One of the last songs added to evermore. Dessner told Rolling Stone that Swift wrote it 'literally days before we were supposed to master', alongside the bonus track 'right where you left me', and compared it to what happened on folklore with 'the 1' and 'hoax'. She sang her vocal remotely.",
          "The music was Dessner's. He told Rolling Stone he had been working on it since the previous year, even sang a little on it, and thought of it as a Big Red Machine song until Swift loved the instrumental and wrote to it."
        ],
        meaning: {
          supported: [
            "Elle read the song's lyrics as a breakup song that draws on The Great Gatsby, pointing to the green light and the 'beautiful fool' lines, and noted it was not clear who or what inspired it. That is the outlet's reading; Swift has not confirmed the allusions in the sources cited here.",
            "Billboard's critic Jason Lipshutz heard it as capturing the post-split scramble of working out who you are now, inside one of the album's most ornate arrangements."
          ],
          fanTheories: [
            "Fans have linked the song to a specific real-life breakup. Swift has not named anyone in the sources cited here, and this guide does not either."
          ]
        },
        live: [
          {
            date: "July 2024",
            event: "The Eras Tour, Hamburg",
            note: "Rolling Stone reported that at the first of two Hamburg shows Swift played 'We Were Happy' and 'Happiness' live for the first time, as a mash-up, telling the crowd she had never played them live and to wish her luck."
          }
        ],
        connections: [
          {
            relatedId: "song:we-were-happy",
            label: "We Were Happy",
            why: "Rolling Stone reported the two songs were performed as a mash-up for their live debut."
          },
          {
            relatedId: "song:hoax",
            label: "hoax",
            why: "Dessner told Rolling Stone this song's late writing was similar to folklore's 'the 1' and 'hoax', which she also wrote days before the deadline."
          }
        ],
        voices: [
          {
            who: "Aaron Dessner",
            context: "Speaking to Rolling Stone, December 2020",
            note: "He said Swift often writes a lot of songs and then, at the very end, writes one or two more, and that they are often important ones."
          }
        ],
        sources: [
          {
            name: "Aaron Dessner on How His Collaborative Chemistry With Taylor Swift Led to 'Evermore' - Rolling Stone",
            url: "https://www.rollingstone.com/music/music-features/aaron-dessner-interview-taylor-swift-evermore-1105853/"
          },
          {
            name: "Taylor Swift's 'Happiness' Lyrics Turn The Great Gatsby Into a Poignant Breakup Song - Elle",
            url: "https://www.elle.com/culture/celebrities/a34944812/taylor-swift-happiness-lyrics-meaning-evermore/"
          },
          {
            name: "Every Song Ranked on Taylor Swift's 'Evermore' Deluxe Edition: Critic's Picks - Billboard",
            url: "https://www.billboard.com/music/pop/taylor-swift-evermore-songs-ranked-9498113/"
          },
          {
            name: "Watch Taylor Swift Mash-Up 'We Were Happy,' 'Happiness' Live in Hamburg - Rolling Stone",
            url: "https://www.rollingstone.com/music/music-news/taylor-swift-we-were-happy-happiness-live-debut-hamburg-1235066612/"
          }
        ]
      },
    },
    {
      slug: 'dorothea',
      trackNumber: 8,
      trackTitle: 'dorothea',
      youtubeId: 'zI4DS5GmQWE', // oEmbed-verified official Taylor Swift channel
      release: 'evermore',
      releaseDate: '2020-12-11',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Aaron Dessner'],
      note: 'The answer record to tis the damn season — the boy who stayed home, keeping a porch light on for the girl on the billboards.',
      summary:
        'A townie watches his high-school love become famous and promises, without bitterness, that the door stays open if the tinsel wears thin. The two Dorothea songs are widely read as one story.',
      inspiration:
        'A character link to tis the damn season, widely read as a shared story set in the same loose fictional-town universe as the folklore kids.',
      themes: ['the one who stayed', 'fame from the outside', 'unconditional welcome'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Dorothea_(song)',
      sources: [
        wiki('Dorothea (song)', 'Dorothea_(song)', 'song article: character universe'),
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "One of the two songs Swift wrote to instrumentals that Aaron Dessner had first thought were for Big Red Machine, his project with Justin Vernon (the other was 'closure'). Rolling Stone reported that Dessner came to hear both as continuations of folklore's characters and stories, and he told Billboard that 'dorothea' felt like it was 'reflecting on some character.'",
          "Swift's own description, quoted by Capital, is of 'the girl who left her small town to chase down Hollywood dreams' and what happens when she comes home for the holidays and rediscovers an old flame."
        ],
        meaning: {
          confirmed: [
            "Capital quotes Swift describing Dorothea as the girl who left her small town to chase Hollywood dreams, and what happens when she comes back for the holidays and rediscovers an old flame.",
            "In a YouTube Q&A reported by Capital, Swift said there is not a direct continuation of the Betty, James and August storyline, but that in her mind Dorothea went to the same school as Betty, James and Inez."
          ],
          supported: [
            "Capital reads the song as sung from the point of view of the old flame, and as tied to ''tis the damn season', which is sung from Dorothea's side. That is the outlet's reading of the pairing.",
            "Billboard's critic Jason Lipshutz heard it as Swift creating stakes by zooming in on passed-down narratives and singing from new perspectives, with the drama mattering more than the characters' backstories."
          ],
          fanTheories: [
            "From the day the album came out, fans have theorized that Dorothea is based on a real person. Capital listed several such theories; Swift's own account, above, describes a fictional character, and this guide does not name anyone."
          ]
        },
        live: [
          {
            date: "July 8, 2023",
            event: "The Eras Tour, Kansas City",
            note: "Deadline's list of Eras Tour surprise songs gives 'Last Kiss' and 'Dorothea' as the pair for this night."
          }
        ],
        connections: [
          {
            relatedId: "song:tis-the-damn-season",
            label: "'tis the damn season",
            why: "Capital read this song and 'dorothea' as the two sides of the same homecoming."
          },
          {
            relatedId: "song:closure",
            label: "closure",
            why: "Dessner told Rolling Stone and Billboard that Swift wrote this song and 'closure' to his Big Red Machine-era instrumentals."
          },
          {
            relatedId: "song:betty",
            label: "betty",
            why: "Swift said in a YouTube Q&A, as reported by Capital, that in her mind Dorothea went to the same school as Betty."
          }
        ],
        voices: [
          {
            who: "Taylor Swift",
            context: "Quoted by Capital on December 11, 2020",
            note: "She framed Dorothea as a girl from a small town chasing Hollywood dreams who returns home for the holidays."
          },
          {
            who: "Aaron Dessner",
            context: "Speaking to Billboard, December 2020",
            note: "He said 'closure' and 'dorothea' were the two early songs he and Swift both thought were for Big Red Machine, before they felt like Taylor songs."
          }
        ],
        sources: [
          {
            name: "Who is Dorothea on Taylor Swift's Evermore? All the theories explained - Capital",
            url: "https://www.capitalfm.com/artists/taylor-swift/who-is-dorothea-evermore-meaning-lyrics/"
          },
          {
            name: "Aaron Dessner on the 'Weird Avalanche' That Resulted in Taylor Swift's 'Evermore' - Billboard",
            url: "https://www.billboard.com/music/pop/aaron-dessner-taylor-swift-evermore-interview-9502756/"
          },
          {
            name: "Aaron Dessner on How His Collaborative Chemistry With Taylor Swift Led to 'Evermore' - Rolling Stone",
            url: "https://www.rollingstone.com/music/music-features/aaron-dessner-interview-taylor-swift-evermore-1105853/"
          },
          {
            name: "Every Song Ranked on Taylor Swift's 'Evermore' Deluxe Edition: Critic's Picks - Billboard",
            url: "https://www.billboard.com/music/pop/taylor-swift-evermore-songs-ranked-9498113/"
          },
          {
            name: "All The Surprise Songs Taylor Swift Played On Her Eras Tour - Deadline",
            url: "https://deadline.com/feature/taylor-swift-surprise-songs-eras-tour-1235928594/"
          }
        ]
      },
    },
    {
      slug: 'coney-island',
      trackNumber: 9,
      trackTitle: 'coney island',
      youtubeId: 'c_p_TBaHvos', // oEmbed-verified official Taylor Swift channel
      release: 'evermore',
      releaseDate: '2020-12-11',
      writers: ['Taylor Swift', 'William Bowery', 'Aaron Dessner', 'Bryce Dessner'],
      producers: ['Aaron Dessner', 'Bryce Dessner'],
      isSingle: true,
      note: 'The duet with The National — two exes on a boardwalk bench, auditing every anniversary they missed while the Ferris wheel turns.',
      summary:
        'Mutual neglect as a slow leak: both parties inventory the birthdays forgotten and the doors not held, wondering when the main character became understudy. Matt Berninger’s baritone is the other half of the fault.',
      inspiration:
        'A four-way write with Alwyn (as Bowery) and both Dessner brothers, sung with Berninger — evermore’s fullest merger with The National’s universe.',
      themes: ['mutual neglect', 'apology in stereo', 'faded grandeur'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Coney_Island_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Coney Island (Taylor Swift song)',
          'Coney_Island_(Taylor_Swift_song)',
          'song article: National collaboration',
        ),
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "Evermore's duet with The National. Dessner told Rolling Stone he was not thinking of the music as a National song while writing it, but once Swift and a co-writer credited as William Bowery had written the words, he and others felt it was the song 'most related to the National'; it almost felt like a story Matt Berninger might tell. He called Berninger, and the band recorded it.",
          "Bryan Devendorf plays drums, Scott Devendorf plays bass and a pocket piano, and Bryce Dessner helped produce, per Dessner's account to Rolling Stone. Billboard's critic heard the duet as a meeting point of Swift's and the band's approaches, resting on gentle recollections rather than the escalating drama of folklore's 'exile'."
        ],
        meaning: {
          supported: [
            "Dessner told Rolling Stone the track was first recorded with just Swift's vocals over music that was everything but the drums, and that the song has a beautiful arc to its story and is one of the strongest on the record, lyrically and musically.",
            "Teen Vogue pointed to lyric echoes: the word 'delicate' links it to the reputation track of that name, and its colors, blue and gold, match imagery Swift has used elsewhere. That is the outlet's reading of the connections, not something Swift has said."
          ]
        },
        live: [
          {
            date: "April 28, 2023",
            event: "The Eras Tour, Atlanta",
            note: "Deadline's list of Eras Tour surprise songs gives 'The Other Side of the Door' and 'Coney Island' as the pair for this night."
          }
        ],
        connections: [
          {
            relatedId: "song:delicate",
            label: "Delicate",
            why: "Teen Vogue noted the shared word 'delicate' as a more obvious tie to another Swift song."
          },
          {
            relatedId: "song:exile",
            label: "exile",
            why: "Billboard contrasted this duet with the folklore duet with Bon Iver, which it said was founded on escalated drama."
          }
        ],
        voices: [
          {
            who: "Aaron Dessner",
            context: "Speaking to Rolling Stone, December 2020",
            note: "He said it was nice to reconnect with his band, since they had not played a show in a year, and that he loves how Berninger and Swift sound together."
          }
        ],
        sources: [
          {
            name: "Aaron Dessner on How His Collaborative Chemistry With Taylor Swift Led to 'Evermore' - Rolling Stone",
            url: "https://www.rollingstone.com/music/music-features/aaron-dessner-interview-taylor-swift-evermore-1105853/"
          },
          {
            name: "Every Song Ranked on Taylor Swift's 'Evermore' Deluxe Edition: Critic's Picks - Billboard",
            url: "https://www.billboard.com/music/pop/taylor-swift-evermore-songs-ranked-9498113/"
          },
          {
            name: "Taylor Swift's \"evermore\" Hidden Meanings - Teen Vogue",
            url: "https://www.teenvogue.com/story/taylor-swift-evermore-hidden-meanings"
          },
          {
            name: "All The Surprise Songs Taylor Swift Played On Her Eras Tour - Deadline",
            url: "https://deadline.com/feature/taylor-swift-surprise-songs-eras-tour-1235928594/"
          }
        ]
      },
    },
    {
      slug: 'ivy',
      trackNumber: 10,
      trackTitle: 'ivy',
      youtubeId: '9nIOx-ezlzA', // oEmbed-verified official Taylor Swift channel
      release: 'evermore',
      releaseDate: '2020-12-11',
      writers: ['Taylor Swift', 'Aaron Dessner', 'Jack Antonoff'],
      producers: ['Aaron Dessner'],
      note: 'A married woman’s affair told in garden metaphors — the fandom’s favorite evermore deep cut and a cottagecore national anthem.',
      summary:
        'Someone else’s vines have grown all over a house that legally belongs to another man: forbidden love in a period drama’s clothes, doom accepted cheerfully in the bridge.',
      inspiration:
        'Fans connect its imagery to Emily Dickinson (evermore was announced on Dickinson’s birthday) — an unconfirmed but beloved reading; the affair plot itself is Swift-invented fiction.',
      themes: ['forbidden love', 'nature as desire', 'accepting ruin'],
      fanLore:
        'Fan reading (unconfirmed): the Dickinson wink, boosted by the announcement date and the show Dickinson using the song.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Evermore',
      sources: [ALBUM],
      dossier: {
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
            note: 'Live debut as an acoustic surprise song, performed with Aaron Dessner on guitar in his home city — one of three surprise songs Taylor played that night.',
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
    },
    {
      slug: 'cowboy-like-me',
      trackNumber: 11,
      trackTitle: 'cowboy like me',
      youtubeId: 'YPlNBb6I8qU', // oEmbed-verified official Taylor Swift channel
      release: 'evermore',
      releaseDate: '2020-12-11',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Aaron Dessner'],
      note: 'Two con artists fall inconveniently in love at a country club — with Marcus Mumford’s backing vocals drifting through the tent.',
      summary:
        'Grifters who hustle rich marks recognize each other instantly and break the only rule: never feel anything. Love as the one long con neither of them planned.',
      inspiration:
        'Marcus Mumford sings a credited harmony vocal; the swindler romance is pure evermore fiction.',
      themes: ['con-artist romance', 'kindred spirits', 'love as the real gamble'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Cowboy_like_Me',
      sources: [wiki('Cowboy like Me', 'Cowboy_like_Me', 'song article: Mumford credit'), ALBUM],
      dossier: {
        whyItMatters: [
          "A Swift and Aaron Dessner song with guest musicians. Dessner told Rolling Stone that Justin Vernon plays drums on it, and Billboard's critics note Marcus Mumford is credited with vocals. Variety's review also credits Mumford with a harmony vocal and some lap steel.",
          "Dessner told Rolling Stone it is 'much more familiar, musically', a country-leaning track, while saying Swift was 'just as sharp and just as masterful in her craft' there as on 'closure'."
        ],
        meaning: {
          supported: [
            "Billboard's critics heard a song that finds Swift circling thoughts of love, independence and commitment in the context of another person with a similar mindset, in a mix of folk, sun-kissed alternative and a whiff of country. They ranked it No. 9 on the deluxe edition.",
            "Variety's review described its story of male and female grifters meeting, and maybe falling in love, as 'more determinedly Western than C&W.' That is the outlet's reading of the lyric; Swift has not commented on it in the sources cited here."
          ]
        },
        live: [
          {
            date: "March 25, 2023",
            event: "The Eras Tour, Las Vegas",
            note: "Swift brought out Marcus Mumford to sing it with her as a surprise song. Billboard quotes her asking, 'Would you sing 'Cowboy Like Me' with me?'"
          },
          {
            date: "November 2, 2024",
            event: "The Eras Tour, Indianapolis",
            note: "Deadline's and Variety's lists give a mash-up of 'Maroon' and 'Cowboy Like Me' as one of the night's surprise slots."
          }
        ],
        connections: [
          {
            relatedId: "song:closure",
            label: "closure",
            why: "Dessner told Rolling Stone that Vernon plays drums on both songs, and used the pair to illustrate how Swift tells stories equally well in an experimental song and in a country-leaning one."
          }
        ],
        voices: [
          {
            who: "Aaron Dessner",
            context: "Speaking to Rolling Stone, December 2020",
            note: "He said Vernon played drums on the track and that Swift's craft was just as sharp here as on 'closure'."
          }
        ],
        sources: [
          {
            name: "Aaron Dessner on How His Collaborative Chemistry With Taylor Swift Led to 'Evermore' - Rolling Stone",
            url: "https://www.rollingstone.com/music/music-features/aaron-dessner-interview-taylor-swift-evermore-1105853/"
          },
          {
            name: "Every Song Ranked on Taylor Swift's 'Evermore' Deluxe Edition: Critic's Picks - Billboard",
            url: "https://www.billboard.com/music/pop/taylor-swift-evermore-songs-ranked-9498113/"
          },
          {
            name: "Taylor Swift Has Her Second Great Album of 2020 With 'Evermore': Album Review - Variety",
            url: "https://variety.com/2020/music/reviews/taylor-swift-evermore-album-review-1234851525/"
          },
          {
            name: "All the Surprise Songs Taylor Swift Performed on The Eras Tour - Billboard",
            url: "https://www.billboard.com/lists/taylor-swift-eras-tour-surprise-songs/"
          },
          {
            name: "All The Surprise Songs Taylor Swift Played On Her Eras Tour - Deadline",
            url: "https://deadline.com/feature/taylor-swift-surprise-songs-eras-tour-1235928594/"
          },
          {
            name: "Taylor Swift's Eras Tour: Every Surprise Song She's Played - Variety",
            url: "https://variety.com/2024/music/news/taylor-swift-eras-tour-surprise-songs-list-1235578714/"
          }
        ]
      },
    },
    {
      slug: 'long-story-short',
      trackNumber: 12,
      trackTitle: 'long story short',
      youtubeId: 'rqQHa2HcGtM', // oEmbed-verified official Taylor Swift channel
      release: 'evermore',
      releaseDate: '2020-12-11',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Aaron Dessner'],
      note: 'A fast-forward, past-tense montage of a hard stretch that ends happily.',
      summary:
        'The pile-on years summarized at fast-forward: wrong fights, bad ground, a fall from the pedestal — survived, traded for a better present, and dispatched with a shrug and advice to her past self.',
      inspiration:
        'Variety read it as revisiting the Reputation-era backlash; Swift hasn\'t explained it on record.',
      themes: ['surviving the pile-on', 'hindsight', 'peace as the punchline'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Long_Story_Short_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Long Story Short (Taylor Swift song)',
          'Long_Story_Short_(Taylor_Swift_song)',
          'song article: autobiographical framing',
        ),
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "Billboard's critics put it at No. 1 in their ranking of the evermore deluxe edition, writing that it 'crystallizes one of Swift's greatest strengths as a songwriter: creating music that is deceptively simple but is bursting with layers and moving pieces.'",
          "Variety's review called it the song that most outrightly revives the narrative of Reputation and Lover, a rough public stretch followed by a better one, and noted a 'major note-to-younger-self' in its bridge."
        ],
        meaning: {
          supported: [
            "Billboard's critics heard the song as framing Swift's personal redemption as the reason she has been able to open her heart to another person, over dense but uncrowded indie-rock instrumentation.",
            "Variety's review heard advice to her past self that her enemies will undo themselves before she has to swing. Swift has not given her own account of the song in the sources cited here, so these are critics' readings."
          ]
        },
        live: [
          {
            date: "March 2, 2024",
            event: "The Eras Tour, Singapore",
            note: "Deadline's and Variety's lists give a mash-up of 'long story short' and 'The Story of Us' as a surprise-song slot."
          },
          {
            date: "June 2, 2024",
            event: "The Eras Tour, Lyon",
            note: "Deadline's and Variety's lists give a mash-up of 'The Prophecy' and 'long story short'."
          },
          {
            date: "November 16, 2024",
            event: "The Eras Tour, Toronto",
            note: "Deadline's and Variety's lists give a mash-up of 'You're On Your Own, Kid' and 'long story short'."
          }
        ],
        connections: [
          {
            relatedId: "song:the-prophecy",
            label: "The Prophecy",
            why: "The two songs were mashed up in Lyon on June 2, 2024, per Deadline's and Variety's lists."
          },
          {
            relatedId: "song:youre-on-your-own-kid",
            label: "You're On Your Own, Kid",
            why: "The two songs were mashed up in Toronto on November 16, 2024, per Deadline's and Variety's lists."
          }
        ],
        sources: [
          {
            name: "Every Song Ranked on Taylor Swift's 'Evermore' Deluxe Edition: Critic's Picks - Billboard",
            url: "https://www.billboard.com/music/pop/taylor-swift-evermore-songs-ranked-9498113/"
          },
          {
            name: "Taylor Swift Has Her Second Great Album of 2020 With 'Evermore': Album Review - Variety",
            url: "https://variety.com/2020/music/reviews/taylor-swift-evermore-album-review-1234851525/"
          },
          {
            name: "All The Surprise Songs Taylor Swift Played On Her Eras Tour - Deadline",
            url: "https://deadline.com/feature/taylor-swift-surprise-songs-eras-tour-1235928594/"
          },
          {
            name: "Taylor Swift's Eras Tour: Every Surprise Song She's Played - Variety",
            url: "https://variety.com/2024/music/news/taylor-swift-eras-tour-surprise-songs-list-1235578714/"
          }
        ]
      },
    },
    {
      slug: 'marjorie',
      trackNumber: 13,
      trackTitle: 'marjorie',
      youtubeId: 'hP6QpMeSG6s', // oEmbed-verified official Taylor Swift channel
      release: 'evermore',
      releaseDate: '2020-12-11',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Aaron Dessner'],
      note: 'Track 13 for her grandmother Marjorie Finlay, the opera singer — whose actual archival voice sings backup from beyond.',
      summary:
        'Grief braided with inherited advice: be polite but keep a knife, be cleverer than clever. The regret of not saving more of someone, answered by literally sampling the recordings that survived.',
      inspiration:
        'Per Rolling Stone’s review, a portrait of her grandmother Marjorie Finlay, an opera singer; Finlay’s archival vocals are credited on the track, the era’s most tender production choice.',
      themes: ['grief for a grandparent', 'inheritance of spirit', 'what survives us'],
      easterEggs:
        'The pairing with epiphany gives each grandparent a song — grandfather at 13 on folklore’s tracklist mirror, grandmother at 13 here.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Marjorie_(song)',
      sources: [
        wiki('Marjorie (song)', 'Marjorie_(song)', 'song article: Finlay tribute and vocal credit'),
        ALBUM,
        RS_REVIEW,
      ],
      dossier: {
        whyItMatters: [
          "The most direct tribute in the catalog: a song about Swift's maternal grandmother, Marjorie Finlay, an opera singer whose career, The Independent reports, inspired Swift to pursue music herself. Finlay's own recorded soprano is on the track. Per its Wikipedia entry, critics including Rolling Stone's Rob Sheffield and Teen Vogue's P. Claire Dodson ranked it among her finest writing.",
          "On the Eras Tour it became a ritual. At the Atlanta show on April 29, 2023, Billboard reported, tens of thousands of fans sang along with phone lights glimmering, and Swift, at her evermore-era piano, said 'my knees went weak.'"
        ],
        meaning: {
          confirmed: [
            "Track 13 of evermore (December 11, 2020), written by Swift and Aaron Dessner, who produced it.",
            "Announcing the album, Swift said one song stars 'my grandmother, Marjorie, who still visits me sometimes... if only in my dreams,' as Rolling Stone and Capital reported.",
            "Swift said her mom found old records of Finlay singing opera: 'I sent them to Aaron and he added them to the song,' as quoted by Capital. Rolling Stone reported that a lyric video released alongside the song uses vintage footage and photos of Finlay, boarding a plane in a sixties dress, walking along ancient ruins, and playing piano with Swift as a toddler, and noted Justin Vernon harmonizing at the end.",
            "The Independent reports that Finlay died on June 1, 2003, in Swift's hometown of Reading, Pennsylvania."
          ],
          supported: [
            "Capital describes the song as addressing a late grandmother, referencing sweet times they shared and regretting not finding out more about her life, a regret that the line about wishing she had asked her questions states directly.",
            "Per Wikipedia, the verses read like chants of Finlay's advice, including a line about being kind but clever, while the refrain insists on her presence after death. The drone in its bridge is the one sampled in 'peace' on folklore."
          ],
          fanTheories: [
            "Fans like to note that Swift considers 13 her lucky number, that this is the 13th track on evermore, and that the matching 13th track on folklore, 'epiphany', honors her grandfather. Songfacts raises the pattern, but it's an observation about her habits, not something she has said about this song."
          ]
        },
        live: [
          {
            date: "April 29, 2023",
            event: "The Eras Tour, Atlanta",
            note: "Billboard reported tens of thousands of voices singing with Swift, with their phone lights glimmering, over Finlay's recorded vocals; the flashlight tribute continued at later shows, per Wikipedia."
          },
          {
            date: "2023-2024",
            event: "The Eras Tour",
            note: "Variety's Chris Willman and Teen Vogue's P. Claire Dodson both picked it among the show's best moments, per Wikipedia."
          }
        ],
        connections: [
          {
            relatedId: "song:peace",
            label: "peace",
            why: "'Marjorie' came first: the drone from its bridge became the sample underneath folklore's 'peace', per the song's Wikipedia article."
          },
          {
            relatedId: "song:epiphany",
            label: "epiphany",
            why: "The 13th track of folklore honors Swift's grandfather, while 'Marjorie' is the 13th track of evermore and honors her grandmother, as Songfacts points out."
          }
        ],
        voices: [
          {
            who: "Taylor Swift",
            context: "Announcing evermore, December 2020",
            note: "She said the album includes a song starring her grandmother, Marjorie, 'who still visits me sometimes... if only in my dreams.'"
          },
          {
            who: "Taylor Swift",
            context: "Interview, as quoted by Capital",
            note: "'My mom found a bunch of her old records, of her singing opera, and I sent them to Aaron and he added them to the song.'"
          }
        ],
        sources: [
          {
            name: "Taylor Swift Honors Her Grandmother With Heart-Wrenching Lyric Video for 'Marjorie' - Rolling Stone",
            url: "https://www.rollingstone.com/music/music-news/taylor-swift-honors-her-grandmother-with-heart-wrenching-lyric-video-for-marjorie-1102391/"
          },
          {
            name: "Taylor Swift Features Grandmother's Opera Singing Vocals On Evermore Track 'Marjorie' - Capital",
            url: "https://www.capitalfm.com/features/taylor-swift-grandmother-marjorie-opera-singer-evermore-vocals/"
          },
          {
            name: "Taylor Swift song 'Marjorie' is a tribute to her late grandmother - The Independent",
            url: "https://www.the-independent.com/arts-entertainment/music/news/taylor-swift-marjorie-who-grandmother-b1769792.html"
          },
          {
            name: "13 Best Moments From Taylor Swift's April 29 Atlanta 'Eras' Concert - Billboard",
            url: "https://www.billboard.com/lists/taylor-swift-eras-tour-atlanta-april-29-best-moments/a-heavenly-marjorie-experience/"
          },
          {
            name: "Marjorie (song) - Wikipedia",
            url: "https://en.wikipedia.org/wiki/Marjorie_(song)"
          },
          {
            name: "Marjorie by Taylor Swift - Songfacts",
            url: "https://www.songfacts.com/facts/taylor-swift/marjorie"
          }
        ]
      },
    },
    {
      slug: 'closure',
      trackNumber: 14,
      trackTitle: 'closure',
      youtubeId: 'AIFnKqIeEdY', // oEmbed-verified official Taylor Swift channel
      release: 'evermore',
      releaseDate: '2020-12-11',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Aaron Dessner', 'BJ Burton'],
      note: 'The 5/4 industrial-folk oddity — a reply to a smug it’s-all-good letter from someone who wants absolution more than amends.',
      summary:
        'An old adversary offers tidy closure and she declines the paperwork: her peace does not require his ceremony. The clattering time signature makes the discomfort audible.',
      inspiration: null,
      themes: ['refusing cheap absolution', 'boundaries', 'discordant peace'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Evermore',
      sources: [ALBUM],
      dossier: {
        whyItMatters: [
          "The other song Swift wrote to Dessner's Big Red Machine-era instrumentals (the first was 'dorothea'). Rolling Stone describes it as an experimental electronic track in 5/4 time over a staccato drum kit; Dessner told Billboard that although it is very experimental and in an odd time signature, lyrically it felt like an evolution of folklore.",
          "Rolling Stone noted that parts of Swift's vocal are filtered through the Messina, a vocal modifier Justin Vernon uses a lot in his Bon Iver work. Dessner said he made one trip to see Vernon, that they worked together at Vernon's place, and that they processed her vocals through Vernon's Messina chain together. Vernon also plays drums on the track."
        ],
        meaning: {
          supported: [
            "Billboard's critic Jason Lipshutz heard the song as Swift rejecting the false niceties of someone who reaches back out to absolve themselves, over a skittering arrangement that recalls mid-period Radiohead, and called it one of the album's most daring highlights. That is a critic's reading.",
            "Dessner told Rolling Stone that he was impressed Swift could tell stories as easily in a track like 'closure' as in a country song like 'cowboy like me', and that her craft was as sharp in both."
          ],
          fanTheories: [
            "Fans have attached the song to real-life figures from Swift's public history. Swift has not named anyone in the sources cited here, and this guide does not either."
          ]
        },
        connections: [
          {
            relatedId: "song:dorothea",
            label: "dorothea",
            why: "Dessner told Rolling Stone and Billboard that these were the two songs written to his Big Red Machine-era instrumentals."
          },
          {
            relatedId: "song:cowboy-like-me",
            label: "cowboy like me",
            why: "Dessner told Rolling Stone that Justin Vernon plays drums on both songs."
          }
        ],
        voices: [
          {
            who: "Aaron Dessner",
            context: "Speaking to Rolling Stone, December 2020",
            note: "He said he went to see Justin Vernon once, the one trip he made, and that they worked on the vocal processing at Vernon's place."
          }
        ],
        sources: [
          {
            name: "Aaron Dessner on How His Collaborative Chemistry With Taylor Swift Led to 'Evermore' - Rolling Stone",
            url: "https://www.rollingstone.com/music/music-features/aaron-dessner-interview-taylor-swift-evermore-1105853/"
          },
          {
            name: "Aaron Dessner on the 'Weird Avalanche' That Resulted in Taylor Swift's 'Evermore' - Billboard",
            url: "https://www.billboard.com/music/pop/aaron-dessner-taylor-swift-evermore-interview-9502756/"
          },
          {
            name: "Every Song Ranked on Taylor Swift's 'Evermore' Deluxe Edition: Critic's Picks - Billboard",
            url: "https://www.billboard.com/music/pop/taylor-swift-evermore-songs-ranked-9498113/"
          }
        ]
      },
    },
    {
      slug: 'evermore',
      trackNumber: 15,
      trackTitle: 'evermore',
      youtubeId: 'EXLgZZE072g', // oEmbed-verified official Taylor Swift channel
      release: 'evermore',
      releaseDate: '2020-12-11',
      writers: ['Taylor Swift', 'William Bowery', 'Justin Vernon'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      note: 'The title-track closer with Bon Iver — depression’s floor found, then a change of tempo and the first sighting of the way out.',
      summary:
        'A November spent rereading old letters and assuming the pain is permanent; Vernon’s frantic bridge is the storm, and the final verses are the quiet discovery that it was not permanent after all.',
      inspiration:
        'Co-written with Alwyn (piano, as Bowery) and Vernon; Swift has described its arc — pain that finally is not forever — as the deliberate closing statement of the sister albums.',
      themes: ['depression and its lifting', 'winter to thaw', 'endurance'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Evermore',
      sources: [ALBUM],
      dossier: {
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
            note: 'Performed as a surprise song, solo at the piano — Taylor covered Vernon’s bridge herself — paired that night with an acoustic "I’m Only Me When I’m With You." No documented live performance of the duet with Bon Iver exists.',
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
    },
    {
      slug: 'right-where-you-left-me',
      trackNumber: 16,
      trackTitle: 'right where you left me',
      youtubeId: 'Ur_wAcYDnuA', // oEmbed-verified official Taylor Swift channel
      release: 'evermore (deluxe edition)',
      releaseDate: '2021-01-07',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Aaron Dessner'],
      note: 'Bonus track one: the girl who never left the restaurant where her life ended — time moves for everyone but her table.',
      summary:
        'A breakup so total she fossilizes at the scene: friends marry, seasons change, and she stays 23 at a corner table with dust in her hair. Small-town gossip as Greek chorus.',
      inspiration: null,
      themes: ['arrested grief', 'frozen in time', 'the town watches'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Evermore',
      sources: [ALBUM],
      dossier: {
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
            note: 'Live debut as the guitar surprise song, performed with Aaron Dessner on guitar; Taylor restarted after flubbing a line, joking it is one of her wordiest songs. "Castles Crumbling" was the piano debut the same night.',
          },
        ],
        sources: [
          { name: 'Songfacts: right where you left me', url: 'https://www.songfacts.com/facts/taylor-swift/right-where-you-left-me' },
          { name: 'Rolling Stone: Taylor Swift’s songs ranked (Sheffield) — right where you left me', url: 'https://www.rollingstone.com/music/music-lists/taylor-swift-songs-ranked-rob-sheffield-201800/right-where-you-left-me-2021-1245547/' },
          { name: 'Consequence: evermore deluxe bonus tracks arrive', url: 'https://consequence.net/2021/01/stream-taylor-swift-evermore-deluxe-edition-bonus-tracks/' },
          { name: 'Billboard: right where you left me Eras debut with Aaron Dessner', url: 'https://www.billboard.com/music/music-news/taylor-swift-right-where-you-left-me-debut-aaron-dessner-santa-clara-1235381549/' },
        ],
      },
    },
    {
      slug: 'its-time-to-go',
      trackNumber: 17,
      trackTitle: "it's time to go",
      youtubeId: '1iRbIYkccgw', // oEmbed-verified official Taylor Swift channel
      release: 'evermore (deluxe edition)',
      releaseDate: '2021-01-07',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Aaron Dessner'],
      note: 'Bonus track two and the deluxe edition’s thesis: knowing when leaving is the brave option — with a verse fans read as the masters saga in miniature.',
      summary:
        'Three case studies in walking away — a dead friendship, a hollow marriage, and a job where something she made was handed to someone else. That last verse maps so cleanly onto the Big Machine exit that fans treat it as autobiography.',
      inspiration:
        'The trusting-your-gut-to-leave thesis is the song’s own text; the record-label verse is the widely held fan reading of the 2018–2019 masters events (not officially footnoted).',
      themes: ['knowing when to leave', 'self-trust', 'starting over as winning'],
      fanLore:
        'Fan reading (widely held): verse three as the departure from Big Machine and the fight for her catalog.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Evermore',
      sources: [ALBUM],
    },
];

export default {
  eraSlug: 'evermore',
  tracks: TRACKS,
};

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
        'Confirmed fiction: Swift described the couple’s backstory as invented; Alwyn co-wrote under the Bowery pseudonym.',
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
        'Dessner has recounted Swift writing it overnight at Long Pond after a dinner gathering; Swift confirmed the Dorothea character connects both songs.',
      themes: ['hometown nostalgia', 'temporary love', 'choices and Decembers'],
      sourceUrl: "https://en.wikipedia.org/wiki/'Tis_the_Damn_Season",
      sources: [
        wiki(
          "'Tis the Damn Season",
          "'Tis_the_Damn_Season",
          'song article: overnight writing and character link',
        ),
        ALBUM,
      ],
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
        'She sets the table, learns his favorite everything, and watches it register as furniture: love received as tolerance. The Rebecca influence is confirmed — an age-gap marriage where worship goes unreturned.',
      inspiration:
        'Confirmed: Swift cited reading Rebecca and imagining a wife whose lavish attention is merely endured — the track-5 slot did the rest.',
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
        'Confirmed fiction with confirmed casting: written solo about an invented infidelity-murder plot, recorded with the HAIM sisters after Swift decided the story belonged to Este.',
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
        'Confirmed as the album’s last-written song (days before release); Swift framed it as the rare breakup song written before the dust settles.',
      themes: ['divorce and dignity', 'both things being true', 'grief mid-stream'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Happiness_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Happiness (Taylor Swift song)',
          'Happiness_(Taylor_Swift_song)',
          'song article: late writing',
        ),
        ALBUM,
      ],
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
        'A townie watches his high-school love become famous and promises, without bitterness, that the door stays open if the tinsel wears thin. Swift confirmed the two Dorothea songs share one story.',
      inspiration:
        'Confirmed character link to tis the damn season; Swift has said Dorothea exists in the same loose fictional town universe as the folklore kids.',
      themes: ['the one who stayed', 'fame from the outside', 'unconditional welcome'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Dorothea_(song)',
      sources: [
        wiki('Dorothea (song)', 'Dorothea_(song)', 'song article: character universe'),
        ALBUM,
      ],
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
        'Mumford’s confirmed backing-vocal cameo came via lockdown-era file-sharing; the swindler romance is pure evermore fiction.',
      themes: ['con-artist romance', 'kindred spirits', 'love as the real gamble'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Cowboy_like_Me',
      sources: [wiki('Cowboy like Me', 'Cowboy_like_Me', 'song article: Mumford credit'), ALBUM],
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
      note: 'The one openly autobiographical sprint on evermore — 2016 compressed into a past-tense montage that ends happily.',
      summary:
        'The pile-on years summarized at fast-forward: wrong fights, bad ground, a fall from the pedestal — survived, married off to a better present, and dispatched with a shrug and advice to her past self.',
      inspiration:
        'Swift confirmed it condenses her 2016 nadir and its aftermath — the rare evermore track she filed under her own name rather than a character’s.',
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
        'Confirmed: about Marjorie Finlay, Swift’s opera-singer grandmother; Finlay’s archival vocals are credited on the track, the era’s most tender production choice.',
      themes: ['grief for a grandparent', 'inheritance of spirit', 'what survives us'],
      easterEggs:
        'The pairing with epiphany gives each grandparent a song — grandfather at 13 on folklore’s tracklist mirror, grandmother at 13 here.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Marjorie_(song)',
      sources: [
        wiki('Marjorie (song)', 'Marjorie_(song)', 'song article: Finlay tribute and vocal credit'),
        ALBUM,
      ],
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

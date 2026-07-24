// Vault track guide — 1989 era (1989 2014 / Taylor's Version 2023, including
// From The Vault). Original prose only — never lyrics; unconfirmed readings
// are labeled. Provenance per docs/content/content-audit-2026-07-08.md §5
// (URLs verified 2026-07-08).
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
  '1989 (album)',
  '1989_(album)',
  'album article: release facts, credits, and cited interviews',
);
const TV = wiki(
  "1989 (Taylor's Version)",
  "1989_(Taylor's_Version)",
  're-recording article: vault-track credits and release facts',
);

export default {
  eraSlug: '1989',
  tracks: [
    {
      slug: 'welcome-to-new-york',
      trackNumber: 1,
      trackTitle: 'Welcome to New York',
      youtubeId: 'FsGdznlfE2U', // oEmbed-verified official Taylor Swift channel
      release: '1989',
      releaseDate: '2014-10-27',
      writers: ['Taylor Swift', 'Ryan Tedder'],
      producers: ['Taylor Swift', 'Ryan Tedder', 'Noel Zancanella'],
      isSingle: true,
      note: 'The synth-doors-flung-open opener about her 2014 move to Manhattan — proceeds went to NYC public schools after the city made her a (much-debated) tourism ambassador.',
      summary:
        'Arrival as rebirth: a new city where nobody knows the old narrative and everyone came to reinvent themselves — the sound of the country exit finalized.',
      inspiration:
        'Confirmed autobiography: written about relocating to New York City, whose energy she credited as the album’s starting gun; she donated its sales to NYC public schools.',
      themes: ['reinvention', 'city as fresh start', 'optimism'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Welcome_to_New_York_(song)',
      sources: [
        wiki(
          'Welcome to New York (song)',
          'Welcome_to_New_York_(song)',
          'song article: NYC context and donation',
        ),
        ALBUM,
        {
          source_url: 'https://abcnews.go.com/Entertainment/taylor-swift-donate-york-proceeds-nyc-public-schools/story?id=26545696',
          source_title: "Taylor Swift to Donate 'Welcome to New York' Proceeds to NYC Public Schools",
          publisher: 'ABC News',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: "'Global Welcome Ambassador' title; the October 29, 2014 proceeds pledge on The View",
        },
        {
          source_url: 'https://www.forbes.com/sites/ellenkilloran/2015/02/24/taylor-swift-donates-50000-of-welcome-to-new-york-proceeds-to-nyc-schools/',
          source_title: "Taylor Swift Donates $50,000 Of 'Welcome To New York' Proceeds To NYC Schools",
          publisher: 'Forbes',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'the $50,000 gift to the NYC Department of Education, confirmed via a public-records request',
        },
      ],
      dossier: {
        whyItMatters: [
          "The synth-doors-flung-open opener of 1989 and one of its most-debated tracks. Issued for download via iTunes on October 20, 2014 — a week ahead of the album — it reached No. 48 on the Billboard Hot 100 as a promotional single and is RIAA-certified platinum. Swift donated its proceeds to the New York City Department of Education, after NYC & Company named her the city's 'Global Welcome Ambassador' in October 2014.",
          "That ambassador title is the source of the song's lasting controversy — and the 'boys and boys and girls and girls' line made it, for many listeners, an early marker of LGBTQ+ visibility in her catalog. 'Welcome to New York (Taylor's Version)' arrived on 1989 (Taylor's Version) on October 27, 2023.",
        ],
        meaning: {
          confirmed: [
            "Written by Swift with Ryan Tedder and produced by Swift, Tedder and Noel Zancanella. Swift recruited Tedder for 1989 and first reached him with a Voice Memo; wanting a 'very 1980s' sound he built the track on a Juno-106 synthesizer, finishing a first draft in about three hours and cutting several more versions while touring in Switzerland.",
            "Swift pledged the single's proceeds to New York City public schools on The View (October 29, 2014); the gift was later confirmed at $50,000 to the NYC Department of Education via a public-records request.",
          ],
          supported: [
            "The line 'you can want who you want / boys and boys and girls and girls' was read by several outlets as a gesture of support for diversity and LGBTQ+ people — notable, one music scholar argued, precisely because Swift was then seen as politically silent. Swift and her team did not frame it that way at release, and no contemporaneous GLAAD statement about the song is on record; her documented LGBTQ+ advocacy (the 'You Need to Calm Down' era, a 2020 GLAAD Vanguard Award) came later.",
            "Critical reception was mixed for an album opener: reviewers often knocked the lyric as an unsophisticated, touristy portrait of the city — PopMatters called it both 'undeniably catchy' and 'completely unlistenable' while allowing it worked because 'it's a manifesto, not an overture' — and some publications dismissed the song as a 'gentrification anthem.' The ambassador role sharpened it: as a recent transplant she was branded a 'carpetbagger' with more in common with the tourists she was selling the city to.",
          ],
        },
        live: [
          {
            date: '2015',
            event: 'The 1989 World Tour',
            note: 'The show opener throughout the tour.',
          },
          {
            date: 'July 20, 2018',
            event: 'Reputation Stadium Tour — surprise song',
            note: 'Performed as a surprise song at East Rutherford, New Jersey.',
          },
          {
            date: 'May 28, 2023 & May 18, 2024',
            event: 'The Eras Tour — surprise song',
            note: 'A surprise-song pick at East Rutherford (May 28, 2023) and reprised as a piano 1989 mashup in Stockholm (May 18, 2024); it otherwise left her main sets after the 1989 cycle.',
          },
        ],
        connections: [
          {
            relatedId: 'moment:vault-1989-new-york-names-her-its-global-welcome-ambassador',
            label: 'New York names her its Global Welcome Ambassador',
            why: "The tourism-ambassador appointment this song is inseparable from — the honor, and the 'carpetbagger' backlash it drew.",
          },
          {
            relatedId: 'moment:vault-1989-welcome-to-new-york-with-the-proceeds-going-to-the-citys-sch',
            label: "The proceeds go to NYC's schools",
            why: "Where the money went: Swift's $50,000 gift of the single's proceeds to the New York City Department of Education.",
          },
          {
            relatedId: 'song:clean',
            label: 'Clean',
            why: "The album's closing bookend to this opener — 'Welcome to New York' is arrival as a fresh start, 'Clean' is finally washing the old life out at the record's end.",
          },
        ],
        sources: [
          { name: 'Welcome to New York (song) — Wikipedia', url: 'https://en.wikipedia.org/wiki/Welcome_to_New_York_(song)' },
          { name: "Taylor Swift to Donate 'Welcome to New York' Proceeds to NYC Public Schools — ABC News", url: 'https://abcnews.go.com/Entertainment/taylor-swift-donate-york-proceeds-nyc-public-schools/story?id=26545696' },
          { name: "Taylor Swift Donates $50,000 of 'Welcome to New York' Proceeds to NYC Schools — Forbes", url: 'https://www.forbes.com/sites/ellenkilloran/2015/02/24/taylor-swift-donates-50000-of-welcome-to-new-york-proceeds-to-nyc-schools/' },
        ],
      },
    },
    {
      slug: 'blank-space',
      trackNumber: 2,
      trackTitle: 'Blank Space',
      youtubeId: 'e-ORhEE9VVg', // oEmbed-verified official Taylor Swift channel
      release: '1989',
      releaseDate: '2014-10-27',
      writers: ['Taylor Swift', 'Max Martin', 'Shellback'],
      producers: ['Max Martin', 'Shellback'],
      singleReleaseDate: '2014-11-10',
      note: 'The satire that ate the tabloid caricature — she played the maneater the press invented, and the joke went to No. 1 for seven weeks.',
      summary:
        'A parody self-portrait of the serial-dating psycho the media described: if that is the character they want, she will write it better than they can. The mansion-wrecking video sealed the bit.',
      inspiration:
        'Confirmed intent: Swift said she built the song from the media’s jet-setting man-collector caricature of her, treating it as a comic character study.',
      themes: ['satire of celebrity narrative', 'media caricature', 'control of the joke'],
      easterEggs:
        'The misheard Starbucks-lovers line became one of pop’s most famous mondegreens — acknowledged by Swift and even her mother.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Blank_Space',
      sources: [
        wiki('Blank Space', 'Blank_Space', 'song article: satire framing and chart run'),
        ALBUM,
      ],
    },
    {
      slug: 'style',
      trackNumber: 3,
      trackTitle: 'Style',
      youtubeId: '2JgvVfOfoWI', // oEmbed-verified official Taylor Swift channel
      release: '1989',
      releaseDate: '2014-10-27',
      writers: ['Taylor Swift', 'Max Martin', 'Shellback', 'Ali Payami'],
      producers: ['Max Martin', 'Shellback', 'Ali Payami'],
      singleReleaseDate: '2015-02-09',
      note: 'The nocturnal drive of the album — a cyclical, can’t-quit attraction dressed in red lips and a James Dean squint.',
      summary:
        'Two people who keep crashing back together because the chemistry is timeless even when the relationship is not — desire as a classic silhouette that never goes out of fashion.',
      inspiration:
        'The title’s wink at Harry Styles is the most widely reported reading (unconfirmed by Swift); she has described the song as being about relationships that circle back forever.',
      themes: ['cyclical attraction', 'timelessness', 'glamour with dread underneath'],
      fanLore:
        'Fan reading (widely reported, unconfirmed): the titular pun on a certain One Directioner’s surname.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Style_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Style (Taylor Swift song)',
          'Style_(Taylor_Swift_song)',
          'song article: reception and reporting',
        ),
        ALBUM,
        {
          source_url: 'https://www.grammy.com/news/taylor-swift-1989-oral-history/',
          source_title: "The Making of Taylor Swift's '1989': An Oral History",
          publisher: 'Recording Academy (Grammy.com)',
          source_type: 'interview',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'producers Ali Payami and Niklas Ljungfelt on the instrumental Swift overheard and claimed',
        },
        {
          source_url: 'https://americansongwriter.com/taylor-swift-style-song-meaning/',
          source_title: "The Meaning Behind Taylor Swift's 'Style'",
          publisher: 'American Songwriter',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 3,
          notes: 'Swift never confirmed the Harry Styles reading; her own coy framing',
        },
      ],
      dossier: {
        whyItMatters: [
          "One of 1989's most enduring singles and a lasting critical favorite. Released to radio on February 9, 2015 as the album's third single, it peaked at No. 6 on the Billboard Hot 100 (chart dated March 21, 2015) — her third straight top-ten hit from the record — and is RIAA-certified triple platinum. Its clean-guitar riff over pulsing synths distilled the funk-inflected, retro-'80s palette that defined the whole 1989 sound.",
          "It is also the 1989 song most bound up with the album's central romance and with Swift's reinvention as a pop craftsman: critics from Rolling Stone's Rob Sheffield to the New York Times' Jon Caramanica singled it out, Billboard placed it among her 20 best songs, and it still lands near the top of best-of-Swift lists a decade on. 'Style (Taylor's Version)' arrived on 1989 (Taylor's Version) on October 27, 2023, produced by Swift with Christopher Rowe.",
        ],
        meaning: {
          confirmed: [
            "Written by Swift with Max Martin, Shellback and Ali Payami. Per the Recording Academy's 1989 oral history, the instrumental began as a track Payami built with guitarist Niklas Ljungfelt for themselves — inspired by Daft Punk and 'funky electronic music' — which Swift overheard Payami playing for Max Martin and claimed; she and Martin then wrote new lyrics over it. It was cut at MXM Studios in Stockholm and Conway in Los Angeles.",
            "Swift's own framing of the song has stayed pointedly coy: she described it around release as a timeless, cyclical attraction — a feeling that 'never goes out of style' in a relationship that is 'always a bit off' — without ever naming its subject.",
          ],
          supported: [
            "The Kyle Newman-directed video (premiered February 13, 2015, co-starring Dominic Sherwood, shot in Los Angeles over four days) drops any clear narrative for fragmented flashbacks glimpsed through broken glass and a rear-view mirror — widely read as a fractured, can't-quite-connect romance, though Newman never stated that intent on the record.",
          ],
          fanTheories: [
            "The title is near-universally read as a pun on Harry Styles's surname, tying the song to their brief 2012-13 romance — but Swift has never confirmed it, and the frequently quoted line that it is about 'relationships that circle back forever' is a fan paraphrase of her 'never goes out of style' framing, not a verbatim quote.",
            "A recurring fan claim that the chorus melody echoes another song (for instance 'Careless Whisper') is undocumented; the producers cite only Daft Punk and funky-electronic influences.",
          ],
        },
        live: [
          {
            date: '2015',
            event: 'The 1989 World Tour',
            note: "A fixed main-set number, performed standalone on the runway stage. (The tour's documented piano mashup paired 'Wildest Dreams' with 'Enchanted' — not 'Style'.)",
          },
          {
            date: '2023-2024',
            event: 'The Eras Tour — 1989 set',
            note: "A fixture of the 1989 act (Style / Blank Space / Shake It Off / Wildest Dreams / Bad Blood), performed as a standalone song rather than a surprise pick.",
          },
        ],
        connections: [
          {
            relatedId: 'song:out-of-the-woods',
            label: 'Out of the Woods',
            why: "The other 1989 song most tied to the same short, fraught romance the record keeps circling — where 'Style' makes it timeless and glamorous, 'Out of the Woods' makes it anxious and fragile.",
          },
          {
            relatedId: 'song:wildest-dreams',
            label: 'Wildest Dreams',
            why: "Its back-to-back partner in 1989's cinematic mode and in the Eras Tour 1989 set — both trade Swift's diaristic detail for mood, silhouette and dread underneath the gloss.",
          },
          {
            relatedId: 'moment:vault-1989-the-style-video-trades-plot-for-pure-atmosphere',
            label: "The 'Style' video",
            why: 'The Kyle Newman video that turned the song into pure atmosphere — the broken-glass, can\'t-connect staging described here.',
          },
        ],
        sources: [
          { name: "The Making of Taylor Swift's '1989': An Oral History (Recording Academy)", url: 'https://www.grammy.com/news/taylor-swift-1989-oral-history/' },
          { name: 'Style (Taylor Swift song) — Wikipedia', url: 'https://en.wikipedia.org/wiki/Style_(Taylor_Swift_song)' },
          { name: "The Meaning Behind Taylor Swift's 'Style' — American Songwriter", url: 'https://americansongwriter.com/taylor-swift-style-song-meaning/' },
          { name: 'The 1989 World Tour (setlist) — Wikipedia', url: 'https://en.wikipedia.org/wiki/The_1989_World_Tour' },
        ],
      },
    },
    {
      slug: 'out-of-the-woods',
      trackNumber: 4,
      trackTitle: 'Out of the Woods',
      youtubeId: 'JLf9q36UsBk', // oEmbed-verified official Taylor Swift channel
      release: '1989',
      releaseDate: '2014-10-27',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff', 'Max Martin'],
      isSingle: true,
      note: 'The first Swift–Antonoff cut on a Taylor Swift album — anxious love rendered as a chanted loop, with a confirmed secret snowmobile crash buried in the bridge.',
      summary:
        'A fragile relationship where every month felt like a cliffhanger: are we safe yet, are we clear yet — panic as a chorus you cannot stop repeating.',
      inspiration:
        'Swift confirmed the bridge’s snowmobile accident really happened and had been kept from the press — the song is about a relationship lived in constant fear of the next disaster.',
      themes: ['anxiety in love', 'fragility', 'surviving the crash'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Out_of_the_Woods',
      sources: [
        wiki(
          'Out of the Woods',
          'Out_of_the_Woods',
          'song article: snowmobile confirmation and Antonoff collaboration',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'all-you-had-to-do-was-stay',
      trackNumber: 5,
      trackTitle: 'All You Had to Do Was Stay',
      youtubeId: '_Usd5X5XJXM', // oEmbed-verified official Taylor Swift channel
      release: '1989',
      releaseDate: '2014-10-27',
      writers: ['Taylor Swift', 'Max Martin'],
      producers: ['Max Martin', 'Shellback', 'Mattman & Robin'],
      note: 'Built around a squeaky high note that came to Swift in an actual dream — she woke up, recorded it, and kept it.',
      summary:
        'An ex comes crawling back and the answer is the title: he had one job. The track-5 slot goes, for once, to exasperation instead of devastation.',
      inspiration:
        'Confirmed: the pitched-up vocal hook came from a dream in which Swift could only squeak the word at a returning ex; she recreated it in the studio.',
      themes: ['too little too late', 'self-worth', 'closing the door'],
      sourceUrl: 'https://en.wikipedia.org/wiki/All_You_Had_to_Do_Was_Stay',
      sources: [
        wiki(
          'All You Had to Do Was Stay',
          'All_You_Had_to_Do_Was_Stay',
          'song article: dream-origin hook',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'shake-it-off',
      trackNumber: 6,
      trackTitle: 'Shake It Off',
      youtubeId: 'nfWlot6h_JM', // oEmbed-verified official Taylor Swift channel
      release: '1989',
      releaseDate: '2014-10-27',
      writers: ['Taylor Swift', 'Max Martin', 'Shellback'],
      producers: ['Max Martin', 'Shellback'],
      singleReleaseDate: '2014-08-18',
      note: 'The lead single that announced the pop pivot with a horn section and a shrug — haters gonna hate entered the permanent lexicon.',
      summary:
        'Her policy statement on criticism: the players, haters, and heartbreakers keep doing their thing, and she keeps dancing. Deliberately the album’s most frictionless joy.',
      inspiration:
        'Swift introduced it at the 1989 announcement livestream as her answer to years of public scrutiny — chosen as the lead single precisely because it laughed instead of argued.',
      themes: ['resilience', 'ignoring the noise', 'joy as strategy'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Shake_It_Off',
      sources: [
        wiki('Shake It Off', 'Shake_It_Off', 'song article: release moment and legacy'),
        ALBUM,
      ],
    },
    {
      slug: 'i-wish-you-would',
      trackNumber: 7,
      trackTitle: 'I Wish You Would',
      youtubeId: '89aQIli8aVU', // oEmbed-verified official Taylor Swift channel
      release: '1989',
      releaseDate: '2014-10-27',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff', 'Max Martin'],
      note: 'Born from an Antonoff guitar loop Swift heard and claimed on the spot — 2 a.m. headlights outside an ex’s street.',
      summary:
        'Two stubborn exes driving past each other’s lives, each wishing the other would make the first move neither will make.',
      inspiration:
        'Confirmed studio story: Antonoff sent the instrumental sketch and Swift wrote the drive-by scenario over it almost immediately.',
      themes: ['pride', 'missed signals', 'late-night regret'],
      sourceUrl: 'https://en.wikipedia.org/wiki/I_Wish_You_Would_(Taylor_Swift_song)',
      sources: [
        wiki(
          'I Wish You Would (Taylor Swift song)',
          'I_Wish_You_Would_(Taylor_Swift_song)',
          'song article: Antonoff loop origin',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'bad-blood',
      trackNumber: 8,
      trackTitle: 'Bad Blood',
      youtubeId: 'QcIy9NiNbmo', // oEmbed-verified official Taylor Swift channel
      release: '1989',
      releaseDate: '2014-10-27',
      writers: ['Taylor Swift', 'Max Martin', 'Shellback'],
      producers: ['Max Martin', 'Shellback'],
      singleReleaseDate: '2015-05-17',
      note: 'The feud anthem — she told Rolling Stone it was about a female peer who tried to sabotage a tour, and the Kendrick Lamar remix video assembled an army.',
      summary:
        'A friendship betrayed at the professional level: not a breakup, a backstab — with a chorus built for stadium-sized grudge-holding.',
      inspiration:
        'Swift’s 2014 Rolling Stone interview confirmed the subject was another female artist who attempted to poach her tour dancers; the press universally read Katy Perry (unconfirmed then; the two publicly reconciled in 2019).',
      themes: ['betrayed friendship', 'professional sabotage', 'grudges'],
      fanLore:
        'Fan/press reading: the Perry feud — effectively closed by their documented burger-and-fries reconciliation in the You Need to Calm Down video.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Bad_Blood_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Bad Blood (Taylor Swift song)',
          'Bad_Blood_(Taylor_Swift_song)',
          'song article: interview origin and remix video',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'wildest-dreams',
      trackNumber: 9,
      trackTitle: 'Wildest Dreams',
      youtubeId: 'IdneKLhsWOQ', // oEmbed-verified official Taylor Swift channel
      release: '1989',
      releaseDate: '2014-10-27',
      writers: ['Taylor Swift', 'Max Martin', 'Shellback'],
      producers: ['Max Martin', 'Shellback'],
      singleReleaseDate: '2015-08-31',
      note: 'The breathy, heartbeat-driven fantasy of being remembered gorgeously — re-recorded early in 2021 after a TikTok slow-zoom trend resurrected it.',
      summary:
        'She scripts the memory before the romance even ends: if it has to be doomed, let the recollection of her be cinematic.',
      inspiration:
        'Swift described it as accepting a doomed attraction and pre-writing the nostalgia; its TV version was rush-released in 2021 when the song went viral on TikTok.',
      themes: ['doomed romance', 'curating memory', 'cinematic fantasy'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Wildest_Dreams',
      sources: [
        wiki('Wildest Dreams', 'Wildest_Dreams', 'song article: single run and 2021 TV release'),
        ALBUM,
        {
          source_url: 'https://americansongwriter.com/under-a-microscope-the-story-behind-wildest-dreams-by-taylor-swift/',
          source_title: "The Story Behind 'Wildest Dreams'",
          publisher: 'American Songwriter',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 3,
          notes: 'writing/production with Max Martin & Shellback; the heartbeat recorded into the percussion',
        },
        {
          source_url: 'https://www.npr.org/sections/goatsandsoda/2015/09/02/436967742/the-director-of-the-taylor-swift-video-defends-his-work',
          source_title: 'The Director Of The Taylor Swift Video Defends His Work',
          publisher: 'NPR (Goats and Soda)',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'video criticism (no Black African leads) and the African Parks Foundation donation',
        },
        {
          source_url: 'https://www.rollingstone.com/music/music-news/taylor-swift-wildest-dreams-taylors-version-1228197/',
          source_title: "Taylor Swift Drops 'Wildest Dreams (Taylor's Version)' After TikTok Trend",
          publisher: 'Rolling Stone',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'the September 17, 2021 surprise TV release, out of sequence, credited to the TikTok surge',
        },
      ],
      dossier: {
        whyItMatters: [
          "The fifth single from 1989 (released August 31, 2015), it peaked at No. 5 on the Billboard Hot 100 in November 2015 — the fifth top-ten hit from the album that year — and is RIAA-certified multi-platinum. Written and produced with Max Martin and Shellback, its breathy, widescreen delivery is 1989 at its most cinematic; during recording Swift captured her own heartbeat and folded it into the percussion.",
          "Six years later it became one of her biggest streaming resurrections: a 2021 TikTok 'slow zoom' trend (an automatic zoom-in filter, not the wrinkle/aging filter it is sometimes confused with) sent the song viral, and Swift answered by surprise-releasing 'Wildest Dreams (Taylor's Version)' on September 17, 2021 — out of album sequence, before Red (Taylor's Version) and two years before the full 1989 (Taylor's Version) — telling fans she saw them get it trending and 'thought you should have my version.'",
        ],
        meaning: {
          confirmed: [
            "Written and produced by Swift with Max Martin and Shellback. The 2021 Taylor's Version was produced by Swift with Shellback and Christopher Rowe (Max Martin was not involved), released early specifically because of the TikTok surge.",
            "Its 2015 music video — directed by Joseph Kahn, a 1950s-Hollywood-style romance opposite Scott Eastwood shot against an African-safari backdrop — drew criticism from NPR and other outlets for romanticizing a colonial-era Africa with no Black African leads. Kahn publicly defended the video and said Swift donated all of her proceeds from it to the African Parks Foundation.",
            "Ryan Adams recast the song on his full 2015 track-by-track cover of 1989 as a jangly, Neil Young-tinged rock ballad — part of a covers project Swift publicly praised.",
          ],
          supported: [
            "Critics widely likened the song's breathy, lower-register, cinematic delivery to Lana Del Rey (contemporary reviews called it 'a Lana Del Rey version of a Taylor Swift love song'); there is no record of Swift or her producers responding to the comparison.",
            "Reviewers heard the 2021 Taylor's Version as a brighter, crisper mix with a deeper, slightly slower vocal — trading the original's youthful energy for a more matured read.",
          ],
          fanTheories: [
            "A frequently repeated fan claim that the Taylor's Version more clearly enunciates the 'he's so tall...' line is not documented by critics — treat it as fan lore.",
          ],
        },
        live: [
          {
            date: '2015',
            event: 'The 1989 World Tour',
            note: "Performed as a piano mashup with 'Enchanted' in the main set.",
          },
          {
            date: 'May 11 & November 21, 2018',
            event: 'Reputation Stadium Tour — B-stage surprise song',
            note: 'Played twice as a standalone acoustic B-stage surprise song (Santa Clara, May 11; Tokyo, November 21), not as the 1989-tour Enchanted mashup.',
          },
          {
            date: '2023-2024',
            event: 'The Eras Tour — 1989 set',
            note: "A shortened 'Wildest Dreams' runs inside the main 1989 act rather than as a surprise song.",
          },
        ],
        connections: [
          {
            relatedId: 'song:style',
            label: 'Style',
            why: "Its back-to-back partner in 1989's cinematic mode and in the Eras Tour 1989 set — both trade Swift's diaristic detail for mood, silhouette and dread underneath the gloss.",
          },
          {
            relatedId: 'song:out-of-the-woods',
            label: 'Out of the Woods',
            why: "Another 1989 cut about a romance lived as fragile and doomed — 'Wildest Dreams' pre-mourns it while 'Out of the Woods' panics through it.",
          },
          {
            relatedId: 'moment:vault-1989-1989-taylors-version-announced-in-head-to-toe-blue-at-sofi-s',
            label: "1989 (Taylor's Version) announced",
            why: "Part of the same re-recordings arc: 'Wildest Dreams (Taylor's Version)' jumped the queue in 2021, two years before this head-to-toe-blue announcement of the full 1989 (Taylor's Version).",
          },
        ],
        sources: [
          { name: "The Story Behind 'Wildest Dreams' — American Songwriter", url: 'https://americansongwriter.com/under-a-microscope-the-story-behind-wildest-dreams-by-taylor-swift/' },
          { name: 'The Director Of The Taylor Swift Video Defends His Work — NPR', url: 'https://www.npr.org/sections/goatsandsoda/2015/09/02/436967742/the-director-of-the-taylor-swift-video-defends-his-work' },
          { name: "'Wildest Dreams (Taylor's Version)' after the TikTok trend — Rolling Stone", url: 'https://www.rollingstone.com/music/music-news/taylor-swift-wildest-dreams-taylors-version-1228197/' },
          { name: 'Taylor Swift reputation tour B-stage surprise songs — Billboard', url: 'https://www.billboard.com/articles/columns/pop/8458025/taylor-swift-reputation-tour-b-stage-songs-list' },
        ],
      },
    },
    {
      slug: 'how-you-get-the-girl',
      trackNumber: 10,
      trackTitle: 'How You Get the Girl',
      youtubeId: 'XQh8zhmTtBg', // oEmbed-verified official Taylor Swift channel
      release: '1989',
      releaseDate: '2014-10-27',
      writers: ['Taylor Swift', 'Max Martin', 'Shellback'],
      producers: ['Max Martin', 'Shellback'],
      note: 'The instruction-manual bop — a step-by-step for winning someone back, delivered with a guitar strum smuggled in from her country years.',
      summary:
        'A how-to for the boy who left: show up in the rain, say the exact right things, mean them for longer than a minute. Sunny on top, pointed underneath.',
      inspiration: null,
      themes: ['winning someone back', 'romantic playbooks', 'pop craftsmanship'],
      sourceUrl: 'https://en.wikipedia.org/wiki/How_You_Get_the_Girl',
      sources: [
        wiki('How You Get the Girl', 'How_You_Get_the_Girl', 'song article: composition'),
        ALBUM,
      ],
    },
    {
      slug: 'this-love',
      trackNumber: 11,
      trackTitle: 'This Love',
      youtubeId: 'r9VzPf8a4kI', // oEmbed-verified official Taylor Swift channel
      release: '1989',
      releaseDate: '2014-10-27',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Nathan Chapman'],
      isSingle: true,
      note: 'The album’s only solo write — it began as a poem in her journal, and its TV version resurfaced early via The Summer I Turned Pretty.',
      summary:
        'Love as tide: something released that actually comes back — the quietest, most patient song on a maximalist record.',
      inspiration:
        'Confirmed: Swift wrote it as a poem first, the only 1989 track she wrote alone; the 2022 early release of its re-record for a TV trailer was its second life.',
      themes: ['patience', 'return', 'stillness'],
      sourceUrl: 'https://en.wikipedia.org/wiki/This_Love_(Taylor_Swift_song)',
      sources: [
        wiki(
          'This Love (Taylor Swift song)',
          'This_Love_(Taylor_Swift_song)',
          'song article: poem origin and 2022 TV release',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'i-know-places',
      trackNumber: 12,
      trackTitle: 'I Know Places',
      youtubeId: '0jTGzm-6cYE', // oEmbed-verified official Taylor Swift channel
      release: '1989',
      releaseDate: '2014-10-27',
      writers: ['Taylor Swift', 'Ryan Tedder'],
      producers: ['Taylor Swift', 'Ryan Tedder', 'Noel Zancanella'],
      note: 'Love as a fox hunt — written about starting a relationship while the paparazzi already had the map.',
      summary:
        'Two people planning a romance like a heist: the watchers are the hunters, the lovers are the foxes, and privacy is the getaway route.',
      inspiration:
        'Swift said it was written about knowing in advance that any new relationship would be hunted for sport — the hiding plan drafted before the love existed.',
      themes: ['surveillance', 'protecting love', 'us versus the lens'],
      sourceUrl: 'https://en.wikipedia.org/wiki/I_Know_Places',
      sources: [wiki('I Know Places', 'I_Know_Places', 'song article: background'), ALBUM],
    },
    {
      slug: 'clean',
      trackNumber: 13,
      trackTitle: 'Clean',
      youtubeId: 'AppsjTInqiw', // oEmbed-verified official Taylor Swift channel
      release: '1989',
      releaseDate: '2014-10-27',
      writers: ['Taylor Swift', 'Imogen Heap'],
      producers: ['Taylor Swift', 'Imogen Heap'],
      note: 'The Imogen Heap closer, written after realizing she had spent two weeks in London without thinking of an ex once — sobriety metaphors and all.',
      summary:
        'Healing framed as detox: the drought, the flood, and finally the morning you notice the wound stopped needing checking. Her tour-speech centerpiece for years.',
      inspiration:
        'Confirmed: sparked by the realization that an old love had quietly evaporated; recorded with Heap in London using Heap’s own instrumental setup.',
      themes: ['recovery', 'time as medicine', 'coming out the other side'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Clean_(song)',
      sources: [wiki('Clean (song)', 'Clean_(song)', 'song article: Heap collaboration'), ALBUM],
    },
    {
      slug: 'wonderland',
      trackNumber: 14,
      trackTitle: 'Wonderland',
      youtubeId: 'E048L9PaZsk', // oEmbed-verified official Taylor Swift channel
      release: '1989 (Deluxe Edition)',
      releaseDate: '2014-10-27',
      writers: ['Taylor Swift', 'Max Martin', 'Shellback'],
      producers: ['Max Martin', 'Shellback'],
      note: 'The deluxe track that runs Alice in Wonderland as a relationship allegory — green eyes, Cheshire grins, and a fall down the rabbit hole with no bottom.',
      summary:
        'Falling fast into a dazzling, disorienting romance and losing the plot together: madness as the destination both of them chose.',
      inspiration: null,
      themes: ['intoxicating love', 'losing yourself', 'literary allegory'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Wonderland_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Wonderland (Taylor Swift song)',
          'Wonderland_(Taylor_Swift_song)',
          'song article: deluxe release',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'you-are-in-love',
      trackNumber: 15,
      trackTitle: 'You Are in Love',
      youtubeId: 'a_zwscPcDGM', // oEmbed-verified official Taylor Swift channel
      release: '1989 (Deluxe Edition)',
      releaseDate: '2014-10-27',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'Written over an Antonoff instrumental about a love she had only witnessed, not lived — inspired by watching Jack and Lena Dunham at home.',
      summary:
        'A definition of real love assembled from small, unglamorous proofs — burnt toast on a Sunday, a word whispered mid-dance — narrated by someone standing just outside it.',
      inspiration:
        'Swift confirmed she wrote it after observing Antonoff’s relationship with then-partner Lena Dunham — the ordinary intimacy she had not yet had.',
      themes: ['quiet love', 'witnessing intimacy', 'yearning for the ordinary'],
      sourceUrl: 'https://en.wikipedia.org/wiki/You_Are_in_Love',
      sources: [wiki('You Are in Love', 'You_Are_in_Love', 'song article: inspiration'), ALBUM],
    },
    {
      slug: 'new-romantics',
      trackNumber: 16,
      trackTitle: 'New Romantics',
      youtubeId: '3-BcH7KowGE', // oEmbed-verified official Taylor Swift channel
      release: '1989 (Deluxe Edition)',
      releaseDate: '2014-10-27',
      writers: ['Taylor Swift', 'Max Martin', 'Shellback'],
      producers: ['Max Martin', 'Shellback'],
      singleReleaseDate: '2016-02-23',
      note: 'The deluxe cut fans insisted was the best song on the record until it got promoted to single — a generation shrugging brightly at its own heartbreak.',
      summary:
        'An anthem for treating heartbreak as raw material: bored, broke, and building castles from the bricks thrown at you. Fans consider its non-album status a historic injustice, affectionately.',
      inspiration: null,
      themes: ['generational irony', 'heartbreak as material', 'collective joy'],
      sourceUrl: 'https://en.wikipedia.org/wiki/New_Romantics_(song)',
      sources: [
        wiki('New Romantics (song)', 'New_Romantics_(song)', 'song article: single promotion'),
        ALBUM,
      ],
    },
    {
      slug: 'slut',
      trackNumber: 17,
      trackTitle: '"Slut!"',
      youtubeId: 'qrxsceexTBw', // oEmbed-verified official Taylor Swift channel
      release: "1989 (Taylor's Version) — From The Vault",
      releaseDate: '2023-10-27',
      writers: ['Taylor Swift', 'Jack Antonoff', 'Patrik Berger'],
      producers: ['Taylor Swift', 'Jack Antonoff', 'Patrik Berger'],
      isFromTheVault: true,
      note: 'The vault title that made everyone brace for a diss track — and turned out to be a dreamy shrug: if the tabloids will call her that anyway, this love is worth the headline.',
      summary:
        'Written from inside the 2014 slut-shaming coverage: instead of anger, it floats — choosing the romance and letting the name-calling be the tax. The quotation marks in the title do the heavy lifting.',
      inspiration:
        'Swift’s 1989 TV prologue discussed the era’s dating-life pile-on directly; the song is the vault’s comment on that coverage.',
      themes: ['slut-shaming', 'choosing love anyway', 'defusing a slur'],
      sourceUrl: 'https://en.wikipedia.org/wiki/%22Slut!%22',
      sources: [
        wiki('"Slut!" (song)', '%22Slut!%22', 'song article: vault context and reception'),
        TV,
      ],
    },
    {
      slug: 'say-dont-go',
      trackNumber: 18,
      trackTitle: "Say Don't Go",
      youtubeId: 'C-z-IckrQK8', // oEmbed-verified official Taylor Swift channel
      release: "1989 (Taylor's Version) — From The Vault",
      releaseDate: '2023-10-27',
      writers: ['Taylor Swift', 'Diane Warren'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      isFromTheVault: true,
      note: 'The one-time-only Diane Warren co-write, rescued from the 2014 cutting-room floor.',
      summary:
        'Loving someone who lets you twist: she keeps waiting for him to fight for it, and the silence is its own answer. A legendary songwriter pairing fans did not know existed until the vault opened.',
      inspiration:
        'Confirmed: written with Warren during the 1989 sessions — Warren later said she had wondered for years if it would ever surface.',
      themes: ['one-sided devotion', 'waiting to be chosen', 'lost collaborations'],
      sourceUrl: "https://en.wikipedia.org/wiki/Say_Don't_Go",
      sources: [wiki("Say Don't Go", "Say_Don't_Go", 'song article: Warren co-write'), TV],
    },
    {
      slug: 'now-that-we-dont-talk',
      trackNumber: 19,
      trackTitle: "Now That We Don't Talk",
      youtubeId: 'yF4ulRTCn44', // oEmbed-verified official Taylor Swift channel
      release: "1989 (Taylor's Version) — From The Vault",
      releaseDate: '2023-10-27',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      isFromTheVault: true,
      note: 'The shortest song in her catalog at release — a disco-strut post-mortem on all the things she no longer has to pretend to enjoy.',
      summary:
        'After the silence sets in, the wins count themselves: no more faking a taste for his music, his friends, his idea of her. Petty, precise, and over in under two and a half minutes.',
      inspiration:
        'Fans immediately mapped its details to the mid-2010s chapter the 1989 vault covers (unconfirmed); the documented fact is its record-setting brevity in her catalog.',
      themes: ['post-breakup clarity', 'identity reclaimed', 'brevity as flex'],
      fanLore:
        'Fan reading (unconfirmed): the yacht-and-long-hair details fans link to a specific 2015–16 relationship.',
      sourceUrl: "https://en.wikipedia.org/wiki/Now_That_We_Don't_Talk",
      sources: [
        wiki(
          "Now That We Don't Talk",
          "Now_That_We_Don't_Talk",
          'song article: length record and reception',
        ),
        TV,
      ],
    },
    {
      slug: 'suburban-legends',
      trackNumber: 20,
      trackTitle: 'Suburban Legends',
      youtubeId: 'ZGBPKYbzSXs', // oEmbed-verified official Taylor Swift channel
      release: "1989 (Taylor's Version) — From The Vault",
      releaseDate: '2023-10-27',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      isFromTheVault: true,
      note: 'A vault daydream about a love that was supposed to be hometown-mythology material — the kind people tell stories about at reunions.',
      summary:
        'She casts the two of them as destined local legend, then watches him wreck the legend on schedule — grandiose romance meeting ordinary disappointment.',
      inspiration: null,
      themes: ['mythologizing love', 'destiny versus reality', 'forgiving too fast'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Suburban_Legends_(song)',
      sources: [
        wiki('Suburban Legends (song)', 'Suburban_Legends_(song)', 'song article: vault release'),
        TV,
      ],
    },
    {
      slug: 'is-it-over-now',
      trackNumber: 21,
      trackTitle: 'Is It Over Now?',
      youtubeId: 'tNxUxm3-658', // oEmbed-verified official Taylor Swift channel
      release: "1989 (Taylor's Version) — From The Vault",
      releaseDate: '2023-10-27',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      isFromTheVault: true,
      isSingle: true,
      note: 'The vault’s parting shot — it debuted at No. 1, nine years after the sessions that produced it, and set fans loose on its very specific imagery.',
      summary:
        'The question you ask when a breakup never got a clean ending: who ended what, and when, and why is he already photographed with someone new. The sharpest-elbowed writing in the 1989 vault.',
      inspiration:
        'Fans connect its blue-dress and boat imagery to heavily photographed 2013–14 tabloid moments (unconfirmed by Swift); its Hot 100 No. 1 debut in 2023 is the documented headline.',
      themes: ['ambiguous endings', 'receipts', 'delayed vindication'],
      fanLore:
        'Fan reading (unconfirmed): the paparazzi-era references fans treat as timestamping the subject.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Is_It_Over_Now%3F',
      sources: [
        wiki(
          'Is It Over Now?',
          'Is_It_Over_Now%3F',
          'song article: chart debut and speculation coverage',
        ),
        TV,
      ],
    },
  ],
};

// Vault track guide — reputation era (reputation, 2017). Original prose only —
// never lyrics; unconfirmed readings are labeled. Provenance per
// docs/content/content-audit-2026-07-08.md §5 (URLs verified 2026-07-08).
// Era context: released with no interviews — the prologue's promise that there
// would be no explanation, only reputation, shapes every reading below.

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
  'Reputation (album)',
  'Reputation_(album)',
  'album article: release facts, credits, and cited interviews',
);

const TRACKS = [
    {
      slug: 'ready-for-it',
      trackNumber: 1,
      trackTitle: '...Ready for It?',
      youtubeId: 'T62maKYX9tU', // oEmbed-verified official Taylor Swift channel
      release: 'reputation',
      releaseDate: '2017-11-10',
      writers: ['Taylor Swift', 'Max Martin', 'Shellback', 'Ali Payami'],
      producers: ['Max Martin', 'Shellback', 'Ali Payami'],
      singleReleaseDate: '2017-09-03',
      note: 'The industrial-trap gauntlet throw that opens the album — armor on the verses, a secret love song hiding in the chorus.',
      summary:
        'A heist-movie meet-cute: she sizes up a new love like a co-conspirator, keeping him hidden as the prize the outside world cannot touch. The clank of the production is the disguise.',
      inspiration: null,
      themes: ['love as conspiracy', 'armor versus softness', 'new beginnings in wartime'],
      sourceUrl: 'https://en.wikipedia.org/wiki/...Ready_for_It%3F',
      sources: [
        wiki(
          '...Ready for It?',
          '...Ready_for_It%3F',
          'song article: single release and composition',
        ),
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "'...Ready for It?' opens reputation and functions as the album's mission statement: after the vengeful, industrial stomp of lead single 'Look What You Made Me Do,' this track reintroduces Swift as someone falling hard and fast into a new relationship, fusing armored, hip-hop-inflected production with the vulnerability of infatuation. It signaled that reputation would not simply be a diss record but an album about rebuilding intimacy behind a defensive public persona.",
          "As the album's second single and the song chosen to premiere during a nationally televised college football broadcast, it also mattered commercially and strategically — it was Swift's way of demonstrating that her sound could evolve toward trap and EDM-adjacent textures while still delivering a top-10, multi-platinum hit, distancing reputation from the polished synth-pop of 1989."
        ],
        meaning: {
          confirmed: [
            "Swift co-wrote '...Ready for It?' with producers Max Martin, Shellback, and Ali Payami for reputation, and the song premiered as a teaser during an ABC college football broadcast on September 2, 2017, before being released for digital download the next day and going to radio as the second single on October 24, 2017.",
            "Swift stated at her iHeartRadio reputation album release party that the song's central 'partner in crime' imagery is about the thrill of finding a romantic match who feels like your equal — comparing it to the excitement of deciding to 'rob banks together', and noted that this crime-and-heist theme recurs elsewhere on the record in different forms."
          ],
          supported: [
            "Wikipedia's sourced composition summary and multiple outlets describe the lyrics as using criminal and heist imagery — including a bank robbery, holding someone 'for ransom,' and going into hiding together — as metaphors for intense new romantic attraction and desire to escape public scrutiny.",
            "Several publications, including Songfacts, note the lyric describing her love interest as 'younger than my exes' who nonetheless 'acts like such a man' aligns with Joe Alwyn, who was younger than Swift when they began dating and when the song was released; additional numeric and visual cues in the music video (including birth-year references) are widely cited by press as reinforcing this reading.",
            "Music critics, as summarized on Wikipedia, generally praised the track's anthemic production and considered it a stronger single than 'Look What You Made Me Do,' while some reviews found its sound generic or too aligned with contemporary trap-pop trends of the period.",
            "The Joseph Kahn-directed music video, which depicts a cloaked human Swift battling a robotic double, has been widely interpreted by critics and fans as a visual metaphor for the tension between Swift's authentic self and her public, media-constructed persona during the reputation era."
          ]
        },
        connections: [
          {
            relatedId: "song:gorgeous",
            label: "Gorgeous",
            why: "Both songs document the same early-relationship infatuation (read by press as being about Joe Alwyn) — one through crime-thriller intensity, the other through flirtatious comedy."
          },
          {
            relatedId: "song:look-what-you-made-me-do",
            label: "Look What You Made Me Do",
            why: "As reputation's first two singles, they establish the album's dual register — public vengeance and private devotion — with 'Ready for It?' pivoting the narrative from feud to romance."
          },
          {
            relatedId: "song:delicate",
            label: "Delicate",
            why: "Both songs explore vulnerability inside a new relationship while Swift is hyper-aware of public perception, though 'Delicate' trades the heist bravado for hushed uncertainty."
          },
          {
            relatedId: "song:end-game",
            label: "End Game",
            why: "The two tracks share reputation's recurring 'partner in crime' motif that Swift said carries through the record in varying forms, framing love as a shared conspiracy against outside judgment."
          }
        ],
        sources: [
          { name: "...Ready for It? — Wikipedia", url: "https://en.wikipedia.org/wiki/...Ready_for_It%3F" },
          { name: "...Ready For It? by Taylor Swift — Songfacts", url: "https://dev-www.songfacts.com/facts/taylor-swift/ready-for-it" },
          { name: "Reputation (album) — Wikipedia", url: "https://en.wikipedia.org/wiki/Reputation_(album)" }
        ]
      },
    },
    {
      slug: 'end-game',
      trackNumber: 2,
      trackTitle: 'End Game',
      youtubeId: 'dfnCAmr569k', // oEmbed-verified official Taylor Swift channel
      release: 'reputation',
      releaseDate: '2017-11-10',
      writers: ['Taylor Swift', 'Max Martin', 'Shellback', 'Ed Sheeran', 'Future'],
      producers: ['Max Martin', 'Shellback', 'Ilya'],
      singleReleaseDate: '2017-11-14',
      note: 'The three-hander with Ed Sheeran and Future — reputations preceding everyone involved, and wanting to be someone’s ending anyway.',
      summary:
        'Three narrators with big reputations ask for the same thing: to be judged by who they are up close, not by the highlight reel of their misses.',
      inspiration: null,
      themes: ['reputation versus reality', 'commitment', 'baggage'],
      sourceUrl: 'https://en.wikipedia.org/wiki/End_Game_(song)',
      sources: [
        wiki('End Game (song)', 'End_Game_(song)', 'song article: features and single release'),
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "End Game is where reputation says its own name: the hook chants 'big reputation, big reputation,' and the word recurs throughout, making the Ed Sheeran and Future three-hander the track that most directly voices the era's title and its theme of wanting to be judged up close rather than by a highlight reel of misses.",
          "It was also the album's marquee collaboration — Swift's second team-up with Sheeran after 'Everything Has Changed,' and Future's only Swift collaboration — carried by a globe-trotting Joseph Kahn video.",
        ],
        meaning: {
          confirmed: [
            "Written and produced by Max Martin and Shellback with Ilya, End Game was released as a single on November 14, 2017. On the Hot 100 it debuted at No. 86 and peaked at No. 18; internationally it reached No. 49 in the UK, No. 36 in Australia and No. 11 in Canada.",
            "Ed Sheeran has said he wrote his verse alone, early one morning in a New York hotel after a dream — so the three-artist track was assembled from separate contributions rather than recorded together in one room.",
            "The Joseph Kahn–directed video premiered January 12, 2018, moving between Miami (a yacht with Future), Tokyo (a bar with Sheeran) and London.",
          ],
          supported: [
            "Critics split on it: Rolling Stone's Rob Sheffield called it 'deeply weird, wildly funny,' while Pitchfork found the guest-heavy production lifeless — with Future's verse frequently singled out as the track's strongest element.",
          ],
          fanTheories: [
            "Listeners map the three verses' bravado onto each singer's own tabloid history, and read Sheeran's 'after the storm... Fourth of July' line as autobiographical; those real-life readings are reported interpretation, not stated in the song.",
          ],
        },
        live: [
          {
            date: '2018',
            event: 'reputation Stadium Tour',
            note: 'Performed nightly in a shortened version within the main setlist.',
          },
          {
            date: '2023-11-11',
            event: 'The Eras Tour — Buenos Aires',
            note: 'Returned as an acoustic surprise song.',
          },
          {
            date: '2024',
            event: 'The Eras Tour — London',
            note: "Performed with Sheeran in a mashup that folded in their earlier collaboration 'Everything Has Changed.'",
          },
        ],
        connections: [
          {
            relatedId: 'song:ready-for-it',
            label: '...Ready for It?',
            why: "reputation's other Max Martin/Shellback opener and the single End Game directly followed — the two front-load the album's armored, hip-hop-leaning sound.",
          },
          {
            relatedId: 'song:everything-has-changed',
            label: 'Everything Has Changed',
            why: "Swift's first Ed Sheeran collaboration (Red, 2013); End Game is the reunion, and the two were later fused in a 2024 Wembley mashup.",
          },
          {
            relatedId: 'moment:vault-reputation-the-end-game-video-miami-tokyo-london-with-ed-sheeran-and-fu',
            label: 'The End Game video — Miami, Tokyo, London',
            why: 'The song’s biggest visual moment gets its own page — the globe-trotting Kahn shoot with Sheeran and Future.',
          },
        ],
        sources: [
          { name: 'End Game (song) — Wikipedia', url: 'https://en.wikipedia.org/wiki/End_Game_(song)' },
          { name: 'Songfacts: End Game', url: 'https://www.songfacts.com/facts/taylor-swift/end-game' },
          { name: "NPR: Taylor Swift's 'End Game' video with Ed Sheeran and Future", url: 'https://www.npr.org/2018/01/12/577618929/taylor-swift-takes-a-shot-with-ed-sheeran-and-rides-shotgun-with-future-in-end-g' },
          { name: 'setlist.fm: reputation Stadium Tour, Manchester (June 8, 2018)', url: 'https://www.setlist.fm/setlist/taylor-swift/2018/etihad-stadium-manchester-england-5beabfb0.html' },
        ],
      },
    },
    {
      slug: 'i-did-something-bad',
      trackNumber: 3,
      trackTitle: 'I Did Something Bad',
      youtubeId: 'xYLxUJ9v6KU', // oEmbed-verified official Taylor Swift channel
      release: 'reputation',
      releaseDate: '2017-11-10',
      writers: ['Taylor Swift', 'Max Martin', 'Shellback'],
      producers: ['Max Martin', 'Shellback'],
      note: 'The most unapologetic song she had ever released — including her first recorded curse — with witch-hunt imagery aimed straight at 2016.',
      summary:
        'Zero remorse as a power stance: if they are going to burn her as a witch either way, she will supply the gasoline and enjoy the light. Fans read the narcissist verses toward specific 2016 antagonists (unconfirmed).',
      inspiration: null,
      themes: ['unapologetic power', 'witch-hunt inversion', 'playing the villain'],
      fanLore: 'Fan reading (unconfirmed): verse-by-verse mappings to the era’s public feuds.',
      sourceUrl: 'https://en.wikipedia.org/wiki/I_Did_Something_Bad',
      sources: [
        wiki(
          'I Did Something Bad',
          'I_Did_Something_Bad',
          'song article: composition and reception',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'dont-blame-me',
      trackNumber: 4,
      trackTitle: "Don't Blame Me",
      youtubeId: 'kRJKB291Z1g', // oEmbed-verified official Taylor Swift channel
      release: 'reputation',
      releaseDate: '2017-11-10',
      writers: ['Taylor Swift', 'Max Martin', 'Shellback'],
      producers: ['Max Martin', 'Shellback'],
      note: 'The gospel-stomp about love as a drug she is happy to be convicted for — reborn years later as a live and streaming favorite.',
      summary:
        'She pleads guilty with a choir behind her: love made her crazy, the addiction metaphors pile up, and the courtroom framing turns worship and vice into the same thing.',
      inspiration: null,
      themes: ['love as intoxication', 'devotion', 'guilty as charged'],
      sourceUrl: "https://en.wikipedia.org/wiki/Don't_Blame_Me_(Taylor_Swift_song)",
      sources: [
        wiki(
          "Don't Blame Me (Taylor Swift song)",
          "Don't_Blame_Me_(Taylor_Swift_song)",
          'song article: composition and live legacy',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'delicate',
      trackNumber: 5,
      trackTitle: 'Delicate',
      youtubeId: 'tCXGJQYZ9JA', // oEmbed-verified official Taylor Swift channel
      release: 'reputation',
      releaseDate: '2017-11-10',
      writers: ['Taylor Swift', 'Max Martin', 'Shellback'],
      producers: ['Max Martin', 'Shellback'],
      singleReleaseDate: '2018-03-12',
      note: 'Track 5, on schedule: the vocoder confession that her reputation has never been worse — so the person who likes her anyway must actually mean it.',
      summary:
        'The album’s soft center: starting something real while assuming the worst about your own name, and asking, twice a line, whether it is too soon to say what she is feeling.',
      inspiration:
        'Swift has framed reputation overall as the story of finding something real amid the wreckage — this is the song fans and critics agree carries that thesis.',
      themes: ['vulnerability', 'reputation as filter', 'is it okay to want this'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Delicate_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Delicate (Taylor Swift song)',
          'Delicate_(Taylor_Swift_song)',
          'song article: single run and thesis reading',
        ),
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "Delicate is reputation's emotional thesis in miniature: after an album of armor, it is the confession that her name has never been worse — so someone who likes her anyway must actually mean it. Critics and fans treat it as the record's soft center, the counter-argument to its revenge singles.",
          "It also proved the album's most durable hit. Sent to radio in March 2018, it logged 35 weeks on the Hot 100 — the longest run of any reputation single — and topped three Billboard airplay charts, quietly reframing the era from spectacle to staying power long after the louder singles faded.",
        ],
        meaning: {
          confirmed: [
            "Swift wrote 'Delicate' with Max Martin and Shellback, who produced it at MXM Studios in Stockholm and Los Angeles; the intro vocal is run through a vocoder. Released as reputation's fourth single on March 12, 2018, it peaked at No. 12 on the Hot 100, spent 35 weeks on the chart (the album's longest-charting single), and reached No. 1 on Pop Airplay, Adult Pop Songs and Adult Contemporary.",
            "The Joseph Kahn–directed video premiered March 11, 2018 at the iHeartRadio Music Awards; its concept has Swift, hounded by press, turn invisible and dance freely through a hotel and city streets.",
          ],
          supported: [
            "It is widely read as reputation's counter-thesis — the tender private feeling beneath the public-villain persona — and is frequently named among the album's best tracks; NPR's Ann Powers called it one of the record's most memorable, and it made 2018 year-end lists at Billboard, Slant and Rolling Stone.",
            "The blurred, vocoder-processed intro is often heard as a 'confession spoken through a filter,' matching the lyric's twice-a-line hesitancy — a reading built on the documented vocoder effect rather than a stated production goal.",
            "After release, some online commentators accused the video of copying Spike Jonze's 2016 Kenzo World fragrance ad (a woman dancing unseen through a building); the comparison dominated part of its reception, and Swift did not publicly respond to that specific charge.",
          ],
          fanTheories: [
            "Fans tie the 'third floor on the west side' line to a real downtown-LA bar, the Golden Gopher (an actual filming location in the video), but no Swift or writer statement confirms the lyric refers to it — treat the venue identification as unconfirmed.",
            "A supposed 2018 'Delicate challenge' lip-sync trend on musical.ly/TikTok is not well documented; what spread was reaction-image humor riffing on the video's mirror faces, so the organized-'challenge' framing is unconfirmed.",
          ],
        },
        live: [
          {
            date: '2018',
            event: 'reputation Stadium Tour',
            note: "Performed in the main setlist, opening the tour's third act into 'Shake It Off.'",
          },
          {
            event: 'The Eras Tour',
            note: "Sits at position 16 in the reputation block, between '...Ready for It?' and 'Don't Blame Me' → 'Look What You Made Me Do.'",
          },
        ],
        connections: [
          {
            relatedId: 'moment:vault-1989-the-snake-video-that-announced-reputation',
            label: 'The snake video that announced reputation',
            why: "Delicate is the private answer to the era this rollout launched — the same 'reputation' the album weaponizes on the outside is what she assumes has ruined her chances on the inside.",
          },
          {
            relatedId: 'song:look-what-you-made-me-do',
            label: 'Look What You Made Me Do',
            why: "The album's two filters on the same self: the lead single builds a villain persona, Delicate confesses the soft feeling that persona is protecting.",
          },
        ],
        sources: [
          { name: 'Delicate (Taylor Swift song) — Wikipedia', url: 'https://en.wikipedia.org/wiki/Delicate_(Taylor_Swift_song)' },
          { name: "NME: Director Joseph Kahn on the 'Delicate' video", url: 'https://www.nme.com/news/music/director-joseph-kahn-trolls-taylor-swift-fans-upcoming-delicate-music-video-2255760' },
          { name: 'setlist.fm: reputation Stadium Tour, MetLife Stadium (July 21, 2018)', url: 'https://www.setlist.fm/setlist/taylor-swift/2018/metlife-stadium-east-rutherford-nj-13ebe5f1.html' },
          { name: "Yahoo Entertainment: real-life locations in the 'Delicate' video", url: 'https://www.yahoo.com/entertainment/apos-visit-real-life-locations-170548748.html' },
        ],
      },
    },
    {
      slug: 'look-what-you-made-me-do',
      trackNumber: 6,
      trackTitle: 'Look What You Made Me Do',
      youtubeId: '3tmd-ClpJxA', // oEmbed-verified official Taylor Swift channel
      release: 'reputation',
      releaseDate: '2017-11-10',
      writers: [
        'Taylor Swift',
        'Jack Antonoff',
        'Richard Fairbrass',
        'Fred Fairbrass',
        'Rob Manzoli',
      ],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      singleReleaseDate: '2017-08-24',
      note: 'The comeback single that killed the old Taylor on the phone — built on an interpolation of I’m Too Sexy, with a video that is one long Easter-egg museum.',
      summary:
        'A revenge overture aimed at everyone who wrote her 2016 obituary: the tilted stage, the list of names, the declaration that the old versions of her cannot come to the phone. The Right Said Fred interpolation is why their names sit in the credits.',
      inspiration:
        'Universally read against the 2016 Kimye phone-call fallout (Swift let the imagery speak rather than confirming specifics); the snake motif reclaimed the emoji flood documented that summer.',
      themes: ['revenge', 'death of the old self', 'narrative reclamation'],
      easterEggs:
        'The video buries the entire discography: dresses, headlines, and a tombstone-adjacent bathtub of jewels fans have itemized line-by-line since 2017.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Look_What_You_Made_Me_Do',
      sources: [
        wiki(
          'Look What You Made Me Do',
          'Look_What_You_Made_Me_Do',
          'song article: interpolation credit and video analysis',
        ),
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "The comeback single that opened the reputation era by killing the old Taylor on the phone: built on an interpolation of Right Said Fred's 'I'm Too Sexy,' it turned the summer's snake-emoji pile-on into a revenge overture and reset the public narrative on Swift's own terms.",
          "It rewrote the record books on arrival — a No. 1 debut-week that ended 'Despacito's reign, and a video that broke the global 24-hour streaming records of its day — making it one of the biggest single-week events of 2017.",
        ],
        meaning: {
          confirmed: [
            "Released August 24, 2017, it debuted at No. 77 and vaulted to No. 1 on the Hot 100 dated September 16, 2017 — its first full tracking week — ending 'Despacito's record-tying 16-week reign, on 2017's biggest week (84.4M US streams and 353,000 downloads). It also hit No. 1 on the UK Singles Chart and is RIAA-certified 4× Platinum.",
            "It set the then-record for most single-day global Spotify streams — 10,129,087 on August 25, 2017 — and the Joseph Kahn–directed video, premiered at the 2017 VMAs, took the YouTube 24-hour record with 43.2M views (past PSY's 'Gentleman,' ~36M) and the Vevo 24-hour record from Adele's 'Hello' (27.7M); both marks have since been beaten.",
            "The 'I'm Too Sexy' interpolation was cleared before release — Swift's team reached out and Right Said Fred (all three members co-credited) approved; the group publicly welcomed it, tweeting 'what a marvellous reinvention!'",
          ],
          supported: [
            "Reception was sharply polarized: Pitchfork's Meaghan Garvey called it 'a hardcore self-own' and The Ringer's Lindsay Zoladz 'a strange collage of retro reference points... devoid of self-effacing humor,' while others praised the darker turn. The video drew 2018 MTV VMA nominations for its craft (art direction, editing, visual effects) but no major song Grammy.",
            "Produced by Swift and Jack Antonoff, the track breaks deliberately from its sing-song verses into a chanted title-hook chorus — the team stripped the vocal down to the repeated title, echoing the 'I'm Too Sexy' cadence — before the spoken 'the old Taylor can't come to the phone right now... she's dead' bridge.",
          ],
          fanTheories: [
            "Swift never named a target on record — the Reputation prologue promised 'no further explanation,' and Antonoff deflected the question to her — so the near-universal read of the song as the 2016 Kanye West / Kim Kardashian / Katy Perry fallout is fan interpretation, not confirmed fact.",
            "The video is a museum of self-reference: press-confirmed intentional Easter eggs include the 'Nils Sjöberg' tombstone (Swift's real songwriting pseudonym on Calvin Harris's 'This Is What You Came For'), the 'I ❤ TS' crop-tops, and the tower of past-era Taylors reciting old quotes; finer 'receipts' readings are more fan-itemized than documented.",
          ],
        },
        live: [
          {
            date: '2018-05-08',
            event: 'reputation Stadium Tour (opening night, Glendale)',
            note: "Not the opener — the tour opened with '...Ready for It?'; 'Look What You Made Me Do' was the fifth song, staged with the giant inflatable cobra fans nicknamed 'Karyn.'",
          },
          {
            event: 'The Eras Tour',
            note: 'Performed in the main reputation set (dancers boxed in clear cases as past eras), not as a surprise song.',
          },
        ],
        connections: [
          {
            relatedId: 'moment:vault-1989-look-what-you-made-me-do-and-the-phone-call-it-started-with',
            label: 'Look What You Made Me Do — and the phone call it started with',
            why: "The song's own origin moment: the 2016 phone-call fallout it answers, and the 'old Taylor is dead' framing it launched.",
          },
          {
            relatedId: 'moment:vault-1989-the-look-what-you-made-me-do-video-shatters-youtubes-24-hour',
            label: 'The Look What You Made Me Do video shatters YouTube’s 24-hour record',
            why: 'The record-breaking premiere gets its own page — the 43.2M-view debut this single set.',
          },
          {
            relatedId: 'moment:vault-1989-the-snake-video-that-announced-reputation',
            label: 'The snake video that announced reputation',
            why: 'The rollout this single launched — the reclaimed-snake teasers that broke the silence before the album.',
          },
        ],
        sources: [
          { name: 'Look What You Made Me Do — Wikipedia', url: 'https://en.wikipedia.org/wiki/Look_What_You_Made_Me_Do' },
          { name: 'Billboard: Leaps to No. 1 on Hot 100 With Top Streaming & Sales Week of 2017', url: 'https://www.billboard.com/pro/taylor-swift-look-what-you-made-me-do-number-one-hot-100/' },
          { name: 'Official Charts: shatters YouTube viewing record', url: 'https://www.officialcharts.com/chart-news/taylor-swifts-look-what-you-made-me-do-shatters-youtube-viewing-record__20292/' },
          { name: "The Hollywood Reporter: Taylor Swift Tops Psy's 24-Hour YouTube Record", url: 'https://www.hollywoodreporter.com/news/general-news/taylor-swift-tops-psys-24-hour-youtube-record-look-what-you-made-me-do-1033726/' },
          { name: "The FADER: Right Said Fred are 'very pleased' with the interpolation", url: 'https://www.thefader.com/2017/08/25/taylor-swift-right-said-fred-look-what-you-made-me-do' },
          { name: "Rolling Stone: 'Look What You Made Me Do' video decoded", url: 'https://www.rollingstone.com/music/music-news/taylor-swifts-look-what-you-made-me-do-video-decoded-13-things-you-missed-126268/' },
          { name: 'RIAA Gold & Platinum database', url: 'https://www.riaa.com/gold-platinum/' },
        ],
      },
    },
    {
      slug: 'so-it-goes',
      trackNumber: 7,
      trackTitle: 'So It Goes...',
      youtubeId: 'iAv1Y1YIwm8', // oEmbed-verified official Taylor Swift channel
      release: 'reputation',
      releaseDate: '2017-11-10',
      writers: ['Taylor Swift', 'Max Martin', 'Shellback', 'Oscar Görres'],
      producers: ['Max Martin', 'Shellback', 'Oscar Görres'],
      note: 'The album’s trapdoor track — the only reputation song left off its own stadium tour’s main setlist, surfacing only as an occasional acoustic surprise.',
      summary:
        'A dissolve into someone behind closed doors, with the Vonnegut-echo title shrugging at everything outside them. Fans know it mainly as the great unplayed deep cut.',
      inspiration: null,
      themes: ['private intensity', 'compartmentalized love', 'deep-cut mystique'],
      sourceUrl: 'https://en.wikipedia.org/wiki/So_It_Goes...',
      sources: [wiki('So It Goes...', 'So_It_Goes...', 'song article: composition'), ALBUM],
    },
    {
      slug: 'gorgeous',
      trackNumber: 8,
      trackTitle: 'Gorgeous',
      youtubeId: 'EUoe7cf0HYw', // oEmbed-verified official Taylor Swift channel
      release: 'reputation',
      releaseDate: '2017-11-10',
      writers: ['Taylor Swift', 'Max Martin', 'Shellback'],
      producers: ['Max Martin', 'Shellback'],
      isSingle: true,
      note: 'The tipsy crush song that opens with a baby saying the title — credited to James, Blake Lively and Ryan Reynolds’ daughter.',
      summary:
        'Being furious at someone for being that attractive while she is spoken for: petty, funny, self-incriminating — the album’s lightest confession.',
      inspiration:
        'The intro voice is confirmed in the credits as one-year-old James Reynolds — the friendship Easter egg that later paid off again in Betty’s character names.',
      themes: ['inconvenient attraction', 'humor', 'self-sabotage'],
      easterEggs:
        'The baby-voice credit connects forward to folklore, where James and Inez name the love-triangle characters.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Gorgeous_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Gorgeous (Taylor Swift song)',
          'Gorgeous_(Taylor_Swift_song)',
          'song article: intro credit',
        ),
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "\"Gorgeous\" sits at a turning point on reputation where Swift lets a little sunlight back into an album built around armor and score-settling. Coming right after the vengeful \"Look What You Made Me Do\" and the seductive dare of \"...Ready for It?\", it shows the softer, sillier side of falling for someone while still wrapped in the record's synth-heavy, tabloid-scarred sound — proof that reputation's narrator could be petty and swooning in the same breath.",
          "The song also matters as a piece of Swift's public narrative-management during the era: she used a low-stakes promotional single, built around a viral baby-voice hook from friends' toddler, to generate press buzz ahead of the album's release, showing her increasing command of rollout strategy alongside songwriting."
        ],
        meaning: {
          confirmed: [
            "Swift wrote 'Gorgeous' with producers Max Martin and Shellback for reputation, and the track opens with a recording of a baby saying the word 'gorgeous' — a sample of James Reynolds, daughter of Blake Lively and Ryan Reynolds, which Swift decided to use after playing them an acoustic demo and the toddler kept repeating the word.",
            "Big Machine Records released 'Gorgeous' as a promotional single on October 20, 2017, ahead of reputation's release, following 'Look What You Made Me Do' and '...Ready for It?' as the third song issued before the album."
          ],
          supported: [
            "Critics and Wikipedia's composition summary describe the lyrics as a flirtatious, self-deprecating confession to a new love interest — the narrator jokes that his good looks make her miserable and torn, including a self-aware nod to being tempted to stray from a current boyfriend, played for comic exaggeration rather than literal confession.",
            "Multiple outlets, including Wikipedia's sourced composition notes, connect the song's romantic subject to Swift's real-life relationship with actor Joe Alwyn, framing 'Gorgeous' as an early, tongue-in-cheek document of new infatuation within the reputation era's broader love story.",
            "Critical reception was split: some reviewers praised its bright, 'radio-friendly' production as a welcome contrast to the album's darker early singles, while others, per Billboard and Wikipedia's aggregated critical summary, felt the songwriting was simplistic compared to Swift's usual standard."
          ]
        },
        connections: [
          {
            relatedId: "song:ready-for-it",
            label: "...Ready for It?",
            why: "Both songs chart the same new relationship (widely read as with Joe Alwyn) at different emotional temperatures — one breathless and cinematic, the other giddy and self-mocking."
          },
          {
            relatedId: "song:call-it-what-you-want",
            label: "Call It What You Want",
            why: "Both tracks depict Swift finding stability and joy in a relationship that also serves as an emotional refuge from reputation's tabloid battles."
          },
          {
            relatedId: "song:delicate",
            label: "Delicate",
            why: "Like 'Gorgeous,' 'Delicate' captures the anxious, giddy uncertainty of new romance, tempering reputation's tougher exterior with vulnerability."
          },
          {
            relatedId: "song:dress",
            label: "Dress",
            why: "Both songs address the same love interest with playful desire, contrasting reputation's brasher, more combative tracks with intimate, romantic material."
          }
        ],
        sources: [
          { name: "Gorgeous (Taylor Swift song) — Wikipedia", url: "https://en.wikipedia.org/wiki/Gorgeous_(Taylor_Swift_song)" },
          { name: "Why Taylor Swift's 'Reputation' Is Her Best Album — Billboard", url: "https://www.billboard.com/music/pop/taylor-swift-reputation-best-album-8527988" },
          { name: "Reputation (album) — Wikipedia", url: "https://en.wikipedia.org/wiki/Reputation_(album)" }
        ]
      },
    },
    {
      slug: 'getaway-car',
      trackNumber: 9,
      trackTitle: 'Getaway Car',
      youtubeId: 'FhPLQVlUiNQ', // oEmbed-verified official Taylor Swift channel
      release: 'reputation',
      releaseDate: '2017-11-10',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The Antonoff heist epic fans call the album’s best writing — using one relationship as the escape vehicle from another, and knowing it is doomed from the ignition.',
      summary:
        'A Bonnie-without-Clyde confession: she jumped into a rebound to flee a crash, and getaway cars, by definition, do not go the distance. She turns herself in by the bridge.',
      inspiration:
        'Fans near-universally map it to the well-photographed mid-2016 relationship handoff (unconfirmed by Swift); the song’s own crime-movie framing is the only official statement.',
      themes: ['rebounds', 'self-aware wrongdoing', 'escape'],
      fanLore:
        'Fan reading (unconfirmed): the 2016 summer timeline fans treat as the heist in question.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Getaway_Car_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Getaway Car (Taylor Swift song)',
          'Getaway_Car_(Taylor_Swift_song)',
          'song article: reception',
        ),
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "Getaway Car is the album cut critics and fans most often crown reputation's best writing: a Bonnie-without-Clyde heist metaphor for using one relationship to flee another, doomed from the ignition. It was never a single and never got a video, yet it routinely tops best-of-reputation and best-Swift-deep-cut lists.",
          "It also became one of the Eras Tour's most-loved surprise songs — proof that a non-single can carry an album's reputation on songwriting alone.",
        ],
        meaning: {
          confirmed: [
            "Written and produced by Taylor Swift and Jack Antonoff, 'Getaway Car' was never released as a single and has no music video. On the Hot 100 it made only a minor No. 76 entry during reputation's release week, on pure streaming and sales; it is certified 4× Platinum in Australia (ARIA) and Platinum in the UK (BPI).",
          ],
          supported: [
            "It is widely named reputation's finest non-single and among Swift's best-written songs, praised for its cinematic 1980s synth-pop craft with Antonoff — a pulsing arpeggio that lifts in key and tempo into the celebrated bridge.",
            "It did not appear in the 2018 reputation Stadium Tour setlist; its live life began five years later on the Eras Tour, where it became a recurring, fan-favorite surprise song.",
            "It was never a US single and never got a music video; the only single service was to radio in Australia and New Zealand, which is why its chart footprint and certifications (4× Platinum ARIA) sit there rather than on the Hot 100 — the answer to the perennial 'why wasn't this a single' question fans ask about it.",
          ],
          fanTheories: [
            "The opening 'it was the best of times, the worst of crimes' is often read as a nod to Dickens's A Tale of Two Cities, and the Bonnie-and-Clyde / 'Thelma & Louise' framing as further cinematic allusion — readings the song's own crime-movie imagery supports but that Swift has not spelled out.",
            "Fans near-universally map the song to a well-photographed mid-2016 relationship handoff; Swift has never confirmed a real-life subject, so that mapping is unconfirmed.",
          ],
        },
        live: [
          {
            date: '2023-05-26',
            event: 'The Eras Tour — MetLife Stadium, East Rutherford',
            note: "Surprise-song debut on guitar with Jack Antonoff — the first of the tour's three MetLife nights, not the tour's opening night.",
          },
          {
            date: '2024-02',
            event: 'The Eras Tour — Melbourne',
            note: "Performed as a surprise-song mashup with 'August' and 'The Other Side of the Door.'",
          },
        ],
        connections: [
          {
            relatedId:
              'moment:vault-reputation-the-getaway-car-bridge-written-in-under-30-seconds-on-camera',
            label: 'The Getaway Car bridge, written in under 30 seconds on camera',
            why: "The filmed songwriting moment behind the track's most-praised section — the bridge fans consider its high point.",
          },
          {
            relatedId: 'song:out-of-the-woods',
            label: 'Out of the Woods',
            why: "Swift's other high-velocity escape song and a documented Eras mashup partner for 'Getaway Car' — the getaway/runaway lineage the two share.",
          },
          {
            relatedId: 'song:the-bolter',
            label: 'The Bolter',
            why: "Swift's later runaway-woman portrait and a documented Eras surprise-song mashup partner — both are songs about leaving before you can be left (cross-link candidate #1445).",
          },
        ],
        voices: [
          {
            who: 'Spencer Kornhaber',
            context: 'The Atlantic',
            note: "Singled it out as reputation's standout — 'the one true tune to hum misty-eyed after the movies.'",
          },
          {
            who: 'Stephen Thomas Erlewine',
            context: 'AllMusic',
            note: "Read the Antonoff cuts as Taylor at her most 'deeply felt and complex,' with 'vulnerability, melody, and confidence.'",
          },
        ],
        sources: [
          { name: 'Getaway Car (Taylor Swift song) — Wikipedia', url: 'https://en.wikipedia.org/wiki/Getaway_Car_(Taylor_Swift_song)' },
          { name: 'Billboard: All the Surprise Songs Taylor Swift Performed on The Eras Tour', url: 'https://www.billboard.com/lists/taylor-swift-eras-tour-surprise-songs/' },
          { name: 'Official Charts: Getaway Car — Taylor Swift', url: 'https://www.officialcharts.com/songs/taylor-swift-getaway-car/' },
          { name: 'Songfacts: Getaway Car', url: 'https://www.songfacts.com/facts/taylor-swift/getaway-car' },
        ],
      },
    },
    {
      slug: 'king-of-my-heart',
      trackNumber: 10,
      trackTitle: 'King of My Heart',
      youtubeId: '5U7bF68xcRg', // oEmbed-verified official Taylor Swift channel
      release: 'reputation',
      releaseDate: '2017-11-10',
      writers: ['Taylor Swift', 'Max Martin', 'Shellback'],
      producers: ['Max Martin', 'Shellback'],
      note: 'A relationship built in three acts of drum programming — each section written as a later stage of falling.',
      summary:
        'From liking her own company, to a new person breaking the cynicism, to full fanfare: the structure itself dramatizes commitment deepening. Luxury-brand boys lose to the one with the American smile.',
      inspiration: null,
      themes: ['stages of falling in love', 'substance over flash', 'contentment'],
      sourceUrl: 'https://en.wikipedia.org/wiki/King_of_My_Heart',
      sources: [wiki('King of My Heart', 'King_of_My_Heart', 'song article: structure'), ALBUM],
    },
    {
      slug: 'dancing-with-our-hands-tied',
      trackNumber: 11,
      trackTitle: 'Dancing with Our Hands Tied',
      youtubeId: 'erGyUphZSt8', // oEmbed-verified official Taylor Swift channel
      release: 'reputation',
      releaseDate: '2017-11-10',
      writers: ['Taylor Swift', 'Max Martin', 'Shellback', 'Oscar Holter'],
      producers: ['Max Martin', 'Shellback', 'Oscar Holter'],
      note: 'Loving someone while the internet watches with knives out — the era’s anxiety distilled into one held breath of a dance.',
      summary:
        'A romance conducted under hostile surveillance: they slow-dance inside the blast radius, certain the world will detonate it eventually. The stadium-tour acoustic version became its redemption arc.',
      inspiration: null,
      themes: ['love under scrutiny', 'dread', 'holding on anyway'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Dancing_with_Our_Hands_Tied',
      sources: [
        wiki(
          'Dancing with Our Hands Tied',
          'Dancing_with_Our_Hands_Tied',
          'song article: composition',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'dress',
      trackNumber: 12,
      trackTitle: 'Dress',
      youtubeId: 'FNEoPctNIUE', // oEmbed-verified official Taylor Swift channel
      release: 'reputation',
      releaseDate: '2017-11-10',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The most adult song in the catalog to that point — desire stated plainly enough that fans watched her parents’ reactions at the listening parties.',
      summary:
        'Friendship burning past its container: the golden-tattoo imagery and the bought-it-so-you-could-take-it-off thesis said what the earlier albums only implied.',
      inspiration:
        'Fans connect the buzzed-hair and flower details in the bridge to documented 2016 events (unconfirmed by Swift).',
      themes: ['desire', 'friends to lovers', 'grown-up candor'],
      fanLore: 'Fan reading (unconfirmed): the bridge details fans use to identify the subject.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Dress_(Taylor_Swift_song)',
      sources: [
        wiki('Dress (Taylor Swift song)', 'Dress_(Taylor_Swift_song)', 'song article: reception'),
        ALBUM,
      ],
    },
    {
      slug: 'this-is-why-we-cant-have-nice-things',
      trackNumber: 13,
      trackTitle: "This Is Why We Can't Have Nice Things",
      youtubeId: '6Z3QJ4L1Bg0', // oEmbed-verified official Taylor Swift channel
      release: 'reputation',
      releaseDate: '2017-11-10',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The party-crash diss track about a friendship that came with a knife in it — forgiveness gets offered mid-song and then gleefully retracted.',
      summary:
        'She throws a housewarming for her own success, names the betrayal that wrecked it, fake-raises a toast to forgiveness, and bursts out laughing instead. The album’s id, unsupervised.',
      inspiration:
        'Universally read as the Kanye West friendship post-2016 (unconfirmed in so many words); the golden-things-broken framing matches the era’s documented events beat for beat.',
      themes: ['betrayed trust', 'mock forgiveness', 'gleeful pettiness'],
      fanLore:
        'Fan/press reading: the West fallout as subject — treated as obvious, never officially footnoted.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Reputation_(album)',
      sources: [ALBUM],
    },
    {
      slug: 'call-it-what-you-want',
      trackNumber: 14,
      trackTitle: 'Call It What You Want',
      youtubeId: 'V54CEElTF_U', // oEmbed-verified official Taylor Swift channel
      release: 'reputation',
      releaseDate: '2017-11-10',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      isSingle: true,
      note: 'Released quietly before the album with lyric-video calligraphy — the castle fell, the kingdom shrank to two people, and she is fine with the downsize.',
      summary:
        'The peace treaty after the war tracks: her status collapsed, the fair-weather crowd left, and what remained was one person who stayed. The title dares the commentariat to keep labeling.',
      inspiration: null,
      themes: ['aftermath', 'love as refuge', 'indifference to opinion'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Call_It_What_You_Want_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Call It What You Want (Taylor Swift song)',
          'Call_It_What_You_Want_(Taylor_Swift_song)',
          'song article: promo release',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'new-years-day',
      trackNumber: 15,
      trackTitle: "New Year's Day",
      youtubeId: 'MWSn0H4qfAs', // oEmbed-verified official Taylor Swift channel
      release: 'reputation',
      releaseDate: '2017-11-10',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      isSingle: true,
      note: 'The piano closer that drops every mask on the album at once — she does not want the party, she wants the person holding the trash bag the morning after.',
      summary:
        'Love measured by who stays to clean up: glitter on the floor, candle wax, a ride home from the hospital someday. After twelve tracks of armor, the thesis lands barefoot in a kitchen.',
      inspiration:
        'Swift premiered it in a living-room session and pushed it to country radio — a deliberate callback to her roots at the end of her most synthetic record.',
      themes: ['staying', 'ordinary devotion', 'the morning after'],
      sourceUrl: "https://en.wikipedia.org/wiki/New_Year's_Day_(Taylor_Swift_song)",
      sources: [
        wiki(
          "New Year's Day (Taylor Swift song)",
          "New_Year's_Day_(Taylor_Swift_song)",
          'song article: country-radio release',
        ),
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "New Year's Day is the album's barefoot thesis: after twelve tracks of armor, the closer measures love by who stays to clean up — glitter on the floor, candle wax — choosing the morning-after over the midnight kiss.",
          "It doubled as the album's country-radio single, a deliberate nod back to where Swift started, closing her most synthetic record on a stripped Swift/Antonoff piano ballad.",
        ],
        meaning: {
          confirmed: [
            "Big Machine sent 'New Year's Day' to US country radio as a promotional single on November 15, 2017 and as an official single on November 27. It peaked at No. 33 on Hot Country Songs and No. 41 on Country Airplay and did not enter the Hot 100; it carries no US certification (only Australian Platinum, New Zealand Gold and UK Silver).",
            "Its first public airing was a pre-recorded, intimate living-room performance — filmed during her October 2017 Secret Sessions at her Rhode Island home — that aired during an ad break in ABC's Scandal on November 9, 2017, the day before reputation's release. There is no official narrative music video.",
          ],
          supported: [
            "Though often called the album's only Swift/Antonoff duo production, several reputation tracks share that pairing ('Call It What You Want,' 'Dress,' 'Getaway Car'); New Year's Day is best described as the sparsest of them, not the sole one.",
          ],
        },
        voices: [
          {
            who: 'Taylor Swift',
            context: 'at the reputation release party',
            note: "Said she wrote it after a big New Year's Eve party in London, explaining the truly romantic figure is 'who's gonna deal with you on New Year's Day. Who's willing to give you Advil and clean up the house.'",
          },
          {
            who: 'Jack Antonoff',
            note: "Said the song 'happened so quickly' at his apartment — 'we texted the next morning to make sure it wasn't a dream' — and that 'the sessions were just her and I,' with unwanted ambient sounds deliberately left in for intimacy.",
          },
        ],
        live: [
          {
            date: '2018',
            event: 'reputation Stadium Tour',
            note: "Performed on piano every night, mashed up with 'Long Live.'",
          },
          {
            date: '2023-08-09',
            event: 'The Eras Tour — SoFi Stadium, Los Angeles',
            note: "Debuted as a piano surprise song at the final LA show; later reprised in 2024 mashups, including with 'Peace' and, at the Vancouver finale, 'Long Live'/'The Manuscript.'",
          },
        ],
        connections: [
          {
            relatedId: 'song:call-it-what-you-want',
            label: 'Call It What You Want',
            why: "reputation's other hushed, private turn — love as shelter rather than spectacle — the closest sibling in tone and sequence.",
          },
          {
            relatedId: 'song:daylight',
            label: 'Daylight',
            why: "Lover's closer answers this one: both end an album on ordinary, durable devotion, making them a deliberate cross-record pair.",
          },
        ],
        sources: [
          { name: "New Year's Day (Taylor Swift song) — Wikipedia", url: "https://en.wikipedia.org/wiki/New_Year's_Day_(Taylor_Swift_song)" },
          { name: "Rolling Stone: 'New Year's Day' sent to country radio", url: 'https://www.rollingstone.com/country/news/taylor-swifts-new-years-day-sent-to-country-radio-w512049' },
          { name: "Songfacts: New Year's Day", url: 'https://www.songfacts.com/facts/taylor-swift/new-years-day' },
          { name: "ABC News: Taylor Swift performs 'New Year's Day' for fans at her home", url: 'https://abcnews.go.com/Entertainment/taylor-swift-performs-reputation-song-years-day-fans/story?id=51038508' },
        ],
      },
    },
];

export default {
  eraSlug: 'reputation',
  tracks: TRACKS,
};

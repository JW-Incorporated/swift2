// Vault theories/easter eggs — reputation era. All URLs verified 2026-07-08.
// lwymmd-* records added 2026-07-17 (Content Shift, #685/#686); URLs verified then.
// old-taylors-ending / lwymmd-et-tu-brute / reputation-tabloid-cover added
// 2026-07-24 (Content Shift, #686 density pass); URLs verified that session.

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
  eraSlug: 'reputation',
  theories: [
    {
      slug: 'snake-reclamation',
      kind: 'easter_egg',
      title: 'Reclaiming the snake',
      claim:
        'After the 2016 feud fallout flooded her comments with snake emoji, the reputation rollout weaponized it: glitchy snake teasers announced the era, a serpent slithered through the visuals, and a giant snake named Karyn towered over the stadium tour.',
      evidence:
        "The era launch was three wordless snake videos posted to blacked-out socials; 'Look What You Made Me Do' leaned all the way in (a snake serving tea); the Stadium Tour made the snake a mascot. A documented, deliberate reclamation arc — the insult became the brand.",
      confidence: 'official',
      outcome: 'confirmed',
      relatedSlugs: [],
      sources: [
        wiki('Look_What_You_Made_Me_Do', 'Look What You Made Me Do', 'documents the snake imagery and its feud context'),
        wiki('Kanye_West%E2%80%93Taylor_Swift_feud', 'Kanye West–Taylor Swift feud', 'the 2016 snake-emoji pile-on this answered'),
      ],
    },
    {
      slug: 'lwymmd-nils-sjoberg-gravestone',
      kind: 'easter_egg',
      title: 'A gravestone for Nils Sjöberg',
      claim:
        "In the 'Look What You Made Me Do' graveyard, the headstone beside the grave zombie-Taylor digs reads Nils Sjöberg — the Swedish pseudonym she used to secretly co-write Calvin Harris's 'This Is What You Came For,' buried on camera.",
      evidence:
        "Outlets ran full decoder guides the week the video premiered at the 2017 VMAs, and the gravestone was near the top of every list. The pseudonym's story was already public — the co-write came out messily after the Harris breakup in July 2016 — which is what made burying the name read as such a pointed goodbye to the era of hiding her own credits.",
      confidence: 'reputable_reporting',
      outcome: 'confirmed',
      relatedSlugs: ['reputation:snake-reclamation'],
      sources: [
        {
          source_url: 'https://time.com/4918411/taylor-swift-look-what-you-made-me-do-music-video-references/',
          source_title: "All the References You Might Have Missed in Taylor Swift's 'Look What You Made Me Do' Video",
          publisher: 'Time',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
          excerpt: null,
          notes: null,
        },
        {
          source_url: 'https://www.rollingstone.com/music/music-news/taylor-swifts-look-what-you-made-me-do-video-decoded-13-things-you-missed-126268/',
          source_title: "Taylor Swift's 'Look What You Made Me Do' Video Decoded: 13 Things You Missed",
          publisher: 'Rolling Stone',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
          excerpt: null,
          notes: null,
        },
      ],
    },
    {
      slug: 'lwymmd-dollar-bill',
      kind: 'theory',
      title: 'The single dollar in the bathtub of diamonds',
      claim:
        "In the 'Look What You Made Me Do' bathtub-of-jewels shot, a lone dollar bill sits beside her. Fans read it as the symbolic $1 she sued for — and won — in her Denver sexual assault trial, days before the video premiered.",
      evidence:
        'The timing does the arguing: the jury found in her favor on August 14, 2017, awarding the single symbolic dollar she had asked for, and the video premiered at the VMAs on August 27. Outlets covered the fan reading immediately, and a year later fans held up $1 bills at her Tampa show on the verdict\'s anniversary. Taylor has never confirmed the detail herself — which is why this stays a theory, not a fact.',
      confidence: 'strong_fan_consensus',
      outcome: 'pending',
      relatedSlugs: ['reputation:lwymmd-nils-sjoberg-gravestone'],
      sources: [
        {
          source_url: 'https://hellogiggles.com/taylor-swift-sexual-assault-trial-music-video/',
          source_title: 'The $1 Taylor Swift won during her sexual assault trial makes an appearance in "Look What You Made Me Do"',
          publisher: 'HelloGiggles',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 3,
          excerpt: null,
          notes: 'documents the fan reading of the video shot — the theory itself is the subject here',
        },
        {
          source_url: 'https://time.com/5367874/taylor-swift-sexual-assault/',
          source_title: 'Taylor Swift Speaks Out About Believing Sexual Assault Victims on Anniversary of Her Trial Verdict',
          publisher: 'Time',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
          excerpt: null,
          notes: 'anchors the underlying facts: the $1 verdict and the fans-holding-dollar-bills anniversary',
        },
      ],
    },
    {
      slug: 'old-taylors-ending',
      kind: 'easter_egg',
      title: 'A courtroom of old Taylors',
      claim:
        "The final 40 seconds of 'Look What You Made Me Do' line up a squabbling crowd of past Taylors — the personas from every earlier scene and era — who bicker in the words her own critics used, ending with the 2009 VMAs version snapping 'I would very much like to be excluded from this narrative,' met by a collective 'SHUT UP!'",
      evidence:
        "Each figure is a resurrected version of herself — the 'You Belong With Me' Junior Jewels tee, the 2014 Met Gala look, the snake-throne queen, zombie-Taylor from the video's own graveyard — and their lines quote real jabs ('There she goes playing the victim again,' 'Stop making that surprised face, it's so annoying'). The closing quote lifts verbatim from the statement she posted during the 2016 phone-call controversy, so the gag turns her most-mocked moments into a chorus she talks back to. Documented in the frame-by-frame decoder guides the week the video premiered at the 2017 VMAs.",
      confidence: 'reputable_reporting',
      outcome: 'confirmed',
      relatedSlugs: ['reputation:snake-reclamation', 'reputation:lwymmd-nils-sjoberg-gravestone'],
      sources: [
        {
          source_url: 'https://www.rollingstone.com/music/music-news/taylor-swifts-look-what-you-made-me-do-video-decoded-13-things-you-missed-126268/',
          source_title: "Taylor Swift's 'Look What You Made Me Do' Video Decoded: 13 Things You Missed",
          publisher: 'Rolling Stone',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          excerpt: null,
          notes: 'describes the tarmac line-up of Swift personas reciting familiar lines, incl. "excluded from this narrative"',
        },
        {
          source_url: 'https://time.com/4918411/taylor-swift-look-what-you-made-me-do-music-video-references/',
          source_title: "All the References You Might Have Missed in Taylor Swift's 'Look What You Made Me Do' Video",
          publisher: 'Time',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          excerpt: null,
          notes: 'the canonical references list cataloguing the past-selves that appear in the video',
        },
      ],
    },
    {
      slug: 'lwymmd-et-tu-brute',
      kind: 'easter_egg',
      title: '"Et Tu, Brute?" on the snake throne',
      claim:
        "In 'Look What You Made Me Do,' the arm of Taylor's throne and the columns flanking it are carved with 'Et Tu, Brute?' — Caesar's dying words to the friend who helped stab him — while a snake slithers up to pour her a cup of tea.",
      evidence:
        "The Latin tag frames the era's betrayal theme in one prop: Julius Caesar realizing his ally Brutus was among his assassins. Paired with the tea-pouring snake — a literal 'serving tea' pun that also reclaims the snake-emoji pile-on — the throne scene reads as the album's thesis staged as set design. Named in the frame-by-frame decoder guides that ran the week the video premiered.",
      confidence: 'reputable_reporting',
      outcome: 'confirmed',
      relatedSlugs: ['reputation:snake-reclamation'],
      sources: [
        {
          source_url: 'https://www.rollingstone.com/music/music-news/taylor-swifts-look-what-you-made-me-do-video-decoded-13-things-you-missed-126268/',
          source_title: "Taylor Swift's 'Look What You Made Me Do' Video Decoded: 13 Things You Missed",
          publisher: 'Rolling Stone',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          excerpt: null,
          notes: 'quotes the "Et tu Brute" throne inscription and the snake pouring tea',
        },
        {
          source_url: 'https://time.com/4918411/taylor-swift-look-what-you-made-me-do-music-video-references/',
          source_title: "All the References You Might Have Missed in Taylor Swift's 'Look What You Made Me Do' Video",
          publisher: 'Time',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          excerpt: null,
          notes: 'references list covering the throne-scene symbolism in the same video',
        },
      ],
    },
    {
      slug: 'reputation-tabloid-cover',
      kind: 'easter_egg',
      title: 'A cover printed like the tabloids',
      claim:
        "The reputation cover is built to look like newspaper: her face half-buried under black-and-white headline print. Zoom in and the 'headlines' aren't stories at all — the text just repeats 'Taylor Swift' over and over, turning years of tabloid coverage into a wall of her own name.",
      evidence:
        "The design (shot by Mert & Marcus) mimics tabloid front-page typography as a comment on the media narrative that had defined her since 2016 — and the rollout extended the joke, with Target-exclusive physical copies packaged as two magazine-style booklets styled like gossip rags. Outlets read the repeated-name newsprint as her taking the pen back: the press wrote her story, so she reprinted it as nothing but her signature.",
      confidence: 'reputable_reporting',
      outcome: 'confirmed',
      relatedSlugs: ['reputation:snake-reclamation'],
      sources: [
        {
          source_url: 'https://www.bustle.com/p/what-does-taylor-swifts-reputation-album-cover-art-mean-the-singer-may-be-reclaiming-her-image-78525',
          source_title: "What Does Taylor Swift's 'Reputation' Album Cover Art Mean?",
          publisher: 'Bustle',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 3,
          excerpt: null,
          notes: 'notes that on close inspection the newsprint "simply says Taylor Swift repeatedly," read as reclaiming her narrative',
        },
        {
          source_url: 'https://www.papermag.com/taylor-swifts-new-album-cover-for-reputation-is-headline-making',
          source_title: "Taylor Swift's New Album Cover for 'Reputation' Is...Headline-Making",
          publisher: 'PAPER',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 3,
          excerpt: null,
          notes: 'confirms the cover is modeled after a newspaper in response to the headlines about her',
        },
      ],
    },
  ],
};

// Vault theories/easter eggs — The Life of a Showgirl era.
// NOTE: the `the-life-of-a-showgirl` era row lands in rollout PR 2; this file
// seeds cleanly once it exists (the validator knows the slug as expected).
// All URLs verified 2026-07-08.

const wiki = (article, title, notes) => ({
  source_url: `https://en.wikipedia.org/wiki/${article}`,
  source_title: title,
  publisher: 'Wikipedia',
  source_type: 'wiki',
  accessed_at: '2026-08-08',
  reliability_score: 2,
  excerpt: null,
  notes: notes ?? null,
});

export default {
  eraSlug: 'the-life-of-a-showgirl',
  theories: [
    {
      slug: 'orange-era-clues',
      kind: 'theory',
      title: 'The orange era, called before the announcement',
      claim:
        'Through the TTPD stretch, TS12 watchers bet the next era\'s color was orange — reading glittery orange accents into late Eras Tour looks and posts. When The Life of a Showgirl arrived, the branding was orange head to toe.',
      evidence:
        'The album was announced on the New Heights podcast in August 2025 wrapped in glittering orange (and mint) — instantly validating months of color-watching. How much of the pre-announcement orange was planted versus pattern-matched has never been itemized, so the call is graded, not fully confirmed.',
      confidence: 'strong_fan_consensus',
      outcome: 'partially_confirmed',
      relatedSlugs: ['midnights:album-color-canon'],
      sources: [wiki('The_Life_of_a_Showgirl', 'The Life of a Showgirl', 'the orange-branded New Heights announcement is documented in the album article')],
    },
    {
      slug: 'ophelia-rewrite',
      kind: 'easter_egg',
      title: 'Ophelia, rewritten to live',
      claim:
        'The lead single "The Fate of Ophelia" flips Shakespeare: where Hamlet\'s Ophelia drowns in abandonment, the song\'s narrator is pulled out of that fate by love — a literary inversion fans and critics mapped line by line.',
      evidence:
        'The allusion is the title; coverage of the single documented the Hamlet inversion as the song\'s central conceit, continuing the quill-pen literary streak from TTPD (Peter Pan, Cassandra, Clara Bow).',
      confidence: 'reputable_reporting',
      outcome: 'confirmed',
      relatedSlugs: ['tortured-poets:peter-pan-throughline'],
      sources: [wiki('The_Fate_of_Ophelia', 'The Fate of Ophelia')],
    },
    {
      // Density pass for #686 (2026-08-11). TLOAS sat at a single easter egg
      // (ophelia-rewrite) while every legacy era had been lifted; folklore and
      // evermore stay with #445, so this newest era was the real gap in-lane.
      // Interpolation = an official songwriting credit, so this is a hard,
      // confirmed egg, not a fan read. Fact verified live 2026-08-11: the
      // Wikipedia song article documents the George Michael co-write. Kept the
      // titular hook out of our prose to stay well inside the lyric-quote limit.
      slug: 'father-figure-george-michael-interpolation',
      kind: 'easter_egg',
      title: "Father Figure, built on George Michael's own",
      claim:
        'Track 4, "Father Figure," is not just named after George Michael\'s 1987 classic — it interpolates it, rebuilding the hook and melody of Michael\'s chorus inside a TS12 song. The tell is in the credits: George Michael is listed as a co-writer, a Wham!-era hitmaker folded whole into the album decades on.',
      evidence:
        'An interpolation re-records a song\'s musical elements rather than sampling the original master, and it shows up as a formal songwriting credit — which is exactly where this one is documented, with George Michael credited as a co-writer on "Father Figure." Coverage describes Taylor\'s track as an interpolation of Michael\'s song, reusing its title-line hook and a similar melody. Reaching back into a specific catalog and crediting it in the liner metadata is the same buried-clue instinct that runs through her rollouts; here the clue is hiding in the songwriting credits themselves.',
      confidence: 'reputable_reporting',
      outcome: 'confirmed',
      relatedSlugs: ['the-life-of-a-showgirl:ophelia-rewrite'],
      sources: [
        {
          source_url: 'https://en.wikipedia.org/wiki/Father_Figure_(Taylor_Swift_song)',
          source_title: 'Father Figure (Taylor Swift song)',
          publisher: 'Wikipedia',
          source_type: 'wiki',
          accessed_at: '2026-08-11',
          reliability_score: 2,
          excerpt: null,
          notes:
            'Documents that the song interpolates George Michael\'s "Father Figure" (title-line hook + similar melody) and credits George Michael as a co-writer. Verified live 2026-08-11.',
        },
      ],
    },
    {
      // Density pass for #686 (2026-08-11). The "Track 5" tradition is a
      // Swift-acknowledged pattern, not a stretch: the fifth song is reliably
      // the album's most emotionally raw. Critics slotted "Eldest Daughter"
      // (confirmed track 5 here) straight into that lineage. Cross-era number/
      // structure lore, squarely the kind of egg this ticket wants. Verified
      // live 2026-08-11 against the song's Wikipedia article.
      slug: 'eldest-daughter-track-five',
      kind: 'easter_egg',
      title: 'Eldest Daughter and the Track 5 rule',
      claim:
        'Swifties treat track 5 as sacred: since Fearless, the fifth song on each album is reliably her most emotionally exposed — a pattern she has spoken about and fans now brace for. On The Life of a Showgirl, track 5 is "Eldest Daughter," and reviewers immediately read it as this album\'s Track 5 confessional.',
      evidence:
        'The "Track 5" convention — the album\'s most vulnerable, confessional song deliberately placed fifth — is a long-documented Taylor trademark running through the catalog (e.g. "The Archer" on Lover, "mirrorball" on folklore). "Eldest Daughter" is the fifth track on The Life of a Showgirl, and critics placed it directly in that lineage, comparing it to "The Archer" and "mirrorball" and their shared themes of perseverance, desperation and perfectionism. The egg is structural rather than hidden-in-the-art: knowing the rule tells a listener where to look for the album\'s emotional core before pressing play.',
      confidence: 'reputable_reporting',
      outcome: 'confirmed',
      relatedSlugs: ['the-life-of-a-showgirl:ophelia-rewrite'],
      sources: [
        {
          source_url: 'https://en.wikipedia.org/wiki/Eldest_Daughter',
          source_title: 'Eldest Daughter',
          publisher: 'Wikipedia',
          source_type: 'wiki',
          accessed_at: '2026-08-11',
          reliability_score: 2,
          excerpt: null,
          notes:
            'Confirms "Eldest Daughter" is the fifth track on The Life of a Showgirl and that critics compared it to prior Track 5 songs ("The Archer", "mirrorball"). Verified live 2026-08-11.',
        },
      ],
    },
    {
      // Density pass for #686 (2026-08-11). The lead-single video is documented
      // as carrying self-referential easter eggs; that is the egg. Verified live
      // 2026-08-11. NOTE: the source also lists a Kelce reference among the
      // video's callbacks — deliberately EXCLUDED here to stay clear of the
      // relationship redline; the egg is the track-to-track and Eras Tour
      // self-references plus the Science World cameo, all about the art.
      slug: 'ophelia-video-self-references',
      kind: 'easter_egg',
      title: 'The Ophelia video, hiding the rest of the album',
      claim:
        'The video for lead single "The Fate of Ophelia" is seeded with easter eggs — visual callbacks to other songs on The Life of a Showgirl and to moments from the Eras Tour — plus a brief cameo of Vancouver\'s Science World near the end. The rollout hid the album inside its own opening visual.',
      evidence:
        'Documentation of the video notes that it features easter eggs referencing other tracks from The Life of a Showgirl and moments from the Eras Tour, and that Vancouver\'s Science World makes a brief appearance near the end. Planting references to the record\'s other songs inside the first video is the same self-referential clue-laying — the album teasing itself — that has defined her visual rollouts since the reputation and Lover eras; here it runs through the era\'s very first frames.',
      confidence: 'reputable_reporting',
      outcome: 'confirmed',
      relatedSlugs: ['the-life-of-a-showgirl:ophelia-rewrite'],
      sources: [
        {
          source_url: 'https://en.wikipedia.org/wiki/The_Fate_of_Ophelia',
          source_title: 'The Fate of Ophelia',
          publisher: 'Wikipedia',
          source_type: 'wiki',
          accessed_at: '2026-08-11',
          reliability_score: 2,
          excerpt: null,
          notes:
            'Documents that the music video features easter eggs referencing other TLOAS tracks and Eras Tour moments, and a Science World cameo. The Kelce reference the source also lists is intentionally omitted per the privacy redlines. Verified live 2026-08-11.',
        },
      ],
    },
    {
      // Density pass for #686 (2026-08-11). Number lore — explicitly named in
      // the ticket as fair game. The 12-on-12 alignment is FACT (twelfth studio
      // album, twelve-track standard edition, both verified live 2026-08-11);
      // whether it is a deliberate wink is the fan read, so this is graded, not
      // asserted. No relationship/announcement framing — pure numerics.
      slug: 'ts12-twelfth-album-twelve-tracks',
      kind: 'easter_egg',
      title: 'TS12: the twelfth album, twelve tracks',
      claim:
        'The Life of a Showgirl is Taylor\'s twelfth studio album, and its standard edition runs exactly twelve tracks — the era Swifties had been counting toward and tagging "TS12" before it had a title. Fans read the twelve-on-twelfth alignment as one more of her deliberate number games.',
      evidence:
        'The album is her twelfth studio LP and its standard tracklist is twelve songs long — both plain, documented facts. Taylor has a long, self-acknowledged history of number play (the recurring 13 motif; release dates and track counts used as planted clues), which is why fans read the twelve-on-twelfth symmetry as intentional rather than incidental. The alignment itself is verified fact; the intent behind it is the fan reading, so the egg is graded partially confirmed — the numbers line up, but Taylor has not itemized this one as a wink.',
      confidence: 'strong_fan_consensus',
      outcome: 'partially_confirmed',
      relatedSlugs: ['the-life-of-a-showgirl:orange-era-clues'],
      sources: [
        {
          source_url: 'https://en.wikipedia.org/wiki/The_Life_of_a_Showgirl',
          source_title: 'The Life of a Showgirl',
          publisher: 'Wikipedia',
          source_type: 'wiki',
          accessed_at: '2026-08-11',
          reliability_score: 2,
          excerpt: null,
          notes:
            'Confirms it is her twelfth studio album with a twelve-track standard edition. Verified live 2026-08-11.',
        },
      ],
    },
    {
      // Authored 2026-07-20 from intake #945. A fan easter-egg read of an
      // unannounced platform change — belongs on the theory track (confidence +
      // outcome badges), never in confirmed narrative. Verified before writing:
      // the canvas swap itself and the "no one knows what it means yet" framing
      // were confirmed against Just Jared (search-corroborated; UA-blocked to a
      // raw fetch) AND geo.tv, which reads cleanly. Nothing is announced, so
      // this is authored as fans reading a tease, never as "a re-recording is
      // coming." The specific decodings are attributed to fans throughout; the
      // release dates cited (debut Oct 24 2006, Speak Now Oct 25 2010, Red Oct
      // 22 2012) are real, and Oct 23 2026 does fall on a Friday. Clean under
      // the privacy redlines: no location, no third parties, no private lives —
      // a pure symbolism/easter-egg item, which the redlines list as admissible.
      slug: 'showgirl-spotify-canvas-color-swap',
      kind: 'theory',
      title: 'The Spotify canvas colors that set off a re-recording hunt',
      claim:
        'Over the weekend of July 18–19, 2026, fans clocked that Taylor had quietly swapped the Spotify canvases — the short looping visuals behind a track — on three songs: "I Knew It, I Knew You" went green, its Piano Version purple, and "Blank Space" red. Swifties read the color-coding as an easter-egg tease of a re-recording, most loudly a debut "Taylor\'s Version."',
      evidence:
        'The change itself is documented — Just Jared (Bradley Stern, July 20) and geo.tv both logged the three new canvases — but nothing was announced, and Just Jared\'s own line was that "no one seems to know what it means yet." Everything past the color swap is fan decoding, and the reads openly contradict each other. The loudest leans on green as debut\'s color, pointing to a debut "Taylor\'s Version." A date-code version lines up the three albums\' release days — debut on Oct 24, Speak Now on Oct 25, Red on Oct 22 — and fixates on the missing Oct 23, a Friday in 2026 and Taylor\'s usual release day. A numerology version adds the albums\' places in her catalog (Red 4th + Speak Now 3rd + reputation 6th = 13). None of them cleanly accounts for "Blank Space," a 1989 track that belongs to none of those records — which is exactly why it stays a theory. If a re-recording or new release follows, this promotes with the citation; if it goes quiet, it fades.',
      confidence: 'plausible',
      outcome: 'pending',
      relatedSlugs: ['the-life-of-a-showgirl:orange-era-clues'],
      sources: [
        {
          source_url:
            'https://www.justjared.com/2026/07/20/taylor-swift-fans-spiral-over-tiny-spotify-change-fueling-new-album-taylors-version-theories/',
          source_title:
            "Taylor Swift Fans Spiral Over Tiny Spotify Change, Fueling New Album & 'Taylor's Version' Theories",
          publisher: 'Just Jared',
          source_type: 'reputable_press',
          accessed_at: '2026-08-24',
          reliability_score: 3,
          excerpt: null,
          notes:
            'Bradley Stern, 2026-07-20. Names the three tracks/colors and the two fan theories; UA-blocked to a raw fetch, corroborated via search + geo.tv. Re-checked 2026-08-24 (Vault Run rumor lifecycle): status verified still pending — no re-recording/new-era announcement or debunk has landed since; the fresher Aug 20 ESB "green TS" signal is the same open hunt, not a resolution.',
        },
        {
          source_url:
            'https://www.geo.tv/latest/673940-taylor-swift-sparks-curiosity-with-new-easter-eggs-on-streaming-platforms',
          source_title:
            'Taylor Swift sparks curiosity with new "Easter Eggs" on streaming platforms',
          publisher: 'Geo.tv',
          source_type: 'reputable_press',
          accessed_at: '2026-08-24',
          reliability_score: 3,
          excerpt: null,
          notes:
            'Independent readable confirmation of the red/green/purple canvas swap and that "Swifties continue to theorise and wait until an official announcement is made."',
        },
      ],
    },
    {
      // Authored 2026-07-25 from intake #1525. A resolved song-meaning theory
      // about Taylor's public-facing musical orbit — squarely inside the
      // rumors/theories allowance, and it belongs on the theory track (badges),
      // never in confirmed narrative. Verified before writing: Dessner's exact
      // "Yeah, definitely not" quote and the "friend's ex" origin against the
      // July 21 Billboard interview, corroborated by NME and E! News (search +
      // fetch; Billboard itself 307-redirects to a paywall proxy, so it is
      // cited from the corroborating reads). Clean under the privacy redlines:
      // Dessner said he did not even know the private person's identity, so no
      // third party is exposed (redline #5) — the denial is only about a song's
      // subject. The intake's "debuted at London's O2 in March 2025" detail was
      // NOT independently verified this pass and is left out; see ledger.
      slug: 'gracie-abrams-death-wish-not-about-taylor',
      kind: 'theory',
      title: 'The "Death Wish" theory, shut down by its own co-writer',
      claim:
        'When Gracie Abrams\'s "Death Wish" circulated, some Swifties read its lines about power, cruelty and a damaged relationship as a coded shot at Taylor — folding Abrams, one of Taylor\'s close friends and Eras Tour openers, into a supposed hidden feud.',
      evidence:
        'The song\'s co-writer and producer, Aaron Dessner — the same collaborator behind folklore and evermore — was asked about the theory head-on in a July 21, 2026 Billboard interview and shut it down flatly: "Yeah, definitely not." He said Abrams wrote it "at a time when [Gracie] was writing about a friend\'s ex, being in a bad relationship," and added that he did not even know the person\'s identity — so there is no hidden third party to expose, and nothing about Taylor in it. NME and E! News carried the same denial. The reading was always a fan inference stacked on a public friendship, never anything Abrams or Dessner had suggested; on the record from the man who helped write the song, it resolves debunked.',
      confidence: 'confirmed_interview',
      outcome: 'debunked',
      sources: [
        {
          source_url:
            'https://www.billboard.com/music/music-news/aaron-dessner-gracie-abrams-death-wish-noah-kahan-interview-1236299956/',
          source_title:
            "Aaron Dessner Sets the Record Straight on Gracie Abrams' 'Death Wish': It's 'Definitely Not' About Taylor Swift",
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: '2026-08-24',
          reliability_score: 4,
          excerpt: null,
          notes:
            'The July 21, 2026 interview carrying Dessner\'s "Yeah, definitely not" and the "friend\'s ex" origin. Billboard 307-redirects to a paywall proxy on a raw fetch; quote confirmed via the NME and E! reads below plus search. Re-checked 2026-08-24 (Vault Run rumor lifecycle): the debunk stands unchanged — no reversal; Wikipedia\'s "Death Wish" article carries the same "about a friend\'s narcissist ex" origin.',
        },
        {
          source_url:
            'https://www.nme.com/news/music/the-nationals-aaron-dessner-speaks-out-on-if-gracie-abrams-death-wish-is-about-taylor-swift-3958555',
          source_title:
            "The National's Aaron Dessner speaks out on if Gracie Abrams' 'Death Wish' is about Taylor Swift",
          publisher: 'NME',
          source_type: 'reputable_press',
          accessed_at: '2026-07-25',
          reliability_score: 4,
          excerpt: null,
          notes:
            'Independent corroboration of the "definitely not" denial and the friend\'s-ex origin, attributing it to the Billboard interview.',
        },
        {
          source_url: 'https://www.eonline.com/news/1434254/gracie-abrams-song-death-wish-is-not-about-taylor-swift',
          source_title: 'Gracie Abrams Song "Death Wish" Is Not About Taylor Swift',
          publisher: 'E! News',
          source_type: 'reputable_press',
          accessed_at: '2026-07-25',
          reliability_score: 3,
          excerpt: null,
          notes: 'Second independent outlet carrying the same on-record denial.',
        },
      ],
    },
  ],
};

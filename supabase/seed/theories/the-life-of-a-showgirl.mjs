// Vault theories/easter eggs — The Life of a Showgirl era.
// NOTE: the `the-life-of-a-showgirl` era row lands in rollout PR 2; this file
// seeds cleanly once it exists (the validator knows the slug as expected).
// All URLs verified 2026-07-08.

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
          accessed_at: '2026-07-20',
          reliability_score: 3,
          excerpt: null,
          notes:
            'Bradley Stern, 2026-07-20. Names the three tracks/colors and the two fan theories; UA-blocked to a raw fetch, corroborated via search + geo.tv.',
        },
        {
          source_url:
            'https://www.geo.tv/latest/673940-taylor-swift-sparks-curiosity-with-new-easter-eggs-on-streaming-platforms',
          source_title:
            'Taylor Swift sparks curiosity with new "Easter Eggs" on streaming platforms',
          publisher: 'Geo.tv',
          source_type: 'reputable_press',
          accessed_at: '2026-07-20',
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
      confidence: 'reputable_reporting',
      outcome: 'debunked',
      sources: [
        {
          source_url:
            'https://www.billboard.com/music/music-news/aaron-dessner-gracie-abrams-death-wish-noah-kahan-interview-1236299956/',
          source_title:
            "Aaron Dessner Sets the Record Straight on Gracie Abrams' 'Death Wish': It's 'Definitely Not' About Taylor Swift",
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: '2026-07-25',
          reliability_score: 4,
          excerpt: null,
          notes:
            'The July 21, 2026 interview carrying Dessner\'s "Yeah, definitely not" and the "friend\'s ex" origin. Billboard 307-redirects to a paywall proxy on a raw fetch; quote confirmed via the NME and E! reads below plus search.',
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

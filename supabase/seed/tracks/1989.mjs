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
      ],
    },
    {
      slug: 'blank-space',
      trackNumber: 2,
      trackTitle: 'Blank Space',
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
      ],
    },
    {
      slug: 'out-of-the-woods',
      trackNumber: 4,
      trackTitle: 'Out of the Woods',
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
      ],
    },
    {
      slug: 'how-you-get-the-girl',
      trackNumber: 10,
      trackTitle: 'How You Get the Girl',
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

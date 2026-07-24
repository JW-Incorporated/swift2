// Vault track guide — folklore era (folklore, 2020). Original prose only —
// never lyrics; unconfirmed readings are labeled. Provenance per
// docs/content/content-audit-2026-07-08.md §5 (URLs verified 2026-07-08).
// Era context: the surprise-released fiction album — first-person stories that
// are explicitly not all hers. William Bowery was confirmed as Joe Alwyn in
// the Long Pond Studio Sessions film. Grammy Album of the Year, 2021.
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
  'Folklore (Taylor Swift album)',
  'Folklore_(Taylor_Swift_album)',
  'album article: release facts, credits, and cited interviews',
);

export default {
  eraSlug: 'folklore',
  tracks: [
    {
      slug: 'the-1',
      trackNumber: 1,
      trackTitle: 'the 1',
      youtubeId: 'KsZ6tROaVOQ', // oEmbed-verified official Taylor Swift channel
      release: 'folklore',
      releaseDate: '2020-07-24',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Aaron Dessner'],
      note: 'The breezy what-if opener — casual on the surface, gutted underneath, and the first sign the album would trade confession for character work.',
      summary:
        'Someone doing fine, honestly, catches herself doing the math on the one who got away: a shrug with a bruise under it.',
      inspiration: null,
      themes: ['the one that got away', 'wistful acceptance', 'parallel lives'],
      sourceUrl: 'https://en.wikipedia.org/wiki/The_1',
      sources: [wiki('The 1', 'The_1', 'song article: composition'), ALBUM],
    },
    {
      slug: 'cardigan',
      trackNumber: 2,
      trackTitle: 'cardigan',
      youtubeId: 'K-a8s8OLBSE', // oEmbed-verified official Taylor Swift channel
      release: 'folklore',
      releaseDate: '2020-07-24',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Aaron Dessner'],
      singleReleaseDate: '2020-07-24',
      note: 'The lead single and Betty’s side of the confirmed-fictional teenage love triangle — it debuted at Hot 100 No. 1 the same week the album topped the chart.',
      summary:
        'Betty, years later, remembers being young and discarded and chosen again — the title image is being someone’s favorite old comfort object rescued from under the bed.',
      inspiration:
        'Confirmed by Swift: one of three songs (with betty and august) telling an invented love triangle from three perspectives.',
      themes: ['teenage love triangle', 'being chosen late', 'memory'],
      easterEggs:
        'Real cardigans were the merch drop; the James/Betty/Inez names came from friends’ children, confirmed on record.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Cardigan_(song)',
      sources: [
        wiki(
          'Cardigan (song)',
          'Cardigan_(song)',
          'song article: triangle concept and chart history',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'the-last-great-american-dynasty',
      trackNumber: 3,
      trackTitle: 'the last great american dynasty',
      youtubeId: '2s5xdY6MCeI', // oEmbed-verified official Taylor Swift channel
      release: 'folklore',
      releaseDate: '2020-07-24',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Aaron Dessner'],
      note: 'The Rebekah Harkness biography — the real socialite who owned Swift’s Rhode Island mansion decades before her, until the last verse hands the story to Taylor herself.',
      summary:
        'A gossiped-about widow scandalizes a New England town for fifty years; then the narrator buys the house and inherits the reputation. History as a hand-me-down.',
      inspiration:
        'Confirmed: about Rebekah Harkness, previous owner of Swift’s Holiday House in Watch Hill — Swift learned the story when she bought the property.',
      themes: ['women labeled mad', 'inherited notoriety', 'history rhyming'],
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Last_Great_American_Dynasty',
      sources: [
        wiki(
          'The Last Great American Dynasty',
          'The_Last_Great_American_Dynasty',
          'song article: Harkness history',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'exile',
      trackNumber: 4,
      trackTitle: 'exile',
      youtubeId: 'osdoLjUNFnA', // oEmbed-verified official Taylor Swift channel
      release: 'folklore',
      releaseDate: '2020-07-24',
      writers: ['Taylor Swift', 'William Bowery', 'Justin Vernon'],
      producers: ['Aaron Dessner'],
      isSingle: true,
      note: 'The Bon Iver duet born from Joe Alwyn playing piano around the house — two exes arguing in parallel, never actually hearing each other.',
      summary:
        'A breakup staged as two monologues: he saw no warning signs, she gave hundreds — the album’s masterclass in talking past someone you loved.',
      inspiration:
        'Confirmed in the Long Pond sessions: Alwyn (as William Bowery) wrote the piano part and first melody; Vernon recorded his half remotely mid-pandemic.',
      themes: ['miscommunication', 'exile from a shared world', 'two truths'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Exile_(song)',
      sources: [
        wiki('Exile (song)', 'Exile_(song)', 'song article: Bowery confirmation and duet history'),
        ALBUM,
      ],
    },
    {
      slug: 'my-tears-ricochet',
      trackNumber: 5,
      trackTitle: 'my tears ricochet',
      youtubeId: 'OWbDJFtHl3w', // oEmbed-verified official Taylor Swift channel
      release: 'folklore',
      releaseDate: '2020-07-24',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'Track 5, solo-written, and the first song composed for the album — a funeral where the man who wrecked her shows up to grieve what he sold.',
      summary:
        'Narrated from inside a casket: a tormentor mourns the very person he cast out. Swift described it as being about an embittered betrayer attending the funeral he caused — fans read the masters sale directly onto it.',
      inspiration:
        'Confirmed as the album’s first-written song, described by Swift in the Long Pond film in stolen-legacy terms. In a December 2020 Entertainment Weekly interview she confirmed the 2019 sale of her masters shaped it (alongside “mad woman”) — so the masters mapping is Swift-stated, not merely fan reading.',
      themes: ['betrayal by a former ally', 'stolen legacy', 'grief as haunting'],
      fanLore:
        'The line-by-line mapping onto the Braun/Big Machine principals stays fan close-reading, but Swift has confirmed the masters dispute as the song’s emotional source.',
      sourceUrl: 'https://en.wikipedia.org/wiki/My_Tears_Ricochet',
      sources: [
        wiki(
          'My Tears Ricochet',
          'My_Tears_Ricochet',
          'song article: production, charts, reception, certifications',
        ),
        ALBUM,
        {
          source_url: 'https://www.nme.com/news/music/taylor-swift-says-her-dispute-with-scooter-braun-felt-like-a-divorce-2834880',
          source_title: 'Taylor Swift says her dispute with Scooter Braun felt like a divorce',
          publisher: 'NME',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
        },
      ],
      dossier: {
        whyItMatters: [
          'folklore’s track five and the first song written for the entire album — a funeral ballad narrated from inside the casket, where the man who wrecked the narrator turns up to grieve what he sold. It is routinely cited among Swift’s finest deep cuts.',
        ],
        meaning: {
          confirmed: [
            'Swift produced it with Jack Antonoff; it was recorded at Kitty Committee (Los Angeles) and Long Pond (Hudson Valley) and was the first song composed for folklore. Its swelling, gospel-like finale is built on choir-inflected layered backing vocals, Antonoff among the voices.',
            'In a December 2020 Entertainment Weekly interview Swift confirmed the 2019 sale of her masters was the emotional source for this song and “mad woman.”',
          ],
          supported: [
            'It debuted at No. 16 on the Billboard Hot 100 (its peak) and reached No. 3 on Hot Rock & Alternative Songs; despite never being a single it was certified Platinum in the UK and 3× Platinum in Australia, and later featured in the trailer and soundtrack of the film It Ends with Us (2024).',
          ],
          fanTheories: [
            'The line-by-line mapping onto the Braun/Big Machine principals is fan close-reading; Swift confirmed the masters dispute as the source but has not footnoted individual lyrics.',
          ],
        },
        connections: [
          {
            relatedId: 'moment:vault-folklore-my-tears-ricochet-the-first-song-written-for-the-album-alone',
            label: 'my tears ricochet, the first song written for the album',
            why: 'The moment page documents this track’s origin as folklore’s first-written song and its confirmed masters-dispute inspiration.',
          },
          {
            relatedId: 'moment:vault-folklore-her-masters-get-sold-again-this-time-to-shamrock-capital-for',
            label: 'Her masters sold to Shamrock',
            why: 'The business event Swift named as the song’s source — the second sale of her first six albums, the “stolen legacy” the funeral conceit grieves.',
          },
          {
            relatedId: 'moment:vault-ttpd-all-of-the-music-ive-ever-made-now-belongs-to-me',
            label: 'She buys her masters back',
            why: 'The 2025 resolution of the standoff the song was born from — the catalog it mourns finally returned to her.',
          },
          {
            relatedId: 'song:mad-woman',
            label: 'mad woman',
            why: 'folklore’s other masters-dispute song — Swift named the two together in the same EW interview; mad woman answers this song’s grief with rage.',
          },
        ],
        live: [
          {
            date: '2023-03-17',
            event: 'The Eras Tour',
            note: 'A fixed part of the folklore segment across the 2023–24 tour (originally its fifth song; from May 9, 2024 the sixth song of the combined folklore + evermore section), and included in the Eras Tour concert film.',
          },
        ],
        voices: [
          {
            who: 'Ann Powers',
            context: 'NPR',
            note: 'Called it “more sophisticated” while staying “classic Taylor Swift.”',
          },
          {
            who: 'NME',
            note: '“A megawatt pop song is encased in layered vocals and twinkling music-box instrumentals.”',
          },
        ],
        sources: [
          { name: 'My Tears Ricochet — Wikipedia', url: 'https://en.wikipedia.org/wiki/My_Tears_Ricochet' },
          {
            name: 'Taylor Swift says her dispute with Scooter Braun felt like a divorce — NME',
            url: 'https://www.nme.com/news/music/taylor-swift-says-her-dispute-with-scooter-braun-felt-like-a-divorce-2834880',
          },
        ],
      },
    },
    {
      slug: 'mirrorball',
      trackNumber: 6,
      trackTitle: 'mirrorball',
      youtubeId: 'KaM1bCuG4xo', // oEmbed-verified official Taylor Swift channel
      release: 'folklore',
      releaseDate: '2020-07-24',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The disco-ball confession written days after the tour cancellations — a performer wondering who she is when no one needs the show.',
      summary:
        'She is a mirrorball: assembled from reflective fragments, spinning hardest when the crowd might leave. Written, per the Long Pond film, right after the pandemic pulled her stages away.',
      inspiration:
        'Confirmed in the Long Pond sessions: composed in the first weeks of lockdown, directly about performing identity with nowhere to perform.',
      themes: ['performing the self', 'people-pleasing', 'fragility'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Mirrorball_(song)',
      sources: [
        wiki('Mirrorball (song)', 'Mirrorball_(song)', 'song article: lockdown writing context'),
        ALBUM,
      ],
    },
    {
      slug: 'seven',
      trackNumber: 7,
      trackTitle: 'seven',
      youtubeId: 'pEY-GPsru_E', // oEmbed-verified official Taylor Swift channel
      release: 'folklore',
      releaseDate: '2020-07-24',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Aaron Dessner'],
      note: 'Track seven, about being seven — a childhood friendship in Pennsylvania remembered like a folk song passed down.',
      summary:
        'Two little girls, one of them living in a frightening house, plotting pirate escapes to India: childhood loyalty recalled before the narrator understood what she was seeing. Love as an heirloom you keep passing on.',
      inspiration:
        'Swift placed it in her own Pennsylvania childhood geography; the friend and her troubled home are drawn with deliberate, unresolved ambiguity.',
      themes: ['childhood memory', 'innocent witness to trouble', 'love passed down'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Seven_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Seven (Taylor Swift song)',
          'Seven_(Taylor_Swift_song)',
          'song article: composition and reception',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'august',
      trackNumber: 8,
      trackTitle: 'august',
      youtubeId: 'nn_0zPAfyo8', // oEmbed-verified official Taylor Swift channel
      release: 'folklore',
      releaseDate: '2020-07-24',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The third corner of the love triangle — the girl with no name in the other two songs gets the most sympathetic song of the three.',
      summary:
        'The summer fling from the other woman’s side: she knew he was never hers, and wanted him anyway. Swift has defended Augustine on the record — not a villain, just a girl who hoped.',
      inspiration:
        'Confirmed as the triangle’s third perspective; in the Long Pond film Swift named the character Augustine and argued for her sympathetically.',
      themes: ['the other girl', 'summer as a whole lifetime', 'hope against fact'],
      easterEggs:
        'August slipping away like a bottle of wine became an annual fan ritual every August 1st — a documented yearly meme-moment.',
      sourceUrl: 'https://en.wikipedia.org/wiki/August_(song)',
      sources: [wiki('August (song)', 'August_(song)', 'song article: triangle role'), ALBUM],
    },
    {
      slug: 'this-is-me-trying',
      trackNumber: 9,
      trackTitle: 'this is me trying',
      youtubeId: '9bdLTPNrlEg', // oEmbed-verified official Taylor Swift channel
      release: 'folklore',
      releaseDate: '2020-07-24',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'Three verses, three different people barely holding on — Swift said one narrator is fighting addiction, another squandered potential, all of them showing up anyway.',
      summary:
        'Effort as the whole achievement: pulling up to a driveway you almost drove past, one year sober with no one clapping. The bar is on the floor and clearing it is heroic.',
      inspiration:
        'Swift described the multiple-narrator design in the Long Pond film — deliberately voicing people whose trying is invisible from outside.',
      themes: ['addiction and recovery', 'invisible effort', 'compassion'],
      sourceUrl: 'https://en.wikipedia.org/wiki/This_Is_Me_Trying',
      sources: [
        wiki('This Is Me Trying', 'This_Is_Me_Trying', 'song article: narrator design'),
        ALBUM,
      ],
    },
    {
      slug: 'illicit-affairs',
      trackNumber: 10,
      trackTitle: 'illicit affairs',
      youtubeId: 'MLV2SJKWk4M', // oEmbed-verified official Taylor Swift channel
      release: 'folklore',
      releaseDate: '2020-07-24',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'An affair anatomized in second person — the dwindling mercurial high, the private language, the ruin. The bridge is a fan-canonized scream.',
      summary:
        'Instructions for sneaking around, curdling into an indictment: an affair builds a secret world exactly one person wide, then bills you for it a million times over.',
      inspiration: null,
      themes: ['infidelity', 'secret worlds', 'self-erasure'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Illicit_Affairs',
      sources: [wiki('Illicit Affairs', 'Illicit_Affairs', 'song article: composition'), ALBUM],
    },
    {
      slug: 'invisible-string',
      trackNumber: 11,
      trackTitle: 'invisible string',
      youtubeId: 'OuFnpmGwg5k', // oEmbed-verified official Taylor Swift channel
      release: 'folklore',
      releaseDate: '2020-07-24',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Aaron Dessner'],
      note: 'The fate song — every wrong turn retroactively revealed as a route, borrowing the East Asian red-thread myth in gold.',
      summary:
        'A relationship audit that finds providence everywhere: teenage jobs, cruel exes, chance timing — all of it now reads as one string pulling two people together. Even old wounds get thanked.',
      inspiration:
        'Built openly on the invisible-thread-of-fate folk motif, recolored gold and threaded with literary references (Jane Eyre, Hemingway’s The Sun Also Rises). Fans and outlets map the biographical details — the “teal was the color of your shirt” line, “sixteen at the yogurt shop,” the park — onto Swift’s own history; neither Swift nor Dessner has confirmed those readings, so they stay inference the song openly invites.',
      themes: ['fate', 'retrospective meaning', 'gratitude for the detours'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Invisible_String',
      sources: [
        wiki('Invisible String', 'Invisible_String', 'song article: motif, production, charts, reception'),
        ALBUM,
        {
          source_url: 'https://www.thefader.com/2020/07/24/taylor-swift-folklore-album-review-2020-national-essay',
          source_title: 'Taylor Swift frees herself from tabloid drama on folklore',
          publisher: 'The FADER',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
        },
      ],
      dossier: {
        whyItMatters: [
          'One of folklore’s most beloved deep cuts and the album’s clearest statement of its thesis — that a life’s worth of wrong turns can read, in hindsight, as a single route. Jon Caramanica of The New York Times singled it out as “the only truly hopeful-sounding song” on an album otherwise steeped in loss.',
        ],
        meaning: {
          confirmed: [
            'Aaron Dessner co-wrote and produced it; the aged, fingerpicked guitar figure comes from a “rubber bridge” guitar — a rubber strip laid over the bridge that, in Dessner’s words, “deadens the strings so that it sounds old.” His brother Bryce Dessner arranged the strings.',
            'As an album cut, never released as a single, it debuted at No. 37 on the Billboard Hot 100 (chart dated Aug. 8, 2020) and was later certified Platinum in Australia and Gold in the UK.',
          ],
          supported: [
            'The title recolors the East-Asian red-thread-of-fate folk motif as a single thread of gold — the same gold Swift uses elsewhere for arrived, settled love.',
          ],
          fanTheories: [
            'The biographical mapping (the teal-shirt line, the yogurt-shop job, the park) onto Swift’s own documented history is fan and press reading the lyric invites; it has never been confirmed by Swift or Dessner.',
          ],
        },
        connections: [
          {
            relatedId: 'song:daylight',
            label: 'Daylight',
            why: 'invisible string paints arrived love as “one single thread of gold”; Lover’s closer “Daylight” reaches the same resolution in the same color (“it’s golden, like daylight”) — the shared gold-as-safe-love motif.',
          },
          {
            relatedId: 'song:dorothea',
            label: 'dorothea',
            why: 'Both are folklore-family songs rooted in hometown memory — invisible string threads teenage Nashville into a love story, while dorothea looks back at the small town someone left behind.',
          },
        ],
        live: [
          {
            date: '2023-03-17',
            event: 'The Eras Tour — Glendale (opening night)',
            note: 'Opened the folklore set for the tour’s first four shows before “The 1” took the slot from the Arlington stop (Mar. 31, 2023) onward; briefly revived for Nashville’s second night as a hometown nod.',
          },
          {
            date: '2024-07-17',
            event: 'The Eras Tour — Gelsenkirchen',
            note: 'Returned as a surprise-song mashup with “Superstar” (Fearless).',
          },
        ],
        voices: [
          {
            who: 'Jason Lipshutz',
            context: 'Billboard',
            note: 'Ranked it the best song on folklore, praising its “sumptuous intricacies.”',
          },
          {
            who: 'NPR',
            context: '100 Best Songs of 2020',
            note: 'Placed “invisible string” at No. 22 on its year-end list.',
          },
        ],
        sources: [
          { name: 'Invisible String — Wikipedia', url: 'https://en.wikipedia.org/wiki/Invisible_String' },
          {
            name: 'Taylor Swift frees herself from tabloid drama on folklore — The FADER',
            url: 'https://www.thefader.com/2020/07/24/taylor-swift-folklore-album-review-2020-national-essay',
          },
        ],
      },
    },
    {
      slug: 'mad-woman',
      trackNumber: 12,
      trackTitle: 'mad woman',
      youtubeId: '6DP4q_1EgQQ', // oEmbed-verified official Taylor Swift channel
      release: 'folklore',
      releaseDate: '2020-07-24',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Aaron Dessner'],
      note: 'The angriest song on the quietest album — how calling a woman crazy is the surest way to drive her exactly there.',
      summary:
        'A woman gaslit into the role of witch decides to play it with teeth: anger begets anger, and her scorn was community property before she ever swung. Fans read the masters dispute here too.',
      inspiration:
        'Swift discussed the song’s thesis — the no-win trap of female anger — in the Long Pond film; the industry-feud mapping is fan reading (unconfirmed in specifics).',
      themes: ['female rage', 'gaslighting', 'witch narratives'],
      fanLore:
        'Fan reading (unconfirmed): the neighborhood-bully verses aimed at the masters-sale principals.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Mad_Woman',
      sources: [wiki('Mad Woman (song)', 'Mad_Woman', 'song article: themes'), ALBUM],
    },
    {
      slug: 'epiphany',
      trackNumber: 13,
      trackTitle: 'epiphany',
      youtubeId: 'DUnDkI7l9LQ', // oEmbed-verified official Taylor Swift channel
      release: 'folklore',
      releaseDate: '2020-07-24',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Aaron Dessner'],
      note: 'Her grandfather’s war and 2020’s hospital wards in one hymn — twenty minutes of trauma, a lifetime of not talking about it.',
      summary:
        'Verse one lands at Guadalcanal with Dean Swift; verse two puts on a mask in a COVID ward. Both generations discover some things cannot be spoken, only slept off in dreams.',
      inspiration:
        'Confirmed: inspired by her grandfather Dean’s WWII service in the Marines and written in tribute to pandemic frontline workers.',
      themes: ['generational trauma', 'war and pandemic', 'the unspeakable'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Epiphany_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Epiphany (Taylor Swift song)',
          'Epiphany_(Taylor_Swift_song)',
          'song article: grandfather tribute',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'betty',
      trackNumber: 14,
      trackTitle: 'betty',
      youtubeId: '6TAPqXkZW_I', // oEmbed-verified official Taylor Swift channel
      release: 'folklore',
      releaseDate: '2020-07-24',
      writers: ['Taylor Swift', 'William Bowery'],
      producers: ['Taylor Swift', 'Aaron Dessner', 'Jack Antonoff'],
      isSingle: true,
      note: 'James’s apology — the harmonica-flavored boy-POV corner of the triangle, co-written by Joe Alwyn under the Bowery pseudonym.',
      summary:
        'A seventeen-year-old shows up at a party to grovel: he did the damage in august, heard about it through the grapevine, and bets everything on a doorstep apology. Whether Betty takes him back stays unwritten.',
      inspiration:
        'Confirmed: the triangle from James’s perspective, with names borrowed from Blake Lively and Ryan Reynolds’ daughters — a fact confirmed when the couple’s third child’s name matched.',
      themes: ['apology', 'teenage recklessness', 'asking forgiveness'],
      easterEggs:
        'Its country-radio single push and CMA-adjacent performance were the era’s single wink back at her first genre.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Betty_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Betty (Taylor Swift song)',
          'Betty_(Taylor_Swift_song)',
          'song article: Bowery credit and names',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'peace',
      trackNumber: 15,
      trackTitle: 'peace',
      youtubeId: 'HpxX4ZE4KWE', // oEmbed-verified official Taylor Swift channel
      release: 'folklore',
      releaseDate: '2020-07-24',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Aaron Dessner'],
      note: 'The most nakedly personal song on the fiction album — she can offer devotion, loyalty, and fire, but never a normal life.',
      summary:
        'A pre-nup of the soul: the fame, the scrutiny, the siege conditions are permanent, so the one thing she cannot promise a partner is peace. Swift confirmed this one is fully hers.',
      inspiration:
        'Confirmed in interviews and the Long Pond film as directly autobiographical — the trade-offs of loving someone whose life is public property.',
      themes: ['what fame costs a partner', 'devotion with caveats', 'honesty'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Peace_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Peace (Taylor Swift song)',
          'Peace_(Taylor_Swift_song)',
          'song article: autobiographical confirmation',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'hoax',
      trackNumber: 16,
      trackTitle: 'hoax',
      youtubeId: 'ryLGxpjwAhM', // oEmbed-verified official Taylor Swift channel
      release: 'folklore',
      releaseDate: '2020-07-24',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Aaron Dessner'],
      note: 'The standard edition’s bleak piano ending — choosing a love that hurts over every painless alternative.',
      summary:
        'Faithful to a faithless thing: betrayal, public wounds, and a barefoot walk back anyway. Swift has said it blends multiple griefs — romantic and otherwise — into one address.',
      inspiration:
        'Swift noted in the Long Pond film that its betrayals braid together more than one real subject rather than a single person.',
      themes: ['devotion to what wounds', 'composite grief', 'bleak fidelity'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Hoax_(song)',
      sources: [wiki('Hoax (song)', 'Hoax_(song)', 'song article: composite-subject note'), ALBUM],
    },
    {
      slug: 'the-lakes',
      trackNumber: 17,
      trackTitle: 'the lakes',
      youtubeId: 'tOHcAc3r2kw', // oEmbed-verified official Taylor Swift channel
      release: 'folklore (deluxe editions)',
      releaseDate: '2020-08-18',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The bonus-track coda in the English Lake District — retiring from the discourse to die where the Romantic poets did, plus one essential companion.',
      summary:
        'An escape fantasy with a Wordsworth pun in it: leave the hunters and clowns to their internet, take the muse, grow roses somewhere with no wifi. The album’s whole ethos in miniature.',
      inspiration:
        'Confirmed: written about the Lake District and its Romantic-poet history — Swift called it the thematic summary of folklore, which is why it closes the deluxe edition.',
      themes: ['escape from public life', 'romantic poets', 'chosen solitude'],
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Lakes_(song)',
      sources: [
        wiki('The Lakes (song)', 'The_Lakes_(song)', 'song article: Lake District inspiration'),
        ALBUM,
      ],
    },
  ],
};

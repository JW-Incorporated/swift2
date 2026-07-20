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
        'Confirmed as the album’s first-written song, described by Swift in the Long Pond film in stolen-legacy terms; the Big Machine/Scooter Braun mapping is the near-universal fan reading (not officially footnoted).',
      themes: ['betrayal by a former ally', 'stolen legacy', 'grief as haunting'],
      fanLore:
        'Fan reading (widely held, unconfirmed in specifics): the 2019 masters dispute as the song’s literal subject.',
      sourceUrl: 'https://en.wikipedia.org/wiki/My_Tears_Ricochet',
      sources: [
        wiki(
          'My Tears Ricochet',
          'My_Tears_Ricochet',
          'song article: first-written status and readings',
        ),
        ALBUM,
      ],
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
        'Built openly on the invisible-thread-of-fate folk motif; fans note the yogurt-shop and park details matching documented biography (the song invites the mapping).',
      themes: ['fate', 'retrospective meaning', 'gratitude for the detours'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Invisible_String',
      sources: [
        wiki('Invisible String', 'Invisible_String', 'song article: motif and readings'),
        ALBUM,
      ],
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

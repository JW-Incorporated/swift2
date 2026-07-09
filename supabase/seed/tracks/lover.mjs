// Vault track guide — Lover era (Lover, 2019). Original prose only — never
// lyrics; unconfirmed readings are labeled. Provenance per
// docs/content/content-audit-2026-07-08.md §5 (URLs verified 2026-07-08).
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
  'Lover (album)',
  'Lover_(album)',
  'album article: release facts, credits, and cited interviews',
);

export default {
  eraSlug: 'lover',
  tracks: [
    {
      slug: 'i-forgot-that-you-existed',
      trackNumber: 1,
      trackTitle: 'I Forgot That You Existed',
      release: 'Lover',
      releaseDate: '2019-08-23',
      writers: ['Taylor Swift', 'Louis Bell', 'Frank Dukes'],
      producers: ['Taylor Swift', 'Louis Bell', 'Frank Dukes'],
      note: 'The giggling epilogue to reputation — not love, not hate, just indifference, which turns out to be the real revenge.',
      summary:
        'She opens the pastel album by closing the black-and-white one: the grudges got heavy, so she put them down and forgot the people attached to them.',
      inspiration: null,
      themes: ['indifference as freedom', 'closing a chapter', 'lightness'],
      sourceUrl: 'https://en.wikipedia.org/wiki/I_Forgot_That_You_Existed',
      sources: [
        wiki('I Forgot That You Existed', 'I_Forgot_That_You_Existed', 'song article: composition'),
        ALBUM,
      ],
    },
    {
      slug: 'cruel-summer',
      trackNumber: 2,
      trackTitle: 'Cruel Summer',
      release: 'Lover',
      releaseDate: '2019-08-23',
      writers: ['Taylor Swift', 'Jack Antonoff', 'Annie Clark'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      singleReleaseDate: '2023-06-20',
      note: 'Co-written with St. Vincent, denied a 2019 single run by the pandemic — then screamed nightly on the Eras Tour until it hit No. 1 four years late.',
      summary:
        'A secret summer romance conducted through garden gates and bad decisions, with the catalog’s most famous bridge-yell about blurting out love. Its 2023 chart-topping resurrection is the great fan-willed correction.',
      inspiration:
        'Widely tied by fans to the guarded start of her late-2016 relationship (unconfirmed); the documented story is the fan campaign that forced its single release in 2023.',
      themes: ['secret love', 'desperation under cool', 'delayed victory'],
      easterEggs:
        'The bridge became the Eras Tour’s loudest nightly scream-along — a documented live phenomenon of the 2023 shows.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Cruel_Summer_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Cruel Summer (Taylor Swift song)',
          'Cruel_Summer_(Taylor_Swift_song)',
          'song article: St. Vincent credit and 2023 single run',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'lover',
      trackNumber: 3,
      trackTitle: 'Lover',
      release: 'Lover',
      releaseDate: '2019-08-23',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      singleReleaseDate: '2019-08-16',
      note: 'The solo-written title track — a first-dance waltz with its own vows in the bridge, written in one night at a piano.',
      summary:
        'Domesticity as romance: leaving the Christmas lights up, guest lists, borrowed heartbeats — a love song built to be slow-danced to at weddings indefinitely.',
      inspiration:
        'Swift has described writing it alone at the piano and knowing immediately it was the album’s center; the bridge is structured as a mock wedding toast.',
      themes: ['commitment', 'domestic magic', 'vows'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Lover_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Lover (Taylor Swift song)',
          'Lover_(Taylor_Swift_song)',
          'song article: writing and release',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'the-man',
      trackNumber: 4,
      trackTitle: 'The Man',
      release: 'Lover',
      releaseDate: '2019-08-23',
      writers: ['Taylor Swift', 'Joel Little'],
      producers: ['Taylor Swift', 'Joel Little'],
      singleReleaseDate: '2020-01-27',
      note: 'The double-standards thought experiment — every criticism of her career re-run with the genders flipped, plus the video where she disappeared into prosthetics as a swaggering man.',
      summary:
        'If she partied, dated, and hustled identically as a man, the same behavior would read as legend, not liability. The self-directed video (with a Dwayne Johnson voice cameo) made the argument literal.',
      inspiration:
        'Swift confirmed the premise directly in interviews: an inventory of the gendered coverage she had absorbed for a decade, itemized.',
      themes: ['sexist double standards', 'ambition', 'perception'],
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Man_(Taylor_Swift_song)',
      sources: [
        wiki(
          'The Man (Taylor Swift song)',
          'The_Man_(Taylor_Swift_song)',
          'song article: video and intent',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'the-archer',
      trackNumber: 5,
      trackTitle: 'The Archer',
      release: 'Lover',
      releaseDate: '2019-08-23',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      isSingle: true,
      note: 'Track 5, released early precisely because fans knew what that slot means — one synth pulse, no chorus, all confession.',
      summary:
        'She has been the hunter and the target, and now wonders who could stay through both. The absence of a drop is the point: nothing resolves, including her.',
      inspiration:
        'Swift acknowledged the track-5 tradition around this release — the first time the fan observation became official canon.',
      themes: ['self-doubt', 'attachment anxiety', 'who could ever leave or stay'],
      easterEggs:
        'Its early promo release is the moment the track-5 vulnerability tradition went from fan theory to confirmed convention.',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Archer_(song)',
      sources: [
        wiki('The Archer (song)', 'The_Archer_(song)', 'song article: track-5 context'),
        ALBUM,
      ],
    },
    {
      slug: 'i-think-he-knows',
      trackNumber: 6,
      trackTitle: 'I Think He Knows',
      release: 'Lover',
      releaseDate: '2019-08-23',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The strutting deep cut with the 16th Avenue nod to Nashville — confidence borrowed from a partner who does not need telling.',
      summary:
        'A crush on someone fully aware of his own charm: she narrates the electricity while admitting he already knows all of it.',
      inspiration: null,
      themes: ['mutual attraction', 'confidence', 'flirtation'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Lover_(album)',
      sources: [ALBUM],
    },
    {
      slug: 'miss-americana-and-the-heartbreak-prince',
      trackNumber: 7,
      trackTitle: 'Miss Americana & the Heartbreak Prince',
      release: 'Lover',
      releaseDate: '2019-08-23',
      writers: ['Taylor Swift', 'Joel Little'],
      producers: ['Taylor Swift', 'Joel Little'],
      note: 'High-school Americana as national allegory — the homecoming-queen imagery is confirmed political disillusionment in a letterman jacket.',
      summary:
        'A dance at a school where the scoreboard is rigged: Swift confirmed the marching-band metaphor is about watching American politics curdle post-2016 and deciding to speak anyway.',
      inspiration:
        'Confirmed: Swift said it channels her disillusionment with U.S. politics through a high-school lens — written around the period covered by the Miss Americana documentary.',
      themes: ['political awakening', 'disillusionment', 'american pageantry'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Miss_Americana_%26_the_Heartbreak_Prince',
      sources: [
        wiki(
          'Miss Americana & the Heartbreak Prince',
          'Miss_Americana_%26_the_Heartbreak_Prince',
          'song article: confirmed political reading',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'paper-rings',
      trackNumber: 8,
      trackTitle: 'Paper Rings',
      release: 'Lover',
      releaseDate: '2019-08-23',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The wedding-band-optional stomp — the album’s thesis that the paperwork matters infinitely less than the person.',
      summary:
        'She would marry this one with rings cut from paper: giddy pop-punk about wanting the whole boring, glorious package after years of gilded drama.',
      inspiration: null,
      themes: ['joyful commitment', 'substance over ceremony', 'giddiness'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Paper_Rings',
      sources: [wiki('Paper Rings', 'Paper_Rings', 'song article: composition'), ALBUM],
    },
    {
      slug: 'cornelia-street',
      trackNumber: 9,
      trackTitle: 'Cornelia Street',
      release: 'Lover',
      releaseDate: '2019-08-23',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'Solo-written and named for the real West Village street where she rented a townhouse — the address that would become unlivable if this love ever died.',
      summary:
        'Memory pinned to geography: if it ends, the whole street gets amputated from her map. Fans treat the actual Cornelia Street as a pilgrimage site because of it.',
      inspiration:
        'Confirmed: named for the Manhattan street where Swift lived during the relationship’s early days — she has called the association literal, not poetic.',
      themes: ['memory and place', 'fear of loss', 'superstition'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Cornelia_Street',
      sources: [
        wiki('Cornelia Street (song)', 'Cornelia_Street', 'song article: NYC background'),
        ALBUM,
      ],
    },
    {
      slug: 'death-by-a-thousand-cuts',
      trackNumber: 10,
      trackTitle: 'Death by a Thousand Cuts',
      release: 'Lover',
      releaseDate: '2019-08-23',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'A breakup song written inside a happy relationship — confirmed to be inspired by the Netflix rom-com Someone Great, closing a strange creative loop.',
      summary:
        'An imagined heartbreak felt in a hundred small places at once. Swift confirmed the film Someone Great sparked it — whose writer-director had partly drawn on Swift’s own catalog, making it a documented inspiration boomerang.',
      inspiration:
        'Confirmed: Swift cited the film Someone Great; director Jennifer Kaytin Robinson has discussed the mutual-influence loop publicly.',
      themes: ['imagined grief', 'art feeding art', 'a city full of reminders'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Lover_(album)',
      sources: [ALBUM],
    },
    {
      slug: 'london-boy',
      trackNumber: 11,
      trackTitle: 'London Boy',
      release: 'Lover',
      releaseDate: '2019-08-23',
      writers: ['Taylor Swift', 'Jack Antonoff', 'Cautious Clay', 'Sounwave'],
      producers: ['Taylor Swift', 'Jack Antonoff', 'Sounwave'],
      note: 'The tourist-map valentine to a British partner’s city — opening with an Idris Elba clip from the James Corden show, and cheerfully mispricing London geography per every British fan ever.',
      summary:
        'An American falls for the whole kit: pubs, rugby screenings, high tea with the lads. The affectionate geographic chaos (Camden to Brixton like it is one stroll) became its own beloved joke.',
      inspiration:
        'The Elba voice clip and the Cautious Clay interpolation are both in the official credits; the subject’s nationality made the reading self-evident and fans ran the borough-hopping audit for sport.',
      themes: ['loving someone’s world', 'anglophilia', 'playful devotion'],
      sourceUrl: 'https://en.wikipedia.org/wiki/London_Boy_(song)',
      sources: [
        wiki('London Boy (song)', 'London_Boy_(song)', 'song article: samples and reception'),
        ALBUM,
      ],
    },
    {
      slug: 'soon-youll-get-better',
      trackNumber: 12,
      trackTitle: "Soon You'll Get Better",
      release: 'Lover',
      releaseDate: '2019-08-23',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The Dixie Chicks collaboration about her mother’s cancer — a song Swift said the family debated even releasing, and one she almost never performs.',
      summary:
        'Written amid Andrea Swift’s cancer treatment: hospital waiting rooms, bargaining with God, and the childlike refrain that has to be true because the alternative is unthinkable.',
      inspiration:
        'Confirmed: about her mother’s illness; Swift said the decision to include it was a family conversation, and its rare performances are documented as exceptional events.',
      themes: ['a parent’s illness', 'bargaining', 'helpless love'],
      sourceUrl: "https://en.wikipedia.org/wiki/Soon_You'll_Get_Better",
      sources: [
        wiki("Soon You'll Get Better", "Soon_You'll_Get_Better", 'song article: family background'),
        ALBUM,
      ],
    },
    {
      slug: 'false-god',
      trackNumber: 13,
      trackTitle: 'False God',
      release: 'Lover',
      releaseDate: '2019-08-23',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'Saxophone, sacrilege, and a long-distance argument — worship as the metaphor for a love both parties refuse to quit.',
      summary:
        'They fight across time zones and still treat the relationship as religion: even if the faith is misplaced, the devotion is the point.',
      inspiration: null,
      themes: ['love as religion', 'conflict and repair', 'devotion'],
      sourceUrl: 'https://en.wikipedia.org/wiki/False_God_(song)',
      sources: [wiki('False God (song)', 'False_God_(song)', 'song article: composition'), ALBUM],
    },
    {
      slug: 'you-need-to-calm-down',
      trackNumber: 14,
      trackTitle: 'You Need to Calm Down',
      release: 'Lover',
      releaseDate: '2019-08-23',
      writers: ['Taylor Swift', 'Joel Little'],
      producers: ['Taylor Swift', 'Joel Little'],
      singleReleaseDate: '2019-06-14',
      note: 'The Pride-month single that told trolls and picketers alike to take several seats — with a video ending in a real petition for the Equality Act.',
      summary:
        'Three verses of de-escalation: internet haters, anti-LGBTQ protesters, and women pitted against each other all get the same advice. The celebrity-packed video closed with a documented policy ask.',
      inspiration:
        'Confirmed advocacy: released during Pride 2019 with an Equality Act petition; the video’s Katy Perry reconciliation cameo formally buried the Bad Blood-era feud.',
      themes: ['allyship', 'anti-harassment', 'solidarity'],
      easterEggs:
        'The burger-and-fries hug is the official end of the Bad Blood storyline — feud opened and closed inside two videos.',
      sourceUrl: 'https://en.wikipedia.org/wiki/You_Need_to_Calm_Down',
      sources: [
        wiki('You Need to Calm Down', 'You_Need_to_Calm_Down', 'song article: advocacy and video'),
        ALBUM,
      ],
    },
    {
      slug: 'afterglow',
      trackNumber: 15,
      trackTitle: 'Afterglow',
      release: 'Lover',
      releaseDate: '2019-08-23',
      writers: ['Taylor Swift', 'Louis Bell', 'Frank Dukes'],
      producers: ['Taylor Swift', 'Louis Bell', 'Frank Dukes'],
      note: 'The apology song — she started the fight, she knows it, and the chorus is her owning the shrapnel.',
      summary:
        'Anxiety torched something good and she claims the arson: an accountability ballad asking the other person to stay inside the glow while she fixes what she broke.',
      inspiration: null,
      themes: ['accountability', 'anxiety in love', 'repair'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Lover_(album)',
      sources: [ALBUM],
    },
    {
      slug: 'me',
      trackNumber: 16,
      trackTitle: 'Me!',
      release: 'Lover',
      releaseDate: '2019-08-23',
      writers: ['Taylor Swift', 'Joel Little', 'Brendon Urie'],
      producers: ['Taylor Swift', 'Joel Little'],
      singleReleaseDate: '2019-04-26',
      note: 'The technicolor lead single with Brendon Urie, announced by a literal butterfly mural — and the spelling-is-fun line that was quietly deleted from the album cut.',
      summary:
        'Self-celebration as a duet: two dramatic people pitching their own irreplaceability. Its pastel-explosion video announced the era’s palette flip from reputation’s black.',
      inspiration:
        'The removed spelling lyric is the documented curiosity: present on the single, absent from the album version after months of ribbing.',
      themes: ['self-worth', 'individuality', 'spectacle'],
      easterEggs:
        'The Kelsey Montague butterfly mural in Nashville was the era’s opening Easter egg — fans found the announcement inside the wings.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Me!',
      sources: [wiki('Me!', 'Me!', 'song article: single rollout and lyric change'), ALBUM],
    },
    {
      slug: 'its-nice-to-have-a-friend',
      trackNumber: 17,
      trackTitle: "It's Nice to Have a Friend",
      release: 'Lover',
      releaseDate: '2019-08-23',
      writers: ['Taylor Swift', 'Louis Bell', 'Frank Dukes'],
      producers: ['Taylor Swift', 'Louis Bell', 'Frank Dukes'],
      note: 'The strangest, sweetest thing on Lover — steel drums, a children’s choir sample, and a whole life story told in miniature.',
      summary:
        'Friendship ripening into marriage in three tiny verses: snow fights, school notes, a ring — the album’s thesis (love as friendship upgraded) in under three minutes. The choir sample benefits a Toronto school program, per the credits.',
      inspiration: null,
      themes: ['friendship into love', 'lifetimes in miniature', 'gentleness'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Lover_(album)',
      sources: [ALBUM],
    },
    {
      slug: 'daylight',
      trackNumber: 18,
      trackTitle: 'Daylight',
      release: 'Lover',
      releaseDate: '2019-08-23',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The solo-written closer that was almost the album title — she once thought love was burning red, and revises her own catalog in a single line.',
      summary:
        'The era-closing thesis: real love is not golden drama or red intensity but ordinary daylight. Ends with a spoken vow to be defined by what she loves, not what she hates — the line the whole album walks toward.',
      inspiration:
        'Confirmed: Swift said Daylight was a candidate album title before Lover won; the closing monologue was written as the record’s mission statement.',
      themes: ['revised definitions of love', 'peace', 'self-definition'],
      easterEggs:
        'The burning-red correction is a direct, deliberate callback to the Red title track — her catalog editing itself in real time.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Daylight_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Daylight (Taylor Swift song)',
          'Daylight_(Taylor_Swift_song)',
          'song article: title-candidate history',
        ),
        ALBUM,
      ],
    },
  ],
};

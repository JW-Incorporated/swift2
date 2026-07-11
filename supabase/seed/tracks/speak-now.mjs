// Vault track guide — Speak Now era (Speak Now 2010 / Taylor's Version 2023,
// including From The Vault). Original prose only — never lyrics; unconfirmed
// readings are labeled. Provenance per docs/content/content-audit-2026-07-08.md
// §5 (URLs verified 2026-07-08). Every track on the original album was written
// solely by Swift — her documented answer to critics who doubted her pen.
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
  'Speak Now',
  'Speak_Now',
  'album article: release facts, credits, and cited interviews',
);
const TV = wiki(
  "Speak Now (Taylor's Version)",
  "Speak_Now_(Taylor's_Version)",
  're-recording article: vault-track credits and release facts',
);

export default {
  eraSlug: 'speak-now',
  tracks: [
    {
      slug: 'mine',
      trackNumber: 1,
      trackTitle: 'Mine',
      release: 'Speak Now',
      releaseDate: '2010-10-25',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Nathan Chapman'],
      singleReleaseDate: '2010-08-04',
      note: 'The lead single, rush-released early after a leak — about her habit of running from love before it can run from her.',
      summary:
        'A girl who learned from her parents’ arguments to expect goodbye imagines, verse by verse, what staying could look like — a careless man’s careful daughter finding an exception.',
      inspiration:
        'Swift said it is about her tendency to flee relationships to avoid being left, written about a crush who never knew.',
      themes: ['fear of abandonment', 'hope against pattern', 'building a life'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Mine_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Mine (Taylor Swift song)',
          'Mine_(Taylor_Swift_song)',
          'song article: early release and background',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'sparks-fly',
      trackNumber: 2,
      trackTitle: 'Sparks Fly',
      release: 'Speak Now',
      releaseDate: '2010-10-25',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Nathan Chapman'],
      isSingle: true,
      note: 'Written years earlier and resurrected by fan demand — live bootlegs made Swifties campaign it onto the album.',
      summary:
        'Attraction as weather: a green-eyed someone she knows is a bad idea, and the rain-soaked kiss she wants anyway.',
      inspiration:
        'An early composition Swift performed live in 2007; fan enthusiasm for the bootleg is the documented reason it was reworked for Speak Now.',
      themes: ['electric attraction', 'bad ideas', 'fan-powered history'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Sparks_Fly_(song)',
      sources: [
        wiki('Sparks Fly (song)', 'Sparks_Fly_(song)', 'song article: fan-demand origin'),
        ALBUM,
      ],
    },
    {
      slug: 'back-to-december',
      trackNumber: 3,
      trackTitle: 'Back to December',
      release: 'Speak Now',
      releaseDate: '2010-10-25',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Nathan Chapman'],
      isSingle: true,
      note: 'Her first apology song — the one time on the early albums she casts herself as the one who did the breaking.',
      summary:
        'An apology delivered out loud to someone who deserved better: she replays the December she gave back his love and owns the damage.',
      inspiration:
        'Swift confirmed it is an apology to someone she hurt; it is widely reported to be about Taylor Lautner, who himself has good-naturedly acknowledged the association in later interviews.',
      themes: ['remorse', 'accountability', 'roads not taken'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Back_to_December',
      sources: [
        wiki('Back to December', 'Back_to_December', 'song article: apology framing and reporting'),
        ALBUM,
      ],
    },
    {
      slug: 'speak-now',
      trackNumber: 4,
      trackTitle: 'Speak Now',
      release: 'Speak Now',
      releaseDate: '2010-10-25',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Nathan Chapman'],
      note: 'The title track: a rom-com heist where she crashes the wedding of a boy marrying the wrong girl — and named the whole album’s say-it-now philosophy.',
      summary:
        'A comic fantasy of interrupting a wedding at the speak-now-or-forever-hold-your-peace moment; the album title came from the idea of saying what you feel before the door closes.',
      inspiration:
        'Swift said the scenario was sparked by a friend whose childhood sweetheart was marrying someone else — she imagined the barge-in her friend never did.',
      themes: ['speaking up', 'romantic comedy', 'seizing the moment'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Speak_Now_(song)',
      sources: [
        wiki('Speak Now (song)', 'Speak_Now_(song)', 'song article: title-track concept'),
        ALBUM,
      ],
    },
    {
      slug: 'dear-john',
      trackNumber: 5,
      trackTitle: 'Dear John',
      release: 'Speak Now',
      releaseDate: '2010-10-25',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Nathan Chapman'],
      note: 'The 6-minute blues-burn track 5 — an open letter to an older man who played games with a 19-year-old, and one of the most dissected songs she has ever written.',
      summary:
        'A young woman looks back at a manipulative relationship with someone much older and reclaims the story: she should have known, but he definitely did.',
      inspiration:
        'Never explicitly named by Swift; the title and guitar styling made John Mayer the universal press reading, and Mayer publicly objected to the song in a 2012 interview. Before the 2023 re-record, Swift pointedly asked fans for kindness toward the song’s subjects.',
      themes: ['age-gap power imbalance', 'manipulation', 'reclaiming the narrative'],
      fanLore:
        'Fan reading (widely reported, unconfirmed): the Mayer attribution; the documented facts are his public response and Swift’s 2023 no-harassment plea.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Dear_John_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Dear John (Taylor Swift song)',
          'Dear_John_(Taylor_Swift_song)',
          'song article: reception and Mayer response',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'mean',
      trackNumber: 6,
      trackTitle: 'Mean',
      release: 'Speak Now',
      releaseDate: '2010-10-25',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Nathan Chapman'],
      isSingle: true,
      note: 'The banjo clapback at a critic who said she ruined her career — it won two Grammys, which settled the argument.',
      summary:
        'Aimed at a bully with a platform: someday she will be big enough that the cheap shots cannot reach, and he will still be mean.',
      inspiration:
        'Swift confirmed it was written about a critic who savaged her after a rough 2010 Grammys vocal; reporting widely identified blogger Bob Lefsetz. It won Best Country Song and Best Country Solo Performance at the 2012 Grammys.',
      themes: ['bullying', 'resilience', 'success as the answer'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Mean_(song)',
      sources: [
        wiki('Mean (song)', 'Mean_(song)', 'song article: critic origin and Grammy wins'),
        ALBUM,
      ],
    },
    {
      slug: 'the-story-of-us',
      trackNumber: 7,
      trackTitle: 'The Story of Us',
      release: 'Speak Now',
      releaseDate: '2010-10-25',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Nathan Chapman'],
      isSingle: true,
      note: 'Pop-punk panic about sitting rows away from an ex at an awards show and both pretending the other is invisible.',
      summary:
        'A love story that stalled mid-chapter: two people in the same room performing indifference, narrated by the one who hates the silence most.',
      inspiration:
        'Swift confirmed it was sparked by running into an ex at an awards show and the absurd theater of mutual avoidance.',
      themes: ['awkward encounters', 'pride', 'unfinished stories'],
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Story_of_Us_(song)',
      sources: [
        wiki(
          'The Story of Us (song)',
          'The_Story_of_Us_(song)',
          'song article: awards-show origin',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'never-grow-up',
      trackNumber: 8,
      trackTitle: 'Never Grow Up',
      release: 'Speak Now',
      releaseDate: '2010-10-25',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Nathan Chapman'],
      note: 'Written around her first solo apartment — a lullaby to a child in verse one that turns out to be a lullaby to herself by verse three.',
      summary:
        'A plea to freeze childhood before the world edits it: protectiveness toward little kids, then the lonely first night in her own place.',
      inspiration:
        'Swift tied it to moving out on her own for the first time and realizing growing up had actually happened.',
      themes: ['growing up', 'innocence', 'homesickness'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Never_Grow_Up',
      sources: [wiki('Never Grow Up', 'Never_Grow_Up', 'song article: writing context'), ALBUM],
    },
    {
      slug: 'enchanted',
      trackNumber: 9,
      trackTitle: 'Enchanted',
      release: 'Speak Now',
      releaseDate: '2010-10-25',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Nathan Chapman'],
      note: 'One dazzling first meeting, replayed all night — more than a decade later it became a viral wedding-and-TikTok standard and an Eras Tour showstopper.',
      summary:
        'The afterglow of meeting someone wonderstruck-level interesting, and the spiraling hope that he is not going home to somebody else.',
      inspiration:
        'Swift confirmed it was written after meeting Owl City’s Adam Young; Young later responded publicly with his own answer version of the song, and Swift’s Wonderstruck fragrance took its name from the lyric.',
      themes: ['first meetings', 'infatuation', 'what-ifs'],
      easterEggs:
        'The name of her Wonderstruck perfume line is a direct lift from this song’s vocabulary — an early lyric-to-brand Easter egg.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Enchanted_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Enchanted (Taylor Swift song)',
          'Enchanted_(Taylor_Swift_song)',
          'song article: Adam Young exchange and legacy',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'better-than-revenge',
      trackNumber: 10,
      trackTitle: 'Better Than Revenge',
      release: 'Speak Now',
      releaseDate: '2010-10-25',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Nathan Chapman'],
      note: 'The pop-punk grudge song whose most notorious line was rewritten on Taylor’s Version — the most talked-about lyric change of the whole re-recording project.',
      summary:
        'A takedown of the girl who "stole" a boyfriend, written at 18 in full drama mode; adult Swift swapped the infamous mattress line for a matches metaphor in 2023, a change that dominated the SNTV discourse.',
      inspiration:
        'Swift acknowledged over the years that she wrote it as a teenager assigning blame she would later rethink — the 2023 lyric revision is the documented postscript.',
      themes: ['jealousy', 'teenage grudges', 'revisiting your younger self'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Better_than_Revenge',
      sources: [
        wiki(
          'Better than Revenge',
          'Better_than_Revenge',
          'song article: 2023 lyric change coverage',
        ),
        TV,
      ],
    },
    {
      slug: 'innocent',
      trackNumber: 11,
      trackTitle: 'Innocent',
      release: 'Speak Now',
      releaseDate: '2010-10-25',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Nathan Chapman'],
      note: 'Her formal response to the 2009 VMA interruption — debuted, deliberately, on the VMA stage one year later.',
      summary:
        'A pointedly gracious song extending forgiveness to the man who humiliated her on live TV: everyone is still growing, everyone can still be redeemed.',
      inspiration:
        'Confirmed response to Kanye West’s 2009 VMAs stage-crash; premiering it at the 2010 VMAs was the statement. The grace curdled after 2016, which is why fans read reputation as this song’s sequel-in-reverse.',
      themes: ['forgiveness', 'public grace', 'growing up in public'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Innocent_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Innocent (Taylor Swift song)',
          'Innocent_(Taylor_Swift_song)',
          'song article: VMA context',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'haunted',
      trackNumber: 12,
      trackTitle: 'Haunted',
      release: 'Speak Now',
      releaseDate: '2010-10-25',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Nathan Chapman'],
      note: 'The album’s gothic centerpiece — live strings, minor keys, and a relationship dying in real time.',
      summary:
        'The panic of feeling someone slip away mid-conversation: she begs the connection to come back before the ghost of it moves in.',
      inspiration:
        'Swift described wanting the production to sound as chaotic as the moment of realizing someone is already gone.',
      themes: ['losing someone slowly', 'desperation', 'dread'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Haunted_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Haunted (Taylor Swift song)',
          'Haunted_(Taylor_Swift_song)',
          'song article: production intent',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'last-kiss',
      trackNumber: 13,
      trackTitle: 'Last Kiss',
      release: 'Speak Now',
      releaseDate: '2010-10-25',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Nathan Chapman'],
      note: 'The quietest devastation on Speak Now — a 1 a.m. autopsy of a breakup, down to remembered dates and doorway postures.',
      summary:
        'Grief in the present tense: she keeps the details (a first kiss timestamp, his jokes, his jacket) because the details are all that is left.',
      inspiration:
        'Fans widely link its specifics to the Jonas breakup timeline (unconfirmed by Swift); what is documented is Swift calling it one of the saddest songs she had written to that point.',
      themes: ['mourning a relationship', 'memory hoarding', 'letting go slowly'],
      fanLore:
        'Fan reading (unconfirmed): the July date referenced in the lyric matching a documented 2008 relationship timeline.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Speak_Now',
      sources: [ALBUM],
    },
    {
      slug: 'long-live',
      trackNumber: 14,
      trackTitle: 'Long Live',
      release: 'Speak Now',
      releaseDate: '2010-10-25',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Nathan Chapman'],
      note: 'Her love letter to the band and the fans — the kings-and-queens victory lap that closes the standard album and still closes hearts at tours.',
      summary:
        'A toast to everyone who built the improbable early run with her: if it all ends tomorrow, remember how it felt to hold the crown together.',
      inspiration:
        'Swift confirmed it was written for her band, crew, and fans as a snapshot of the Fearless-era triumphs.',
      themes: ['gratitude', 'shared victory', 'legacy'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Long_Live_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Long Live (Taylor Swift song)',
          'Long_Live_(Taylor_Swift_song)',
          'song article: dedication background',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'ours',
      trackNumber: 15,
      trackTitle: 'Ours',
      release: 'Speak Now (Deluxe Edition)',
      releaseDate: '2010-10-25',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Nathan Chapman'],
      isSingle: true,
      note: 'The deluxe cut that earned a single release anyway — a shrug at everyone who disapproves, because the relationship belongs to exactly two people.',
      summary:
        'Defending an unglamorous, gossiped-about love: let people talk; what they think they see was never theirs to grade.',
      inspiration: null,
      themes: ['us against the world', 'privacy', 'contentment'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Ours_(song)',
      sources: [wiki('Ours (song)', 'Ours_(song)', 'song article: single release'), ALBUM],
    },
    {
      slug: 'if-this-was-a-movie',
      trackNumber: 16,
      trackTitle: 'If This Was a Movie',
      release: 'Speak Now (Deluxe Edition)',
      releaseDate: '2010-10-25',
      writers: ['Taylor Swift', 'Martin Johnson'],
      producers: ['Taylor Swift', 'Nathan Chapman'],
      note: 'The only Speak Now-era co-write — with Boys Like Girls’ Martin Johnson — about waiting for the third-act reunion scene that real life keeps not delivering.',
      summary:
        'She knows exactly how the movie version ends: he comes back in the rain. The song is the ache of living in the unscripted version.',
      inspiration: null,
      themes: ['cinema versus reality', 'waiting', 'heartbreak logic'],
      easterEggs:
        "Its Taylor's Version was released in 2021 attached to the Fearless TV wave rather than with SNTV in 2023 — a catalog quirk fans still flag.",
      sourceUrl: 'https://en.wikipedia.org/wiki/If_This_Was_a_Movie',
      sources: [
        wiki(
          'If This Was a Movie',
          'If_This_Was_a_Movie',
          'song article: co-write and TV release quirk',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'superman',
      trackNumber: 17,
      trackTitle: 'Superman',
      release: 'Speak Now (Deluxe Edition)',
      releaseDate: '2010-10-25',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Nathan Chapman'],
      note: 'A deluxe track about watching an impressive older man fly off to his important life — and quietly hoping to be the one he comes back to.',
      summary:
        'Hero worship with a bruise in it: he is dazzling and busy saving the world, and she is doing the un-dazzling work of waiting.',
      inspiration:
        'Fans widely file it in the same chapter as Dear John’s subject (unconfirmed by Swift); she has only said it began with the thought that a man leaving the room looked like a superhero departure.',
      themes: ['admiration', 'waiting', 'unequal orbits'],
      fanLore: 'Fan reading (unconfirmed): the Mayer-era attribution common in fan chronologies.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Speak_Now',
      sources: [ALBUM],
    },
    {
      slug: 'electric-touch',
      trackNumber: 18,
      trackTitle: 'Electric Touch',
      release: "Speak Now (Taylor's Version) — From The Vault",
      releaseDate: '2023-07-07',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      isFromTheVault: true,
      note: 'The vault duet with Fall Out Boy — pop-punk royalty joining a song about the terror and thrill of a first date that could fix or wreck everything.',
      summary:
        'Two people with bad track records meet anyway: every past ending says run, the spark says stay.',
      inspiration:
        'Recorded with Fall Out Boy for the 2023 vault — a nod to the pop-punk influences all over the original Speak Now.',
      themes: ['second chances', 'first-date nerves', 'hope over history'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Electric_Touch_(song)',
      sources: [
        wiki(
          'Electric Touch (song)',
          'Electric_Touch_(song)',
          'song article: Fall Out Boy collaboration',
        ),
        TV,
      ],
    },
    {
      slug: 'when-emma-falls-in-love',
      trackNumber: 19,
      trackTitle: 'When Emma Falls in Love',
      release: "Speak Now (Taylor's Version) — From The Vault",
      releaseDate: '2023-07-07',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      isFromTheVault: true,
      note: 'A piano portrait of a friend who loves carefully and completely — the vault song that launched a thousand which-Emma theories.',
      summary:
        'An admiring character study of a friend named Emma: how she falls, how she guards herself, and why the narrator wishes she were more like her.',
      inspiration:
        'Swift has said only that it is about a friend; fans overwhelmingly speculate Emma Stone (the two have a documented long friendship) — unconfirmed.',
      themes: ['friendship', 'admiration', 'how people love differently'],
      fanLore:
        'Fan reading (unconfirmed): the Emma Stone identification, based on the friendship timeline.',
      sourceUrl: 'https://en.wikipedia.org/wiki/When_Emma_Falls_in_Love',
      sources: [
        wiki(
          'When Emma Falls in Love',
          'When_Emma_Falls_in_Love',
          'song article: speculation coverage',
        ),
        TV,
      ],
    },
    {
      slug: 'i-can-see-you',
      trackNumber: 20,
      trackTitle: 'I Can See You',
      release: "Speak Now (Taylor's Version) — From The Vault",
      releaseDate: '2023-07-07',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      isFromTheVault: true,
      isSingle: true,
      note: 'The slinkiest thing in the Speak Now vault — with a heist-movie video starring Taylor Lautner, whose casting was its own reconciliation Easter egg.',
      summary:
        'A workplace-crush fantasy kept strictly behind the eyes — desire as a secret both people are pretending not to notice.',
      inspiration:
        'The 2023 video — Lautner and Joey King breaking a vault-imprisoned Swift out — is the documented meta-joke: liberating the old album, with an old flame helping.',
      themes: ['secret desire', 'restraint', 'tension'],
      easterEggs:
        'The video is one long vault metaphor: fans catalog its props as references to reclaiming the Speak Now masters.',
      sourceUrl: 'https://en.wikipedia.org/wiki/I_Can_See_You_(song)',
      sources: [
        wiki(
          'I Can See You (song)',
          'I_Can_See_You_(song)',
          'song article: video and single release',
        ),
        TV,
      ],
    },
    {
      slug: 'castles-crumbling',
      trackNumber: 21,
      trackTitle: 'Castles Crumbling',
      release: "Speak Now (Taylor's Version) — From The Vault",
      releaseDate: '2023-07-07',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      isFromTheVault: true,
      note: 'A duet with Paramore’s Hayley Williams about fearing the fall from grace — written six years before the 2016 pile-on made it prophetic.',
      summary:
        'A ruler watches the kingdom turn: cheers becoming jeers, and the terror of disappointing everyone who once chanted your name. Fans read it as Long Live’s shadow twin.',
      inspiration:
        'Written in the Speak Now era about fame anxiety; recorded with Williams, a documented friend since their teens. Its eerie pre-echo of 2016 is the fan-noted (and widely press-noted) irony.',
      themes: ['fame anxiety', 'fall from grace', 'public disappointment'],
      easterEggs: 'Deliberate mirror of Long Live: same castle imagery, opposite outcome.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Castles_Crumbling',
      sources: [
        wiki('Castles Crumbling', 'Castles_Crumbling', 'song article: Williams collaboration'),
        TV,
      ],
    },
    {
      slug: 'foolish-one',
      trackNumber: 22,
      trackTitle: 'Foolish One',
      release: "Speak Now (Taylor's Version) — From The Vault",
      releaseDate: '2023-07-07',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      isFromTheVault: true,
      note: 'The vault’s self-aware spiral — narrating her own delusion about a man who is never going to call, in real time.',
      summary:
        'She lectures herself mid-daydream: stop reading into the crumbs, stop planning the wedding — and then keeps doing both.',
      inspiration: null,
      themes: ['self-delusion', 'waiting by the phone', 'hard truths'],
      sourceUrl: "https://en.wikipedia.org/wiki/Speak_Now_(Taylor's_Version)",
      sources: [TV],
    },
    {
      slug: 'timeless',
      trackNumber: 23,
      trackTitle: 'Timeless',
      release: "Speak Now (Taylor's Version) — From The Vault",
      releaseDate: '2023-07-07',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      isFromTheVault: true,
      note: 'The vault closer built from an antique-shop box of strangers’ photographs — love stories she reverse-engineered from other people’s snapshots.',
      summary:
        'Flipping through old photos of couples who survived wars and disapproval, she decides she would have found the same person in any century.',
      inspiration:
        'The antique-store photograph conceit is in the song’s own framing; the lyric-video treatment leaned on vintage imagery to match.',
      themes: ['fated love', 'history', 'love across eras'],
      sourceUrl: "https://en.wikipedia.org/wiki/Speak_Now_(Taylor's_Version)",
      sources: [TV],
    },
  ],
};

// Vault track guide — evermore era (evermore, 2020). Original prose only —
// never lyrics; unconfirmed readings are labeled. Provenance per
// docs/content/content-audit-2026-07-08.md §5 (URLs verified 2026-07-08).
// Era context: folklore's surprise "sister album," released nine months later
// on 2020-12-11 — deeper into fiction, released around her 31st birthday.
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
  'Evermore',
  'Evermore',
  'album article: release facts, credits, and cited interviews',
);

// Per-song dossiers (issue #440 / #726 pattern) live in the .dossiers.mjs side
// file to keep this file diffable; attach them by slug below. A dossier keyed
// to a slug that doesn't exist here is an authoring typo — fail loudly.
import DOSSIERS from './evermore.dossiers.mjs';

const TRACKS = [
    {
      slug: 'willow',
      trackNumber: 1,
      trackTitle: 'willow',
      youtubeId: 'RsEZmictANA', // oEmbed-verified official Taylor Swift channel
      release: 'evermore',
      releaseDate: '2020-12-11',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Aaron Dessner'],
      singleReleaseDate: '2020-12-11',
      note: 'The lead single written to a Dessner instrumental in under ten minutes of listening — wanting someone rendered as witchcraft, with a glowing-string video to match.',
      summary:
        'Devotion that bends like the tree it is named for: she casts the wanting as a spell, follows the golden thread from cardigan’s video, and made witch-titled remixes an official joke.',
      inspiration:
        'Dessner has said Swift wrote it to his track almost immediately; the video picks up the literal thread where cardigan’s left off.',
      themes: ['longing as magic', 'pliancy and devotion', 'pursuit'],
      easterEggs:
        'The video begins exactly where cardigan’s ended — same piano, same thread — making the sister-album link literal.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Willow_(song)',
      sources: [
        wiki('Willow (song)', 'Willow_(song)', 'song article: writing speed and video continuity'),
        ALBUM,
      ],
    },
    {
      slug: 'champagne-problems',
      trackNumber: 2,
      trackTitle: 'champagne problems',
      youtubeId: 'wMpqCRF7TKg', // oEmbed-verified official Taylor Swift channel
      release: 'evermore',
      releaseDate: '2020-12-11',
      writers: ['Taylor Swift', 'William Bowery'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      note: 'The Bowery co-write about a proposal that gets a no — fiction, per Swift, and the era’s biggest gut-punch bridge.',
      summary:
        'She turns down a ring in front of everyone and narrates her own condemnation: his mid-sentence stall, the gossiping town, her unnamed reasons. Written with Joe Alwyn, about invented people.',
      inspiration:
        'Confirmed fiction: Swift described the couple’s backstory as invented; Alwyn co-wrote under the Bowery pseudonym.',
      themes: ['rejected proposals', 'mental health whispered about', 'self-blame'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Champagne_Problems_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Champagne Problems (Taylor Swift song)',
          'Champagne_Problems_(Taylor_Swift_song)',
          'song article: Bowery credit and fiction framing',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'gold-rush',
      trackNumber: 3,
      trackTitle: 'gold rush',
      youtubeId: 'Pz-f9mM3Ms8', // oEmbed-verified official Taylor Swift channel
      release: 'evermore',
      releaseDate: '2020-12-11',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The lone Antonoff production on evermore — a daydream inside a daydream about wanting someone everyone else wants too.',
      summary:
        'Jealousy at the fantasy stage: the whole crush happens and dies inside her head because loving someone universally desired sounds exhausting. The production literally fades in and out of the reverie.',
      inspiration: null,
      themes: ['jealousy', 'daydream romance', 'self-protective retreat'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Evermore',
      sources: [ALBUM],
    },
    {
      slug: 'tis-the-damn-season',
      trackNumber: 4,
      trackTitle: "'tis the damn season",
      youtubeId: 'WuvhOD-mP8M', // oEmbed-verified official Taylor Swift channel
      release: 'evermore',
      releaseDate: '2020-12-11',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Aaron Dessner'],
      note: 'The hometown-for-the-holidays hookup — Dorothea’s side of evermore’s own two-song pairing, written in one night after a dinner party.',
      summary:
        'An actress back home for Christmas offers an old flame the weekend, no strings, honesty included: the road not taken looks warm every December. Pairs with dorothea, the same story from the boy who stayed.',
      inspiration:
        'Dessner has recounted Swift writing it overnight at Long Pond after a dinner gathering; Swift confirmed the Dorothea character connects both songs.',
      themes: ['hometown nostalgia', 'temporary love', 'choices and Decembers'],
      sourceUrl: "https://en.wikipedia.org/wiki/'Tis_the_Damn_Season",
      sources: [
        wiki(
          "'Tis the Damn Season",
          "'Tis_the_Damn_Season",
          'song article: overnight writing and character link',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'tolerate-it',
      trackNumber: 5,
      trackTitle: 'tolerate it',
      youtubeId: 'ukxEKY_7MOc', // oEmbed-verified official Taylor Swift channel
      release: 'evermore',
      releaseDate: '2020-12-11',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Aaron Dessner'],
      note: 'Track 5, in 10/8 time — inspired by Daphne du Maurier’s Rebecca, a young wife performing devotion for a man who merely permits it.',
      summary:
        'She sets the table, learns his favorite everything, and watches it register as furniture: love received as tolerance. The Rebecca influence is confirmed — an age-gap marriage where worship goes unreturned.',
      inspiration:
        'Confirmed: Swift cited reading Rebecca and imagining a wife whose lavish attention is merely endured — the track-5 slot did the rest.',
      themes: ['unreciprocated devotion', 'age-gap imbalance', 'quiet rebellion brewing'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Tolerate_It',
      sources: [wiki('Tolerate It', 'Tolerate_It', 'song article: Rebecca inspiration'), ALBUM],
    },
    {
      slug: 'no-body-no-crime',
      trackNumber: 6,
      trackTitle: 'no body, no crime',
      youtubeId: 'IEPomqor2A8', // oEmbed-verified official Taylor Swift channel
      release: 'evermore',
      releaseDate: '2020-12-11',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      isSingle: true,
      note: 'The solo-written country-noir murder ballad with HAIM — Este gets killed off by name, her sisters get the harmonies, and the narrator gets away with it.',
      summary:
        'A whodunit where everyone did it: a cheating husband, a vanished friend named Este, and a narrator with an alibi and a boating license. Swift invented the whole crime, casting her real friends as the fictional victims.',
      inspiration:
        'Confirmed fiction with confirmed casting: written solo about an invented infidelity-murder plot, recorded with the HAIM sisters after Swift decided the story belonged to Este.',
      themes: ['murder ballad', 'infidelity and comeuppance', 'female solidarity, armed'],
      sourceUrl: 'https://en.wikipedia.org/wiki/No_Body%2C_No_Crime',
      sources: [
        wiki(
          'No Body, No Crime',
          'No_Body%2C_No_Crime',
          'song article: HAIM collaboration and fiction',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'happiness',
      trackNumber: 7,
      trackTitle: 'happiness',
      youtubeId: 'tP4TTgt4nb0', // oEmbed-verified official Taylor Swift channel
      release: 'evermore',
      releaseDate: '2020-12-11',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Aaron Dessner'],
      note: 'Finished a week before release — a divorce song written from the exact middle of the grief, where both truths still hold.',
      summary:
        'There was happiness, and there will be happiness again — but right now she is standing between the two, refusing to rewrite seven years as villainy. The Gatsby green light drifts through it.',
      inspiration:
        'Confirmed as the album’s last-written song (days before release); Swift framed it as the rare breakup song written before the dust settles.',
      themes: ['divorce and dignity', 'both things being true', 'grief mid-stream'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Happiness_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Happiness (Taylor Swift song)',
          'Happiness_(Taylor_Swift_song)',
          'song article: late writing',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'dorothea',
      trackNumber: 8,
      trackTitle: 'dorothea',
      youtubeId: 'zI4DS5GmQWE', // oEmbed-verified official Taylor Swift channel
      release: 'evermore',
      releaseDate: '2020-12-11',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Aaron Dessner'],
      note: 'The answer record to tis the damn season — the boy who stayed home, keeping a porch light on for the girl on the billboards.',
      summary:
        'A townie watches his high-school love become famous and promises, without bitterness, that the door stays open if the tinsel wears thin. Swift confirmed the two Dorothea songs share one story.',
      inspiration:
        'Confirmed character link to tis the damn season; Swift has said Dorothea exists in the same loose fictional town universe as the folklore kids.',
      themes: ['the one who stayed', 'fame from the outside', 'unconditional welcome'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Dorothea_(song)',
      sources: [
        wiki('Dorothea (song)', 'Dorothea_(song)', 'song article: character universe'),
        ALBUM,
      ],
    },
    {
      slug: 'coney-island',
      trackNumber: 9,
      trackTitle: 'coney island',
      youtubeId: 'c_p_TBaHvos', // oEmbed-verified official Taylor Swift channel
      release: 'evermore',
      releaseDate: '2020-12-11',
      writers: ['Taylor Swift', 'William Bowery', 'Aaron Dessner', 'Bryce Dessner'],
      producers: ['Aaron Dessner', 'Bryce Dessner'],
      isSingle: true,
      note: 'The duet with The National — two exes on a boardwalk bench, auditing every anniversary they missed while the Ferris wheel turns.',
      summary:
        'Mutual neglect as a slow leak: both parties inventory the birthdays forgotten and the doors not held, wondering when the main character became understudy. Matt Berninger’s baritone is the other half of the fault.',
      inspiration:
        'A four-way write with Alwyn (as Bowery) and both Dessner brothers, sung with Berninger — evermore’s fullest merger with The National’s universe.',
      themes: ['mutual neglect', 'apology in stereo', 'faded grandeur'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Coney_Island_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Coney Island (Taylor Swift song)',
          'Coney_Island_(Taylor_Swift_song)',
          'song article: National collaboration',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'ivy',
      trackNumber: 10,
      trackTitle: 'ivy',
      youtubeId: '9nIOx-ezlzA', // oEmbed-verified official Taylor Swift channel
      release: 'evermore',
      releaseDate: '2020-12-11',
      writers: ['Taylor Swift', 'Aaron Dessner', 'Jack Antonoff'],
      producers: ['Aaron Dessner'],
      note: 'A married woman’s affair told in garden metaphors — the fandom’s favorite evermore deep cut and a cottagecore national anthem.',
      summary:
        'Someone else’s vines have grown all over a house that legally belongs to another man: forbidden love in a period drama’s clothes, doom accepted cheerfully in the bridge.',
      inspiration:
        'Fans connect its imagery to Emily Dickinson (evermore was announced on Dickinson’s birthday) — an unconfirmed but beloved reading; the affair plot itself is Swift-invented fiction.',
      themes: ['forbidden love', 'nature as desire', 'accepting ruin'],
      fanLore:
        'Fan reading (unconfirmed): the Dickinson wink, boosted by the announcement date and the show Dickinson using the song.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Evermore',
      sources: [ALBUM],
    },
    {
      slug: 'cowboy-like-me',
      trackNumber: 11,
      trackTitle: 'cowboy like me',
      youtubeId: 'YPlNBb6I8qU', // oEmbed-verified official Taylor Swift channel
      release: 'evermore',
      releaseDate: '2020-12-11',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Aaron Dessner'],
      note: 'Two con artists fall inconveniently in love at a country club — with Marcus Mumford’s backing vocals drifting through the tent.',
      summary:
        'Grifters who hustle rich marks recognize each other instantly and break the only rule: never feel anything. Love as the one long con neither of them planned.',
      inspiration:
        'Mumford’s confirmed backing-vocal cameo came via lockdown-era file-sharing; the swindler romance is pure evermore fiction.',
      themes: ['con-artist romance', 'kindred spirits', 'love as the real gamble'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Cowboy_like_Me',
      sources: [wiki('Cowboy like Me', 'Cowboy_like_Me', 'song article: Mumford credit'), ALBUM],
    },
    {
      slug: 'long-story-short',
      trackNumber: 12,
      trackTitle: 'long story short',
      youtubeId: 'rqQHa2HcGtM', // oEmbed-verified official Taylor Swift channel
      release: 'evermore',
      releaseDate: '2020-12-11',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Aaron Dessner'],
      note: 'The one openly autobiographical sprint on evermore — 2016 compressed into a past-tense montage that ends happily.',
      summary:
        'The pile-on years summarized at fast-forward: wrong fights, bad ground, a fall from the pedestal — survived, married off to a better present, and dispatched with a shrug and advice to her past self.',
      inspiration:
        'Swift confirmed it condenses her 2016 nadir and its aftermath — the rare evermore track she filed under her own name rather than a character’s.',
      themes: ['surviving the pile-on', 'hindsight', 'peace as the punchline'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Long_Story_Short_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Long Story Short (Taylor Swift song)',
          'Long_Story_Short_(Taylor_Swift_song)',
          'song article: autobiographical framing',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'marjorie',
      trackNumber: 13,
      trackTitle: 'marjorie',
      youtubeId: 'hP6QpMeSG6s', // oEmbed-verified official Taylor Swift channel
      release: 'evermore',
      releaseDate: '2020-12-11',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Aaron Dessner'],
      note: 'Track 13 for her grandmother Marjorie Finlay, the opera singer — whose actual archival voice sings backup from beyond.',
      summary:
        'Grief braided with inherited advice: be polite but keep a knife, be cleverer than clever. The regret of not saving more of someone, answered by literally sampling the recordings that survived.',
      inspiration:
        'Confirmed: about Marjorie Finlay, Swift’s opera-singer grandmother; Finlay’s archival vocals are credited on the track, the era’s most tender production choice.',
      themes: ['grief for a grandparent', 'inheritance of spirit', 'what survives us'],
      easterEggs:
        'The pairing with epiphany gives each grandparent a song — grandfather at 13 on folklore’s tracklist mirror, grandmother at 13 here.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Marjorie_(song)',
      sources: [
        wiki('Marjorie (song)', 'Marjorie_(song)', 'song article: Finlay tribute and vocal credit'),
        ALBUM,
      ],
    },
    {
      slug: 'closure',
      trackNumber: 14,
      trackTitle: 'closure',
      youtubeId: 'AIFnKqIeEdY', // oEmbed-verified official Taylor Swift channel
      release: 'evermore',
      releaseDate: '2020-12-11',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Aaron Dessner', 'BJ Burton'],
      note: 'The 5/4 industrial-folk oddity — a reply to a smug it’s-all-good letter from someone who wants absolution more than amends.',
      summary:
        'An old adversary offers tidy closure and she declines the paperwork: her peace does not require his ceremony. The clattering time signature makes the discomfort audible.',
      inspiration: null,
      themes: ['refusing cheap absolution', 'boundaries', 'discordant peace'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Evermore',
      sources: [ALBUM],
    },
    {
      slug: 'evermore',
      trackNumber: 15,
      trackTitle: 'evermore',
      youtubeId: 'EXLgZZE072g', // oEmbed-verified official Taylor Swift channel
      release: 'evermore',
      releaseDate: '2020-12-11',
      writers: ['Taylor Swift', 'William Bowery', 'Justin Vernon'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      note: 'The title-track closer with Bon Iver — depression’s floor found, then a change of tempo and the first sighting of the way out.',
      summary:
        'A November spent rereading old letters and assuming the pain is permanent; Vernon’s frantic bridge is the storm, and the final verses are the quiet discovery that it was not permanent after all.',
      inspiration:
        'Co-written with Alwyn (piano, as Bowery) and Vernon; Swift has described its arc — pain that finally is not forever — as the deliberate closing statement of the sister albums.',
      themes: ['depression and its lifting', 'winter to thaw', 'endurance'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Evermore',
      sources: [ALBUM],
    },
    {
      slug: 'right-where-you-left-me',
      trackNumber: 16,
      trackTitle: 'right where you left me',
      youtubeId: 'Ur_wAcYDnuA', // oEmbed-verified official Taylor Swift channel
      release: 'evermore (deluxe edition)',
      releaseDate: '2021-01-07',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Aaron Dessner'],
      note: 'Bonus track one: the girl who never left the restaurant where her life ended — time moves for everyone but her table.',
      summary:
        'A breakup so total she fossilizes at the scene: friends marry, seasons change, and she stays 23 at a corner table with dust in her hair. Small-town gossip as Greek chorus.',
      inspiration: null,
      themes: ['arrested grief', 'frozen in time', 'the town watches'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Evermore',
      sources: [ALBUM],
    },
    {
      slug: 'its-time-to-go',
      trackNumber: 17,
      trackTitle: "it's time to go",
      youtubeId: '1iRbIYkccgw', // oEmbed-verified official Taylor Swift channel
      release: 'evermore (deluxe edition)',
      releaseDate: '2021-01-07',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Aaron Dessner'],
      note: 'Bonus track two and the deluxe edition’s thesis: knowing when leaving is the brave option — with a verse fans read as the masters saga in miniature.',
      summary:
        'Three case studies in walking away — a dead friendship, a hollow marriage, and a job where something she made was handed to someone else. That last verse maps so cleanly onto the Big Machine exit that fans treat it as autobiography.',
      inspiration:
        'The trusting-your-gut-to-leave thesis is the song’s own text; the record-label verse is the widely held fan reading of the 2018–2019 masters events (not officially footnoted).',
      themes: ['knowing when to leave', 'self-trust', 'starting over as winning'],
      fanLore:
        'Fan reading (widely held): verse three as the departure from Big Machine and the fight for her catalog.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Evermore',
      sources: [ALBUM],
    },
];

{
  const slugs = new Set(TRACKS.map((t) => t.slug));
  for (const key of Object.keys(DOSSIERS)) {
    if (!slugs.has(key)) throw new Error(`dossier for unknown track slug: ${key}`);
  }
}

export default {
  eraSlug: 'evermore',
  tracks: TRACKS.map((t) => (DOSSIERS[t.slug] ? { ...t, dossier: DOSSIERS[t.slug] } : t)),
};

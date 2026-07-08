import type { ContentItem, EraId, Milestone } from './types';

/**
 * Representative mock content. Every era gets a hero image reused from the era
 * art; a real API would supply per-moment imagery. Ordering is handled in the
 * UI (chronological, oldest-first), so authoring order here is not significant.
 */

type RawItem = Omit<ContentItem, 'eraId' | 'image'> & { image?: string };

function build(eraId: EraId, items: RawItem[]): ContentItem[] {
  return items.map((it) => ({
    ...it,
    eraId,
    image: it.image ?? `/eras/${eraId === 'ttpd' ? 'ttpd' : eraId}.png`,
  }));
}

const RAW: Record<EraId, RawItem[]> = {
  debut: [
    {
      id: 'debut-tim-mcgraw',
      date: '2006-06-19',
      dateLabel: 'June 2006',
      title: '“Tim McGraw” arrives',
      summary:
        'A debut single named after a country legend announces a 16-year-old songwriter with an unusual gift for specifics.',
      body: [
        'Before the stadiums, there was a teenager who named her first single after Tim McGraw — a bet that specificity would travel further than polish.',
        'It cracked the country charts and set the template for everything after: real names, real places, and a diaristic eye for the small detail that makes a memory ache.',
      ],
      tags: ['Music'],
      hiddenClue: {
        clue: 'The liner notes hid secret messages in capital letters.',
        payoff:
          'That decrypting-the-capitals habit became a decade-long tradition fans still decode on every album.',
      },
    },
    {
      id: 'debut-cowboy-boots',
      date: '2007-04-01',
      dateLabel: 'Spring 2007',
      title: 'Curls, sundresses and cowboy boots',
      summary: 'The visual signature of the debut era: sunlit country-girl Americana.',
      body: [
        'Ringlet curls, floaty sundresses, and well-worn cowboy boots became the uniform of the debut era — a look as handmade and earnest as the songs.',
      ],
      tags: ['Fashion'],
    },
    {
      id: 'debut-our-song',
      date: '2007-09-08',
      dateLabel: 'September 2007',
      title: '“Our Song” hits number one',
      summary:
        'At 17, she becomes the youngest person to single-handedly write and perform a number-one country hit.',
      body: [
        'A song she originally wrote for a high-school talent show became a record-setting number one, proving the debut was no fluke.',
      ],
      tags: ['Music'],
    },
  ],
  fearless: [
    {
      id: 'fearless-album',
      date: '2008-11-11',
      dateLabel: 'November 2008',
      title: 'Fearless changes everything',
      summary:
        'The fairy-tale record that turns a promising country act into a global phenomenon.',
      body: [
        'Fearless is the sound of teenage romance written in gold ink — princess dresses, white horses, and choruses built for arenas.',
        'It would become the most-awarded country album in history and make her the youngest Album of the Year winner at the time.',
      ],
      tags: ['Music'],
    },
    {
      id: 'fearless-vmas',
      date: '2009-09-13',
      dateLabel: 'September 2009',
      title: 'The interrupted speech',
      summary:
        'A VMAs moment becomes pop-culture lore and a defining public turning point.',
      body: [
        'Mid-acceptance, the microphone was taken. The moment turned a rising star into a household name overnight and seeded a narrative she would revisit for years.',
      ],
      tags: ['Lore'],
      hiddenClue: {
        clue: 'She later wrote a song thanking the moment for making her stronger.',
        payoff: '“Innocent” and, years later, the framing of the reputation era both trace back here.',
      },
    },
  ],
  'speak-now': [
    {
      id: 'speak-now-album',
      date: '2010-10-25',
      dateLabel: 'October 2010',
      title: 'Written entirely alone',
      summary:
        'A response to critics who doubted her songwriting: every word, solo.',
      body: [
        'Speak Now carries no co-writers — a deliberate statement of authorship after whispers that others wrote her hits.',
        'The result is theatrical and intimate at once: apologies, fantasies, and confrontations staged under violet light.',
      ],
      tags: ['Music'],
    },
    {
      id: 'speak-now-ballgowns',
      date: '2011-02-01',
      dateLabel: '2011 Tour',
      title: 'The ballgown tour',
      summary: 'Sweeping purple gowns turn every show into a fairy tale.',
      body: ['The Speak Now World Tour leaned fully theatrical — flowing gowns, castles, and enchantment.'],
      tags: ['Tour', 'Fashion'],
    },
  ],
  red: [
    {
      id: 'red-album',
      date: '2012-10-22',
      dateLabel: 'October 2012',
      title: 'Red: heartbreak in every genre',
      summary:
        'The transitional masterpiece that pointed straight at pop stardom.',
      body: [
        'Red is maximalist and messy on purpose — dubstep drops next to acoustic confessionals, all of it about one crimson-colored heartbreak.',
        'The centerpiece, a ten-minute epic, would return years later as a cultural event of its own.',
      ],
      tags: ['Music'],
      hiddenClue: {
        clue: 'A scarf mentioned in one song became the most-discussed accessory in pop.',
        payoff:
          'Fans still debate who kept the scarf — a mystery she has coyly refused to fully resolve.',
      },
    },
    {
      id: 'red-wanegbt',
      date: '2012-08-13',
      dateLabel: 'August 2012',
      title: '“We Are Never Ever Getting Back Together”',
      summary: 'The gleeful kiss-off lead single that announced a decisive pop pivot.',
      body: [
        'The lead single arrived with an eye-roll and a spoken-word bridge, and it shot straight to number one — her first Hot 100 chart-topper.',
        'It signaled, unmistakably, that the country prodigy was walking toward the center of pop.',
      ],
      tags: ['Music'],
    },
    {
      id: 'red-begin-again',
      date: '2012-10-01',
      dateLabel: 'October 2012',
      title: '“Begin Again” as the soft landing',
      summary: 'A gentle promotional single about hope after heartbreak.',
      body: ['Released ahead of the album, “Begin Again” balanced the era’s louder singles with quiet, hopeful romance.'],
      tags: ['Music'],
    },
    {
      id: 'red-lip',
      date: '2012-11-01',
      dateLabel: 'Late 2012',
      title: 'The classic red lip',
      summary: 'A signature look is born: red lip, vintage silhouettes, autumn tones.',
      body: ['The bold red lip and retro tailoring defined the era and became a lasting personal signature.'],
      tags: ['Fashion'],
    },
    {
      id: 'red-i-knew-you',
      date: '2012-11-12',
      dateLabel: 'November 2012',
      title: '“I Knew You Were Trouble” goes global',
      summary: 'A dubstep-tinged drop that pushed her sound to its poppiest edge yet.',
      body: ['The bass-heavy breakdown scandalized country purists and delighted everyone else, cementing the genre crossover.'],
      tags: ['Music'],
    },
    {
      id: 'red-snl',
      date: '2012-11-03',
      dateLabel: 'November 2012',
      title: 'A run of TV performances',
      summary: 'Late-night and award-show stages keep Red everywhere at once.',
      body: ['A dense promotional stretch put the album on every major stage as the release momentum peaked.'],
      tags: ['Tour'],
    },
    {
      id: 'red-grammys-2013',
      date: '2013-02-10',
      dateLabel: 'February 2013',
      title: 'The circus-themed Grammy opener',
      summary: 'A theatrical performance opens the ceremony and previews the tour’s scale.',
      body: ['Opening the Grammys with a ringmaster’s flourish, she turned a single song into full-blown spectacle.'],
      tags: ['Tour'],
    },
    {
      id: 'red-tour',
      date: '2013-03-13',
      dateLabel: 'March 2013',
      title: 'The Red Tour begins',
      summary: 'Her most ambitious production yet crosses continents and shatters country touring records.',
      body: [
        'The Red Tour spanned the globe across 2013 and 2014, becoming the highest-grossing tour by a country artist at the time.',
        'Each night folded in surprise guests and costume changes, a blueprint for the spectacle to come.',
      ],
      tags: ['Tour'],
    },
    {
      id: 'red-everything-changed',
      date: '2013-07-06',
      dateLabel: 'July 2013',
      title: '“Everything Has Changed” duet',
      summary: 'A folk-pop collaboration extends the album’s long single run.',
      body: ['A tender duet kept Red on the charts deep into 2013, well over a year after release.'],
      tags: ['Music'],
    },
  ],
  '1989': [
    {
      id: '1989-album',
      date: '2014-10-27',
      dateLabel: 'October 2014',
      title: 'The pop reinvention',
      summary:
        'A clean break from country: synths, New York, and a Polaroid aesthetic.',
      body: [
        'Billed as her first “official pop album,” 1989 traded twang for gleaming synth-pop and remade her as the biggest star in the world.',
      ],
      tags: ['Music'],
    },
    {
      id: '1989-shake-it-off',
      date: '2014-08-18',
      dateLabel: 'August 2014',
      title: '“Shake It Off” launches the era',
      summary: 'A brass-driven lead single announces the full pop pivot from a stadium stage.',
      body: ['Debuted at a live-streamed event, the lead single made the reinvention official and immediately topped the charts.'],
      tags: ['Music'],
    },
    {
      id: '1989-blank-space',
      date: '2014-11-10',
      dateLabel: 'November 2014',
      title: '“Blank Space” flips the narrative',
      summary: 'A self-aware satire of her own tabloid image becomes a defining smash.',
      body: ['By playing the “boy-crazy” caricature for laughs, she seized control of the story and scored another number one.'],
      tags: ['Music', 'Lore'],
    },
    {
      id: '1989-polaroids',
      date: '2014-11-01',
      dateLabel: 'Late 2014',
      title: 'Polaroids and pastel',
      summary: 'The visual language of 1989: instant photos, seagulls, sky-blue minimalism.',
      body: ['Polaroid-framed lyrics and a crisp pastel palette made 1989 instantly iconic.'],
      tags: ['Fashion'],
    },
    {
      id: '1989-squad',
      date: '2015-01-15',
      dateLabel: 'Early 2015',
      title: 'The “squad” era',
      summary: 'A rotating cast of famous friends becomes its own cultural storyline.',
      body: ['Group appearances and red-carpet friendships turned her social circle into a defining 1989-era talking point.'],
      tags: ['Lore'],
    },
    {
      id: '1989-bad-blood',
      date: '2015-05-17',
      dateLabel: 'May 2015',
      title: '“Bad Blood” short film',
      summary: 'A star-studded cinematic music video doubles as an event premiere.',
      body: ['The action-movie video premiered at an awards show with a cast of celebrity cameos, blurring music and blockbuster.'],
      tags: ['Music'],
    },
    {
      id: '1989-world-tour',
      date: '2015-05-05',
      dateLabel: 'May 2015',
      title: 'The 1989 World Tour',
      summary: 'A parade of surprise guests turns each show into an event.',
      body: [
        'The tour’s recurring gimmick — a different famous guest strolling the catwalk each night — made every stop feel unrepeatable.',
        'It became the highest-grossing tour of the year and the peak of her imperial pop phase.',
      ],
      tags: ['Tour'],
    },
    {
      id: '1989-aoty',
      date: '2016-02-15',
      dateLabel: 'February 2016',
      title: 'Second Album of the Year',
      summary: 'She becomes the first woman to win the top Grammy twice.',
      body: ['Accepting the award, she used the moment to speak directly to young women about crediting their own work.'],
      tags: ['Lore'],
    },
  ],
  // NOTE: the flagship eras (Red, 1989, Midnights) carry extra entries to
  // demonstrate the timeline density ridge; other eras will fill in over time.
  reputation: [
    {
      id: 'rep-album',
      date: '2017-11-10',
      dateLabel: 'November 2017',
      title: 'reputation strikes back',
      summary:
        'Armored, monochrome, and defiant — the sound of rebuilding on her own terms.',
      body: [
        'After a very public year, she disappeared and returned all in black, with snakes reclaimed as armor.',
        'Beneath the hard exterior, though, reputation hides a surprisingly tender love story.',
      ],
      tags: ['Music'],
      hiddenClue: {
        clue: 'She reclaimed the snake her critics used against her.',
        payoff: 'Turning the insult into iconography flipped the whole narrative in her favor.',
      },
    },
    {
      id: 'rep-tour',
      date: '2018-05-08',
      dateLabel: 'May 2018',
      title: 'Giant snakes, record numbers',
      summary: 'The Reputation Stadium Tour becomes the highest-grossing US tour at the time.',
      body: ['Towering cobra stage design and a stadium-scale production reset expectations for her live shows.'],
      tags: ['Tour'],
    },
  ],
  lover: [
    {
      id: 'lover-album',
      date: '2019-08-23',
      dateLabel: 'August 2019',
      title: 'Color returns with Lover',
      summary:
        'A pastel love letter — and the first album she would fully own.',
      body: [
        'After the armor, Lover flooded everything with pastel light: romance loud again, hearts and glitter everywhere.',
      ],
      tags: ['Music'],
    },
    {
      id: 'lover-masters',
      date: '2019-06-30',
      dateLabel: 'June 2019',
      title: 'The masters are sold',
      summary:
        'Her back catalog changes hands without her — igniting a fight to reclaim her work.',
      body: [
        'News that her master recordings were sold set off the defining business battle of her career and the plan to re-record everything.',
      ],
      tags: ['Lore'],
      hiddenClue: {
        clue: 'She announced she would re-record her old albums.',
        payoff: 'The “Taylor’s Version” project was born — reclaiming her catalog one album at a time.',
      },
    },
  ],
  folklore: [
    {
      id: 'folklore-album',
      date: '2020-07-24',
      dateLabel: 'July 2020',
      title: 'A surprise in the woods',
      summary:
        'Dropped with less than a day’s notice during lockdown — an indie-folk reinvention.',
      body: [
        'No rollout, no singles, no warning: folklore arrived overnight and rewrote what a Taylor Swift album could be.',
        'Muted, literary, and fictional, it introduced interlocking character stories fans mapped for months.',
      ],
      tags: ['Music', 'Lore'],
    },
    {
      id: 'folklore-cardigan',
      date: '2020-08-01',
      dateLabel: 'Summer 2020',
      title: 'The cardigan and cottagecore',
      summary: 'Grayscale knitwear and misty forests define the era’s look.',
      body: ['Cozy cardigans, braided hair, and a foggy woodland palette made cottagecore the aesthetic of 2020.'],
      tags: ['Fashion'],
    },
  ],
  evermore: [
    {
      id: 'evermore-album',
      date: '2020-12-11',
      dateLabel: 'December 2020',
      title: 'folklore’s sister arrives',
      summary:
        'A second surprise album in five months — warmer, rustier, and just as literary.',
      body: [
        'evermore extended the folklore universe into late autumn: flannel, firelight, and some of her most intricate storytelling.',
      ],
      tags: ['Music'],
    },
  ],
  midnights: [
    {
      id: 'midnights-album',
      date: '2022-10-21',
      dateLabel: 'October 2022',
      title: 'Thirteen sleepless nights',
      summary:
        'A return to pop as a diary of midnights across her life.',
      body: [
        'Midnights framed itself as thirteen sleepless nights, blending retro-glam synths with confessional diary entries.',
      ],
      tags: ['Music'],
    },
    {
      id: 'midnights-3am',
      date: '2022-10-22',
      dateLabel: 'October 2022',
      title: 'The 3am edition surprise',
      summary: 'Seven extra tracks land three hours after release, a now-signature move.',
      body: ['Hours after midnight, a “3am Edition” expanded the album — rewarding the fans who stayed up.'],
      tags: ['Music'],
    },
    {
      id: 'midnights-antihero',
      date: '2022-10-24',
      dateLabel: 'October 2022',
      title: '“Anti-Hero” dominates',
      summary: 'A candid single about self-doubt becomes her biggest solo hit in years.',
      body: ['Its confessional humor and inescapable chorus made “Anti-Hero” the defining pop single of the season.'],
      tags: ['Music'],
    },
    {
      id: 'midnights-chart-record',
      date: '2022-11-05',
      dateLabel: 'November 2022',
      title: 'Every top-ten slot at once',
      summary: 'She becomes the first artist to monopolize the entire top ten of the Hot 100.',
      body: ['The album’s dominance rewrote the record books, occupying all ten of the chart’s highest positions in a single week.'],
      tags: ['Lore'],
    },
    {
      id: 'midnights-ticket-chaos',
      date: '2022-11-15',
      dateLabel: 'November 2022',
      title: 'The ticket frenzy',
      summary: 'Unprecedented demand for the Eras Tour crashes the sales system and reaches Washington.',
      body: ['The scramble for tickets became a national news story — and eventually a subject of political hearings.'],
      tags: ['Lore'],
    },
    {
      id: 'midnights-eras-tour',
      date: '2023-03-17',
      dateLabel: 'March 2023',
      title: 'The Eras Tour begins',
      summary:
        'A career-spanning show becomes a global cultural and economic event.',
      body: [
        'Three-plus hours spanning every era, the Eras Tour shattered records and turned entire cities into pilgrimage sites.',
      ],
      tags: ['Tour'],
      hiddenClue: {
        clue: 'A rotating “surprise song” slot changed every single night.',
        payoff: 'Fans tracked mashups obsessively, treating each night’s pairing as a coded message.',
      },
    },
    {
      id: 'midnights-film',
      date: '2023-10-13',
      dateLabel: 'October 2023',
      title: 'The Eras Tour hits cinemas',
      summary: 'A concert film breaks box-office records for the format.',
      body: ['Bypassing traditional studios, the concert film became the highest-grossing of its kind, extending the tour’s reach worldwide.'],
      tags: ['Tour'],
    },
  ],
  ttpd: [
    {
      id: 'ttpd-album',
      date: '2024-04-19',
      dateLabel: 'April 2024',
      title: 'The Tortured Poets Department',
      summary:
        'A literary, ink-stained double album — the most word-heavy record of her career.',
      body: [
        'Announced from the Grammy stage and released as a surprise double album, TTPD is dense, diaristic, and unflinching.',
        'Typewriter fonts, black-and-white imagery, and poetry-as-liner-notes make it the most literary era yet.',
      ],
      tags: ['Music'],
      hiddenClue: {
        clue: 'A second half — “The Anthology” — appeared two hours after release.',
        payoff: 'The surprise 15 extra tracks doubled the album and broke streaming records overnight.',
      },
    },
    {
      id: 'ttpd-typewriter',
      date: '2024-04-20',
      dateLabel: 'April 2024',
      title: 'Ink, typewriters and monochrome',
      summary: 'The most restrained visual era: black, white, and typewritten confession.',
      body: ['Grayscale styling and typewriter motifs frame the era as a literary confessional.'],
      tags: ['Fashion'],
    },
  ],
  tloas: [
    {
      id: 'tloas-announce',
      date: '2025-08-12',
      dateLabel: 'August 2025',
      title: 'A new era is announced',
      summary: 'The Life of a Showgirl is revealed — a hard turn from ink into glitter.',
      body: [
        'After the monochrome hush of the last era, the announcement lands in warm orange and gold: a showgirl era, all sparkle and spectacle.',
        'The reveal reframes everything that came before as the build-up to a curtain call.',
      ],
      tags: ['Music'],
      hiddenClue: {
        clue: 'The announcement leaned hard on the color orange — a shade barely used before.',
        payoff: 'Orange became the era’s signature, blanketing every teaser and cover in warm footlight glow.',
      },
    },
    {
      id: 'tloas-album',
      date: '2025-10-03',
      dateLabel: 'October 2025',
      title: 'The Life of a Showgirl released',
      summary: 'The twelfth era arrives: opulent, theatrical, and unapologetically bright.',
      body: [
        'The album trades diary pages for the stage — feathers, footlights, and the glittering armor of a performer who has seen it all.',
        'It is a victory lap dressed as a cabaret: knowing, warm, and dazzling.',
      ],
      tags: ['Music'],
    },
    {
      id: 'tloas-sequins',
      date: '2025-10-04',
      dateLabel: 'October 2025',
      title: 'Orange sequins and feathers',
      summary: 'The visual language: burnt-orange rhinestones, marabou, and spotlight sparkle.',
      body: ['Showgirl glamour defines the styling — sequins, feathers, and a warm theatrical glow in every frame.'],
      tags: ['Fashion'],
    },
    {
      id: 'tloas-single',
      date: '2025-10-10',
      dateLabel: 'October 2025',
      title: 'The lead single shines',
      summary: 'A brassy, celebratory single sets the tone for the era.',
      body: ['Bright horns and a confident strut announce a mood of triumph rather than heartbreak.'],
      tags: ['Music'],
    },
    {
      id: 'tloas-debut-chart',
      date: '2025-10-13',
      dateLabel: 'October 2025',
      title: 'A record-setting debut',
      summary: 'The album opens at number one with era-defining first-week numbers.',
      body: ['The launch reaffirmed her commercial dominance, opening atop the charts around the world.'],
      tags: ['Lore'],
    },
  ],
};

export const CONTENT: ContentItem[] = (Object.keys(RAW) as EraId[]).flatMap((eraId) =>
  build(eraId, RAW[eraId]),
);

export function contentForEra(eraId: EraId): ContentItem[] {
  // Chronological (oldest-first) so the era reads as a story from its start,
  // and aligns top-to-bottom with the timeline scrubber.
  return CONTENT.filter((c) => c.eraId === eraId).sort((a, b) => a.date.localeCompare(b.date));
}

export function getContentItem(id: string): ContentItem | undefined {
  return CONTENT.find((c) => c.id === id);
}

// ── Milestones (timeline markers) ───────────────────────────────────────────

export const MILESTONES: Milestone[] = [
  { id: 'm-debut-1', eraId: 'debut', date: '2006-10-24', label: 'Debut album', kind: 'album' },
  { id: 'm-debut-2', eraId: 'debut', date: '2007-09-08', label: '“Our Song” #1', kind: 'award' },
  { id: 'm-fear-1', eraId: 'fearless', date: '2008-11-11', label: 'Fearless released', kind: 'album' },
  { id: 'm-fear-2', eraId: 'fearless', date: '2009-09-13', label: 'VMAs moment', kind: 'life' },
  { id: 'm-fear-3', eraId: 'fearless', date: '2010-01-31', label: 'Album of the Year', kind: 'award' },
  { id: 'm-sn-1', eraId: 'speak-now', date: '2010-10-25', label: 'Speak Now released', kind: 'album' },
  { id: 'm-sn-2', eraId: 'speak-now', date: '2011-02-09', label: 'World Tour begins', kind: 'tour' },
  { id: 'm-red-0', eraId: 'red', date: '2012-08-13', label: 'First #1 single', kind: 'award' },
  { id: 'm-red-1', eraId: 'red', date: '2012-10-22', label: 'Red released', kind: 'album' },
  { id: 'm-red-2', eraId: 'red', date: '2013-03-13', label: 'The Red Tour', kind: 'tour' },
  { id: 'm-89-0', eraId: '1989', date: '2014-08-18', label: '“Shake It Off”', kind: 'life' },
  { id: 'm-89-1', eraId: '1989', date: '2014-10-27', label: '1989 released', kind: 'album' },
  { id: 'm-89-2', eraId: '1989', date: '2015-05-05', label: '1989 World Tour', kind: 'tour' },
  { id: 'm-89-3', eraId: '1989', date: '2016-02-15', label: 'Album of the Year', kind: 'award' },
  { id: 'm-rep-1', eraId: 'reputation', date: '2017-11-10', label: 'reputation released', kind: 'album' },
  { id: 'm-rep-2', eraId: 'reputation', date: '2018-05-08', label: 'Stadium Tour', kind: 'tour' },
  { id: 'm-lov-1', eraId: 'lover', date: '2019-06-30', label: 'Masters sold', kind: 'business' },
  { id: 'm-lov-2', eraId: 'lover', date: '2019-08-23', label: 'Lover released', kind: 'album' },
  { id: 'm-folk-1', eraId: 'folklore', date: '2020-07-24', label: 'folklore surprise drop', kind: 'album' },
  { id: 'm-folk-2', eraId: 'folklore', date: '2021-03-14', label: 'folklore wins AOTY', kind: 'award' },
  { id: 'm-ever-1', eraId: 'evermore', date: '2020-12-11', label: 'evermore surprise drop', kind: 'album' },
  { id: 'm-mid-1', eraId: 'midnights', date: '2022-10-21', label: 'Midnights released', kind: 'album' },
  { id: 'm-mid-1b', eraId: 'midnights', date: '2022-11-05', label: 'Entire top ten', kind: 'award' },
  { id: 'm-mid-2', eraId: 'midnights', date: '2023-03-17', label: 'Eras Tour begins', kind: 'tour' },
  { id: 'm-mid-3', eraId: 'midnights', date: '2023-10-13', label: 'Eras Tour film', kind: 'tour' },
  { id: 'm-ttpd-1', eraId: 'ttpd', date: '2024-04-19', label: 'TTPD released', kind: 'album' },
  { id: 'm-ttpd-2', eraId: 'ttpd', date: '2024-12-08', label: 'Eras Tour finale', kind: 'tour' },
  { id: 'm-tloas-1', eraId: 'tloas', date: '2025-08-12', label: 'Era announced', kind: 'life' },
  { id: 'm-tloas-2', eraId: 'tloas', date: '2025-10-03', label: 'Showgirl released', kind: 'album' },
  { id: 'm-tloas-3', eraId: 'tloas', date: '2025-10-13', label: 'Record debut', kind: 'award' },
];

export function milestonesForEra(eraId: EraId): Milestone[] {
  return MILESTONES.filter((m) => m.eraId === eraId).sort((a, b) => a.date.localeCompare(b.date));
}

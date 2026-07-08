import type { ContentItem, EraId, Milestone } from './types';

/**
 * Representative mock content. Every era gets a hero image reused from the era
 * art; a real API would supply per-moment imagery. Ordering is handled in the
 * UI (newest-first), so authoring order here is not significant.
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
      id: 'red-lip',
      date: '2012-11-01',
      dateLabel: 'Late 2012',
      title: 'The classic red lip',
      summary: 'A signature look is born: red lip, vintage silhouettes, autumn tones.',
      body: ['The bold red lip and retro tailoring defined the era and became a lasting personal signature.'],
      tags: ['Fashion'],
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
      id: '1989-polaroids',
      date: '2014-11-01',
      dateLabel: 'Late 2014',
      title: 'Polaroids and pastel',
      summary: 'The visual language of 1989: instant photos, seagulls, sky-blue minimalism.',
      body: ['Polaroid-framed lyrics and a crisp pastel palette made 1989 instantly iconic.'],
      tags: ['Fashion'],
    },
  ],
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
};

export const CONTENT: ContentItem[] = (Object.keys(RAW) as EraId[]).flatMap((eraId) =>
  build(eraId, RAW[eraId]),
);

export function contentForEra(eraId: EraId): ContentItem[] {
  return CONTENT.filter((c) => c.eraId === eraId).sort((a, b) => b.date.localeCompare(a.date));
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
  { id: 'm-red-1', eraId: 'red', date: '2012-10-22', label: 'Red released', kind: 'album' },
  { id: 'm-red-2', eraId: 'red', date: '2013-03-13', label: 'The Red Tour', kind: 'tour' },
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
  { id: 'm-mid-2', eraId: 'midnights', date: '2023-03-17', label: 'Eras Tour begins', kind: 'tour' },
  { id: 'm-ttpd-1', eraId: 'ttpd', date: '2024-04-19', label: 'TTPD released', kind: 'album' },
  { id: 'm-ttpd-2', eraId: 'ttpd', date: '2024-12-08', label: 'Eras Tour finale', kind: 'tour' },
];

export function milestonesForEra(eraId: EraId): Milestone[] {
  return MILESTONES.filter((m) => m.eraId === eraId).sort((a, b) => a.date.localeCompare(b.date));
}

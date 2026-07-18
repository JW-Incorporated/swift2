import type { ContentItem, ContentTag, EraId, ImageRef, LensId, Milestone } from './types';
import { VAULT_RAW } from './content-vault.generated';

/**
 * Default thread membership implied by a content tag — the mechanism behind
 * "new content flows into Threads automatically" (docs/decisions.md
 * 2026-07-10). Only tags with an unambiguous, always-true thread mapping
 * belong here: a 'Relationship'-tagged item is *always* Love Story material,
 * a 'Fashion'-tagged item is *always* Runway material. Threads with no such
 * 1:1 tag ('taylors-version', 'easter-eggs', 'hidden-clues', 'the-proposal')
 * are opt-in only, via an item's explicit `threadIds` — adding a case here
 * would silently over-include unrelated content.
 */
const DEFAULT_THREAD_IDS_BY_TAG: Partial<Record<ContentTag, LensId>> = {
  Relationship: 'love-story',
  Fashion: 'fashion',
};

/** Exported for unit tests. */
export function defaultThreadIdsForTags(tags: ContentTag[]): LensId[] {
  const out: LensId[] = [];
  for (const t of tags) {
    const id = DEFAULT_THREAD_IDS_BY_TAG[t];
    if (id && !out.includes(id)) out.push(id);
  }
  return out;
}

/**
 * Representative mock content. Every era gets a hero image reused from the era
 * art; a real API would supply per-moment imagery. Ordering is handled in the
 * UI (chronological, oldest-first), so authoring order here is not significant.
 *
 * dateLabel rule (#682 — the WS1 day-precision relapse): when `date` is a
 * researched day-precision date, the label must show the day — write the
 * formatFullDate() form ('June 19, 2006'), never the bare month ('June
 * 2006'). When the day is genuinely unknown or the moment spans a period,
 * use an editorial period label ('Spring 2007', 'Late 2012') with a
 * representative placeholder date — a bare month+year label is
 * indistinguishable from a masked day-precision date, so a test
 * (content.test.ts) rejects it on curated items.
 */

/**
 * Authoring shape: accepts BOTH the legacy single `image` string and the new
 * `images` gallery, so existing data (the RAW literals below and the
 * generated VAULT_RAW) keeps compiling untouched. `build()` normalizes either
 * form into ContentItem's non-empty `images: ImageRef[]`.
 */
export type RawItem = Omit<ContentItem, 'eraId' | 'images'> & {
  image?: string;
  images?: ImageRef[];
};

/**
 * Normalizes RawItems into ContentItems. Every item ends up with a non-empty
 * `images` gallery: an explicit `images` array passes through verbatim; a
 * legacy single `image` (or nothing) becomes one 'primary' entry, falling
 * back to the era art. Exported for unit tests.
 */
export function build(eraId: EraId, items: RawItem[]): ContentItem[] {
  return items.map(({ image, images, threadIds, ...it }) => {
    // Explicit threadIds (an opt-in tag on the seed row) ADD to whatever the
    // item's tags imply by default — an explicit opt-in never removes a tag
    // default, matching the ContentItem.threadIds doc. Merged here — not in
    // the sync script — so hand-curated RAW items below get the exact same
    // treatment as items synced from supabase/seed/content.
    const defaults = defaultThreadIdsForTags(it.tags);
    const resolvedThreadIds = [
      ...defaults,
      ...(threadIds ?? []).filter((id) => !defaults.includes(id)),
    ];
    return {
      ...it,
      eraId,
      images: images?.length
        ? images
        : [{ url: image ?? `/eras/${eraId === 'ttpd' ? 'ttpd' : eraId}.png`, kind: 'primary' }],
      threadIds: resolvedThreadIds.length ? resolvedThreadIds : undefined,
    };
  });
}

const RAW: Record<EraId, RawItem[]> = {
  debut: [
    {
      id: 'debut-tim-mcgraw',
      video: { youtubeId: 'GkD20ajVxnY', title: 'Taylor Swift - Tim McGraw' },
      date: '2006-06-19',
      dateLabel: 'June 19, 2006',
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
      video: { youtubeId: 'Jb2stN7kH28', title: 'Taylor Swift - Our Song' },
      date: '2007-09-08',
      dateLabel: 'September 8, 2007',
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
      dateLabel: 'November 11, 2008',
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
      dateLabel: 'September 13, 2009',
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
      dateLabel: 'October 25, 2010',
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
      id: 'speak-now-mine',
      date: '2010-08-04',
      dateLabel: 'August 4, 2010',
      title: '"Mine" leaks early, ships anyway',
      summary: 'The lead single was rushed to radio and iTunes after an unauthorized online leak.',
      body: ['"Mine" was announced via livestream and scheduled for an August 16 release, but an early leak forced Big Machine Records to rush it to country radio and iTunes on August 4 instead — nearly two weeks ahead of plan.'],
      tags: ['Music'],
    },
    {
      id: 'speak-now-ballgowns',
      date: '2011-02-01',
      dateLabel: '2011 Tour',
      title: 'The ballgown tour',
      summary: 'Sweeping purple gowns turn every show into a fairy tale.',
      body: [
        'The Speak Now World Tour leaned fully theatrical — flowing gowns, castles, and enchantment.',
        'Each song got its own staged set piece, from the title track\'s wedding-crashing fantasy to "Enchanted"\'s ballroom backdrop.',
      ],
      tags: ['Tour', 'Fashion'],
    },
    {
      id: 'speak-now-mean',
      date: '2011-03-14',
      dateLabel: 'March 14, 2011',
      title: '"Mean" answers a critic',
      summary: 'A banjo-driven single written directly about online criticism she\'d received.',
      body: ['Swift has said "Mean" was written in direct response to a critical review — a rare moment of the album engaging a critic rather than an ex, and one of Speak Now\'s more overtly personal tracks.'],
      tags: ['Music'],
    },
    {
      id: 'speak-now-enchanted',
      date: '2011-05-03',
      dateLabel: 'May 3, 2011',
      title: '"Enchanted," a fan favorite',
      summary: 'A sprawling, six-minute love-at-first-sight song that became one of the album\'s most enduring deep cuts.',
      body: ['Never released as an official single, "Enchanted" nonetheless became one of Speak Now\'s most fan-beloved tracks — its extended, key-changing structure a favorite live moment on the Speak Now World Tour.'],
      tags: ['Music'],
    },
    {
      id: 'speak-now-taylors-version',
      date: '2023-07-07',
      dateLabel: 'July 7, 2023',
      title: 'Speak Now (Taylor\'s Version)',
      summary: 'The third re-recording arrives with six previously unreleased "From the Vault" tracks.',
      body: ['Speak Now (Taylor\'s Version) released July 7, 2023, with six vault tracks, including "Castles Crumbling" featuring Hayley Williams of Paramore — reclaiming the only album in her catalog she\'s said was written entirely without a co-writer.'],
      tags: ['Music'],
    },
  ],
  red: [
    {
      id: 'red-album',
      date: '2012-10-22',
      dateLabel: 'October 22, 2012',
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
      video: { youtubeId: 'WA4iX5D9Z64', title: 'Taylor Swift - We Are Never Ever Getting Back Together' },
      date: '2012-08-13',
      dateLabel: 'August 13, 2012',
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
      video: { youtubeId: 'cMPEd8m79Hw', title: 'Taylor Swift - Begin Again' },
      date: '2012-10-01',
      dateLabel: 'October 1, 2012',
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
      video: { youtubeId: 'vNoKguSdy4Y', title: 'Taylor Swift - I Knew You Were Trouble' },
      date: '2012-11-12',
      dateLabel: 'November 12, 2012',
      title: '“I Knew You Were Trouble” goes global',
      summary: 'A dubstep-tinged drop that pushed her sound to its poppiest edge yet.',
      body: ['The bass-heavy breakdown scandalized country purists and delighted everyone else, cementing the genre crossover.'],
      tags: ['Music'],
    },
    {
      id: 'red-snl',
      date: '2012-11-03',
      dateLabel: 'Fall 2012',
      title: 'A run of TV performances',
      summary: 'Late-night and award-show stages keep Red everywhere at once.',
      body: ['A dense promotional stretch put the album on every major stage as the release momentum peaked.'],
      tags: ['Tour'],
    },
    {
      id: 'red-grammys-2013',
      date: '2013-02-10',
      dateLabel: 'February 10, 2013',
      title: 'The circus-themed Grammy opener',
      summary: 'A theatrical performance opens the ceremony and previews the tour’s scale.',
      body: ['Opening the Grammys with a ringmaster’s flourish, she turned a single song into full-blown spectacle.'],
      tags: ['Tour'],
    },
    {
      id: 'red-tour',
      date: '2013-03-13',
      dateLabel: 'March 13, 2013',
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
      dateLabel: 'July 6, 2013',
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
      dateLabel: 'October 27, 2014',
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
      video: { youtubeId: 'nfWlot6h_JM', title: 'Taylor Swift - Shake It Off' },
      date: '2014-08-18',
      dateLabel: 'August 18, 2014',
      title: '“Shake It Off” launches the era',
      summary: 'A brass-driven lead single announces the full pop pivot from a stadium stage.',
      body: ['Debuted at a live-streamed event, the lead single made the reinvention official and immediately topped the charts.'],
      tags: ['Music'],
    },
    {
      id: '1989-blank-space',
      video: { youtubeId: 'e-ORhEE9VVg', title: 'Taylor Swift - Blank Space' },
      date: '2014-11-10',
      dateLabel: 'November 10, 2014',
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
      video: { youtubeId: 'QcIy9NiNbmo', title: 'Taylor Swift - Bad Blood ft. Kendrick Lamar' },
      date: '2015-05-17',
      dateLabel: 'May 17, 2015',
      title: '“Bad Blood” short film',
      summary: 'A star-studded cinematic music video doubles as an event premiere.',
      body: ['The action-movie video premiered at an awards show with a cast of celebrity cameos, blurring music and blockbuster.'],
      tags: ['Music'],
    },
    {
      id: '1989-world-tour',
      date: '2015-05-05',
      dateLabel: 'May 5, 2015',
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
      dateLabel: 'February 15, 2016',
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
      dateLabel: 'November 10, 2017',
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
      dateLabel: 'May 8, 2018',
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
      dateLabel: 'August 23, 2019',
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
      dateLabel: 'June 30, 2019',
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
      dateLabel: 'July 24, 2020',
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
      video: { youtubeId: 'K-a8s8OLBSE', title: 'Taylor Swift - cardigan' },
      date: '2020-08-01',
      dateLabel: 'Summer 2020',
      title: 'The cardigan and cottagecore',
      summary: 'Grayscale knitwear and misty forests define the era’s look.',
      body: [
        'Cozy cardigans, braided hair, and a foggy woodland palette made cottagecore the aesthetic of 2020.',
        'The cream cable-knit cardigan from the video, embroidered with stars, was sold as official merch and is widely credited with driving cottagecore\'s mainstream revival.',
      ],
      tags: ['Fashion'],
    },
    {
      id: 'folklore-teenage-love-triangle',
      date: '2020-07-25',
      dateLabel: 'July 25, 2020',
      title: 'The teenage love triangle',
      summary: 'Three songs — "cardigan," "august," and "betty" — tell one story from three points of view.',
      body: [
        'Swift has said on record that "cardigan," "august," and "betty" form a fictional teenage love triangle, each song narrated by a different character in the story.',
        'It set the template for folklore\'s fictional, novelistic approach — a sharp turn from the autobiographical framing of her earlier catalog.',
      ],
      tags: ['Music', 'Lore'],
    },
    {
      id: 'folklore-william-bowery',
      date: '2020-11-25',
      dateLabel: 'November 25, 2020',
      title: 'William Bowery revealed',
      summary: 'The mystery co-writer credited on "exile" and "betty" is confirmed as Joe Alwyn.',
      body: [
        'In the Disney+ special Folklore: The Long Pond Studio Sessions, Swift revealed that "William Bowery" — credited as a co-writer on "exile" and "betty" — was her then-partner Joe Alwyn.',
        'The pseudonym combines his great-grandfather\'s name, William Alwyn (also a musician), with the Bowery Hotel, where the two were first spotted together.',
      ],
      tags: ['Music', 'Lore'],
    },
    {
      id: 'folklore-aoty',
      date: '2021-03-14',
      dateLabel: 'March 14, 2021',
      title: 'A third Album of the Year',
      summary: 'folklore wins the Grammy for Album of the Year, her third — the most by a woman.',
      body: [
        'At the 63rd Annual Grammy Awards, folklore won Album of the Year — Swift\'s third win in the category, after Fearless and 1989, making her the first woman to win it three times.',
        'She performed a acoustic-lawn medley of "cardigan," "august," and "willow" (evermore\'s lead single) at the ceremony.',
      ],
      tags: ['Music'],
    },
    {
      id: 'folklore-long-pond',
      date: '2020-11-25',
      dateLabel: 'November 25, 2020',
      title: 'The Long Pond Studio Sessions',
      summary: 'A Disney+ concert film performs the album live for the first time, in the studio it was written in.',
      body: ['Filmed at Long Pond Studio in upstate New York with producers Aaron Dessner and Jack Antonoff, the special was the first live performance of any folklore song and doubled as the William Bowery reveal.'],
      tags: ['Music', 'Tour'],
    },
  ],
  evermore: [
    {
      id: 'evermore-album',
      date: '2020-12-11',
      dateLabel: 'December 11, 2020',
      title: 'folklore’s sister arrives',
      summary:
        'A second surprise album in five months — warmer, rustier, and just as literary.',
      body: [
        'evermore extended the folklore universe into late autumn: flannel, firelight, and some of her most intricate storytelling.',
        'Swift announced it with a note calling folklore\'s "sister record" not a spillover of extra songs but a natural continuation she "couldn\'t stop writing."',
      ],
      tags: ['Music'],
    },
    {
      id: 'evermore-willow',
      video: { youtubeId: 'RsEZmictANA', title: 'Taylor Swift - willow' },
      date: '2020-12-11',
      dateLabel: 'December 11, 2020',
      title: '"willow" leads the era',
      summary: 'The lead single doubles as the album\'s only official single release.',
      body: ['"willow" was released same-day as the album as its lead single and only Hot 100 top-10 hit from evermore — later performed live for the first time at the 2021 Grammys.'],
      tags: ['Music'],
    },
    {
      id: 'evermore-no-body-no-crime',
      date: '2020-12-11',
      dateLabel: 'December 11, 2020',
      title: '"no body no crime" with HAIM',
      summary: 'A murder-ballad duet featuring sisters Este, Danielle, and Alana Haim, named as characters in the song.',
      body: ['The song casts all three HAIM sisters as characters in its narrative (Este Haim is even the credited narrator), and the band joined Swift to perform it live during the Eras Tour years later.'],
      tags: ['Music'],
    },
    {
      id: 'evermore-champagne-problems',
      date: '2020-12-11',
      dateLabel: 'December 11, 2020',
      title: '"champagne problems"',
      summary: 'A co-write with William Bowery (Joe Alwyn) about a declined proposal.',
      body: ['One of two evermore tracks co-written with "William Bowery," "champagne problems" narrates a failed proposal — widely read by fans as one of the album\'s emotional centerpieces.'],
      tags: ['Music', 'Lore'],
    },
    {
      id: 'evermore-right-where-you-left-me',
      date: '2021-01-07',
      dateLabel: 'January 7, 2021',
      title: 'The deluxe edition adds two tracks',
      summary: '"right where you left me" and "it\'s time to go" arrive a month after the album.',
      body: ['A deluxe edition released three weeks after the original, adding "right where you left me" and "it\'s time to go" — both later folded into the era\'s standard track list on streaming.'],
      tags: ['Music'],
    },
    {
      id: 'evermore-marjorie',
      date: '2020-12-11',
      dateLabel: 'December 11, 2020',
      title: '"marjorie," for her grandmother',
      summary: 'A tribute built partly from archival recordings of Swift\'s late grandmother, opera singer Marjorie Finlay.',
      body: ['The song incorporates real vocal recordings of Marjorie Finlay, Swift\'s grandmother and a professional opera singer who died in 2003 — Swift has spoken about writing it as a way of "bringing her back."'],
      tags: ['Music', 'Lore'],
    },
  ],
  midnights: [
    {
      id: 'midnights-album',
      date: '2022-10-21',
      dateLabel: 'October 21, 2022',
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
      dateLabel: 'October 22, 2022',
      title: 'The 3am edition surprise',
      summary: 'Seven extra tracks land three hours after release, a now-signature move.',
      body: ['Hours after midnight, a “3am Edition” expanded the album — rewarding the fans who stayed up.'],
      tags: ['Music'],
    },
    {
      id: 'midnights-antihero',
      video: { youtubeId: 'b1kbLwvqugk', title: 'Taylor Swift - Anti-Hero (Official Music Video)' },
      date: '2022-10-24',
      dateLabel: 'October 24, 2022',
      title: '“Anti-Hero” dominates',
      summary: 'A candid single about self-doubt becomes her biggest solo hit in years.',
      body: ['Its confessional humor and inescapable chorus made “Anti-Hero” the defining pop single of the season.'],
      tags: ['Music'],
    },
    {
      id: 'midnights-chart-record',
      date: '2022-11-05',
      dateLabel: 'November 5, 2022',
      title: 'Every top-ten slot at once',
      summary: 'She becomes the first artist to monopolize the entire top ten of the Hot 100.',
      body: ['The album’s dominance rewrote the record books, occupying all ten of the chart’s highest positions in a single week.'],
      tags: ['Lore'],
    },
    {
      id: 'midnights-ticket-chaos',
      date: '2022-11-15',
      dateLabel: 'November 15, 2022',
      title: 'The ticket frenzy',
      summary: 'Unprecedented demand for the Eras Tour crashes the sales system and reaches Washington.',
      body: ['The scramble for tickets became a national news story — and eventually a subject of political hearings.'],
      tags: ['Lore'],
    },
    {
      id: 'midnights-eras-tour',
      date: '2023-03-17',
      dateLabel: 'March 17, 2023',
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
      dateLabel: 'October 13, 2023',
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
      dateLabel: 'April 19, 2024',
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
      dateLabel: 'Spring 2024',
      title: 'Ink, typewriters and monochrome',
      summary: 'The most restrained visual era: black, white, and typewritten confession.',
      body: ['Grayscale styling and typewriter motifs frame the era as a literary confessional.'],
      tags: ['Fashion'],
    },
  ],
  tloas: [
    {
      id: 'tloas-announce',
      date: '2025-08-13',
      dateLabel: 'August 13, 2025',
      title: 'A new era is announced',
      summary:
        'The Life of a Showgirl is revealed live on Travis Kelce’s "New Heights" podcast — a hard turn from ink into glitter.',
      body: [
        'After the monochrome hush of the last era, the reveal comes not from a stage or a cryptic post but from a guest chair on her fiancé’s football podcast — itself a sign of how public the era would be.',
        'The announcement lands in warm orange and gold: a showgirl era, all sparkle and spectacle, reframing everything that came before as the build-up to a curtain call.',
      ],
      tags: ['Music'],
      hiddenClue: {
        clue: 'The announcement leaned hard on the color orange — a shade barely used before.',
        payoff: 'Orange became the era’s signature, blanketing every teaser and cover in warm footlight glow.',
      },
    },
    {
      id: 'tloas-engagement',
      date: '2025-08-26',
      dateLabel: 'August 26, 2025',
      title: 'The engagement, announced in cleats and pearls',
      summary: 'Two weeks after the album reveal, she and Travis Kelce announce their engagement on Instagram.',
      body: [
        'A joint Instagram post — captioned "your English teacher and your gym teacher are getting married" — confirmed the engagement to the Kansas City Chiefs tight end.',
        'The proposal itself had happened roughly two weeks earlier at a garden in Lee’s Summit, Missouri, keeping the love story running parallel to the new album’s rollout.',
      ],
      tags: ['Relationship'],
    },
    {
      id: 'tloas-album',
      date: '2025-10-03',
      dateLabel: 'October 3, 2025',
      title: 'The Life of a Showgirl released',
      summary: 'The twelfth studio album arrives: opulent, theatrical, and unapologetically bright.',
      body: [
        'The album trades diary pages for the stage — feathers, footlights, and the glittering armor of a performer who has seen it all.',
        'Produced with Max Martin and Shellback — their first new-album collaboration with her since reputation — it is a victory lap dressed as a cabaret: knowing, warm, and dazzling.',
      ],
      tags: ['Music'],
    },
    {
      id: 'tloas-release-party-film',
      date: '2025-10-03',
      dateLabel: 'October 3, 2025',
      title: 'The Official Release Party of a Showgirl hits theaters',
      summary:
        'A companion film screens in cinemas worldwide alongside the album, with behind-the-scenes footage and track commentary.',
      body: [
        'Rolling into more than 50 territories across AMC, Cinemark, and Regal screens, the release-party film paired the album drop with lyric videos and Taylor’s own reflections on each song.',
        'It also carried the promise of a world premiere still to come: the music video for the lead single, held back for its own big-screen debut two days later.',
      ],
      tags: ['Music', 'Tour'],
    },
    {
      id: 'tloas-fate-of-ophelia-video',
      video: {
        youtubeId: 'ko70cExuzZM',
        title: 'Taylor Swift - The Fate of Ophelia (Official Music Video)',
      },
      date: '2025-10-05',
      dateLabel: 'October 5, 2025',
      title: '“The Fate of Ophelia” video premieres',
      summary: 'The self-directed lead-single video debuts on YouTube after its theatrical-only premiere two days earlier.',
      body: [
        'Written and directed by Taylor Swift, the video moves through a string of theatrical costume changes and sets, in keeping with the album’s showgirl framing.',
        'It had already premiered on the big screen as part of the release-party film before arriving on YouTube for the wider audience.',
      ],
      tags: ['Music'],
    },
    {
      id: 'tloas-sequins',
      date: '2025-10-04',
      dateLabel: 'Fall 2025',
      title: 'Orange sequins and feathers',
      summary: 'The visual language: burnt-orange rhinestones, marabou, and spotlight sparkle.',
      body: ['Showgirl glamour defines the styling — sequins, feathers, and a warm theatrical glow in every frame.'],
      tags: ['Fashion'],
    },
    {
      id: 'tloas-debut-chart',
      date: '2025-10-18',
      dateLabel: 'October 18, 2025',
      title: 'A record-setting debut',
      summary: 'The album opens at number one with the fastest-selling first week in history.',
      body: [
        'The Life of a Showgirl moved north of 4 million album-equivalent units in its opening week, the biggest sales week any album has ever posted.',
        'It became her 15th number-one album on the Billboard 200, breaking a tie with Drake and Jay-Z for the most chart-toppers among solo acts.',
      ],
      tags: ['Lore'],
    },
    {
      id: 'tloas-hot100-sweep',
      date: '2025-10-18',
      dateLabel: 'October 18, 2025',
      title: 'All twelve songs, all twelve top spots',
      summary: 'Every track on the album lands positions 1 through 12 of the Billboard Hot 100 — a first in chart history.',
      body: [
        'Led by "The Fate of Ophelia" at number one, the full tracklist swept the top of the Hot 100 with no other song breaking the streak.',
        'It was the first time in the chart’s history, dating back to the 1950s, that an entire album occupied every one of its top positions uninterrupted.',
      ],
      tags: ['Lore'],
    },
    {
      id: 'tloas-opalite-video',
      video: { youtubeId: '1FVF-9KQiPo', title: 'Taylor Swift - Opalite (Official Music Video)' },
      date: '2026-01-12',
      dateLabel: 'January 12, 2026',
      title: '“Opalite” arrives as the second single',
      summary: 'A time-slip music video follows a lonesome character through the 1990s toward a gem-hued reinvention.',
      body: [
        'The video for "Opalite" casts Taylor as a wistful, cat-loving figure decades removed from the stage, before the song’s glow pulls her back into color.',
        'Released as the second single, it kept the era’s pastel-orange visual thread going into the new year.',
      ],
      tags: ['Music'],
    },
    {
      id: 'tloas-elizabeth-taylor-video',
      video: { youtubeId: 'WqbJT_vC0rs', title: 'Taylor Swift - Elizabeth Taylor (Official Music Video)' },
      date: '2026-03-09',
      dateLabel: 'March 9, 2026',
      title: '“Elizabeth Taylor” goes to radio',
      summary: 'The album’s third single, named for the screen icon, arrives at radio with its own official video.',
      body: [
        'The song went to US hot adult contemporary radio first, followed a day later by a contemporary hit radio push, extending the album’s single cycle five months after release.',
        'A "So Glamorous Cabaret Version" and full digital package followed later that month, keeping the showgirl motif alive well into 2026.',
      ],
      tags: ['Music', 'Fashion'],
    },
  ],
};

// Hand-curated items plus the Supabase-content-seed sync (source of truth for
// era coverage; regenerate via `node scripts/sync-longlive-content.mjs`).
// Curated ids win on collision, though the generator's `vault-` id prefix
// makes that vanishingly unlikely in practice.
export const CONTENT: ContentItem[] = (Object.keys(RAW) as EraId[]).flatMap((eraId) => {
  const curated = build(eraId, RAW[eraId]);
  const curatedIds = new Set(curated.map((c) => c.id));
  const synced = build(eraId, VAULT_RAW[eraId] ?? []).filter((c) => !curatedIds.has(c.id));
  return [...curated, ...synced];
});

export function contentForEra(eraId: EraId): ContentItem[] {
  // Newest-first: the experience travels *back* in time, so the most recent
  // moment sits at the top (fresh on every visit) and you descend into the past.
  // The timeline scrubber mirrors this — top = now, bottom = the era's start.
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
  { id: 'm-tloas-1', eraId: 'tloas', date: '2025-08-13', label: 'Era announced', kind: 'life' },
  { id: 'm-tloas-1b', eraId: 'tloas', date: '2025-08-26', label: 'Engagement announced', kind: 'life' },
  { id: 'm-tloas-2', eraId: 'tloas', date: '2025-10-03', label: 'Showgirl released', kind: 'album' },
  { id: 'm-tloas-3', eraId: 'tloas', date: '2025-10-18', label: 'Record debut', kind: 'award' },
  { id: 'm-tloas-4', eraId: 'tloas', date: '2025-10-18', label: 'Hot 100 sweep', kind: 'award' },
  // Added 2026-07-18 alongside the significance system (docs/decisions.md)
  // — conspicuously absent before: the era's list stopped at 2025-10-18
  // despite the wedding (msg-wedding, the era's clearest 'defining' item)
  // having happened since. Milestones and ContentItem.significance are
  // deliberately kept in sync manually for now — both are hand-curated,
  // and a life-defining event should appear in both places.
  { id: 'm-tloas-5', eraId: 'tloas', date: '2026-07-03', label: 'Married at MSG', kind: 'life' },
];

export function milestonesForEra(eraId: EraId): Milestone[] {
  return MILESTONES.filter((m) => m.eraId === eraId).sort((a, b) => a.date.localeCompare(b.date));
}

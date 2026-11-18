import { describe, expect, it } from 'vitest';
import { chipTagsForCurrentItem, withChipTags } from './current-item-chips';

// Each fixture is a real row from /vault/live/tloas on 2026-11-18 (category,
// tags and headline copied verbatim).
const LIVE = {
  award: {
    category: 'award',
    tags: ['CMA Awards', 'awards season', 'nominations'],
    headline: "Taylor lands on the 2026 CMA Awards nominee list and confirms she'll attend the ceremony",
  },
  chart: {
    category: 'music',
    tags: ['chart', 'pop-airplay', 'hot-100', 'patient-zero'],
    headline: "Taylor's 'Patient Zero' ties Rihanna for most Pop Airplay top 10s as it climbs to No. 10",
  },
  outfit: {
    category: 'fashion',
    tags: ['red carpet', 'gala', 'Dior', 'Academy Museum'],
    headline: 'Taylor wears a strapless Dior gown to the Academy Museum gala, per InStyle',
  },
  appearance: {
    category: 'sighting',
    tags: ['snl', 'dakota-johnson', 'cameo', 'tloas'],
    headline: "Taylor Swift makes a surprise cameo during Dakota Johnson's SNL monologue",
  },
  musicVideo: {
    category: 'release',
    tags: ['VMAs', 'music video', 'Patient Zero', 'jewelry'],
    headline: "Taylor premieres the 'Patient Zero' music video at the VMAs, with a 35-carat diamond look",
  },
  show: {
    category: 'tour',
    tags: ['live-performance', 'gala', 'academy-museum'],
    headline: 'Taylor Swift booked to perform at the 2026 Academy Museum Gala, which honors Charlize Theron',
  },
  performSighting: {
    category: 'award',
    tags: ['CMA Awards', 'performance', 'country music'],
    headline: 'Taylor reportedly set to perform at the CMA Awards for the first time in 13 years',
  },
  wedding: {
    category: 'relationship',
    tags: ['wedding', 'marriage', 'msg', 'first-comments'],
    headline: 'Travis Kelce speaks publicly about wedding to Taylor at MSG',
  },
  sighting: {
    category: 'sighting',
    tags: ['sighting', 'chiefs', 'karlie-kloss', '1989-world-tour'],
    headline: 'Taylor Swift seen with Karlie Kloss in her Chiefs game box at Arrowhead Stadium',
  },
  exhibition: {
    category: 'business',
    tags: ['exhibition', 'museum', 'eras', 'boston'],
    headline: "Boston's Museum of Fine Arts announces 'Taylor Swift: The Eras Collection', opening April 10, 2027",
  },
};

describe('chipTagsForCurrentItem (real live items)', () => {
  it('files an awards story under Music', () => {
    expect(chipTagsForCurrentItem(LIVE.award)).toEqual(['Music']);
  });

  it('files a chart story under Music', () => {
    expect(chipTagsForCurrentItem(LIVE.chart)).toEqual(['Music']);
  });

  it('files an outfit story under Fashion', () => {
    expect(chipTagsForCurrentItem(LIVE.outfit)).toEqual(['Fashion']);
  });

  it('files a music-video premiere with a styled look under Music and Fashion', () => {
    expect(chipTagsForCurrentItem(LIVE.musicVideo)).toEqual(['Music', 'Fashion']);
  });

  it('files show news the extractor called a tour under Tour, but not a one-off awards performance', () => {
    expect(chipTagsForCurrentItem(LIVE.show)).toEqual(['Tour']);
    expect(chipTagsForCurrentItem(LIVE.performSighting)).toEqual(['Music']);
  });

  it('files wedding news under Relationship', () => {
    expect(chipTagsForCurrentItem(LIVE.wedding)).toEqual(['Relationship']);
  });

  it('leaves a TV cameo, a game-day sighting and a museum announcement under "All" only', () => {
    expect(chipTagsForCurrentItem(LIVE.appearance)).toEqual([]);
    expect(chipTagsForCurrentItem(LIVE.sighting)).toEqual([]);
    expect(chipTagsForCurrentItem(LIVE.exhibition)).toEqual([]);
  });
});

describe('chipTagsForCurrentItem (rules)', () => {
  it('keeps a chip id already present and never invents Videos', () => {
    expect(chipTagsForCurrentItem({ category: 'statement', tags: ['Lore', 'Videos'] })).toEqual(['Lore']);
  });

  it('matches free-form tags case- and dash-insensitively, but only whole tags', () => {
    expect(chipTagsForCurrentItem({ category: 'statement', tags: ['Red-Carpet'] })).toEqual(['Fashion']);
    expect(chipTagsForCurrentItem({ category: 'statement', tags: ['off-duty style'] })).toEqual(['Fashion']);
    expect(chipTagsForCurrentItem({ category: 'statement', tags: ['1989-world-tour'] })).toEqual([]);
  });

  it('returns chips in chip order with no duplicates', () => {
    expect(
      chipTagsForCurrentItem({ category: 'relationship', tags: ['fashion', 'wedding', 'Fashion'], headline: 'Taylor and Travis marry' }),
    ).toEqual(['Fashion', 'Relationship']);
  });
});

describe('withChipTags', () => {
  it('appends the chip ids after the free-form tags, once', () => {
    expect(withChipTags(LIVE.outfit)).toEqual(['red carpet', 'gala', 'Dior', 'Academy Museum', 'Fashion']);
    expect(withChipTags({ category: 'music', tags: ['Music', 'chart'] })).toEqual(['Music', 'chart']);
  });

  it('leaves an item that names no chip unchanged', () => {
    expect(withChipTags(LIVE.sighting)).toEqual(LIVE.sighting.tags);
  });
});

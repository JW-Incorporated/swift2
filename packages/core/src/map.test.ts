import { describe, expect, it } from 'vitest';
import { mapEra, mapMilestone, mapMoment, mapMonthItem, mapTrackNote } from './map';

describe('row mappers', () => {
  it('maps an era row to camelCase', () => {
    const era = mapEra({
      slug: 'midnights',
      title: 'The Midnights era',
      album: 'Midnights',
      start_date: '2022-10-21',
      end_date: '2024-04-18',
      sort_order: 9,
      theme: { bg: '#000' },
      cover_image_url: null,
    });
    expect(era.startDate).toBe('2022-10-21');
    expect(era.order).toBe(9);
    expect(era.coverImageUrl).toBeNull();
    expect((era.theme as { bg: string }).bg).toBe('#000');
  });

  it('maps a milestone row', () => {
    const m = mapMilestone({
      id: 'x',
      era_slug: 'midnights',
      type: 'album_release',
      title: 'Midnights released',
      date: '2022-10-21',
    });
    expect(m.eraSlug).toBe('midnights');
    expect(m.type).toBe('album_release');
  });

  it('maps a month item row', () => {
    const item = mapMonthItem({
      id: 'x',
      era_slug: 'lover',
      year: 2019,
      month: 8,
      category: 'release',
      title: 'Lover released',
      snippet: 's',
      source_url: null,
      thumbnail_url: null,
    });
    expect(item.year).toBe(2019);
    expect(item.category).toBe('release');
  });

  it('maps a moment row and narrows sources/photos jsonb', () => {
    const moment = mapMoment({
      month_item_id: 'x',
      context: 'ctx',
      sources: [{ outlet: 'EW', url: 'https://ew.com' }, { url: '' }, 'garbage'],
      photos: [{ url: 'https://img', credit: 'Getty' }, { credit: 'no url' }],
    });
    expect(moment.sources).toEqual([{ outlet: 'EW', url: 'https://ew.com' }]);
    expect(moment.photos).toEqual([{ url: 'https://img', credit: 'Getty' }]);
  });

  it('handles non-array jsonb defensively', () => {
    const moment = mapMoment({ month_item_id: 'x', context: '', sources: null, photos: undefined });
    expect(moment.sources).toEqual([]);
    expect(moment.photos).toEqual([]);
  });

  it('maps a track note row and narrows sources', () => {
    const t = mapTrackNote({
      id: 'x',
      era_slug: 'midnights',
      track_title: 'Anti-Hero',
      track_number: 3,
      note: "It's me, hi",
      source_url: 'https://ex.com',
      sources: [{ outlet: 'EW', url: 'https://ew.com' }, 'garbage'],
    });
    expect(t.eraSlug).toBe('midnights');
    expect(t.trackTitle).toBe('Anti-Hero');
    expect(t.trackNumber).toBe(3);
    expect(t.sources).toEqual([{ outlet: 'EW', url: 'https://ew.com' }]);
  });
});

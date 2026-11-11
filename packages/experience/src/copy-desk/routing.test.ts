import { describe, expect, it } from 'vitest';
import { PERSONA_SLUGS, routeAuthor } from './routing';

describe('routeAuthor', () => {
  it('routes every month_item category per the spec table', () => {
    const expected = {
      sighting: 'vera',
      fashion: 'vera',
      relationship: 'deb',
      business: 'deb',
      tour: 'deb',
      music: 'theo',
      release: 'theo',
      video: 'theo',
    };
    for (const [category, slug] of Object.entries(expected)) {
      expect(routeAuthor({ surface: 'month_item', category })).toBe(slug);
    }
  });

  it('routes the non-category surfaces', () => {
    expect(routeAuthor({ surface: 'track_note' })).toBe('theo');
    expect(routeAuthor({ surface: 'theory' })).toBe('loren');
    expect(routeAuthor({ surface: 'release' })).toBe('theo');
    expect(routeAuthor({ surface: 'tour' })).toBe('deb');
    expect(routeAuthor({ surface: 'chrome' })).toBe('house');
  });

  it('routes video_work kinds', () => {
    expect(routeAuthor({ surface: 'video_work', category: 'music_video' })).toBe('theo');
    expect(routeAuthor({ surface: 'video_work', category: 'lyric_video' })).toBe('theo');
    expect(routeAuthor({ surface: 'video_work', category: 'tour_film' })).toBe('deb');
    expect(routeAuthor({ surface: 'video_work', category: 'documentary' })).toBe('deb');
  });

  it('lets an explicit override win', () => {
    expect(routeAuthor({ surface: 'month_item', category: 'music', override: 'deb' })).toBe('deb');
  });

  it('rejects an unknown override, category or surface', () => {
    expect(() => routeAuthor({ surface: 'month_item', category: 'music', override: 'bob' })).toThrow();
    expect(() => routeAuthor({ surface: 'month_item', category: 'gossip' })).toThrow();
    expect(() => routeAuthor({ surface: 'month_item' })).toThrow();
    expect(() => routeAuthor({ surface: 'nope' as never })).toThrow();
  });

  it('keeps the persona slug set permanent', () => {
    expect([...PERSONA_SLUGS]).toEqual(['theo', 'loren', 'vera', 'deb']);
  });
});

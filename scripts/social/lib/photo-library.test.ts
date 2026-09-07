import { describe, expect, it } from 'vitest';
import { selectSocialPhoto, validatePhotoEntry } from './photo-library.mjs';

const library = [
  {
    id: 'lover-minneapolis',
    mediaPath: '/social/library/photos/taylor-lover-eras-minneapolis-2023.jpg',
    credit: 'Michael Hicks (CC BY 2.0), via Wikimedia Commons',
    source: 'https://commons.wikimedia.org/wiki/File:Eras_Tour_-_Minneapolis,_Minnesota_-_acoustic_set_2.jpg',
  },
  {
    id: 'red-inglewood',
    mediaPath: '/social/library/photos/taylor-red-eras-inglewood-2023.jpg',
    credit: 'Paolo Villanueva (CC BY 2.0), via Wikimedia Commons',
    source: 'https://commons.wikimedia.org/wiki/File:Taylor_Swift_The_Eras_Tour_2023.jpg',
  },
  {
    id: 'fearless-inglewood',
    mediaPath: '/social/library/photos/taylor-fearless-eras-inglewood-2023.jpg',
    credit: 'Paolo Villanueva (CC BY 2.0), via Wikimedia Commons',
    source: 'https://commons.wikimedia.org/wiki/File:Taylor_Swift_The_Eras_Tour_Fearless_Set_Era_(53109821975).jpg',
  },
  {
    id: 'debut-acoustic',
    mediaPath: '/social/library/photos/taylor-debut-2007-acoustic.jpg',
    credit: 'Brian Cantoni (CC BY 2.0), via Wikimedia Commons',
    source: 'https://commons.wikimedia.org/wiki/File:Taylor_Swift_(2007)_retouched.jpg',
  },
  {
    id: 'lover-minneapolis-act5',
    mediaPath: '/social/library/photos/taylor-lover-eras-minneapolis-act5-2023.jpg',
    credit: 'Michael Hicks (CC BY 2.0), via Wikimedia Commons',
    source: 'https://commons.wikimedia.org/wiki/File:Eras_Tour_-_Minneapolis,_MN_-_Lover_act_-_5.jpg',
  },
];

describe('photo-library', () => {
  it('requires an auditable source and truthful credit for every inventory entry', () => {
    expect(validatePhotoEntry(library[0])).toEqual([]);
    expect(validatePhotoEntry({ ...library[0], credit: '' })).toContain('credit is required');
    expect(validatePhotoEntry({ ...library[0], source: 'not-a-url' })).toContain('source must be an http(s) URL');
  });

  it('does not deadlock after all five sources have been used: it selects the least-recently-used credited photo', () => {
    const history = [
      { photoId: 'lover-minneapolis', postedAt: '2026-09-01T23:00:00Z' },
      { photoId: 'red-inglewood', postedAt: '2026-09-02T23:00:00Z' },
      { photoId: 'fearless-inglewood', postedAt: '2026-09-03T23:00:00Z' },
      { photoId: 'debut-acoustic', postedAt: '2026-09-04T23:00:00Z' },
      { photoId: 'lover-minneapolis-act5', postedAt: '2026-09-05T23:00:00Z' },
    ];

    expect(selectSocialPhoto(library, history)).toMatchObject({ id: 'lover-minneapolis', reused: true });
  });

  it('selects an unused photo before any previously used photo', () => {
    const history = [{ photoId: 'lover-minneapolis', postedAt: '2026-09-01T23:00:00Z' }];
    const selected = selectSocialPhoto(library, history);

    expect(selected.reused).toBe(false);
    expect(selected.id).not.toBe('lover-minneapolis');
  });

  it('returns non-empty source and credit with the selected photo so a queue draft cannot lose attribution', () => {
    const selected = selectSocialPhoto(library, []);

    expect(selected.mediaPath).toMatch(/^\/social\/library\/photos\//);
    expect(selected.credit).not.toBe('');
    expect(selected.source).toMatch(/^https:\/\//);
  });
});

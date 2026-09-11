import { describe, expect, it } from 'vitest';
import { selectSocialPhoto, validatePhotoEntry } from './photo-library.mjs';
import { validatePhotoInventoryBinding, validateQueueItem } from './queue-schema.mjs';

const library = [
  {
    id: 'lover-minneapolis',
    mediaPath: '/social/library/photos/taylor-lover-eras-minneapolis-2023.jpg',
    credit: 'Michael Hicks (CC BY 2.0), via Wikimedia Commons',
    source: 'https://commons.wikimedia.org/wiki/File:Eras_Tour_-_Minneapolis,_Minnesota_-_acoustic_set_2.jpg',
    alt: 'Taylor Swift performing the Lover set in Minneapolis, 2023.',
  },
  {
    id: 'red-inglewood',
    mediaPath: '/social/library/photos/taylor-red-eras-inglewood-2023.jpg',
    credit: 'Paolo Villanueva (CC BY 2.0), via Wikimedia Commons',
    source: 'https://commons.wikimedia.org/wiki/File:Taylor_Swift_The_Eras_Tour_2023.jpg',
    alt: 'Taylor Swift performing the Red set in Inglewood, 2023.',
  },
  {
    id: 'fearless-inglewood',
    mediaPath: '/social/library/photos/taylor-fearless-eras-inglewood-2023.jpg',
    credit: 'Paolo Villanueva (CC BY 2.0), via Wikimedia Commons',
    source: 'https://commons.wikimedia.org/wiki/File:Taylor_Swift_The_Eras_Tour_Fearless_Set_Era_(53109821975).jpg',
    alt: 'Taylor Swift performing the Fearless set in Inglewood, 2023.',
  },
  {
    id: 'debut-acoustic',
    mediaPath: '/social/library/photos/taylor-debut-2007-acoustic.jpg',
    credit: 'Brian Cantoni (CC BY 2.0), via Wikimedia Commons',
    source: 'https://commons.wikimedia.org/wiki/File:Taylor_Swift_(2007)_retouched.jpg',
    alt: 'Taylor Swift seated with an acoustic guitar, 2007.',
  },
  {
    id: 'lover-minneapolis-act5',
    mediaPath: '/social/library/photos/taylor-lover-eras-minneapolis-act5-2023.jpg',
    credit: 'Michael Hicks (CC BY 2.0), via Wikimedia Commons',
    source: 'https://commons.wikimedia.org/wiki/File:Eras_Tour_-_Minneapolis,_MN_-_Lover_act_-_5.jpg',
    alt: 'Taylor Swift performing the Lover set, act 5, in Minneapolis, 2023.',
  },
];

describe('photo-library', () => {
  it('requires an auditable source and truthful credit for every inventory entry', () => {
    expect(validatePhotoEntry(library[0])).toEqual([]);
    expect(validatePhotoEntry({ ...library[0], credit: '' })).toContain('credit is required');
    expect(validatePhotoEntry({ ...library[0], source: 'not-a-url' })).toContain('source must be an http(s) URL');
  });

  // docs/social/RULINGS-SOCIAL.md A3/B2 — alt text is written once per library entry.
  it('requires a non-blank alt description for every inventory entry', () => {
    expect(validatePhotoEntry({ ...library[0], alt: undefined })).toContain('alt is required — write the accessibility description once here (RULINGS-SOCIAL A3)');
    expect(validatePhotoEntry({ ...library[0], alt: '   ' })).toContain('alt is required — write the accessibility description once here (RULINGS-SOCIAL A3)');
  });

  // Fable ruling, kanban t_75ec7106 (PR #4062 review round 2): closes the
  // hole a blank tags[] entry would open in selectSocialPhoto's fail-closed
  // era filtering (a caller-supplied blank requiredTags would otherwise
  // accidentally match it).
  it('rejects a blank/whitespace-only entry in tags[]', () => {
    expect(validatePhotoEntry({ ...library[0], tags: [''] })).toContain('tags entries must be non-blank strings');
    expect(validatePhotoEntry({ ...library[0], tags: ['lover', '   '] })).toContain('tags entries must be non-blank strings');
    expect(validatePhotoEntry({ ...library[0], tags: ['lover', 'eras-tour'] })).toEqual([]);
    expect(validatePhotoEntry({ ...library[0], tags: undefined })).toEqual([]);
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

  it('makes the 09-08 paired launch plan valid after the five-photo corpus is exhausted', () => {
    const history = library.map((photo, index) => ({
      photoId: photo.id,
      postedAt: `2026-09-0${index + 1}T23:00:00Z`,
    }));
    const selected = selectSocialPhoto(library, history);
    const common = {
      media: [selected.mediaPath],
      mediaKind: 'photo',
      photoId: selected.id,
      mediaCredit: selected.credit,
      mediaSource: selected.source,
      altText: [selected.alt],
      scheduledAt: '2026-09-08T23:00:00Z',
      campaign: 'launch:shop-the-look:announce',
    };
    const pair = [
      { ...common, platform: 'instagram', body: 'See the look.' },
      { ...common, platform: 'x', body: 'See the look.' },
    ];

    expect(selected.reused).toBe(true);
    for (const draft of pair) {
      expect(validateQueueItem(draft)).toEqual([]);
      expect(validatePhotoInventoryBinding(draft, library)).toEqual([]);
    }
  });

  // 2026-09-10 (kanban t_75ec7106) — the founder-reported bug: the
  // 2026-09-09 reputation/villain-era X post shipped a Lover-era tour photo
  // because selection ignored theme entirely. These lock in the fix: a
  // themed draft must only be offered a photo tagged for its own era, and
  // a caller must be told "no match" rather than silently getting an
  // unrelated era's photo.
  describe('era-constrained selection (requiredTags)', () => {
    const taggedLibrary = [
      { ...library[0], tags: ['lover', 'eras-tour', 'minneapolis'] },
      { ...library[1], tags: ['red', 'eras-tour', 'inglewood'] },
      { ...library[2], tags: ['fearless', 'eras-tour', 'inglewood'] },
    ];

    it('only offers photos tagged with a required era', () => {
      const selected = selectSocialPhoto(taggedLibrary, [], { requiredTags: ['red'] });
      expect(selected.id).toBe('red-inglewood');
    });

    it('never falls back to an off-era photo: returns null when no tagged photo exists', () => {
      expect(selectSocialPhoto(taggedLibrary, [], { requiredTags: ['reputation'] })).toBeNull();
    });

    it('still applies least-used/longest-unseen as the tiebreaker WITHIN the matching era', () => {
      const twoRed = [
        { ...taggedLibrary[1], id: 'red-a' },
        { ...taggedLibrary[1], id: 'red-b' },
      ];
      const history = [{ photoId: 'red-a', postedAt: '2026-09-01T00:00:00Z' }];
      const selected = selectSocialPhoto(twoRed, history, { requiredTags: ['red'] });
      expect(selected.id).toBe('red-b');
    });

    it('an unconstrained call (no requiredTags) keeps the old total-over-non-empty-library behavior', () => {
      expect(selectSocialPhoto(taggedLibrary, [])).not.toBeNull();
    });

    // Codex review round 1 (kanban t_75ec7106): a caller-supplied blank tag
    // must fail closed, not silently discard itself and match everything.
    it('a blank/whitespace-only required tag fails closed instead of silently matching the whole library', () => {
      expect(selectSocialPhoto(taggedLibrary, [], { requiredTags: ['   '] })).toBeNull();
      expect(selectSocialPhoto(taggedLibrary, [], { requiredTags: [''] })).toBeNull();
    });

    it('trims surrounding whitespace on a required tag before matching', () => {
      const selected = selectSocialPhoto(taggedLibrary, [], { requiredTags: [' red '] });
      expect(selected.id).toBe('red-inglewood');
    });
  });
});

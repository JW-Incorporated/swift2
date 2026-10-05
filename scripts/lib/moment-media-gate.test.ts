import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  MEDIA_LEGACY,
  mediaPublicationVerdict,
  momentFingerprint,
  momentMediaErrors,
} from './moment-media-gate.mjs';

describe('moment media publication gate', () => {
  it('matches the frozen, reviewable migration ledger exactly', () => {
    const ledger = readFileSync('docs/content/historical-media-migration-2026-09-15.md', 'utf8');
    const keys = [...ledger.matchAll(/^\| `([^`]+\.mjs#[^`]+)` \|/gm)].map((match) => match[1]);
    expect(keys).toHaveLength(0);
    expect(new Set(keys)).toEqual(new Set(MEDIA_LEGACY.keys()));
  });
  it.each([
    [{}, 'needs an authored'],
    [{ thumbnailUrl: '  ' }, 'thumbnailUrl'],
    [{ thumbnailUrl: 'https://www.longlivets.com/eras/tloas.png' }, 'needs an authored'],
    [{ thumbnailUrl: 'https://www.longlivets.com/placeholder.svg' }, 'needs an authored'],
    [{ moment: { photos: [] } }, 'empty arrays/objects'],
    [{ moment: { photos: [{}] } }, 'empty arrays/objects'],
    [
      { moment: { photos: [{ url: 'https://www.longlivets.com/eras/tloas.png' }] } },
      'needs an authored',
    ],
    [
      { moment: { sources: [{ url: 'https://youtube.com/watch?v=abcdefghijk' }] } },
      'needs an authored',
    ],
    [{ video: { youtubeId: '', title: 'Clip' } }, 'video requires'],
    [{ video: { youtubeId: ' abcdefghijk ', title: 'Clip' } }, 'video requires'],
    [
      { socialPost: { platform: 'instagram', shortcode: '', label: 'Post' } },
      'socialPost requires',
    ],
  ])('rejects media that cannot render (%j)', (item, message) => {
    expect(momentMediaErrors(item).join('\n')).toContain(message);
  });

  it.each([
    { thumbnailUrl: 'https://images.example/photo.jpg' },
    {
      moment: {
        photos: [
          {
            url: 'https://images.example/photo.jpg',
            credit: 'Photographer',
            caption: 'Subject at event',
          },
        ],
      },
    },
    { moment: { video: { youtubeId: 'abcdefghijk', title: 'Official performance' } } },
    { socialPost: { platform: 'instagram', shortcode: 'ABC_123-x', label: 'Taylor Swift post' } },
  ])('accepts one supported authored visual (%j)', (item) => {
    expect(momentMediaErrors(item)).toEqual([]);
  });

  it('grandfathers only an exact existing key and exposes when that row gains media', () => {
    const old = { title: 'Old row' };
    const legacy = new Map([['era.mjs#old-row', momentFingerprint(old)]]);
    expect(mediaPublicationVerdict('era.mjs#new-row', {}, legacy).errors).not.toEqual([]);
    expect(mediaPublicationVerdict('era.mjs#old-row', old, legacy)).toEqual({
      errors: [],
      legacyGap: true,
    });
    expect(
      mediaPublicationVerdict('era.mjs#old-row', { ...old, snippet: 'changed' }, legacy).errors,
    ).not.toEqual([]);
    expect(
      mediaPublicationVerdict(
        'era.mjs#old-row',
        { thumbnailUrl: 'https://images.example/new.jpg' },
        legacy,
      ),
    ).toEqual({ errors: [], legacyGap: false });
  });
});

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  MEDIA_LEGACY,
  merchMediaErrors,
  mediaPublicationVerdict,
  momentFingerprint,
  momentMediaErrors,
  nonMomentMediaErrors,
  retiredSurfaceMediaKeys,
  socialInboxMediaErrors,
  surfaceMediaLegacyFindings,
  surfaceMediaPublicationVerdict,
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

describe('P1-23 surface media gates', () => {
  const errorsFor = (key: string, item: object, errors: string[], legacy = new Set<string>()) =>
    surfaceMediaPublicationVerdict(key, item, errors, legacy).errors;

  it.each(['release', 'tour', 'theory', 'video'])('rejects a new %s row without media', (type) => {
    const row = { slug: 'new-row', title: 'Text only' };
    expect(errorsFor(`${type}/fixture.mjs#new-row`, row, nonMomentMediaErrors(row))).not.toEqual([]);
  });

  it('rejects a new social inbox intent without media', () => {
    const intent = { id: 'new-intent', media: [] };
    expect(errorsFor('social/inbox/new-intent.json', intent, socialInboxMediaErrors(intent))).not.toEqual([]);
  });

  it('rejects a new merch row without an image', () => {
    const row = { sourceId: 'new-product' };
    expect(errorsFor('merch/official.mjs#new-product', row, merchMediaErrors(row))).not.toEqual([]);
  });

  it('keeps an edited grandfathered row exempt by stable key', () => {
    const old = { slug: 'old-row' };
    const legacy = new Set(['releases/x.mjs#old-row']);
    expect(errorsFor('releases/x.mjs#old-row', old, nonMomentMediaErrors(old), legacy)).toEqual([]);
    const edited = { ...old, title: 'Corrected title' };
    expect(errorsFor('releases/x.mjs#old-row', edited, nonMomentMediaErrors(edited), legacy)).toEqual([]);
  });

  it('keeps a grandfathered row valid when it gains media', () => {
    const key = 'releases/x.mjs#old-row';
    const row = {
      slug: 'old-row',
      media: [{ kind: 'hotlink_legacy', url: 'https://images.example/new.jpg' }],
    };
    expect(surfaceMediaPublicationVerdict(key, row, nonMomentMediaErrors(row), new Set([key])))
      .toEqual({ errors: [], legacyGap: true });
  });
});

describe('SURFACE_MEDIA_LEGACY list audit', () => {
  const key = 'social/inbox/appearance-2026-10-12-FqbcAAKQjes.json';
  const legacy = new Set([key]);

  it('errors on an entry that gates nothing', () => {
    const findings = surfaceMediaLegacyFindings(legacy, {
      seen: new Set(),
      exactGaps: new Set(),
    });
    expect(findings.map((f) => f.level)).toEqual(['error']);
    expect(findings[0].message).toContain('matches no gated row');
  });

  it('errors on an entry whose row gained media', () => {
    const findings = surfaceMediaLegacyFindings(legacy, {
      seen: new Set([key]),
      exactGaps: new Set(),
    });
    expect(findings.map((f) => f.level)).toEqual(['error']);
    expect(findings[0].message).toContain('no longer matches');
  });

  it('stays silent while the exemption is live', () => {
    expect(
      surfaceMediaLegacyFindings(legacy, { seen: new Set([key]), exactGaps: new Set([key]) }),
    ).toEqual([]);
  });

  // #6109: closing an intent moves it to social/inbox/closed/, which the live
  // scan no longer sees. That is the normal lifecycle, not a stale entry, so
  // it warns for cleanup instead of turning build-content red on every PR
  // that performs the move.
  it('warns instead of erroring when the intent has been closed', () => {
    const findings = surfaceMediaLegacyFindings(legacy, {
      seen: new Set(),
      exactGaps: new Set(),
      retired: retiredSurfaceMediaKeys(['appearance-2026-10-12-FqbcAAKQjes.json']),
    });
    expect(findings.map((f) => f.level)).toEqual(['warn']);
    expect(findings[0].message).toContain('now closed');
  });
});

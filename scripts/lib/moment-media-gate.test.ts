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
  SURFACE_MEDIA_LEGACY,
  surfaceMediaLegacyFindings,
  surfaceMediaPublicationVerdict,
} from './moment-media-gate.mjs';
import { TEXT_ONLY_CEILING, textOnlyRatchetFindings } from './text-only-ratchet.mjs';

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
  const errorsFor = (key: string, item: object, errors: string[], legacy = new Map<string, string>()) =>
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

  const legacyFor = (key: string, row: object) =>
    new Map([[key, momentFingerprint(row).slice(0, 16)]]);

  it('exempts a legacy row only while its content hash is unchanged', () => {
    const old = { slug: 'old-row' };
    const key = 'releases/x.mjs#old-row';
    expect(errorsFor(key, old, nonMomentMediaErrors(old), legacyFor(key, old))).toEqual([]);
  });

  it('requires media once a legacy row is edited', () => {
    const old = { slug: 'old-row' };
    const key = 'releases/x.mjs#old-row';
    const edited = { ...old, title: 'Corrected title' };
    expect(errorsFor(key, edited, nonMomentMediaErrors(edited), legacyFor(key, old))).not.toEqual([]);
  });

  it('keeps a grandfathered row valid when it gains media', () => {
    const key = 'releases/x.mjs#old-row';
    const row = {
      slug: 'old-row',
      media: [{ kind: 'hotlink_legacy', url: 'https://images.example/new.jpg' }],
    };
    const verdict = surfaceMediaPublicationVerdict(
      key,
      row,
      nonMomentMediaErrors(row),
      legacyFor(key, { slug: 'old-row' }),
    );
    expect(verdict.errors).toEqual([]);
  });

  it('pins every shipped legacy entry to a 16-hex content hash', () => {
    expect(SURFACE_MEDIA_LEGACY.size).toBeGreaterThan(100);
    for (const hash of SURFACE_MEDIA_LEGACY.values()) expect(hash).toMatch(/^[0-9a-f]{16}$/);
  });
});

describe('hardened photo validity', () => {
  it.each([
    [{ thumbnailUrl: 'https://example.com/page.html' }],
    [{ thumbnailUrl: 'https://example.com/article' }],
    [{ moment: { photos: [{ url: 'https://example.com/page.html' }] } }],
    [{ moment: { photos: [] }, thumbnailUrl: null }],
    [{ moment: { photos: [] }, thumbnailUrl: '' }],
    [{ thumbnailUrl: 'https://www.billboard.com/music/story.html' }],
  ])('rejects a non-image or empty photo (%j)', (item) => {
    expect(momentMediaErrors(item)).not.toEqual([]);
  });

  it.each([
    { thumbnailUrl: 'https://example.com/a/b.PNG?w=800' },
    { thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Taylor' },
    { moment: { photos: [{ url: 'https://media.glamour.com/photos/abc/master/w_1200' }] } },
  ])('accepts an image-like url (%j)', (item) => {
    expect(momentMediaErrors(item)).toEqual([]);
  });

  it('does not treat photosReviewed as a waiver', () => {
    const item = { photosReviewed: 'no verifiable image exists', moment: { photos: [] } };
    expect(momentMediaErrors(item).join('\n')).toContain('needs an authored');
    expect(mediaPublicationVerdict('era.mjs#new', item, new Map()).errors).not.toEqual([]);
  });

  it('rejects a non-image hotlink and merch imageUrl', () => {
    expect(
      nonMomentMediaErrors({ media: [{ kind: 'hotlink_legacy', url: 'https://example.com/p.html' }] }),
    ).not.toEqual([]);
    expect(merchMediaErrors({ imageUrl: 'https://example.com/p.html' })).not.toEqual([]);
  });
});

describe('text-only count ratchet (tracks, Era Secrets, On This Day, Clownbot lore)', () => {
  it('fails when a new text-only row grows any frozen count', () => {
    for (const [name, ceiling] of Object.entries(TEXT_ONLY_CEILING)) {
      const findings = textOnlyRatchetFindings({ [name]: ceiling + 1 });
      expect(findings.map((f) => f.level)).toEqual(['error']);
    }
  });

  it('freezes new text-only track guide rows at zero', () => {
    expect(TEXT_ONLY_CEILING['track guides (no youtubeId or media)']).toBe(0);
  });

  it('is silent at the ceiling and warns when the count falls', () => {
    const era = TEXT_ONLY_CEILING['Era Secrets'];
    expect(textOnlyRatchetFindings({ 'Era Secrets': era })).toEqual([]);
    expect(textOnlyRatchetFindings({ 'Era Secrets': era - 1 }).map((f) => f.level)).toEqual(['warn']);
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

  // #6081: the retired-tolerance above covers the single PR that moves an
  // intent into closed/; it does not protect later builds whose tree already
  // has the file there and whose `retired` set is built from that same tree.
  // A key that survives only in SURFACE_MEDIA_LEGACY after its intent has
  // been closed must therefore be removed from the list — guard that the
  // exemption list never outlives its retired intents.
  it('exposes a legacy social-inbox key whose intent is closed but not yet swept from the exemption list', () => {
    const closedKey = 'social/inbox/appearance-2026-10-12-FqbcAAKQjes.json';
    if (SURFACE_MEDIA_LEGACY.has(closedKey)) {
      const closedFiles = ['appearance-2026-10-12-FqbcAAKQjes.json'];
      const findings = surfaceMediaLegacyFindings(SURFACE_MEDIA_LEGACY, {
        seen: new Set(),
        exactGaps: new Set(),
        retired: retiredSurfaceMediaKeys(closedFiles),
      });
      const stale = findings.find(
        (f) => f.key === closedKey && f.level === 'error',
      );
      expect(stale).toBeDefined();
      expect(stale.message).toContain('matches no gated row');
    }
  });
});

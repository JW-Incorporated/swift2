import { describe, expect, it } from 'vitest';
import {
  normalizeSecret,
  buildEraSecrets,
  renderModule,
} from './sync-longlive-era-secrets.mjs';

// The Era Secret generator (#688) mirrors the theories/videos syncs: pure
// normalization, tested here so the "every fact real and sourced" rule and the
// EraId mapping can't regress silently.
describe('normalizeSecret', () => {
  const good = {
    slug: 'debut-anthem-strategy',
    title: 'The national anthem was her way onto a stage',
    secret: 'A young Taylor worked out that singing the anthem got her in front of crowds.',
    deeperLink: 'song:tim-mcgraw',
    sources: [{ source_title: 'NBC', source_url: 'https://example.com/a' }],
  };

  it('normalizes a well-formed secret and maps §5 source fields', () => {
    const out = normalizeSecret(good);
    expect(out).toMatchObject({
      slug: 'debut-anthem-strategy',
      deeperLink: 'song:tim-mcgraw',
    });
    expect(out.sources).toEqual([{ name: 'NBC', url: 'https://example.com/a' }]);
  });

  it('drops a secret with no real source (never ships an unsourced fact)', () => {
    expect(normalizeSecret({ ...good, sources: [] })).toBeNull();
    expect(normalizeSecret({ ...good, sources: [{ source_title: 'x' }] })).toBeNull();
  });

  it('drops a secret missing slug, title, or the fact itself', () => {
    expect(normalizeSecret({ ...good, slug: '  ' })).toBeNull();
    expect(normalizeSecret({ ...good, title: '' })).toBeNull();
    expect(normalizeSecret({ ...good, secret: undefined })).toBeNull();
  });

  it('omits a malformed deeperLink rather than shipping a bad reference', () => {
    expect(normalizeSecret({ ...good, deeperLink: 'https://nope' }).deeperLink).toBeUndefined();
    expect(normalizeSecret({ ...good, deeperLink: 'moment:vault-x' }).deeperLink).toBe('moment:vault-x');
  });
});

describe('buildEraSecrets', () => {
  const src = [{ source_url: 'https://example.com/s' }];

  it('maps seed era slugs to EraIds and de-dupes slugs within an era (first wins)', () => {
    const byEra = buildEraSecrets([
      { eraSlug: 'tortured-poets', slug: 'a', title: 'A', secret: 'first', sources: src },
      { eraSlug: 'tortured-poets', slug: 'a', title: 'A2', secret: 'dupe', sources: src },
      { eraSlug: 'debut', slug: 'b', title: 'B', secret: 'x', sources: src },
    ]);
    expect(Object.keys(byEra).sort()).toEqual(['debut', 'ttpd']);
    expect(byEra.ttpd).toHaveLength(1);
    expect(byEra.ttpd[0].secret).toBe('first');
  });

  it('preserves authored order (the rotation seeds off it)', () => {
    const byEra = buildEraSecrets([
      { eraSlug: 'debut', slug: 'one', title: '1', secret: 'a', sources: src },
      { eraSlug: 'debut', slug: 'two', title: '2', secret: 'b', sources: src },
    ]);
    expect(byEra.debut.map((s) => s.slug)).toEqual(['one', 'two']);
  });
});

describe('renderModule', () => {
  it('emits a valid, importable TS module with the expected export', () => {
    const ts = renderModule({
      debut: [{ slug: 's', title: 'T', secret: 'fact', sources: [{ name: 'N', url: 'https://u' }] }],
    });
    expect(ts).toContain("import type { EraId, EraSecret } from '@swift2/experience';");
    expect(ts).toContain('export const ERA_SECRETS_RAW: Partial<Record<EraId, EraSecret[]>> = {');
    expect(ts).toContain('sources: [{ name: "N", url: "https://u" }],');
  });
});

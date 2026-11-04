import { describe, expect, it } from 'vitest';
import { formatMarkdown, formatText, imageHost, parseIds, resolveIds, summarizeRow } from './inspect-current-items.mjs';

const A = '43575689-aaaa-4bbb-8ccc-111111111111';
const B = '43575689-bbbb-4bbb-8ccc-222222222222';
const C = '9f3a1c20-aaaa-4bbb-8ccc-333333333333';

describe('inspect-current-items ids', () => {
  it('accepts UUIDs and 8-char prefixes, lowercases and dedupes', () => {
    expect(parseIds(`${A.toUpperCase()}, 9F3A1C20 ,9f3a1c20`)).toEqual([A, '9f3a1c20']);
  });

  it('rejects anything else', () => {
    expect(() => parseIds('abc')).toThrow(/invalid id/);
    expect(() => parseIds('')).toThrow(/no ids/);
  });

  it('resolves a unique prefix and a full id', () => {
    expect(resolveIds(['9f3a1c20', A], [A, B, C])).toEqual({ resolved: [C, A], unresolved: [] });
  });

  it('reports ambiguous and missing prefixes instead of guessing', () => {
    const { resolved, unresolved } = resolveIds(['43575689', 'deadbeef'], [A, B, C]);
    expect(resolved).toEqual([]);
    expect(unresolved).toEqual([
      { id: '43575689', reason: 'ambiguous_prefix(2)' },
      { id: 'deadbeef', reason: 'not_found' },
    ]);
  });
});

describe('inspect-current-items formatting', () => {
  const row = {
    id: A, era_id: 'tloas', observed_on: '2026-11-01', merged_into: null, retracted_at: null, promoted_to: null,
    redline_ok: true, quality_hold_reason: null, image_url: 'https://Cdn.Example.com/a/b.jpg?token=secret',
    expires_at: '2026-12-01T00:00:00Z', facts: [{ claim: 'private copy' }],
    headline: 'SECRET HEADLINE', summary: 'SECRET SUMMARY', detail: 'SECRET DETAIL',
  };

  it('keeps only the host of the image url', () => {
    expect(imageHost(row.image_url)).toBe('cdn.example.com');
    expect(imageHost(null)).toBe('none');
    expect(imageHost('not a url')).toBe('unparseable');
  });

  it('summarizes flags and the gate verdict without copy or url paths', () => {
    const s = summarizeRow({ ...row, merged_into: C }, { ok: false, reason: 'missing_image' });
    expect(s).toMatchObject({ mergedInto: 'set', retractedAt: 'null', facts: 'present', gate: 'missing_image', imageHost: 'cdn.example.com' });
    const out = formatMarkdown([s]) + formatText([s]);
    expect(out).not.toMatch(/SECRET|token=|\/a\/b/);
  });

  it('renders a markdown table with an unresolved list', () => {
    const md = formatMarkdown([summarizeRow(row, { ok: true })], [{ id: 'deadbeef', reason: 'not_found' }]);
    const lines = md.split('\n');
    expect(lines[0]).toMatch(/^\| id \| era \|/);
    expect(lines[1]).toMatch(/^\| --- \|/);
    expect(lines[2]).toContain(`| ${A} | tloas | 2026-11-01 | null | null | null | true | none | cdn.example.com |`);
    expect(lines[2]).toMatch(/\| present \| ok \|$/);
    expect(md).toContain('- deadbeef: not_found');
  });
});

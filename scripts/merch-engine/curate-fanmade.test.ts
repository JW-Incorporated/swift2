import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error plain ESM script
import { BOOTLEG_REJECT_THRESHOLD, curateFanmadeIssues } from './fanmade-curation.mjs';
// @ts-expect-error plain ESM script
import { parseCandidateIssue } from './fanmade-curation-issues.mjs';
// @ts-expect-error plain ESM script
import { appendFanmadeSeeds } from './fanmade-curation-seed.mjs';

const NOW = '2026-10-15T12:00:00.000Z';
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function issue(number = 1) {
  return {
    issueNumber: number,
    item: `Original bracelet ${number}`,
    brand: `Maker ${number}`,
    price: '$24.00',
    url: `https://www.etsy.com/listing/${number}/original-bracelet`,
    imageUrl: `https://images.example.test/${number}.png`,
    provenance: [{
      discoveredVia: 'etsy-search', discoveredAt: '2026-10-14T00:00:00.000Z',
      sourceUrl: `https://www.etsy.com/listing/${number}/original-bracelet`,
    }],
  };
}

function jev({ bootleg = 0.1, kind = 'fan_original', confidence = 0.95 } = {}) {
  return {
    ask: vi.fn(async () => ({ answers: {
      q_bootleg: { type: 'noul', probability: bootleg },
      q_merch_kind: { type: 'choice', optionId: kind, confidence, probabilities: {} },
    } })),
  };
}

function d3(overrides = {}) {
  return vi.fn(async () => ({ status: 'ok', data: {
    judgment: 'inspired-original', prohibitedMaterial: 'none',
    basis: 'Visible original beads and letter charms.', kind: 'jewelry',
    depicts: 'A handmade beaded bracelet.', officialArtwork: false,
    tourGraphic: false, taylorPhoto: false, ...overrides,
  } }));
}

function dependencies(overrides = {}) {
  return {
    now: NOW,
    existingCatalog: [],
    jevClient: jev(),
    callClaudeImpl: d3(),
    verifyProductUrlImpl: vi.fn(async () => true),
    verifyImageImpl: vi.fn(async () => ({ verdict: 'ok' })),
    fetchImageImpl: vi.fn(async () => ({ buffer: PNG, mimeType: 'image/png' })),
    log: vi.fn(),
    ...overrides,
  };
}

describe('fan-made curation', () => {
  it('rejects when q_bootleg is above the configured threshold', async () => {
    const result = await curateFanmadeIssues({
      issues: [issue()], ...dependencies({ jevClient: jev({ bootleg: BOOTLEG_REJECT_THRESHOLD + 0.01 }) }),
    });
    expect(result).toMatchObject({ accepted: [], rejected: [{ issueNumber: 1 }] });
    expect(result.rejected[0].reason).toContain('bootleg probability');
  });

  it('filters out a non-fan-original q_merch_kind result', async () => {
    const result = await curateFanmadeIssues({
      issues: [issue()], ...dependencies({ jevClient: jev({ kind: 'official_store' }) }),
    });
    expect(result.rejected[0].reason).toContain('official_store');
  });

  it('rejects prohibited imagery from the D3 vision check', async () => {
    const result = await curateFanmadeIssues({
      issues: [issue()], ...dependencies({ callClaudeImpl: d3({
        judgment: 'reject', prohibitedMaterial: 'taylor-photo', taylorPhoto: true,
      }) }),
    });
    expect(result).toMatchObject({ accepted: [], rejected: [{ reason: 'D3 vision check rejected prohibited imagery' }] });
  });

  it.each([
    ['E1', { verifyProductUrlImpl: vi.fn(async () => false) }, 'E1 listing verification failed'],
    ['E2', { verifyImageImpl: vi.fn(async () => ({ verdict: 'invalid' })) }, 'E2 image verification failed'],
  ])('rejects a %s verification failure', async (_gate, override, reason) => {
    const result = await curateFanmadeIssues({ issues: [issue()], ...dependencies(override) });
    expect(result).toMatchObject({ accepted: [], rejected: [{ reason }] });
  });

  it('accepts no more than five items in a week and records dated D3/E1/E2 provenance', async () => {
    const callClaudeImpl = d3();
    const result = await curateFanmadeIssues({
      issues: Array.from({ length: 7 }, (_, index) => issue(index + 1)),
      ...dependencies({ callClaudeImpl }),
    });
    expect(result.accepted).toHaveLength(5);
    expect(result.accepted[0].seed).toMatchObject({
      kind: 'jewelry', verifiedAt: NOW,
      provenance: [{
        d3: { judgment: 'inspired-original', prohibitedMaterial: 'none', verifiedAt: NOW },
        e1: { listingVerified: true, available: true, verifiedAt: NOW },
        e2: {
          imageVerified: true, officialArtwork: false, tourGraphic: false,
          taylorPhoto: false, verifiedAt: NOW,
        },
      }],
    });
    expect(callClaudeImpl).toHaveBeenCalledWith(expect.objectContaining({
      model: 'claude-haiku-5-5', priority: 'P3',
      images: [{ buffer: PNG, mimeType: 'image/png' }],
    }));
  });

  it('counts catalog items already accepted this UTC week against the cap', async () => {
    const existingCatalog = Array.from({ length: 4 }, (_, index) => ({
      url: `https://existing.test/${index}`, verifiedAt: '2026-10-13T00:00:00.000Z',
    }));
    const result = await curateFanmadeIssues({
      issues: [issue(1), issue(2)], ...dependencies({ existingCatalog }),
    });
    expect(result.accepted).toHaveLength(1);
  });

  it('discards staged acceptances and leaves the failed issue open when the wrapper is unavailable', async () => {
    const callClaudeImpl = vi.fn()
      .mockResolvedValueOnce(await d3()())
      .mockResolvedValueOnce({ status: 'unavailable', reason: 'CLI missing' });
    const result = await curateFanmadeIssues({
      issues: [issue(1), issue(2)], ...dependencies({ callClaudeImpl }),
    });
    expect(result).toMatchObject({ status: 'unavailable', accepted: [], unresolved: [{ issueNumber: 2 }] });
  });

  it('accepts nothing and leaves the issue open when Jev is unavailable', async () => {
    const result = await curateFanmadeIssues({
      issues: [issue()], ...dependencies({ jevClient: { ask: vi.fn(async () => { throw new Error('offline'); }) } }),
    });
    expect(result).toMatchObject({ status: 'unavailable', accepted: [], rejected: [], unresolved: [{ issueNumber: 1 }] });
  });
});

describe('fan-made curation I/O', () => {
  it('parses the P0-10 issue shape without trusting the title', () => {
    expect(parseCandidateIssue({
      number: 42, title: 'untrusted', createdAt: NOW, url: 'https://github.com/o/r/issues/42',
      body: [
        'Candidate URL: https://www.etsy.com/listing/42/item',
        'Title observed: Handmade item', 'Observed maker: GoodMaker',
        'Observed price: $24.00', 'Observed image: https://images.example.test/item.png',
        'Provenance:', '- etsy-search: https://www.etsy.com/listing/42/item',
      ].join('\n'),
    })).toMatchObject({ issueNumber: 42, item: 'Handmade item', brand: 'GoodMaker', price: '$24.00' });
  });

  it('appends accepted seeds without reformatting existing entries', async () => {
    const writeFileImpl = vi.fn(async () => undefined);
    await appendFanmadeSeeds({
      seeds: [{ brand: 'New maker', url: 'https://example.test/new' }],
      readFileImpl: vi.fn(async () => "export const FAN_MADE = [\n  { brand: 'Existing' },\n\n];\n\nexport default FAN_MADE;\n"),
      writeFileImpl,
    });
    const output = writeFileImpl.mock.calls[0][1] as string;
    expect(output).toContain("  { brand: 'Existing' },");
    expect(output).toContain('"brand": "New maker"');
  });
});

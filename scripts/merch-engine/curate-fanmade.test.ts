import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error plain ESM script
import { BOOTLEG_REJECT_THRESHOLD, FANMADE_PRIORITY, FANMADE_WEEKLY_CAP, curateFanmadeIssues, safeFanmadePriority } from './fanmade-curation.mjs';
// @ts-expect-error plain ESM script
import { parseCandidateIssue } from './fanmade-curation-issues.mjs';
// @ts-expect-error plain ESM script
import { appendFanmadeSeeds } from './fanmade-curation-seed.mjs';
// @ts-expect-error plain ESM script
import { buildCurationReport, renderSummary, runFanmadeCuration } from './curate-fanmade.mjs';

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
    ['E2', { verifyImageImpl: vi.fn(async () => ({ verdict: 'invalid' })) }, 'E2 image verification failed'],
  ])('rejects a %s verification failure', async (_gate, override, reason) => {
    const result = await curateFanmadeIssues({ issues: [issue()], ...dependencies(override) });
    expect(result).toMatchObject({ accepted: [], rejected: [{ reason }] });
  });

  it.each([403, 429, 503])('leaves an E1 HTTP %s candidate unresolved and open', async (status) => {
    const result = await curateFanmadeIssues({
      issues: [issue()],
      ...dependencies({ verifyProductUrlImpl: vi.fn(async () => ({ verdict: 'unavailable', status })) }),
    });
    expect(result).toMatchObject({ rejected: [], unresolved: [{ issueNumber: 1, reason: expect.stringContaining(`HTTP ${status}`) }] });
    expect(buildCurationReport(result, NOW, { config: { enabled: true, shadow: false }, issues: [issue()] }).closures).toEqual([]);
  });

  it.each([403, 429, 503])('leaves an E2 HTTP %s candidate unresolved and open', async (status) => {
    const verdict = status === 403 ? 'blocked' : 'unavailable';
    const result = await curateFanmadeIssues({
      issues: [issue()],
      ...dependencies({ verifyImageImpl: vi.fn(async () => ({ verdict, status })) }),
    });
    expect(result).toMatchObject({ rejected: [], unresolved: [{ issueNumber: 1, reason: expect.stringContaining(`HTTP ${status}`) }] });
  });

  it.each([403, 429, 503])('leaves an image download HTTP %s candidate unresolved and open', async (status) => {
    const error = Object.assign(new Error(`image source unavailable (HTTP ${status})`), { status });
    const result = await curateFanmadeIssues({
      issues: [issue()], ...dependencies({ fetchImageImpl: vi.fn(async () => { throw error; }) }),
    });
    expect(result).toMatchObject({ rejected: [], unresolved: [{ issueNumber: 1, reason: expect.stringContaining(`HTTP ${status}`) }] });
  });

  it.each([
    ['E1', { verifyProductUrlImpl: vi.fn(async () => { throw new Error('network down'); }) }],
    ['E2', { verifyImageImpl: vi.fn(async () => { throw new Error('network down'); }) }],
    ['image download', { fetchImageImpl: vi.fn(async () => { throw new Error('network down'); }) }],
  ])('leaves a %s network throw unresolved and open', async (_gate, override) => {
    const result = await curateFanmadeIssues({ issues: [issue()], ...dependencies(override) });
    expect(result).toMatchObject({ rejected: [], unresolved: [{ issueNumber: 1, reason: expect.stringContaining('network down') }] });
  });

  it.each([
    ['E1', { verifyProductUrlImpl: vi.fn(async () => ({ verdict: 'invalid', status: 404 })) }, 'E1 listing verification failed (HTTP 404)'],
    ['E2', { verifyImageImpl: vi.fn(async () => ({ verdict: 'invalid', status: 404 })) }, 'E2 image verification failed (HTTP 404)'],
  ])('rejects a conclusive %s 404 with a reason', async (_gate, override, reason) => {
    const result = await curateFanmadeIssues({ issues: [issue()], ...dependencies(override) });
    expect(result).toMatchObject({ unresolved: [], rejected: [{ issueNumber: 1, reason }] });
  });

  it('rejects a conclusive image-download 404 with a reason', async () => {
    const error = Object.assign(new Error('image source unavailable (HTTP 404)'), { status: 404 });
    const result = await curateFanmadeIssues({
      issues: [issue()], ...dependencies({ fetchImageImpl: vi.fn(async () => { throw error; }) }),
    });
    expect(result).toMatchObject({ unresolved: [], rejected: [{ issueNumber: 1, reason: expect.stringContaining('HTTP 404') }] });
  });

  it('normalizes an Etsy query string before checking catalog duplicates', async () => {
    const candidate = { ...issue(), url: `${issue().url}?utm_source=weekly&ref=home` };
    const result = await curateFanmadeIssues({
      issues: [candidate],
      ...dependencies({ existingCatalog: [{ url: issue().url, verifiedAt: '2026-09-01T00:00:00.000Z' }] }),
    });
    expect(result).toMatchObject({ accepted: [], rejected: [{ issueNumber: 1, reason: 'listing is already curated' }] });
  });

  it('uses the configured weekly cap and priority and records dated D3/E1/E2 provenance', async () => {
    const callClaudeImpl = d3();
    const result = await curateFanmadeIssues({
      issues: Array.from({ length: 7 }, (_, index) => issue(index + 1)),
      ...dependencies({ callClaudeImpl }),
    });
    expect(result.accepted).toHaveLength(FANMADE_WEEKLY_CAP);
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
      model: 'claude-haiku-5-5', priority: FANMADE_PRIORITY,
      images: [{ buffer: PNG, mimeType: 'image/png' }],
    }));
    expect(FANMADE_PRIORITY).toBe('P2');
    expect(safeFanmadePriority('P0')).toBe('P3');
    expect(safeFanmadePriority('P1')).toBe('P3');
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
  it('runs all checks but writes no seeds in shadow mode', async () => {
    const appendSeeds = vi.fn(async () => undefined);
    const jevClient = jev();
    const callClaudeImpl = d3();
    const verifyProductUrlImpl = vi.fn(async () => true);
    const verifyImageImpl = vi.fn(async () => ({ verdict: 'ok' }));
    const fetchImageImpl = vi.fn(async () => ({ buffer: PNG, mimeType: 'image/png' }));
    const pipeline = vi.fn((options) => curateFanmadeIssues({
      ...options, issues: [issue()], callClaudeImpl, verifyProductUrlImpl,
      verifyImageImpl, fetchImageImpl,
    }));
    const report = await runFanmadeCuration({
      rawIssues: [issue()], jevClient, pipeline, appendSeeds,
      config: { enabled: true, shadow: true }, now: NOW,
    });
    expect(pipeline).toHaveBeenCalledOnce();
    expect(jevClient.ask).toHaveBeenCalledOnce();
    expect(callClaudeImpl).toHaveBeenCalledOnce();
    expect(verifyProductUrlImpl).toHaveBeenCalledOnce();
    expect(verifyImageImpl).toHaveBeenCalledOnce();
    expect(fetchImageImpl).toHaveBeenCalledOnce();
    expect(appendSeeds).not.toHaveBeenCalled();
    expect(report).toMatchObject({ mode: 'shadow', writeEnabled: false, acceptedCount: 1, rejectedCount: 0, closures: [] });
    expect(renderSummary(report)).toMatch(/Would accept: 1 .*would reject: 0/);
    expect(renderSummary(report)).toContain('#1 accept');
  });

  it('writes seeds live, leaves accepted issues for merge, and closes only rejected issues', async () => {
    const appendSeeds = vi.fn(async () => undefined);
    const report = await runFanmadeCuration({
      rawIssues: [{ number: 1, title: 'Accepted title' }, { number: 2, title: 'Rejected title' }],
      jevClient: jev(), appendSeeds, config: { enabled: true, shadow: false }, now: NOW,
      pipeline: vi.fn(async () => ({
        status: 'ok', capacity: 5,
        accepted: [{ issueNumber: 1, seed: { item: 'Accepted title' } }],
        rejected: [{ issueNumber: 2, reason: 'validated-invalid image' }], unresolved: [],
      })),
    });
    expect(appendSeeds).toHaveBeenCalledOnce();
    expect(report.closures).toEqual([{ issueNumber: 2, reason: 'Rejected by fan-made curation: validated-invalid image.' }]);
    expect(report.acceptedIssues).toEqual([expect.objectContaining({ issueNumber: 1 })]);
  });

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

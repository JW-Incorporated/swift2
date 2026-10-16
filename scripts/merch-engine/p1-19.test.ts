import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  buildMatcherInput,
  hasNoProducts,
  readTidewatchQueue,
  serializeMatcherInput,
} from './build-matcher-input.mjs';
import { findOpenMatcherPr, openMatcherPr } from './matcher-open-pr-guard.mjs';
import { authorizeMatcherRun, inNoMatchCooldown, recordNoMatch } from './matcher-state.mjs';
import {
  main as writeMomentProducts,
  prepareMomentProducts,
  productFromCandidate,
  selectAlternatives,
  writeProductsToSource,
} from './write-moment-products.mjs';

const now = new Date('2026-10-15T12:00:00.000Z');
const photo = (url: string) => ({ photos: [{ url }] });
const item = (title: string, day: number, products?: object[]) => ({
  year: 2026, month: 10, day, category: 'fashion', title,
  moment: { ...photo(`https://images.example/${title}.jpg`), ...(products ? { products } : {}) },
});

describe('P1-19 matcher input', () => {
  it('keeps serialized input byte-identical when the Tidewatch queue is absent or empty', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'p2-11-matcher-'));
    const absent = join(dir, 'absent.jsonl');
    const empty = join(dir, 'empty.jsonl');
    const corpora = [{ sourceFile: 'test.mjs', eraSlug: 'lover', items: [item('look', 15)] }];
    try {
      await writeFile(empty, '');
      const baseline = serializeMatcherInput(buildMatcherInput({
        corpora, tidewatchClass: { enabled: false, shadow: true }, now,
      }));
      const absentOutput = serializeMatcherInput(buildMatcherInput({
        corpora, tidewatchClass: { enabled: false, shadow: true }, now,
        tidewatchItems: await readTidewatchQueue(absent),
      }));
      const emptyOutput = serializeMatcherInput(buildMatcherInput({
        corpora, tidewatchClass: { enabled: false, shadow: true }, now,
        tidewatchItems: await readTidewatchQueue(empty),
      }));
      expect(absentOutput).toBe(baseline);
      expect(emptyOutput).toBe(baseline);
      expect(baseline).toMatchInlineSnapshot(`
        "{
          "moments": [
            {
              "source": "fashion-moment",
              "sourceFile": "test.mjs",
              "momentId": "vault-lover-look",
              "moment": {
                "id": "vault-lover-look",
                "title": "look"
              },
              "momentImageUrl": "https://images.example/look.jpg"
            }
          ],
          "paidSearch": {
            "cap": 5
          },
          "sources": {
            "fashion": 1,
            "tidewatch": {
              "enabled": false,
              "used": 0
            }
          }
        }
        "
      `);
    } finally {
      await rm(dir, { recursive: true });
    }
  });

  it('selects only empty fashion moments, newest first, and caps the run at three', () => {
    const curated = { verifiedAt: '2026-09-01T12:00:00.000Z', altNote: 'Curated alternative.' };
    const corpora = [{ sourceFile: 'supabase/seed/content/test.mjs', eraSlug: 'lover', items: [
      item('old', 1), item('newest', 14), item('second', 13), item('third', 12), item('curated', 15, [curated]),
      { ...item('music', 15), category: 'music' },
    ] }];
    const input = buildMatcherInput({ corpora, tidewatchClass: { enabled: false, shadow: true }, now });
    expect(input.moments.map((row) => row.moment.title)).toEqual(['newest', 'second', 'third']);
    expect(input.sources.tidewatch).toEqual({ enabled: false, used: 0 });
    expect(input.paidSearch.cap).toBe(5);
  });

  it('never treats a moment with products as eligible, regardless of verification age', () => {
    expect(hasNoProducts(item('none', 1))).toBe(true);
    expect(hasNoProducts(item('empty', 1, []))).toBe(true);
    expect(hasNoProducts(item('stale', 1, [{ verifiedAt: '2026-01-01T00:00:00Z' }]))).toBe(false);
  });

  it('skips fashion and Tidewatch moments during the no-match cooldown', () => {
    const state = recordNoMatch({ runs: [], noMatches: {} }, 'vault-lover-cooling', now);
    const corpora = [{ sourceFile: 'test.mjs', eraSlug: 'lover', items: [item('cooling', 15), item('open', 14)] }];
    const input = buildMatcherInput({
      corpora, state, now, limit: 3,
      tidewatchClass: { enabled: true, shadow: false },
      tidewatchItems: [{ moment: { id: 'vault-lover-cooling' }, momentImageUrl: 'https://images.example/cooling.jpg', occurredAt: now.getTime() }],
    });
    expect(input.moments.map((row) => row.moment.id)).toEqual(['vault-lover-open']);
    expect(inNoMatchCooldown('vault-lover-cooling', state, now)).toBe(true);
  });
});

describe('P1-19 writer', () => {
  const candidate = (id: string, score: number, price: string) => ({
    id, score, source: 'paid-search', title: `${id} dress`, price,
    productUrl: `https://shop.example/${id}`, imageUrl: `https://images.example/${id}.jpg`,
  });

  it('maps candidate score to matchScore/matchTier without affiliate data', () => {
    expect(productFromCandidate(candidate('one', 82, '$75'), { score: 82, kind: 'dress' }, now.toISOString())).toEqual({
      brand: 'shop.example', item: 'one dress', retailer: 'shop.example',
      url: 'https://shop.example/one', matchTier: 'close', matchScore: 82,
      kind: 'dress', imageUrl: 'https://images.example/one.jpg', price: '$75', verifiedAt: now.toISOString(),
    });
  });

  it('keeps the best match and at most two alternatives in distinct price bands', () => {
    const selected = selectAlternatives('look', [
      candidate('best', 95, '$250'), candidate('mid', 80, '$100'),
      candidate('same-band', 79, '$90'), candidate('low', 70, '$30'),
    ]);
    expect(selected.map((row) => row.id)).toEqual(['best', 'mid', 'low']);
  });

  it.each([
    ['E1', async () => ({ verdict: 'unverified' }), async () => ({ verdict: 'ok', status: 200 })],
    ['E2', async () => ({ verdict: 'ok' }), async () => { throw new Error('timeout'); }],
  ])('holds the whole moment on a transient %s failure', async (_gate, linkCheck, imageCheck) => {
    const auditImpl = vi.fn(async ({ queue }) => ({ judgments: queue.queue.map((pair: { productId: string }) => ({
      ...pair, score: 80, tier: 'close', kind: 'dress', reasons: ['same silhouette'],
    })) }));
    const result = await prepareMomentProducts({
      momentId: 'look', momentImageUrl: 'https://images.example/look.jpg', products: [candidate('one', 80, '$75')],
    }, { auditImpl, linkCheck, imageCheck, now });
    expect(result.status).toBe('hold');
    expect(result.products).toEqual([]);
  });

  it('fills an empty target moment products array', () => {
    const source = `export default { eraSlug: 'lover', items: [{ title: 'Look', category: 'fashion', moment: { photos: [], products: [] } }] };\n`;
    const written = writeProductsToSource(source, 'vault-lover-look', [{ item: 'Dress', url: 'https://shop.example/dress' }]);
    expect(written).toContain('"item": "Dress"');
    expect(written).toContain('products: [');
  });

  it('throws instead of replacing any existing products', () => {
    const source = `export default { eraSlug: 'lover', items: [{ title: 'Look', category: 'fashion', moment: { products: [{ item: 'Curated', altNote: 'Keep me' }] } }] };\n`;
    expect(() => writeProductsToSource(source, 'vault-lover-look', [{ item: 'New' }])).toThrow('already has products');
  });

  it('holds a matcher result when its vision judgment was unavailable', async () => {
    const auditImpl = vi.fn();
    const result = await prepareMomentProducts({ momentId: 'look', status: 'hold', holdReason: 'vision-unavailable', products: [] }, { auditImpl });
    expect(result).toEqual({ status: 'hold', reason: 'vision-unavailable', products: [] });
    expect(auditImpl).not.toHaveBeenCalled();
  });

  it('drops and logs an invalid row while retaining a valid row', async () => {
    const auditImpl = vi.fn(async ({ queue }) => ({ judgments: queue.queue.map((pair: { productId: string }) => ({
      ...pair, score: pair.productId.endsWith(':bad') ? 90 : 80, tier: 'close', kind: 'dress', reasons: [],
    })) }));
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await prepareMomentProducts({
      momentId: 'look', momentImageUrl: 'https://images.example/look.jpg', products: [
        { ...candidate('bad', 90, '$300'), productUrl: 'https://www.google.com/shopping/product/1' },
        candidate('good', 80, '$75'),
      ],
    }, { auditImpl, linkCheck: async () => ({ verdict: 'ok' }), imageCheck: async () => ({ verdict: 'ok' }), now });
    expect(result.products.map((row) => row.item)).toEqual(['good dress']);
    expect(warning).toHaveBeenCalledWith(expect.stringContaining('dropped look:bad'));
    warning.mockRestore();
  });

  it('fails only when row errors leave no valid products', async () => {
    const auditImpl = vi.fn(async ({ queue }) => ({ judgments: queue.queue.map((pair: { productId: string }) => ({
      ...pair, score: 90, tier: 'exact', kind: 'dress', reasons: [],
    })) }));
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(prepareMomentProducts({
      momentId: 'look', momentImageUrl: 'https://images.example/look.jpg',
      products: [{ ...candidate('bad', 90, '$300'), productUrl: 'https://google.com/shopping/product/1' }],
    }, { auditImpl, linkCheck: async () => ({ verdict: 'ok' }), imageCheck: async () => ({ verdict: 'ok' }), now })).rejects.toThrow('all 1 product rows');
    warning.mockRestore();
  });

  it('preserves curated alternative rows elsewhere in the source file during a run', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'p1-19-'));
    const sourceFile = join(dir, 'lover.mjs');
    const planFile = join(dir, 'plan.json');
    const source = `export default { eraSlug: 'lover', items: [\n  { title: 'Curated', category: 'fashion', moment: { products: [{ brand: 'Old', item: 'Alt', retailer: 'old.example', url: 'https://old.example/alt', isAlternative: true, altNote: 'Keep this note', inStock: false }] } },\n  { title: 'Empty', category: 'fashion', moment: { products: [] } },\n] };\n`;
    const match = { momentId: 'vault-lover-empty', sourceFile, momentImageUrl: 'https://images.example/empty.jpg', products: [candidate('one', 80, '$75')] };
    const auditImpl = vi.fn(async ({ queue }) => ({ judgments: queue.queue.map((pair: { productId: string }) => ({ ...pair, score: 80, tier: 'close', kind: 'dress', reasons: [] })) }));
    try {
      await writeFile(sourceFile, source);
      await writeFile(planFile, JSON.stringify({ matches: [match] }));
      await writeMomentProducts(['--plan', planFile], { auditImpl, linkCheck: async () => ({ verdict: 'ok' }), imageCheck: async () => ({ verdict: 'ok' }), now });
      const written = await readFile(sourceFile, 'utf8');
      expect(written).toContain("altNote: 'Keep this note'");
      expect(written).toContain('inStock: false');
      expect(written).toContain('"item": "one dress"');
    } finally {
      await rm(dir, { recursive: true });
    }
  });
});

describe('P1-19 cached run state', () => {
  const state = { runs: ['2026-10-12T10:00:00.000Z', '2026-10-13T10:00:00.000Z'], noMatches: {} };

  it('skips a third scheduled run in the ISO week', () => {
    expect(authorizeMatcherRun({ state, eventName: 'schedule', confirmation: '', lookCap: 3, paidSearchCap: 5, now })).toEqual(
      expect.objectContaining({ proceed: false, reason: 'weekly-run-limit' }),
    );
  });

  it('requires the existing typed confirmation beyond weekly or per-run caps', () => {
    expect(() => authorizeMatcherRun({ state, eventName: 'workflow_dispatch', confirmation: '', lookCap: 3, paidSearchCap: 5, now })).toThrow('RUN_MATCHER_AUTHORING');
    expect(() => authorizeMatcherRun({ state: { runs: [], noMatches: {} }, eventName: 'workflow_dispatch', confirmation: '', lookCap: 4, paidSearchCap: 5, now })).toThrow('RUN_MATCHER_AUTHORING');
    expect(authorizeMatcherRun({ state, eventName: 'workflow_dispatch', confirmation: 'RUN_MATCHER_AUTHORING', lookCap: 3, paidSearchCap: 5, now }).proceed).toBe(true);
  });
});

describe('P1-19 open-PR guard', () => {
  const prs = [{ number: 42, headRefName: 'merch-matcher/123', createdAt: '2026-10-14T00:00:00Z' }];

  it('finds a recent matcher PR and ignores other prefixes', () => {
    expect(openMatcherPr(prs, now)?.number).toBe(42);
    expect(openMatcherPr([{ ...prs[0], headRefName: 'merch-official-sync/1' }], now)).toBeNull();
  });

  it('queries open PRs through an injectable fake', async () => {
    const run = vi.fn(async () => ({ stdout: JSON.stringify(prs) }));
    expect((await findOpenMatcherPr({ run, now }))?.number).toBe(42);
    expect(run).toHaveBeenCalledWith('gh', expect.arrayContaining(['--state', 'open']));
  });
});

describe('P1-19 workflow credential split', () => {
  it('keeps the PAT out of matching and uses it only in the author job', async () => {
    const workflow = await readFile('.github/workflows/merch-matcher-authoring.yml', 'utf8');
    const matchJob = workflow.slice(workflow.indexOf('  match:'), workflow.indexOf('  author:'));
    const authorJob = workflow.slice(workflow.indexOf('  author:'));
    expect(matchJob).toContain('persist-credentials: false');
    expect(matchJob).not.toContain('SOCIAL_POSTER_PAT');
    expect(matchJob).toContain("always() && steps.open.outputs.number == ''");
    expect(authorJob).toContain('SOCIAL_POSTER_PAT');
    expect(authorJob).toContain('git apply --numstat .artifacts/merch-matcher/seed.patch');
    expect(authorJob).toContain("^supabase/seed/content/[^/]+$");
    expect(authorJob).toContain("git apply --include='supabase/seed/content/*'");
  });

  it('passes dispatch caps through env and confirms non-main cache isolation', async () => {
    const workflow = await readFile('.github/workflows/merch-matcher-authoring.yml', 'utf8');
    expect(workflow).toContain("LOOK_CAP: ${{ inputs.look_cap || '3' }}");
    expect(workflow).toContain('--limit "$LOOK_CAP"');
    expect(workflow).not.toContain('--limit "${{ inputs.look_cap');
    expect(workflow).toContain("github.ref_name != 'main'");
    expect(workflow).toContain("inputs.confirmation != 'RUN_MATCHER_AUTHORING'");
    expect(workflow).toContain("cannot see main's weekly cache");
  });
});

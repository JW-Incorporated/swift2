import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { DAILY_CAP, DIRECTIONS, MAX_DEPTH, childDepth, dispatchMarkers, dispatchResponse, dispatchedToday, renderDispatchMarker } from './loop-dispatch.mjs';

const NOW = Date.parse('2026-09-30T23:30:00Z');
const BOT = { login: 'github-actions[bot]' };

type Opts = { comments?: Record<number, unknown[]>; total?: number; failDispatch?: boolean };
function fakeGh({ comments = {}, total = 0, failDispatch = false }: Opts = {}) {
  const calls: string[][] = [];
  const gh = vi.fn(async (args: string[]) => {
    calls.push(args);
    if (args[0] === 'api') {
      const p = args[1];
      if (p.includes('/actions/workflows/')) return { stdout: JSON.stringify({ total_count: total }) };
      const n = Number(/issues\/(\d+)\/comments/.exec(p)?.[1]);
      return { stdout: JSON.stringify(comments[n] || []) };
    }
    if (args[0] === 'workflow' && failDispatch) throw new Error('HTTP 404: workflow not found on main');
    return { stdout: '' };
  });
  return { gh, calls };
}
const marker = (direction: string, depth: number, user = BOT) => ({ user, body: `Started a routine.\n\n${renderDispatchMarker(direction, depth)}` });
const run = (calls: string[][]) => calls.find((c) => c[0] === 'workflow');
const log = () => vi.fn();

describe('dispatchResponse', () => {
  it('writes the claim comment, then starts the other bot’s workflow for that issue', async () => {
    const { gh, calls } = fakeGh();
    const res = await dispatchResponse('to-marjorie', 4300, { repo: 'o/r', gh, now: NOW, log: log() });
    expect(res).toMatchObject({ dispatched: true, depth: 0 });
    const kinds = calls.map((c) => (c[0] === 'api' ? 'read' : c[0]));
    expect(kinds.indexOf('issue')).toBeLessThan(kinds.indexOf('workflow'));
    expect(calls.find((c) => c[0] === 'issue')).toEqual(['issue', 'comment', '4300', '--repo', 'o/r', '--body', expect.stringContaining('<!-- loop-dispatched: to-marjorie depth=0 -->')]);
    expect(run(calls)).toEqual(['workflow', 'run', 'routine-marjorie-ask-response.yml', '--repo', 'o/r', '--ref', 'main', '-f', 'issue_number=4300']);
  });

  it('each direction starts its own workflow', async () => {
    const { gh, calls } = fakeGh();
    await dispatchResponse('to-tree', 4301, { repo: 'o/r', gh, now: NOW, log: log() });
    expect(run(calls)?.[2]).toBe('routine-tree-ask-response.yml');
    expect(Object.keys(DIRECTIONS).sort()).toEqual(['to-marjorie', 'to-tree']);
  });

  it('never dispatches the same kind for the same issue twice (marker)', async () => {
    const { gh, calls } = fakeGh({ comments: { 4300: [marker('to-marjorie', 0)] } });
    const res = await dispatchResponse('to-marjorie', 4300, { repo: 'o/r', gh, now: NOW, log: log() });
    expect(res).toEqual({ dispatched: false, reason: 'already dispatched' });
    expect(run(calls)).toBeUndefined();
    expect(calls.some((c) => c[0] === 'issue')).toBe(false);
  });

  it('a marker for the OTHER direction does not block this one', async () => {
    const { gh, calls } = fakeGh({ comments: { 4300: [marker('to-tree', 0)] } });
    expect((await dispatchResponse('to-marjorie', 4300, { repo: 'o/r', gh, now: NOW, log: log() })).dispatched).toBe(true);
    expect(run(calls)).toBeDefined();
  });

  it('ignores a marker a human (or any non-workflow author) typed — the repo is public', async () => {
    const forged = marker('to-marjorie', 0, { login: 'someone' });
    const { gh, calls } = fakeGh({ comments: { 4300: [forged] } });
    expect((await dispatchResponse('to-marjorie', 4300, { repo: 'o/r', gh, now: NOW, log: log() })).dispatched).toBe(true);
    expect(run(calls)).toBeDefined();
    expect(dispatchMarkers([forged])).toEqual([]);
  });

  it('stops at the daily cap per direction, counted from today’s runs of that workflow', async () => {
    const full = fakeGh({ total: DAILY_CAP });
    expect(await dispatchResponse('to-tree', 1, { repo: 'o/r', gh: full.gh, now: NOW, log: log() })).toEqual({ dispatched: false, reason: `daily cap ${DAILY_CAP}/${DAILY_CAP}` });
    expect(run(full.calls)).toBeUndefined();
    const one = fakeGh({ total: DAILY_CAP - 1 });
    expect((await dispatchResponse('to-tree', 1, { repo: 'o/r', gh: one.gh, now: NOW, log: log() })).dispatched).toBe(true);
  });

  it('counts runs since UTC midnight of the dispatch moment', async () => {
    const { gh, calls } = fakeGh({ total: 3 });
    expect(await dispatchedToday('to-marjorie', { repo: 'o/r', gh, now: NOW })).toBe(3);
    const path = calls.find((c) => c[0] === 'api')![1];
    expect(path).toContain('/actions/workflows/routine-marjorie-ask-response.yml/runs?');
    expect(decodeURIComponent(path)).toContain('created=>=2026-09-30');
  });

  it('bounds a chain: an ask filed from a response run carries its parent’s depth + 1', async () => {
    const { gh } = fakeGh({ comments: { 10: [marker('to-marjorie', 0)] } });
    expect(await childDepth(10, { repo: 'o/r', gh })).toBe(1);
    expect(await childDepth(null, { repo: 'o/r', gh })).toBe(0);
    expect(await childDepth(99, { repo: 'o/r', gh })).toBe(1);
    const mid = fakeGh({ comments: { 10: [marker('to-tree', MAX_DEPTH - 1)] } });
    const ok = await dispatchResponse('to-marjorie', 11, { repo: 'o/r', gh: mid.gh, now: NOW, parent: 10, log: log() });
    expect(ok).toMatchObject({ dispatched: true, depth: MAX_DEPTH });
    const deep = fakeGh({ comments: { 10: [marker('to-tree', MAX_DEPTH)] } });
    const refused = await dispatchResponse('to-marjorie', 11, { repo: 'o/r', gh: deep.gh, now: NOW, parent: 10, log: log() });
    expect(refused.dispatched).toBe(false);
    expect(refused.reason).toContain('chain depth');
    expect(run(deep.calls)).toBeUndefined();
  });

  it('fails CLOSED for a response run that cannot name its parent: depth max+1, never dispatched, depth recorded', async () => {
    expect(await childDepth('', { repo: 'o/r', gh: fakeGh().gh, failClosed: true })).toBe(MAX_DEPTH + 1);
    expect(await childDepth(undefined, { repo: 'o/r', gh: fakeGh().gh })).toBe(0);
    const { gh, calls } = fakeGh();
    const res = await dispatchResponse('to-tree', 20, { repo: 'o/r', gh, now: NOW, parent: '', response: true, log: log() });
    expect(res.dispatched).toBe(false);
    expect(res.reason).toContain('chain depth');
    expect(run(calls)).toBeUndefined();
    const note = calls.find((c) => c[0] === 'issue');
    expect(note?.[6]).toContain(`<!-- loop-depth: ${MAX_DEPTH + 1} -->`);
  });

  it('an ask held back by the daily cap still records its depth, so answering it later cannot reset the chain', async () => {
    const { gh, calls } = fakeGh({ total: DAILY_CAP, comments: { 10: [marker('to-marjorie', 0)] } });
    const res = await dispatchResponse('to-tree', 21, { repo: 'o/r', gh, now: NOW, parent: 10, response: true, log: log() });
    expect(res.reason).toContain('daily cap');
    expect(calls.find((c) => c[0] === 'issue')?.[6]).toContain('<!-- loop-depth: 1 -->');
    // a later response run answering #21 now counts from its recorded depth
    const later = fakeGh({ comments: { 21: [{ user: BOT, body: 'Not started\n\n<!-- loop-depth: 2 -->' }] } });
    expect(await childDepth(21, { repo: 'o/r', gh: later.gh })).toBe(3);
  });

  it('records no depth for an original ask (nothing to carry) and ignores a forged depth marker', async () => {
    const { gh, calls } = fakeGh({ total: DAILY_CAP });
    await dispatchResponse('to-marjorie', 22, { repo: 'o/r', gh, now: NOW, log: log() });
    expect(calls.some((c) => c[0] === 'issue')).toBe(false);
    const forged = fakeGh({ comments: { 23: [{ user: { login: 'someone' }, body: '<!-- loop-depth: 9 -->' }] } });
    expect(await childDepth(23, { repo: 'o/r', gh: forged.gh })).toBe(1);
  });

  it('turns any GitHub failure into a warning and a not-dispatched result, never a throw', async () => {
    const { gh } = fakeGh({ failDispatch: true });
    const out = log();
    const res = await dispatchResponse('to-marjorie', 4300, { repo: 'o/r', gh, now: NOW, log: out });
    expect(res).toEqual({ dispatched: false, reason: 'error' });
    expect(out.mock.calls.flat().join('\n')).toContain('::warning::loop-dispatch');
    const reads = vi.fn(async () => { throw new Error('HTTP 502'); });
    expect((await dispatchResponse('to-tree', 1, { repo: 'o/r', gh: reads, now: NOW, log: log() })).reason).toBe('error');
  });

  it('rejects an unknown direction loudly (a code bug, not a runtime condition)', async () => {
    await expect(dispatchResponse('sideways', 1, { gh: fakeGh().gh })).rejects.toThrow('unknown loop direction');
  });
});

import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { fileHelp, pending, saveHelp } from './loop-live.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { fileMarjorie, fileTree } from './loop-asks.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { askKey, renderMarker } from './lib/loop-asks.mjs';

const NOW = Date.parse('2026-09-30T12:00:00Z');
const BOT = { login: 'github-actions[bot]' };
const dir = mkdtempSync(path.join(tmpdir(), 'loop-live-'));
const save = (name: string, value: unknown) => writeFileSync(path.join(dir, name), JSON.stringify(value));

type Fake = { listing?: unknown[]; comments?: Record<number, unknown[]>; runsToday?: number; newNumber?: number };
function fakeGh({ listing = [], comments = {}, runsToday = 0, newNumber = 4400 }: Fake = {}) {
  const calls: string[][] = [];
  const gh = vi.fn(async (args: string[]) => {
    calls.push(args);
    if (args[0] === 'api') {
      const p = args[1];
      if (p.includes('/actions/workflows/')) return { stdout: JSON.stringify({ total_count: runsToday }) };
      const m = /issues\/(\d+)\/comments/.exec(p);
      if (m) return { stdout: JSON.stringify(comments[Number(m[1])] || []) };
      return { stdout: JSON.stringify(listing) };
    }
    if (args[0] === 'issue' && args[1] === 'create') return { stdout: `https://github.com/o/r/issues/${newNumber}\n` };
    return { stdout: '' };
  });
  return { gh, calls };
}
const rest = (n: number, side: 'tree' | 'marjorie', text: string, created = '2026-09-30T06:00:00Z', labels = side === 'tree' ? ['tree-filed', 'desk:ops'] : ['marjorie-filed', 'desk:tree']) => ({
  number: n, title: `x: ${text}`, html_url: `https://github.com/o/r/issues/${n}`, user: BOT, state: 'open', created_at: created, closed_at: null,
  labels: labels.map((name) => ({ name })), body: `b\n\n${renderMarker(askKey(side, 1, text), null)}`,
});
const verbs = (calls: string[][]) => calls.filter((c) => c[0] !== 'api').map((c) => c.slice(0, 2).join(' '));
const quiet = () => vi.spyOn(console, 'log').mockImplementation(() => {});

describe('file-help', () => {
  it('Tree files a saved help ask and dispatches Marjorie for the new issue', async () => {
    const d = mkdtempSync(path.join(dir, 'a-'));
    writeFileSync(path.join(d, 'for-marjorie-1.json'), JSON.stringify({ ask: 'Need 6 more Eras photos for the Thursday arc', why: 'pool is dry' }));
    const { gh, calls } = fakeGh();
    const log = quiet();
    expect(await fileHelp({ side: 'tree', dir: d, source: '123', 'source-url': 'u', dispatch: true }, { gh, now: NOW })).toBe(0);
    log.mockRestore();
    expect(verbs(calls)).toEqual(['issue create', 'issue comment', 'workflow run']);
    expect(calls.find((c) => c[1] === 'create')).toContain('tree-filed');
    expect(calls.find((c) => c[0] === 'workflow')).toEqual(['workflow', 'run', 'routine-marjorie-ask-response.yml', '--repo', 'JW-Incorporated/swift2', '--ref', 'main', '-f', 'issue_number=4400']);
  });

  it('Marjorie’s side files desk:tree and dispatches nothing (Tree answers from its Hermes loop), passing the parent for the depth guard', async () => {
    const d = mkdtempSync(path.join(dir, 'b-'));
    writeFileSync(path.join(d, 'for-tree-1.json'), JSON.stringify([{ ask: 'Shift the Friday pair to Thursday' }]));
    const { gh, calls } = fakeGh({ comments: { 77: [{ user: BOT, body: '<!-- loop-dispatched: to-marjorie depth=0 -->' }] } });
    const log = quiet();
    await fileHelp({ side: 'marjorie', dir: d, source: '9', 'source-url': 'u', dispatch: true, parent: '77' }, { gh, now: NOW });
    log.mockRestore();
    expect(calls.find((c) => c[1] === 'create')).toContain('desk:tree');
    // routine-tree-ask-response.yml is retired (2026-10-09): the ask is filed, nothing is dispatched.
    expect(calls.find((c) => c[0] === 'workflow')).toBeUndefined();
  });

  it('response mode: each ask carries its own parent for the depth; one with none is filed but never dispatched', async () => {
    const d = mkdtempSync(path.join(dir, 'r-'));
    writeFileSync(path.join(d, 'for-marjorie-1.json'), JSON.stringify({ ask: 'answers item 77', parent: 77 }));
    writeFileSync(path.join(d, 'for-marjorie-2.json'), JSON.stringify({ ask: 'answers nothing in particular' }));
    const { gh, calls } = fakeGh({ comments: { 77: [{ user: BOT, body: '<!-- loop-dispatched: to-marjorie depth=0 -->' }] }, newNumber: 4500 });
    const log = quiet();
    await fileHelp({ side: 'tree', dir: d, source: '9', 'source-url': 'u', dispatch: true, response: true, parent: '12' }, { gh, now: NOW });
    log.mockRestore();
    expect(calls.filter((c) => c[1] === 'create')).toHaveLength(2);
    expect(calls.filter((c) => c[0] === 'workflow')).toHaveLength(1);
    const bodies = calls.filter((c) => c[0] === 'issue' && c[1] === 'comment').map((c) => c[6]);
    expect(bodies.some((b) => b.includes('loop-dispatched: to-marjorie depth=1'))).toBe(true);
    expect(bodies.some((b) => b.includes('<!-- loop-depth: 3 -->'))).toBe(true);
  });

  it('files without dispatching unless asked', async () => {
    const d = mkdtempSync(path.join(dir, 'c-'));
    save(path.relative(dir, path.join(d, 'for-marjorie-1.json')), { ask: 'x need' });
    const { gh, calls } = fakeGh();
    const log = quiet();
    await fileHelp({ side: 'tree', dir: d, source: '1', 'source-url': 'u' }, { gh, now: NOW });
    log.mockRestore();
    expect(verbs(calls)).toEqual(['issue create']);
  });

  it('stops at the daily cap and does not refile an ask that is already open', async () => {
    const d = mkdtempSync(path.join(dir, 'd-'));
    writeFileSync(path.join(d, 'for-marjorie-1.json'), JSON.stringify([{ ask: 'brand new need A' }, { ask: 'already open need' }]));
    const open = fakeGh({ listing: [rest(50, 'tree', 'already open need')] });
    const log = quiet();
    await fileHelp({ side: 'tree', dir: d, source: '1', 'source-url': 'u', dispatch: true }, { gh: open.gh, now: NOW });
    expect(open.calls.filter((c) => c[1] === 'create')).toHaveLength(1);
    const capped = fakeGh({ listing: [rest(51, 'tree', 'one'), rest(52, 'tree', 'two')] });
    await fileHelp({ side: 'tree', dir: d, source: '1', 'source-url': 'u', dispatch: true }, { gh: capped.gh, now: NOW });
    log.mockRestore();
    expect(capped.calls.filter((c) => c[0] !== 'api')).toEqual([]);
  });

  it('does nothing and exits 0 with no saved asks, and survives a GitHub outage without filing', async () => {
    const empty = mkdtempSync(path.join(dir, 'e-'));
    const log = quiet();
    expect(await fileHelp({ side: 'tree', dir: empty, source: '1', 'source-url': 'u', dispatch: true }, { gh: fakeGh().gh, now: NOW })).toBe(0);
    const d = mkdtempSync(path.join(dir, 'f-'));
    writeFileSync(path.join(d, 'for-marjorie-1.json'), JSON.stringify({ ask: 'need' }));
    const down = vi.fn(async () => { throw new Error('HTTP 502'); });
    expect(await fileHelp({ side: 'tree', dir: d, source: '1', 'source-url': 'u', dispatch: true }, { gh: down, now: NOW })).toBe(0);
    expect(log.mock.calls.flat().join('\n')).toContain('::warning::loop-live');
    log.mockRestore();
  });

  it('skips a malformed file and an entry with no ask text', async () => {
    const d = mkdtempSync(path.join(dir, 'g-'));
    writeFileSync(path.join(d, 'for-marjorie-1.json'), '{not json');
    writeFileSync(path.join(d, 'for-marjorie-2.json'), JSON.stringify({ why: 'no ask' }));
    const { gh, calls } = fakeGh();
    const log = quiet();
    await fileHelp({ side: 'tree', dir: d, source: '1', 'source-url': 'u', dispatch: true }, { gh, now: NOW });
    log.mockRestore();
    expect(calls.filter((c) => c[0] !== 'api')).toEqual([]);
  });

  it('a re-run files nothing new and dispatches nothing (same source + text)', async () => {
    const d = mkdtempSync(path.join(dir, 'h-'));
    writeFileSync(path.join(d, 'for-marjorie-1.json'), JSON.stringify({ ask: 'rerun need' }));
    const again = fakeGh({ listing: [rest(60, 'tree', 'rerun need', '2026-09-29T06:00:00Z')] });
    const log = quiet();
    await fileHelp({ side: 'tree', dir: d, source: '1', 'source-url': 'u', dispatch: true }, { gh: again.gh, now: NOW });
    log.mockRestore();
    expect(again.calls.filter((c) => c[0] !== 'api')).toEqual([]);
  });
});

describe('--dispatch on the existing filers: creation only', () => {
  const bodyFile = () => { const f = path.join(dir, `brief-${Math.random().toString(36).slice(2)}.md`); writeFileSync(f, '**Tree**\n- For Tree: fix the /shop pair\n'); return f; };

  it('file-marjorie dispatches Tree for a new filing, not for one already filed, not without the flag', async () => {
    const log = quiet();
    const created = fakeGh();
    const f1 = bodyFile();
    await fileMarjorie({ issue: '4280', 'issue-url': 'u', 'body-file': f1, out: f1, 'no-edit': true, dispatch: true }, { gh: created.gh });
    expect(created.calls.find((c) => c[0] === 'workflow')).toBeUndefined(); // routine-tree-ask-response.yml retired 2026-10-09

    const plain = fakeGh();
    const f2 = bodyFile();
    await fileMarjorie({ issue: '4280', 'issue-url': 'u', 'body-file': f2, out: f2, 'no-edit': true }, { gh: plain.gh });
    expect(plain.calls.some((c) => c[0] === 'workflow')).toBe(false);

    const existing = fakeGh({ listing: [rest(70, 'marjorie', 'fix the /shop pair')].map((i) => ({ ...i, body: `b\n\n${renderMarker(askKey('marjorie', 4280, 'fix the /shop pair'), null)}` })) });
    const f3 = bodyFile();
    await fileMarjorie({ issue: '4280', 'issue-url': 'u', 'body-file': f3, out: f3, 'no-edit': true, dispatch: true }, { gh: existing.gh });
    log.mockRestore();
    expect(existing.calls.some((c) => c[0] === 'workflow')).toBe(false);
  });

  it('file-tree dispatches Marjorie once per newly filed ask', async () => {
    const plan = path.join(dir, 'plan.json');
    writeFileSync(plan, JSON.stringify({ needsFromMarjorie: [{ ask: 'get the daily draft green' }] }));
    const { gh, calls } = fakeGh();
    const log = quiet();
    await fileTree({ plan, pr: '4270', 'pr-url': 'u', out: path.join(dir, 'loop.json'), dispatch: true }, { gh, now: NOW });
    log.mockRestore();
    expect(calls.filter((c) => c[0] === 'workflow').map((c) => c[2])).toEqual(['routine-marjorie-ask-response.yml']);
  });
});

describe('pending', () => {
  it('writes the oldest unanswered asks, the dispatched one first, and ensures the loop labels', async () => {
    const listing = [rest(81, 'tree', 'second', '2026-09-20T00:00:00Z'), rest(80, 'tree', 'first', '2026-09-14T00:00:00Z'), rest(82, 'tree', 'third', '2026-09-25T00:00:00Z')];
    const { gh, calls } = fakeGh({ listing, comments: { 80: [{ user: { login: 'claude[bot]' }, body: 'Disposition: DECLINE' }] } });
    const out = path.join(dir, 'q', 'queue.json');
    const log = quiet();
    expect(await pending({ for: 'marjorie', out, issue: '82', limit: '2' }, { gh, now: NOW })).toBe(0);
    log.mockRestore();
    const queue = JSON.parse(readFileSync(out, 'utf8'));
    expect(queue.items.map((i: { number: number }) => i.number)).toEqual([82, 81]);
    expect(queue.items[0].primary).toBe(true);
    expect(queue.error).toBeNull();
    expect(calls.filter((c) => c[0] === 'label')).toHaveLength(5);
  });

  it('writes an empty queue with the error recorded when GitHub is down', async () => {
    const out = path.join(dir, 'q2', 'queue.json');
    const down = vi.fn(async () => { throw new Error('HTTP 502'); });
    const log = quiet();
    expect(await pending({ for: 'tree', out }, { gh: down, now: NOW })).toBe(0);
    log.mockRestore();
    expect(JSON.parse(readFileSync(out, 'utf8'))).toMatchObject({ items: [], error: expect.stringContaining('502') });
  });
});

describe('save-help', () => {
  it('writes the next numbered file for the other bot, at most two, and never touches GitHub', () => {
    const d = mkdtempSync(path.join(dir, 's-'));
    const log = quiet();
    expect(saveHelp({ side: 'tree', ask: '  need photos  ', why: 'dry', dir: d })).toBe(0);
    expect(saveHelp({ side: 'tree', ask: 'second', dir: d })).toBe(0);
    expect(saveHelp({ side: 'tree', ask: 'third', dir: d })).toBe(0);
    log.mockRestore();
    expect(JSON.parse(readFileSync(path.join(d, 'for-marjorie-1.json'), 'utf8'))).toEqual({ ask: 'need photos', why: 'dry' });
    expect(JSON.parse(readFileSync(path.join(d, 'for-marjorie-2.json'), 'utf8')).ask).toBe('second');
    expect(() => readFileSync(path.join(d, 'for-marjorie-3.json'), 'utf8')).toThrow();
  });
  it('records the parent the ask answers, only when it is a real issue number', () => {
    const d = mkdtempSync(path.join(dir, 'p-'));
    const log = quiet();
    saveHelp({ side: 'marjorie', ask: 'a', parent: '77', dir: d });
    saveHelp({ side: 'marjorie', ask: 'b', parent: 'not-a-number', dir: d });
    log.mockRestore();
    expect(JSON.parse(readFileSync(path.join(d, 'for-tree-1.json'), 'utf8')).parent).toBe(77);
    expect(JSON.parse(readFileSync(path.join(d, 'for-tree-2.json'), 'utf8')).parent).toBeUndefined();
  });
  it('Marjorie’s side writes for-tree files that file-help reads back', async () => {
    const d = mkdtempSync(path.join(dir, 't-'));
    const log = quiet();
    saveHelp({ side: 'marjorie', ask: 'pause the shop lane', dir: d });
    const { gh, calls } = fakeGh();
    await fileHelp({ side: 'marjorie', dir: d, source: '5', 'source-url': 'u' }, { gh, now: NOW });
    log.mockRestore();
    expect(calls.find((c) => c[1] === 'create')).toContain('desk:tree');
  });
  it('refuses a missing ask or a bad side', () => {
    expect(() => saveHelp({ side: 'tree', ask: '   ' })).toThrow('--ask is required');
    expect(() => saveHelp({ side: 'nobody', ask: 'x' })).toThrow('--side');
  });
});

describe('error asks are not capped like discretionary asks', () => {
  it('save-help --error keeps its own two slots and marks the file', () => {
    const d = mkdtempSync(path.join(dir, 'e-'));
    const log = quiet();
    saveHelp({ side: 'tree', ask: 'one', dir: d });
    saveHelp({ side: 'tree', ask: 'two', dir: d });
    saveHelp({ side: 'tree', ask: 'broken link on the Friday pair', error: true, dir: d });
    saveHelp({ side: 'tree', ask: 'tool failed', error: true, dir: d });
    saveHelp({ side: 'tree', ask: 'one too many errors', error: true, dir: d });
    log.mockRestore();
    expect(JSON.parse(readFileSync(path.join(d, 'for-marjorie-3.json'), 'utf8')).kind).toBe('error');
    expect(JSON.parse(readFileSync(path.join(d, 'for-marjorie-4.json'), 'utf8')).ask).toBe('tool failed');
    expect(() => readFileSync(path.join(d, 'for-marjorie-5.json'), 'utf8')).toThrow();
  });
  it('files an error ask with the marker even when the discretionary cap is spent, and does not count it toward that cap', async () => {
    const d = mkdtempSync(path.join(dir, 'f-'));
    writeFileSync(path.join(d, 'for-marjorie-1.json'), JSON.stringify({ ask: 'nice-to-have extra photos' }));
    writeFileSync(path.join(d, 'for-marjorie-2.json'), JSON.stringify({ ask: 'the photo CDN returns 403', kind: 'error' }));
    const spent = fakeGh({ listing: [rest(51, 'tree', 'one'), rest(52, 'tree', 'two')] });
    const log = quiet();
    await fileHelp({ side: 'tree', dir: d, source: '1', 'source-url': 'u' }, { gh: spent.gh, now: NOW });
    log.mockRestore();
    const creates = spent.calls.filter((c) => c[1] === 'create');
    expect(creates).toHaveLength(1);
    expect(creates[0].join(' ')).toContain('loop-kind: error');
    // an error filed today does not use up the discretionary cap
    const errorOnly = { ...rest(53, 'tree', 'earlier error'), body: `b\n\n<!-- loop-kind: error -->\n${renderMarker(askKey('tree', 1, 'earlier error'), null)}` };
    const afterError = fakeGh({ listing: [errorOnly, rest(51, 'tree', 'one')] });
    const log2 = quiet();
    await fileHelp({ side: 'tree', dir: d, source: '1', 'source-url': 'u' }, { gh: afterError.gh, now: NOW });
    log2.mockRestore();
    expect(afterError.calls.filter((c) => c[1] === 'create')).toHaveLength(2);
  });
});

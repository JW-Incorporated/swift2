import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { HELP_DAILY_CAP, LOOP_LABELS, buildQueue, ensureLoopLabels, helpBudget, parseDisposition, selectPending } from './loop-queue.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { askKey, renderMarker } from './loop-asks.mjs';

const NOW = Date.parse('2026-09-30T12:00:00Z');
const BOT = { login: 'app/github-actions' };
const claude = (body: string, id = 1) => ({ id, user: { login: 'claude[bot]' }, body });

type Ask = ReturnType<typeof treeAsk>;
function treeAsk(n: number, over: Record<string, unknown> = {}, text = `need thing ${n}`) {
  return {
    number: n,
    title: `Tree → Marjorie: ${text}`,
    url: `https://github.com/o/r/issues/${n}`,
    body: `x\n\n${renderMarker(askKey('tree', 4000, text), null)}`,
    author: BOT,
    labels: [{ name: 'tree-filed' }, { name: 'desk:ops' }],
    state: 'OPEN',
    createdAt: `2026-09-${String(10 + (n % 15)).padStart(2, '0')}T12:00:00Z`,
    closedAt: null,
    ...over,
  };
}

describe('parseDisposition', () => {
  it('reads the responder’s own Disposition line, tolerating bold and case', () => {
    expect(parseDisposition([claude('Disposition: ACCEPT-NOW\nWhat: …')], 'marjorie')).toMatchObject({ disposition: 'ACCEPT-NOW' });
    expect(parseDisposition([claude('**Disposition:** schedule — week of Oct 7')], 'marjorie')?.disposition).toBe('SCHEDULE');
    expect(parseDisposition([claude("Disposition: CAN'T")], 'tree')?.disposition).toBe('CANT');
    expect(parseDisposition([claude('Disposition: NEEDS HELP')], 'tree')?.disposition).toBe('NEEDS HELP');
  });
  it('ignores the other bot’s vocabulary, free text, and anyone but claude', () => {
    expect(parseDisposition([claude('Disposition: DOING IT')], 'marjorie')).toBeNull();
    expect(parseDisposition([claude('I will accept this now')], 'marjorie')).toBeNull();
    expect(parseDisposition([{ id: 2, user: { login: 'someone' }, body: 'Disposition: DECLINE' }], 'marjorie')).toBeNull();
    expect(parseDisposition([{ id: 3, user: { login: 'github-actions[bot]' }, body: 'Disposition: DECLINE' }], 'marjorie')).toBeNull();
    expect(parseDisposition(undefined, 'tree')).toBeNull();
  });
});

describe('selectPending', () => {
  const issues = [treeAsk(14), treeAsk(11), treeAsk(12), treeAsk(13, { state: 'CLOSED', closedAt: '2026-09-20T00:00:00Z' })];

  it('lists open unanswered asks oldest first, skipping answered and closed ones', () => {
    const answered = { 12: [claude('Disposition: DECLINE')] };
    const items = selectPending('marjorie', issues, answered, { now: NOW });
    expect(items.map((i: { number: number }) => i.number)).toEqual([11, 14]);
  });
  it('puts the dispatched issue first, then drains the backlog oldest first, within the limit', () => {
    const items = selectPending('marjorie', issues, {}, { primary: 14, limit: 2, now: NOW });
    expect(items.map((i: { number: number }) => i.number)).toEqual([14, 11]);
    expect(items[0].primary).toBe(true);
    expect(items[1].primary).toBe(false);
  });
  it('an already answered primary is dropped, so a re-dispatch is a no-op for it', () => {
    const items = selectPending('marjorie', issues, { 14: [claude('Disposition: SCHEDULE')] }, { primary: 14, limit: 1, now: NOW });
    expect(items.map((i: { number: number }) => i.number)).toEqual([11]);
  });
  it('flags a contradicting ask as held and trims long bodies', () => {
    const held = treeAsk(20, { body: `${'y'.repeat(5000)}\n\n${renderMarker('tree-1-deadbeef', 4290)}` });
    const [item] = selectPending('marjorie', [held], {}, { now: NOW });
    expect(item.held).toBe(true);
    expect(item.body.length).toBeLessThanOrEqual(1200);
  });
  it('never lists an issue that is not a real loop filing (wrong author or no marker)', () => {
    const human = treeAsk(30, { author: { login: 'someone' } });
    const noMarker = treeAsk(31, { body: 'plain' });
    expect(selectPending('marjorie', [human, noMarker], {}, { now: NOW })).toEqual([]);
  });
});

function fakeGh(open: Ask[], comments: Record<number, unknown[]> = {}) {
  const calls: string[][] = [];
  const gh = vi.fn(async (args: string[]) => {
    calls.push(args);
    if (args[0] === 'api') {
      const m = /issues\/(\d+)\/comments/.exec(args[1]);
      if (m) return { stdout: JSON.stringify(comments[Number(m[1])] || []) };
      return { stdout: JSON.stringify(open.map((i) => ({ ...i, html_url: i.url, user: i.author, created_at: i.createdAt, closed_at: i.closedAt, state: String(i.state).toLowerCase() }))) };
    }
    return { stdout: '' };
  });
  return { gh, calls };
}

describe('buildQueue', () => {
  it('reads each candidate’s comments and returns the unanswered ones', async () => {
    const { gh } = fakeGh([treeAsk(11), treeAsk(12)], { 12: [claude('Disposition: DECLINE')] });
    const q = await buildQueue('marjorie', { repo: 'o/r', gh, now: NOW });
    expect(q.items.map((i: { number: number }) => i.number)).toEqual([11]);
    expect(q.bot).toBe('marjorie');
  });
});

describe('ensureLoopLabels', () => {
  it('creates every loop label idempotently and survives a failure on one', async () => {
    const calls: string[][] = [];
    const gh = vi.fn(async (args: string[]) => { calls.push(args); if (args[2] === 'loop:declined') throw new Error('HTTP 403'); return { stdout: '' }; });
    const log = vi.fn();
    await ensureLoopLabels({ repo: 'o/r', gh, log });
    expect(calls).toHaveLength(LOOP_LABELS.length);
    expect(calls.every((c) => c.includes('--force'))).toBe(true);
    expect(log.mock.calls.flat().join('\n')).toContain('loop:declined');
  });
});

describe('helpBudget', () => {
  const today = '2026-09-30T08:00:00Z';
  it('allows the daily cap minus what was filed today, counting Monday-plan filings too', async () => {
    const { gh } = fakeGh([treeAsk(41, { createdAt: today }), treeAsk(40, { createdAt: '2026-09-29T08:00:00Z' })]);
    const b = await helpBudget('tree', [{ ask: 'brand new need', why: '', contradicts: null }], { repo: 'o/r', gh, now: NOW });
    expect(b.filedToday).toBe(1);
    expect(b.remaining).toBe(HELP_DAILY_CAP.tree - 1);
    expect(b.fresh).toHaveLength(1);
  });
  it('exhausts at the cap, and reports an ask already open under the same text instead of refiling it', async () => {
    const { gh } = fakeGh([treeAsk(41, { createdAt: today }, 'same words'), treeAsk(42, { createdAt: today }, 'other words')]);
    const b = await helpBudget('tree', [{ ask: 'Same   Words', why: '', contradicts: null }], { repo: 'o/r', gh, now: NOW });
    expect(b.remaining).toBe(0);
    expect(b.fresh).toEqual([]);
    expect(b.duplicates).toEqual([expect.objectContaining({ number: 41 })]);
  });
});

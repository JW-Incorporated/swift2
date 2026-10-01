import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { PING_DEBOUNCE_MS, decidePing, describeChange, pingMarker, pingText, readPingState, snapshotOf } from './status-ping.mjs';

const URL = 'https://github.com/o/r/issues/4';
const T0 = Date.parse('2026-10-01T12:00:00Z');
const MIN = 60_000;
const base = () => snapshotOf({ waiting: [88, 87], closing: [], shipped: [1, 2], posts: ['https://x.com/p/1'], feedback: [5], plan: 'plan A', strategy: 'strat A', note: 'note A', recap: 'recap A' });
const stored = (snap = base(), at = T0) => ({ h: snap.h, at: new Date(at).toISOString(), s: snap });

describe('snapshotOf', () => {
  it('is stable for the same content and ignores order and duplicates', () => {
    expect(snapshotOf({ waiting: [2, 1, 1], shipped: [3, 4] }).h).toBe(snapshotOf({ waiting: [1, 2], shipped: [4, 3] }).h);
  });
  it('changes when any meaningful part changes', () => {
    const h = base().h;
    for (const change of [{ waiting: [88] }, { closing: [87] }, { shipped: [1, 2, 3] }, { posts: [] }, { feedback: [] }, { plan: 'plan B' }, { strategy: 'strat B' }, { note: 'note B' }, { recap: 'recap B' }]) {
      expect(snapshotOf({ ...{ waiting: [88, 87], shipped: [1, 2], posts: ['https://x.com/p/1'], feedback: [5], plan: 'plan A', strategy: 'strat A', note: 'note A', recap: 'recap A' }, ...change }).h, JSON.stringify(change)).not.toBe(h);
    }
  });
});

describe('the stored baseline', () => {
  it('round-trips through the page body and ignores garbage', () => {
    const state = stored();
    expect(readPingState(`# page\n${pingMarker(state)}\nmore`)).toEqual(state);
    expect(readPingState('no marker')).toBeNull();
    expect(readPingState('<!-- status-ping {nope} -->')).toBeNull();
    expect(readPingState('<!-- status-ping {"h":"x","at":"never","s":{}} -->')).toBeNull();
  });
  it('never lets stored text close the comment early', () => {
    expect(pingMarker({ h: 'a', at: T0, s: { t: '--> <b>' } }).match(/-->/g)).toHaveLength(1);
  });
});

describe('describeChange', () => {
  it('summarises as short chips: needs you, closed, shipped, posts, feedback, strategy, plan, recap, note', () => {
    const prev = base();
    const cur = snapshotOf({ waiting: [88, 90], shipped: [1, 2, 3, 4, 5], posts: ['https://x.com/p/1', 'a', 'b'], feedback: [5, 6], plan: 'plan B', strategy: 'strat B', note: 'note B', recap: 'recap B' });
    const { chips, added } = describeChange(prev, cur);
    expect(added).toBe(1);
    expect(chips).toEqual(['+1 needs you', '1 closed', '3 shipped', '2 posts live', '1 feedback', 'strategy updated', 'plan updated', 'fan recap updated', 'note updated']);
  });
  it('says "1 post live" in the singular', () => {
    expect(describeChange(snapshotOf({}), snapshotOf({ posts: ['a'] })).chips).toEqual(['1 post live']);
  });
});

describe('pingText', () => {
  it('is one compact line ending in the link', () => {
    expect(pingText(['+1 needs you', '2 closed', '3 shipped', '1 post live', 'strategy updated'], URL))
      .toBe(`📋 Status updated — +1 needs you · 2 closed · 3 shipped · 1 post live · strategy updated — ${URL}`);
    expect(pingText([], URL)).toBe(`📋 Status updated — ${URL}`);
  });
});

describe('decidePing', () => {
  const run = (over: Record<string, unknown>) => decidePing({ prev: stored(), cur: base(), now: T0 + 3 * 60 * MIN, url: URL, notify: true, ...over });

  it('stays quiet and keeps the baseline when nothing changed', () => {
    const out = run({});
    expect(out).toMatchObject({ send: false, reason: 'unchanged' });
    expect(out.state).toEqual(stored());
  });
  it('pings once on a material change and moves the baseline to now', () => {
    const cur = snapshotOf({ waiting: [88, 87], shipped: [1, 2, 3], posts: ['https://x.com/p/1'], feedback: [5], plan: 'plan A', strategy: 'strat A', note: 'note A', recap: 'recap A' });
    const out = run({ cur });
    expect(out).toMatchObject({ send: true, text: `📋 Status updated — 1 shipped — ${URL}` });
    expect(out.state).toEqual({ h: cur.h, at: new Date(T0 + 180 * MIN).toISOString(), s: cur });
  });
  it('holds a change for up to an hour (baseline untouched, so it piles into the next ping)', () => {
    const cur = snapshotOf({ ...{ waiting: [88, 87], shipped: [1, 2, 3] } });
    const held = run({ cur, now: T0 + 59 * MIN });
    expect(held).toMatchObject({ send: false, reason: 'debounced' });
    expect(held.state).toEqual(stored());
    expect(run({ cur, now: T0 + PING_DEBOUNCE_MS }).send).toBe(true);
  });
  it('pings through the debounce when a Needs-you item was added', () => {
    const cur = snapshotOf({ waiting: [88, 87, 92], shipped: [1, 2], posts: ['https://x.com/p/1'], feedback: [5], plan: 'plan A', strategy: 'strat A', note: 'note A', recap: 'recap A' });
    expect(run({ cur, now: T0 + 5 * MIN })).toMatchObject({ send: true, text: `📋 Status updated — +1 needs you — ${URL}` });
  });
  it('only records a baseline the first time, with no ping', () => {
    const out = run({ prev: null });
    expect(out).toMatchObject({ send: false, reason: 'baseline' });
    expect(out.state.h).toBe(base().h);
  });
  it('never touches the baseline when notify is off', () => {
    const prev = stored();
    expect(run({ notify: false, cur: snapshotOf({ waiting: [1] }), prev })).toEqual({ send: false, state: prev });
    expect(run({ notify: false, prev: null }).state).toBeNull();
  });
});

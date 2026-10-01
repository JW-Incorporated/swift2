// "Tell the owner the page changed" — one short Discord line, and only when the
// page materially changed (owner, 2026-10-01: "simply saying it's been updated,
// and giving me the link", compact, never a long thing).
//
// The page keeps a hidden baseline: `<!-- status-ping {"h","at","s"} -->` holds
// the snapshot of what the owner was last told about (`s`), its hash (`h`) and
// when (`at`). Each render in notify mode snapshots the meaningful sections
// (never the timestamp, growth numbers or the in-flight PR list, which churn
// all day), compares it with the baseline and decides:
//   same hash                      -> no ping
//   changed, pinged < 60 min ago   -> hold: the baseline stays, so the changes
//                                     pile up into the next ping — unless a
//                                     Needs-you item was ADDED (always worth it)
//   changed, otherwise             -> one ping, baseline moves to now
// A first-ever render only records the baseline (nothing to compare with).
import { createHash } from 'node:crypto';

export const PING_DEBOUNCE_MS = 60 * 60 * 1000;
const MARKER = /<!-- status-ping (\{[^\n]*?\}) -->/;
const LIST_CAP = 150;

const short = (text) => createHash('sha1').update(String(text ?? '')).digest('hex').slice(0, 8);
const ints = (list) => [...new Set((list || []).map(Number).filter((n) => Number.isInteger(n) && n > 0))].sort((a, b) => a - b).slice(0, LIST_CAP);
const hashes = (list) => [...new Set((list || []).map(short))].sort().slice(0, LIST_CAP);

/** What the owner would care to be told about; every field is small and stable. */
export function snapshotOf({ waiting = [], closing = [], shipped = [], posts = [], feedback = [], plan = '', strategy = '', note = '', recap = '' } = {}) {
  const snap = {
    n: ints(waiting), c: ints(closing), p: ints(shipped), o: hashes(posts), f: ints(feedback),
    l: plan ? short(plan) : '', s: strategy ? short(strategy) : '', t: note ? short(note) : '', r: recap ? short(recap) : '',
  };
  return { ...snap, h: short(JSON.stringify(snap)) };
}

/** The baseline stored on the page, or null when absent or unreadable. */
export function readPingState(body) {
  const m = MARKER.exec(String(body || ''));
  if (!m) return null;
  try {
    const state = JSON.parse(m[1]);
    if (!state || typeof state.h !== 'string' || !Number.isFinite(Date.parse(state.at)) || !state.s || typeof state.s !== 'object') return null;
    return state;
  } catch {
    return null;
  }
}

export function pingMarker(state) {
  return `<!-- status-ping ${JSON.stringify(state).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')} -->`;
}

const minus = (a = [], b = []) => a.filter((x) => !b.includes(x));

/** The compact "what changed" chips between two snapshots, plus how many Needs-you items were added. */
export function describeChange(prev, cur) {
  const added = minus(cur.n, prev.n).length;
  const chips = [];
  if (added) chips.push(`+${added} needs you`);
  if (minus(prev.n, cur.n).length) chips.push(`${minus(prev.n, cur.n).length} closed`);
  if (minus(cur.p, prev.p).length) chips.push(`${minus(cur.p, prev.p).length} shipped`);
  if (minus(cur.o, prev.o).length) chips.push(`${minus(cur.o, prev.o).length} ${minus(cur.o, prev.o).length === 1 ? 'post' : 'posts'} live`);
  if (minus(cur.f, prev.f).length) chips.push(`${minus(cur.f, prev.f).length} feedback`);
  if (cur.s !== prev.s) chips.push('strategy updated');
  if (cur.l !== prev.l) chips.push('plan updated');
  if (cur.r !== prev.r) chips.push('fan recap updated');
  if (cur.t !== prev.t) chips.push('note updated');
  return { chips, added };
}

export const pingText = (chips, url) => `📋 Status updated — ${chips.length ? `${chips.join(' · ')} — ` : ''}${url}`;

/**
 * `prev` is the stored baseline (or null); returns `{ send, text, state }` where
 * `state` is the baseline to write back (unchanged unless a ping is due or this
 * is the first render). `notify` false = a render that must never move the baseline.
 */
export function decidePing({ prev, cur, now, url, notify }) {
  if (!notify) return { send: false, state: prev };
  const stamp = (at) => ({ h: cur.h, at: new Date(at).toISOString(), s: cur });
  if (!prev) return { send: false, state: stamp(now), reason: 'baseline' };
  if (prev.h === cur.h) return { send: false, state: prev, reason: 'unchanged' };
  const { chips, added } = describeChange(prev.s, cur);
  if (!added && now - Date.parse(prev.at) < PING_DEBOUNCE_MS) return { send: false, state: prev, reason: 'debounced' };
  return { send: true, text: pingText(chips, url), state: stamp(now), reason: 'changed' };
}

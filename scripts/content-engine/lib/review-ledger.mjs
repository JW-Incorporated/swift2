// The agent-review ledger — what the LLM half of the engine has actually looked at.
//
// WHY THIS EXISTS. The agent review layer (the half that catches fabricated
// events, fabricated quotes, source/subject mismatch, and wrong-subject images)
// was a manual ritual: a human read RUNBOOK.md and dispatched subagents by hand.
// It last ran on 2026-07-10. `prep-batches` kept producing batches every night
// and nothing consumed them. The engine's own highest-value checks were dark for
// a month and nothing said so.
//
// The blocker to automating it was STATE. A cloud runner starts from a clean
// checkout every night, so `.findings/` (gitignored) is empty: there is no way
// for last night's run to tell tonight's run what it already reviewed. So the
// ledger is COMMITTED — a plain JSON file under docs/audits/engine/ that the
// runner updates and includes in its PR. It is the only durable memory the
// review layer has, and it is what makes "review a rotating slice each night,
// changed content first" possible without a human tracking it.
//
// Keyed by ITEM, not by batch: batch names (`factual-007-1989`) are derived from
// era ordering and renumber whenever the corpus grows, so a batch-keyed ledger
// would silently lose its history on the next content merge. An item key and an
// image URL are stable.
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { ROOT } from './corpus.mjs';
import { CONFIG } from '../config.mjs';

export const LEDGER_REL = join(CONFIG.output.reportsDir, 'agent-review-ledger.json');
export const LEDGER_PATH = join(ROOT, LEDGER_REL);
export const LEDGER_VERSION = 1;

/** Short stable content hash. Only equality matters, so 12 hex chars is plenty. */
export function contentHash(value) {
  return createHash('sha1').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex').slice(0, 12);
}

export function emptyLedger() {
  return { version: LEDGER_VERSION, updated: null, factual: {}, images: {}, safety: {} };
}

export async function loadLedger(path = LEDGER_PATH) {
  if (!existsSync(path)) return emptyLedger();
  try {
    const raw = JSON.parse(await readFile(path, 'utf8'));
    if (raw?.version !== LEDGER_VERSION) return emptyLedger();
    return { ...emptyLedger(), ...raw };
  } catch {
    // A corrupt ledger must not silently mean "nothing was ever reviewed" in a
    // way that hides itself — the caller logs this, and the worst case is one
    // wasted re-review cycle rather than a wrong coverage claim.
    return emptyLedger();
  }
}

/**
 * Write the ledger with one entry per line. Deliberately hand-rolled rather than
 * `JSON.stringify(x, null, 2)`: ~2,200 entries × 4 lines each is a 9,000-line
 * file whose daily diff is unreadable. One line per key keeps the diff to the
 * handful of items that were actually reviewed that night.
 */
export async function saveLedger(ledger, path = LEDGER_PATH) {
  const section = (name, obj) => {
    const keys = Object.keys(obj).sort();
    const rows = keys.map((k) => `    ${JSON.stringify(k)}: ${JSON.stringify(obj[k])}`);
    return `  ${JSON.stringify(name)}: {\n${rows.join(',\n')}\n  }`;
  };
  const body = [
    '{',
    `  "version": ${ledger.version},`,
    `  "updated": ${JSON.stringify(ledger.updated)},`,
    [section('factual', ledger.factual), section('images', ledger.images), section('safety', ledger.safety)].join(',\n'),
    '}',
    '',
  ].join('\n');
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, body, 'utf8');
  return path;
}

/**
 * Choose what this run reviews.
 *
 * @param {Array<{id:string, hash:string, weight?:number}>} entries every reviewable thing that exists now
 * @param {Record<string,{h:string,d:string}>} seen the ledger section for this kind
 * @param {number} limit how many to take
 * @returns {{picked: Array<{id:string,hash:string,why:string}>, counts: Record<string,number>}}
 *
 * Priority — this ordering IS the design:
 *  1. `changed` — the content was edited since it was reviewed. Highest risk:
 *     the page currently LOOKS reviewed while carrying claims nobody checked.
 *  2. `new` — never reviewed. Equally unverified, but at least nothing is
 *     claiming otherwise.
 *  3. `rotation` — oldest review first, so the whole corpus cycles instead of
 *     the engine re-reading the same era forever.
 * Ties inside each tier break on `weight` (visibility) descending, so the most
 * public content is always at the front of the queue.
 */
export function selectSlice(entries, seen = {}, limit = 0) {
  const tiers = { changed: [], new: [], rotation: [] };
  for (const e of entries) {
    const prev = seen[e.id];
    if (!prev) tiers.new.push({ ...e, why: 'new', d: '' });
    else if (prev.h !== e.hash) tiers.changed.push({ ...e, why: 'changed', d: prev.d ?? '' });
    else tiers.rotation.push({ ...e, why: 'rotation', d: prev.d ?? '' });
  }
  const byWeight = (a, b) => (b.weight ?? 0) - (a.weight ?? 0) || a.id.localeCompare(b.id);
  tiers.changed.sort(byWeight);
  tiers.new.sort(byWeight);
  // Rotation is oldest-reviewed first; visibility only breaks a same-day tie.
  tiers.rotation.sort((a, b) => String(a.d).localeCompare(String(b.d)) || byWeight(a, b));

  const picked = [...tiers.changed, ...tiers.new, ...tiers.rotation].slice(0, Math.max(0, limit));
  const counts = { changed: 0, new: 0, rotation: 0 };
  for (const p of picked) counts[p.why]++;
  return {
    picked: picked.map(({ id, hash, why }) => ({ id, hash, why })),
    counts,
    available: { changed: tiers.changed.length, new: tiers.new.length, rotation: tiers.rotation.length },
  };
}

/** Coverage numbers for the run report and the runner's summary comment. */
export function coverage(entries, seen = {}, today = new Date().toISOString().slice(0, 10)) {
  let reviewed = 0;
  let stale = 0;
  let oldestDays = 0;
  const t = Date.parse(`${today}T00:00:00Z`);
  for (const e of entries) {
    const prev = seen[e.id];
    if (!prev) continue;
    reviewed++;
    if (prev.h !== e.hash) stale++;
    const days = Math.round((t - Date.parse(`${prev.d}T00:00:00Z`)) / 86_400_000);
    if (Number.isFinite(days) && days > oldestDays) oldestDays = days;
  }
  return {
    total: entries.length,
    reviewed,
    never: entries.length - reviewed,
    stale, // reviewed once, but the content has changed since
    oldestReviewDays: oldestDays,
    pct: entries.length ? Math.round((reviewed / entries.length) * 100) : 100,
  };
}

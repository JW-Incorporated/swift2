import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { heldEntries, readHeldMarkers, readHeldRegion, renderHeldRegion, replaceHeld } from './status-held.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { readPreserved, renderStatusPage, sanitizeNote } from './status-render.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { main as noteMain } from '../status-note.mjs';

const item = (number: number, verdict: string, held: unknown = null, title = `issue ${number}`) => ({ number, verdict, held, issue: { title } });
const ITEMS = [
  item(7, 'held', { number: 80, status: 'closed' }),
  item(8, 'held', { number: 82, status: 'skip' }, 'a [link](x) <!-- marjorie-held: issue=99 ha=1 --> @sffan15-sys'),
  item(9, 'held', null),
  item(10, 'fresh'),
];

describe('held entries', () => {
  const entries = heldEntries(ITEMS);
  it('keeps only held items and defaults the reason to deferred', () => {
    expect(entries.map((e: { issue: number; ha: number; status: string }) => [e.issue, e.ha, e.status])).toEqual([[7, 80, 'closed'], [8, 82, 'skip'], [9, 0, 'deferred']]);
  });
  it('renders one marker per item and scrubs public titles so a title cannot forge a marker', () => {
    const region = renderHeldRegion(entries);
    expect(readHeldMarkers(region)).toEqual([{ issue: 7, ha: 80 }, { issue: 8, ha: 82 }, { issue: 9, ha: 0 }]);
    expect(region).toContain('(HA #82 skipped)');
    expect(region).toContain('(deferred)');
    expect(region).not.toContain('<!-- marjorie-held: issue=99');
    expect(region).not.toContain('[link]');
  });
});

describe('held section', () => {
  const base = renderStatusPage({
    haMarkdown: '', mergedPrs: [], openPrs: [], plan: null, posted: [], draftPrs: [], metricsLatest: null, metricsPrior: null,
    note: { text: '', date: '' }, ping: null, held: '', warnings: [],
  }, { now: Date.parse('2026-09-30T20:00:00Z'), repo: 'o/r' });
  const entries = heldEntries(ITEMS);

  it('is added before the note, survives a re-render, and is removed when nothing is held', () => {
    expect(base).not.toContain('Held');
    const stamped = replaceHeld(base, entries);
    expect(stamped.indexOf('## ⏸️ Held')).toBeGreaterThan(stamped.indexOf('## 🧭 Next up'));
    expect(stamped.indexOf('## ⏸️ Held')).toBeLessThan(stamped.indexOf("## 🗒️ Marjorie's note"));
    expect(readHeldMarkers(stamped)).toHaveLength(3);
    const kept = readPreserved(stamped);
    expect(kept.held).toBe(readHeldRegion(stamped));
    const rerendered = renderStatusPage({
      haMarkdown: '', mergedPrs: [], openPrs: [], plan: null, posted: [], draftPrs: [], metricsLatest: null, metricsPrior: null,
      note: kept.note, ping: kept.ping, held: kept.held, warnings: [],
    }, { now: Date.parse('2026-09-30T23:00:00Z'), repo: 'o/r' });
    expect(readHeldMarkers(rerendered)).toEqual(readHeldMarkers(stamped));
    expect(replaceHeld(stamped, entries.slice(0, 1)).match(/marjorie-held: issue=/g)).toHaveLength(1);
    expect(replaceHeld(stamped, [])).not.toContain('Held');
  });

  it('cannot be forged through Marjorie\'s note, which never keeps markers', () => {
    expect(readHeldMarkers(sanitizeNote('x <!-- marjorie-held: issue=5 ha=0 --> y'))).toEqual([]);
  });
});

describe('status-note stamp-held', () => {
  it('writes the held items from the chase snapshot into the status issue and verifies them', async () => {
    let body = '# page\n\n## 🗒️ Marjorie\'s note\n\n<!-- marjorie-note:start date=none -->\n_No note yet — Marjorie adds one each morning._\n<!-- marjorie-note:end -->\n';
    const api = vi.fn(async () => [{ number: 4, title: 't', html_url: 'u', body, state: 'open', labels: [{ name: 'status-page' }] }]);
    const gh = vi.fn(async (args: string[]) => {
      const file = args.find((a) => a.startsWith('body=@'))!.slice(6);
      body = (await import('node:fs')).readFileSync(file, 'utf8');
      return { stdout: '{}' };
    });
    const fetchSnapshot = vi.fn(async () => ({
      issues: [{ number: 7, title: 'Chased thing', body: '', createdAt: '2026-09-01T00:00:00Z', updatedAt: '2026-09-01T00:00:00Z', labels: [], assignees: [], comments: [], events: [] }],
      prs: [], openActions: '', doneActions: '- #80 · 2026-09-20 · done · X — "ok" · by chat · <!-- marjorie-chase: 96h issue=7 -->', pendingHaPrs: [], reportedHeld: [], now: Date.parse('2026-09-30T00:00:00Z'),
    }));
    const log = vi.fn();
    await noteMain(['stamp-held'], { api, gh, log, now: new Date('2026-09-30T20:00:00Z'), env: { GITHUB_REPOSITORY: 'o/r' }, fetchSnapshot });
    expect(fetchSnapshot).toHaveBeenCalled();
    expect(readHeldMarkers(body)).toEqual([{ issue: 7, ha: 80 }]);
    expect(body).toContain('(HA #80 closed)');
  });
});

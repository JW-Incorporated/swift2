import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { closeHumanAction, laToday, main, parseArgs } from './ha-close.mjs';

const OPEN = [
  '# Human actions — Swift2',
  '',
  '<!-- ha-format: 2 -->',
  '',
  '> **4 open.** Closed items are in `HUMAN-ACTIONS-DONE.md` — you never need it.',
  '',
  '## #69 🔴 [BLOCKING] Grant the Discord bot permissions (~5 min)',
  '<!-- ha filed=2026-09-12 -->',
  '',
  '**Why:** reasons',
  '**Steps:**',
  '1. click',
  '**Worked if:** it works',
  '',
  '## #67 🟢 [UPGRADE] Add the webhook to social (~5 min)',
  '<!-- ha filed=2026-09-12 -->',
  '',
  '**Why:** more reasons',
  '',
  '---',
  '',
  '## #54 🔴 [BLOCKING] Turn on Code Scanning (~5 min)',
  '<!-- ha filed=2026-09-11 -->',
  '',
  '---',
  '',
  '## #49 🔴 [BLOCKING] Add the ack secret (~5 min)',
  '<!-- ha filed=2026-09-11 -->',
  '',
].join('\n');

const DONE = [
  '# Human actions — Swift2 — CLOSED',
  '',
  '<!-- ha-format: 2. Machine record. -->',
  '',
  '- #68 · 2026-09-13 · done · Older item — "x" · by agent',
  '',
].join('\n');

describe('closeHumanAction', () => {
  it('removes only the named block and prepends the ledger line newest-first', () => {
    const r = closeHumanAction(OPEN, DONE, { number: 67, date: '2026-09-13', note: 'Joey said "done" in #longlive-marjorie' });
    expect(r.ok).toBe(true);
    expect(r.title).toBe('Add the webhook to social');
    expect(r.open).not.toContain('#67');
    expect(r.open).toContain('## #69');
    expect(r.open).toContain('## #54');
    expect(r.done.split('\n')[4]).toBe(`- #67 · 2026-09-13 · done · Add the webhook to social — "Joey said 'done' in #longlive-marjorie" · by chat`);
    expect(r.done).toContain('- #68 ·');
  });

  it('leaves no back-to-back separators when a fenced item goes', () => {
    const r = closeHumanAction(OPEN, DONE, { number: 54, date: '2026-09-13', note: 'done' });
    expect(r.ok).toBe(true);
    expect(r.open).not.toMatch(/---\s*\n\s*---/);
    expect(r.open).toContain('## #49');
  });

  it('recounts the header\x27s open total from the remaining items (#4279)', () => {
    const r = closeHumanAction(OPEN, DONE, { number: 69, date: '2026-09-13', note: 'done' });
    expect(r.open).toContain('> **3 open.** Closed items');
    expect(r.open).not.toContain('**4 open.**');
  });

  it('keeps CRLF files CRLF', () => {
    const r = closeHumanAction(OPEN.replace(/\n/g, '\r\n'), DONE.replace(/\n/g, '\r\n'), { number: 69, date: '2026-09-13', note: 'done' });
    expect(r.open.includes('\r\n')).toBe(true);
    expect(r.open.replace(/\r\n/g, '').includes('\n')).toBe(false);
    expect(r.done.replace(/\r\n/g, '').includes('\n')).toBe(false);
  });

  it('refuses an item that is not open, a bad date, or an empty note', () => {
    expect(closeHumanAction(OPEN, DONE, { number: 68, date: '2026-09-13', note: 'x' })).toMatchObject({ ok: false });
    expect(closeHumanAction(OPEN, DONE, { number: 67, date: '09/13', note: 'x' })).toMatchObject({ ok: false });
    expect(closeHumanAction(OPEN, DONE, { number: 67, date: '2026-09-13', note: '  ' })).toMatchObject({ ok: false });
  });

  it('records a skip with its reason', () => {
    const r = closeHumanAction(OPEN, DONE, { number: 49, date: '2026-09-13', note: 'not needed', outcome: 'skip' });
    expect(r.entry).toContain('· skip ·');
  });
});

describe('CLI', () => {
  it('parses flags and writes both files', () => {
    expect(parseArgs(['#67', '--note', 'n', '--by', 'chat'])).toMatchObject({ number: 67, note: 'n', by: 'chat', outcome: 'done' });
    const root = mkdtempSync(join(tmpdir(), 'ha-close-'));
    writeFileSync(join(root, 'HUMAN-ACTIONS.md'), OPEN);
    writeFileSync(join(root, 'HUMAN-ACTIONS-DONE.md'), DONE);
    expect(main(['67', '--note', 'owner said done'], { root, now: new Date('2026-09-13T20:00:00Z') })).toBe(0);
    expect(readFileSync(join(root, 'HUMAN-ACTIONS.md'), 'utf8')).not.toContain('#67');
    expect(readFileSync(join(root, 'HUMAN-ACTIONS-DONE.md'), 'utf8')).toContain('- #67 · 2026-09-13 · done');
    expect(main(['67', '--note', 'again'], { root })).toBe(1);
  });

  it('dates in America/Los_Angeles', () => {
    expect(laToday(new Date('2026-09-14T03:00:00Z'))).toBe('2026-09-13');
  });
});

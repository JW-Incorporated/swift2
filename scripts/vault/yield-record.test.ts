import { describe, expect, it } from 'vitest';
import {
  appendYieldRecord,
  formatCounts,
  normalizeRecord,
  parseArgs,
  parseYieldRecords,
} from './yield-record.mjs';

const shift = { lane: 'content-shift', status: 'done', added: 2, edited: 1, skipped: 0, failed: 0 };
const rumor = { lane: 'rumor-desk', status: 'partial', added: 0, edited: 1, skipped: 2, failed: 1, reasons: ['source 404'] };

describe('normalizeRecord', () => {
  it('fills defaults for counts and reasons', () => {
    expect(normalizeRecord({ lane: 'stylist', status: 'no_op' })).toEqual({
      lane: 'stylist', status: 'no_op', added: 0, edited: 0, skipped: 0, failed: 0, reasons: [],
    });
  });
  it('rejects unknown lane, status, bad counts and failed without reason', () => {
    expect(() => normalizeRecord({ lane: 'nope', status: 'done' })).toThrow(/lane/);
    expect(() => normalizeRecord({ lane: 'stylist', status: 'weird' })).toThrow(/status/);
    expect(() => normalizeRecord({ lane: 'stylist', status: 'done', added: -1 })).toThrow(/added/);
    expect(() => normalizeRecord({ lane: 'stylist', status: 'done', edited: 1.5 })).toThrow(/edited/);
    expect(() => normalizeRecord({ lane: 'stylist', status: 'failed', failed: 1 })).toThrow(/reason/);
  });
});

describe('appendYieldRecord / parseYieldRecords', () => {
  it('appends a fenced block to an existing body and parses it back', () => {
    const body = appendYieldRecord('TL;DR\n\nTier-2: Vault Run', shift);
    expect(body).toContain('```json vault-yield');
    expect(body.startsWith('TL;DR\n\nTier-2: Vault Run\n\n```json')).toBe(true);
    const { records, malformed } = parseYieldRecords(body);
    expect(malformed).toEqual([]);
    expect(records).toEqual([normalizeRecord(shift)]);
  });

  it('works on an empty or null body', () => {
    expect(parseYieldRecords(appendYieldRecord('', shift)).records).toHaveLength(1);
    expect(parseYieldRecords(appendYieldRecord(null, shift)).records).toHaveLength(1);
  });

  it('is idempotent per lane and replaces in place', () => {
    const once = appendYieldRecord('intro', shift);
    expect(appendYieldRecord(once, shift)).toBe(once);
    const withRumor = appendYieldRecord(once, rumor);
    const updated = appendYieldRecord(withRumor, { ...shift, added: 3 });
    const { records } = parseYieldRecords(updated);
    expect(records.map((r) => r.lane)).toEqual(['content-shift', 'rumor-desk']);
    expect(records[0].added).toBe(3);
    expect(updated.match(/vault-yield/g)).toHaveLength(2);
    expect(updated.startsWith('intro')).toBe(true);
  });

  it('leaves non-fenced prose and other json fences alone', () => {
    const body = 'before\n\n```json\n{"lane":"content-shift"}\n```\n\nafter';
    const next = appendYieldRecord(body, shift);
    expect(next.startsWith(body)).toBe(true);
    expect(parseYieldRecords(next).records).toHaveLength(1);
  });

  it('reports a malformed block without throwing and does not replace it', () => {
    const bad = 'x\n\n```json vault-yield\n{not json}\n```\n';
    const parsed = parseYieldRecords(bad);
    expect(parsed.records).toEqual([]);
    expect(parsed.malformed).toHaveLength(1);
    const next = appendYieldRecord(bad, shift);
    expect(next).toContain('{not json}');
    expect(parseYieldRecords(next)).toMatchObject({ records: [{ lane: 'content-shift' }], malformed: [{ index: 0 }] });
  });

  it('reports a well-formed JSON block that fails validation as malformed', () => {
    const bad = '```json vault-yield\n{"lane":"nope","status":"done"}\n```';
    expect(parseYieldRecords(bad).malformed[0].error).toMatch(/lane/);
  });

  it('last valid block for a lane wins on parse', () => {
    const a = '```json vault-yield\n' + JSON.stringify({ ...shift, added: 1 }) + '\n```';
    const b = '```json vault-yield\n' + JSON.stringify({ ...shift, added: 5 }) + '\n```';
    expect(parseYieldRecords(`${a}\n\n${b}`).records[0].added).toBe(5);
  });

  it('handles CRLF bodies', () => {
    const body = appendYieldRecord('hi', shift).replace(/\n/g, '\r\n');
    expect(parseYieldRecords(body).records).toHaveLength(1);
  });
});

describe('formatCounts', () => {
  it('prints a line per lane, flags a missing lane and malformed blocks', () => {
    const parsed = parseYieldRecords(appendYieldRecord('```json vault-yield\nbad\n```', shift));
    const out = formatCounts(parsed).split('\n');
    expect(out[0]).toBe('content-shift: done added=2 edited=1 skipped=0 failed=0');
    expect(out).toContain('stylist: NO RECORD');
    expect(out.some((l) => l.startsWith('malformed block #0'))).toBe(true);
  });
});

describe('parseArgs', () => {
  it('collects repeated --reason and positional command', () => {
    const a = parseArgs(['append', '--pr', '7', '--lane', 'stylist', '--reason', 'a', '--reason', 'b']);
    expect(a._).toEqual(['append']);
    expect(a.reason).toEqual(['a', 'b']);
    expect(a.pr).toBe('7');
  });
  it('rejects a flag with no value', () => {
    expect(() => parseArgs(['--pr'])).toThrow(/needs a value/);
  });
});

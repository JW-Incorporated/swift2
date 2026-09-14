import { describe, expect, it } from 'vitest';
// @ts-expect-error plain module
import { canReserve, covered, dueRows, parseSchedule, scheduleProblems } from './clock-core.mjs';

const rows = parseSchedule({ rows: [{ workflow: 'poll.yml', cron: '*/5 * * * *', inputs: {} }] });
const at = Date.parse('2026-09-14T18:00:00Z');

describe('clock decisions', () => {
  it('rejects slots before process start and handles a slot once', () => {
    expect(dueRows(rows, new Set(), at + 1, at)).toEqual([]);
    expect(dueRows(rows, new Set(), at, at)).toHaveLength(1);
    expect(dueRows(rows, new Set([`${rows[0].key}@${at}`]), at, at)).toEqual([]);
  });

  it('fails closed on incomplete runs, feature branches and bad server time', () => {
    const run = { head_branch: 'main', event: 'schedule', created_at: new Date(at).toISOString() };
    const response = { ok: true, date: new Date(at).toUTCString(), data: { total_count: 1, workflow_runs: [run] } };
    expect(covered(response, at, 300_000, at)).toBe(true);
    expect(covered({ ...response, data: { total_count: 2, workflow_runs: [run] } }, at, 300_000, at)).toBeNull();
    expect(covered({ ...response, date: new Date(at - 1).toUTCString() }, at, 300_000, at)).toBeNull();
    expect(covered({ ...response, date: new Date(at + 91_000).toUTCString() }, at, 300_000, at)).toBeNull();
    expect(covered({ ...response, data: { total_count: 1, workflow_runs: [{ ...run, head_branch: 'feature/x' }] } }, at, 300_000, at)).toBe(false);
  });

  it('enforces the rolling 40-attempt cap and five-minute row gap', () => {
    expect(canReserve(rows[0], [{ key: rows[0].key, at: at - 299_999 }], at)).toBe(false);
    expect(canReserve(rows[0], Array.from({ length: 40 }, (_, i) => ({ key: `x${i}`, at: at - i * 1_000 })), at)).toBe(false);
    expect(canReserve(rows[0], [{ key: rows[0].key, at: at - 300_000 }], at)).toBe(true);
  });

  it('validates the full circular minute cycle analytically', () => {
    expect(scheduleProblems(rows)).toEqual([]);
    const tooFast = parseSchedule({ rows: [{ workflow: 'bad.yml', cron: '*/4 * * * *', inputs: {} }] });
    expect(scheduleProblems(tooFast)).not.toEqual([]);
    const tooMany = parseSchedule({ rows: Array.from({ length: 41 }, (_, i) => ({ workflow: `w${i}.yml`, cron: '0 * * * *', inputs: {} })) });
    expect(scheduleProblems(tooMany)).not.toEqual([]);
  });
});

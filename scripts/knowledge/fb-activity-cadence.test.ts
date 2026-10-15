import { describe, expect, it, vi } from 'vitest';
import { runExport } from './fb-export-run.mjs';

describe('owner activity cadence', () => {
  const baseOptions = (overrides = {}) => ({
    root: 'C:/outside-repo',
    now: new Date('2026-10-15T20:00:00Z'),
    groups: [],
    activity: true,
    readLedger: vi.fn().mockResolvedValue({ groups: {} }),
    writeLedger: vi.fn(),
    readActivityState: vi.fn().mockResolvedValue({}),
    writeActivityState: vi.fn(),
    findIssue: vi.fn().mockResolvedValue(70),
    reportIssue: vi.fn().mockResolvedValue(true),
    ...overrides,
  });

  it('skips the activity pass when the previous pass is newer than 20 hours', async () => {
    const runActivity = vi.fn();
    const writeActivityState = vi.fn();
    const now = new Date('2026-10-15T20:00:00Z');
    const result = await runExport({
      root: 'C:/outside-repo',
      now,
      groups: [],
      activity: true,
      readLedger: vi.fn().mockResolvedValue({ groups: {} }),
      writeLedger: vi.fn(),
      readActivityState: vi.fn().mockResolvedValue({ lastActivityAt: '2026-10-15T01:00:01Z' }),
      writeActivityState,
      runActivity,
      findIssue: vi.fn().mockResolvedValue(70),
      reportIssue: vi.fn().mockResolvedValue(true),
    });
    expect(result.activity).toMatchObject({ ok: true, skipped: true });
    expect(result.summary).toContain('skipped (last pass was less than 20 hours ago)');
    expect(runActivity).not.toHaveBeenCalled();
    expect(writeActivityState).not.toHaveBeenCalled();
  });

  it('records the cadence timestamp only after a successful pass', async () => {
    const writeActivityState = vi.fn();
    const now = new Date('2026-10-15T20:00:00Z');
    const result = await runExport(
      baseOptions({
        now,
        writeActivityState,
        runActivity: vi.fn().mockResolvedValue({ ok: true, count: 3, written: 2 }),
      }),
    );

    expect(result.activity).toMatchObject({ ok: true, count: 3 });
    expect(writeActivityState).toHaveBeenCalledOnce();
    expect(writeActivityState).toHaveBeenCalledWith(expect.stringMatching(/ledger[\\/]activity\.json$/), {
      lastActivityAt: now.toISOString(),
    });
  });

  it('does not record the cadence timestamp after a failed pass', async () => {
    const writeActivityState = vi.fn();
    const result = await runExport(
      baseOptions({
        writeActivityState,
        runActivity: vi.fn().mockResolvedValue({ ok: false, count: 0, reason: 'capture failed' }),
      }),
    );

    expect(result.activity).toMatchObject({ ok: false, reason: 'capture failed' });
    expect(writeActivityState).not.toHaveBeenCalled();
  });
});

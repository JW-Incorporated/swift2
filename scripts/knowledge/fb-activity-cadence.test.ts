import { describe, expect, it, vi } from 'vitest';
import { runExport } from './fb-export-run.mjs';

describe('owner activity cadence', () => {
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
});

import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error plain module
import { createClock, parseMainLive } from './clock.mjs';
// @ts-expect-error plain module
import { parseSchedule } from './clock-core.mjs';

const start = Date.parse('2026-09-14T18:00:00Z');
const rows = parseSchedule({ rows: [{ workflow: 'poll.yml', cron: '*/5 * * * *', inputs: {} }] });
const response = (body: unknown, date = new Date(start).toUTCString()) => ({ ok: true, status: 200, headers: { get: (name: string) => name === 'date' ? date : null }, text: async () => String(body), json: async () => body });
const liveText = 'export const CLOCK_LIVE = true;\n';

describe('host clock', () => {
  it('reads only one literal live flag and fails closed on three refresh failures', async () => {
    expect(parseMainLive(`${liveText}${liveText}`)).toBeNull();
    const fetchImpl = vi.fn().mockResolvedValueOnce(response(liveText)).mockRejectedValue(new Error('secret details'));
    const clock = createClock({ githubToken: 'x', fetchImpl, rows, now: () => start, processStartMs: start });
    await clock.refresh();
    expect(clock.state().live).toBe(true);
    await clock.refresh(); await clock.refresh(); await clock.refresh();
    expect(clock.state()).toMatchObject({ live: false, failures: 3 });
  });

  it('turns off 30 minutes after its last good read even when refresh timers stall', async () => {
    let time = start;
    const clock = createClock({ githubToken: 'x', fetchImpl: vi.fn().mockResolvedValue(response(liveText)), rows, now: () => time, processStartMs: start });
    await clock.refresh();
    time += 30 * 60_000 + 1;
    expect(clock.state().live).toBe(false);
  });

  it.each([500, 408])('records before POST and never retries after HTTP %s', async (status) => {
    const runs = { total_count: 0, workflow_runs: [] };
    const fetchImpl = vi.fn().mockResolvedValueOnce(response(liveText)).mockResolvedValueOnce(response(runs)).mockResolvedValue({ ok: false, status, headers: { get: () => null }, json: async () => ({}) });
    const clock = createClock({ githubToken: 'x', fetchImpl, rows, now: () => start, processStartMs: start });
    await clock.refresh(); await clock.tick(); await clock.tick();
    expect(fetchImpl.mock.calls.filter((call) => call[1]?.method === 'POST')).toHaveLength(1);
  });

  it('never retries an ambiguous POST timeout', async () => {
    const runs = { total_count: 0, workflow_runs: [] };
    const fetchImpl = vi.fn().mockResolvedValueOnce(response(liveText)).mockResolvedValueOnce(response(runs)).mockRejectedValue(new Error('timeout'));
    const clock = createClock({ githubToken: 'x', fetchImpl, rows, now: () => start, processStartMs: start });
    await clock.refresh(); await clock.tick(); await clock.tick();
    expect(fetchImpl.mock.calls.filter((call) => call[1]?.method === 'POST')).toHaveLength(1);
  });

  it('retries an unreadable run list without posting and pauses across backward time', async () => {
    let time = start;
    const fetchImpl = vi.fn().mockResolvedValueOnce(response(liveText)).mockResolvedValueOnce(response({ total_count: 1 })).mockResolvedValue(response({ total_count: 0, workflow_runs: [] }, new Date(start + 60_000).toUTCString()));
    const clock = createClock({ githubToken: 'x', fetchImpl, rows, now: () => time, processStartMs: start });
    await clock.refresh(); await clock.tick();
    time -= 60_000; await clock.tick();
    expect(fetchImpl.mock.calls.filter((call) => call[1]?.method === 'POST')).toHaveLength(0);
    time = start + 60_000; await clock.tick();
    expect(fetchImpl.mock.calls.filter((call) => call[1]?.method === 'POST')).toHaveLength(1);
  });

  it('signals progress only after a serialized tick finishes, including a failed run read', async () => {
    const progress = vi.fn();
    let release!: () => void;
    const pending = new Promise((resolve) => { release = () => resolve(response({ total_count: 1 })); });
    const fetchImpl = vi.fn().mockResolvedValueOnce(response(liveText)).mockReturnValueOnce(pending);
    const clock = createClock({ githubToken: 'x', fetchImpl, rows, now: () => start, processStartMs: start, progress });
    await clock.refresh();
    const first = clock.tick();
    const second = clock.tick();
    expect(first).toBe(second);
    expect(progress).not.toHaveBeenCalled();
    release();
    await first;
    expect(progress).toHaveBeenCalledOnce();
  });

  it('keeps watchdog progress for handled network failures and a disabled clock', async () => {
    const progress = vi.fn();
    const networkFailure = createClock({
      githubToken: 'x',
      fetchImpl: vi.fn().mockResolvedValueOnce(response(liveText)).mockRejectedValueOnce(new Error('network details')),
      rows,
      now: () => start,
      processStartMs: start,
      progress,
    });
    await networkFailure.refresh();
    await networkFailure.tick();
    expect(progress).toHaveBeenCalledOnce();

    const disabled = createClock({
      githubToken: 'x',
      fetchImpl: vi.fn().mockResolvedValue(response('export const CLOCK_LIVE = false;\n')),
      rows,
      now: () => start,
      processStartMs: start,
      progress,
    });
    await disabled.refresh();
    await disabled.tick();
    expect(progress).toHaveBeenCalledTimes(2);
  });

  it('latches an unexpected tick failure without leaking its error or resuming progress', async () => {
    const progress = vi.fn();
    const log = vi.fn();
    let calls = 0;
    const now = () => {
      calls += 1;
      if (calls === 2) throw new Error('secret exception details');
      return start;
    };
    const fetchImpl = vi.fn().mockResolvedValue(response(liveText));
    const clock = createClock({ githubToken: 'x', fetchImpl, rows, now, processStartMs: start, progress, log });
    await clock.refresh();
    await clock.tick();
    await clock.tick();
    expect(progress).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledOnce();
    expect(log).toHaveBeenCalledWith('clock: unexpected failure; watchdog progress stopped');
    expect(log.mock.calls.flat().join(' ')).not.toContain('secret exception details');
    expect(fetchImpl).toHaveBeenCalledOnce();
  });
});

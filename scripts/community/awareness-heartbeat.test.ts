import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error plain .mjs module
import { shouldSkipForHomeReader } from './awareness-heartbeat.mjs';

const NOW = new Date('2026-10-01T12:00:00.000Z');

function heartbeatClient(result: { data: unknown; error: unknown }) {
  const chain = {
    select: () => chain,
    eq: () => chain,
    maybeSingle: async () => result,
  };
  return { from: () => chain };
}

describe('home-reader heartbeat fallback', () => {
  it('skips the GitHub RSS scan while the home heartbeat is fresh', async () => {
    const client = heartbeatClient({
      data: { enabled: true, updated_at: '2026-10-01T11:31:00.000Z' },
      error: null,
    });
    await expect(shouldSkipForHomeReader(client, { now: NOW })).resolves.toBe(true);
  });

  it('runs the RSS fallback when the breaker disabled the heartbeat', async () => {
    const client = heartbeatClient({
      data: { enabled: false, updated_at: '2026-10-01T11:59:00.000Z' },
      error: null,
    });
    await expect(shouldSkipForHomeReader(client, { now: NOW })).resolves.toBe(false);
  });

  it('fails open when the heartbeat read errors', async () => {
    const warn = vi.fn();
    const client = heartbeatClient({ data: null, error: new Error('temporary failure') });
    await expect(shouldSkipForHomeReader(client, { now: NOW, warn })).resolves.toBe(false);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('running RSS fallback'));
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
// @ts-expect-error plain .mjs modules
import { loadCircuitState } from './breaker.mjs';
// @ts-expect-error plain .mjs modules
import { createRedditTransport, REDDIT_USER_AGENT } from './transport.mjs';

const temporary: string[] = [];

async function harness(response: Response) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'reddit-transport-'));
  temporary.push(directory);
  const circuitFile = path.join(directory, 'state.json');
  const fetchImpl = vi.fn(async () => response);
  const transport = createRedditTransport({
    circuitFile,
    pacer: { beforeRequest: vi.fn(async () => {}) },
    fetchImpl,
    now: () => new Date('2026-10-17T00:00:00Z'),
  });
  return { circuitFile, fetchImpl, transport };
}

afterEach(async () => {
  await Promise.all(temporary.splice(0).map((directory) => rm(directory, { recursive: true })));
});

describe('Reddit transport circuit breaker', () => {
  it.each([403, 429])('trips immediately on HTTP %s', async (status) => {
    const { circuitFile, fetchImpl, transport } = await harness(new Response('', { status }));
    await expect(transport.json('https://www.reddit.com/r/x/comments/a.json')).rejects.toThrow(
      /circuit breaker tripped/,
    );
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(await loadCircuitState(circuitFile)).toMatchObject({
      remainingSkips: 3,
      tripCount: 1,
      lastReason: expect.stringContaining(`HTTP ${status}`),
    });
  });

  it('trips on an HTML response instead of attempting to parse it', async () => {
    const { circuitFile, transport } = await harness(
      new Response('<html>challenge</html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      }),
    );
    await expect(transport.json('https://www.reddit.com/r/x/comments/a.json')).rejects.toThrow(
      /non-JSON response/,
    );
    expect(await loadCircuitState(circuitFile)).toMatchObject({
      remainingSkips: 3,
      lastReason: expect.stringContaining('non-JSON'),
    });
  });

  it('sends the honest project User-Agent on JSON requests', async () => {
    const { fetchImpl, transport } = await harness(
      new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } }),
    );
    await expect(transport.json('https://www.reddit.com/r/x/comments/a.json')).resolves.toEqual([]);
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://www.reddit.com/r/x/comments/a.json',
      expect.objectContaining({
        headers: expect.objectContaining({ 'User-Agent': REDDIT_USER_AGENT }),
      }),
    );
  });
});

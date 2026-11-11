import { readFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error plain .mjs module
import { runReader } from './reader.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const temporary: string[] = [];

afterEach(async () => {
  await Promise.all(temporary.splice(0).map((directory) => rm(directory, { recursive: true })));
});

describe('home Reddit reader orchestration', () => {
  it('stops the run immediately when the first detail request trips the breaker', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'reddit-reader-'));
    temporary.push(directory);
    const xml = readFileSync(path.join(here, 'fixtures', 'discovery.xml'), 'utf8');
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(xml, { status: 200, headers: { 'content-type': 'application/atom+xml' } }),
      )
      .mockResolvedValueOnce(new Response('', { status: 429 }));

    const result = await runReader({
      dryRun: true,
      maxThreads: 1,
      subreddit: 'TaylorSwift',
      config: { defaults: {}, subs: [], excluded: [], search: {} },
      catalog: { eras: [{ id: 'tloas', name: 'Showgirl' }], moments: [] },
      circuitStatePath: path.join(directory, 'state.json'),
      fetchImpl,
      pacer: { beforeRequest: vi.fn(async () => {}) },
      onStatus: vi.fn(),
      warn: vi.fn(),
    });

    expect(result).toMatchObject({ status: 'tripped', httpStatus: 429 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});

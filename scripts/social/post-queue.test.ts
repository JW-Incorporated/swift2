// End-to-end regression test for the 2026-08-11 silent-failure bug: an X post
// that the API rejects must be REPORTED — non-zero exit, an ::error::
// annotation, a report naming the item and the platform's error text — not
// swallowed into a green run. Twelve real X posts died that way between
// 2026-07-21 and 2026-08-04 while every social-poster run stayed green.
//
// Drives the real post-queue.mjs against a temp SOCIAL_ROOT with `fetch`
// stubbed. No network, no credentials: the X_* env vars below are obvious
// dummies and never leave the process.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const DUMMY_X_ENV = {
  X_API_KEY: 'dummy-key',
  X_API_KEY_SECRET: 'dummy-key-secret',
  X_ACCESS_TOKEN: 'dummy-token',
  X_ACCESS_TOKEN_SECRET: 'dummy-token-secret',
};

let root: string;
let reportPath: string;
const savedEnv = { ...process.env };

async function seedQueueItem(name: string, item: Record<string, unknown>) {
  await writeFile(path.join(root, 'social', 'queue', name), JSON.stringify(item, null, 2) + '\n');
}

function xItem(overrides: Record<string, unknown> = {}) {
  return {
    platform: 'x',
    body: 'on this day in 2010: "mine" leaked early, so taylor just shipped it early.',
    scheduledAt: '2020-01-01T00:00:00Z', // long past — always due
    campaign: 'test',
    ...overrides,
  };
}

/** Fresh import each time so module-level state can't leak between cases. */
async function runPoster() {
  vi.resetModules();
  const mod = await import('./post-queue.mjs');
  return mod.main();
}

function stubFetch(response: { ok: boolean; status: number; body: unknown }) {
  const spy = vi.fn(async () => ({
    ok: response.ok,
    status: response.status,
    json: async () => response.body,
  }));
  vi.stubGlobal('fetch', spy);
  return spy;
}

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'social-poster-test-'));
  for (const dir of ['queue', 'posted', 'failed'])
    await mkdir(path.join(root, 'social', dir), { recursive: true });
  reportPath = path.join(root, 'report.md');
  process.env = {
    ...savedEnv,
    ...DUMMY_X_ENV,
    SOCIAL_ROOT: root,
    SOCIAL_POSTER_REPORT: reportPath,
  };
  delete process.env.SOCIAL_FREEZE;
  delete process.env.GITHUB_STEP_SUMMARY;
  delete process.env.FB_PAGE_ID;
  process.exitCode = 0;
});

afterEach(async () => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  process.env = { ...savedEnv };
  process.exitCode = 0;
  await rm(root, { recursive: true, force: true });
});

describe('post-queue: a failed X post is reported, never swallowed', () => {
  it('exits non-zero when an X post exhausts its attempts against a 403', async () => {
    stubFetch({
      ok: false,
      status: 403,
      body: {
        detail: 'You are not permitted to perform this action.',
        status: 403,
        title: 'Forbidden',
      },
    });
    // attempts: 2 — this run is the third and final attempt.
    await seedQueueItem('2026-08-04-mine-rush-release-x.json', xItem({ attempts: 2 }));

    const outcomes = await runPoster();

    expect(process.exitCode).toBe(1);
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]).toMatchObject({ kind: 'failed', platform: 'x', attempts: 3 });
    expect(outcomes[0].error).toContain('403');
  });

  it('names the item, the platform and the API error in the run report', async () => {
    stubFetch({
      ok: false,
      status: 403,
      body: {
        detail: 'You are not permitted to perform this action.',
        status: 403,
        title: 'Forbidden',
      },
    });
    await seedQueueItem('2026-08-04-mine-rush-release-x.json', xItem({ attempts: 2 }));

    await runPoster();

    const report = await readFile(reportPath, 'utf-8');
    expect(report).toContain('PERMANENTLY FAILED');
    expect(report).toContain('2026-08-04-mine-rush-release-x.json');
    expect(report).toContain('You are not permitted to perform this action.');
    expect(report).toContain('NOT published');
  });

  it('prints an ::error:: annotation so the failure shows on the Actions run page', async () => {
    stubFetch({ ok: false, status: 403, body: { detail: 'Forbidden' } });
    await seedQueueItem('a-x.json', xItem({ attempts: 2 }));
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    await runPoster();

    const annotations = log.mock.calls
      .flat()
      .filter((line) => typeof line === 'string' && line.startsWith('::error'));
    expect(annotations).toHaveLength(1);
    expect(annotations[0]).toContain('a-x.json');
  });

  it('still moves the dead item to social/failed/ — the state a red run must persist', async () => {
    stubFetch({ ok: false, status: 403, body: { detail: 'Forbidden' } });
    await seedQueueItem('a-x.json', xItem({ attempts: 2 }));

    await runPoster();

    expect(await readdir(path.join(root, 'social', 'queue'))).toEqual([]);
    expect(await readdir(path.join(root, 'social', 'failed'))).toEqual(['a-x.json']);
    const dead = JSON.parse(
      await readFile(path.join(root, 'social', 'failed', 'a-x.json'), 'utf-8'),
    );
    expect(dead.attempts).toBe(3);
    expect(dead.lastError).toContain('403');
  });

  it('stays green while an X post still has retries left, but reports the attempt', async () => {
    stubFetch({ ok: false, status: 429, body: { detail: 'Too Many Requests' } });
    await seedQueueItem('a-x.json', xItem({ attempts: 0 }));

    const outcomes = await runPoster();

    expect(process.exitCode).toBe(0);
    expect(outcomes[0]).toMatchObject({ kind: 'retrying', platform: 'x', attempts: 1 });
    const report = await readFile(reportPath, 'utf-8');
    expect(report).toContain('retrying');
    expect(report).toContain('a-x.json');
    // Still queued for the next run.
    expect(await readdir(path.join(root, 'social', 'queue'))).toEqual(['a-x.json']);
  });

  it('reports a media-bearing X item as failed rather than posting it text-only', async () => {
    stubFetch({ ok: true, status: 200, body: { data: { id: '123' } } });
    await seedQueueItem('a-x.json', xItem({ attempts: 2, media: ['/eras/red.png'] }));

    const outcomes = await runPoster();

    expect(process.exitCode).toBe(1);
    expect(outcomes[0].error).toContain('X image/video posting is not implemented yet');
    expect(await readdir(path.join(root, 'social', 'posted'))).toEqual([]);
  });
});

describe('post-queue: the happy path stays green', () => {
  it('posts a due X item, records it, and exits zero', async () => {
    stubFetch({ ok: true, status: 200, body: { data: { id: '2086959658460230140' } } });
    await seedQueueItem('a-x.json', xItem());

    const outcomes = await runPoster();

    expect(process.exitCode).toBe(0);
    expect(outcomes[0]).toMatchObject({ kind: 'posted', platform: 'x' });
    const posted = JSON.parse(
      await readFile(path.join(root, 'social', 'posted', 'a-x.json'), 'utf-8'),
    );
    expect(posted.platformPostId).toBe('2086959658460230140');
    expect(posted.url).toBe('https://x.com/longlivetscom/status/2086959658460230140');
    expect(await readFile(reportPath, 'utf-8')).toContain('1 posted (x 1)');
  });

  it('reports "nothing due" without failing when the queue is all future-dated', async () => {
    const spy = stubFetch({ ok: true, status: 200, body: {} });
    await seedQueueItem('a-x.json', xItem({ scheduledAt: '2099-01-01T00:00:00Z' }));

    const outcomes = await runPoster();

    expect(process.exitCode).toBe(0);
    expect(outcomes).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
    expect(await readFile(reportPath, 'utf-8')).toContain('nothing due');
  });

  it('honours SOCIAL_FREEZE without touching the queue', async () => {
    const spy = stubFetch({ ok: true, status: 200, body: {} });
    process.env.SOCIAL_FREEZE = 'true';
    await seedQueueItem('a-x.json', xItem());

    const outcomes = await runPoster();

    expect(outcomes).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
    expect(await readdir(path.join(root, 'social', 'queue'))).toEqual(['a-x.json']);
  });
});

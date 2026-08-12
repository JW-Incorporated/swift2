// End-to-end regression test for the 2026-08-11 silent-failure bug: an X post
// that the API rejects must be REPORTED — non-zero exit, an ::error::
// annotation, a report naming the item and the platform's error text — not
// swallowed into a green run. Twelve real posts died that way between
// 2026-07-21 and 2026-08-04 (eleven X, one Instagram — #1897) while every
// social-poster run stayed green.
//
// Drives the real post-queue.mjs against a temp SOCIAL_ROOT with `fetch`
// stubbed. No network, no credentials: the X_*/IG_* env vars below are
// obvious dummies and never leave the process.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const DUMMY_CREDS_ENV = {
  X_API_KEY: 'dummy-key',
  X_API_KEY_SECRET: 'dummy-key-secret',
  X_ACCESS_TOKEN: 'dummy-token',
  X_ACCESS_TOKEN_SECRET: 'dummy-token-secret',
  IG_ACCESS_TOKEN: 'dummy-ig-token',
  IG_BUSINESS_ACCOUNT_ID: 'dummy-ig-account',
};

let root: string;
let reportPath: string;
const savedEnv = { ...process.env };

async function seedQueueItem(name: string, item: Record<string, unknown>) {
  await writeFile(path.join(root, 'social', 'queue', name), JSON.stringify(item, null, 2) + '\n');
}

/** Recently due (1 minute ago): due, but nowhere near the 48h stale rule. */
function justDue() {
  return new Date(Date.now() - 60_000).toISOString();
}

function xItem(overrides: Record<string, unknown> = {}) {
  return {
    platform: 'x',
    body: 'on this day in 2010: "mine" leaked early, so taylor just shipped it early.',
    scheduledAt: justDue(),
    campaign: 'test',
    ...overrides,
  };
}

function igItem(overrides: Record<string, unknown> = {}) {
  return {
    platform: 'instagram',
    body: 'there\'s a scarf in "all too well." you know the one.',
    // A dedicated photo path, NOT /eras/… — generic era art would trip the
    // era-art guard before the post is ever attempted (see lib/queue.mjs).
    media: ['/social/2026/scarf.jpg'],
    scheduledAt: justDue(),
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

type StubResponse = { ok: boolean; status: number; body: unknown };

/** lib/platforms.mjs reads bodies via res.text() (parseResponse) and
 * lib/preflight.mjs looks at res.ok/status/headers — cover all of them. */
function toFetchResponse(r: StubResponse) {
  return {
    ok: r.ok,
    status: r.status,
    json: async () => r.body,
    text: async () => JSON.stringify(r.body),
    headers: { get: () => null },
  };
}

function stubFetch(response: StubResponse) {
  const spy = vi.fn(async () => toFetchResponse(response));
  vi.stubGlobal('fetch', spy);
  return spy;
}

/** Distinct response per call, for multi-step platform flows (preflight, then
 * IG's create-container, then publish). The last entry repeats if exhausted. */
function stubFetchSequence(responses: StubResponse[]) {
  let i = 0;
  const spy = vi.fn(async () => toFetchResponse(responses[Math.min(i++, responses.length - 1)]));
  vi.stubGlobal('fetch', spy);
  return spy;
}

const PREFLIGHT_OK: StubResponse = { ok: true, status: 200, body: '' };

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'social-poster-test-'));
  for (const dir of ['queue', 'posted', 'failed'])
    await mkdir(path.join(root, 'social', dir), { recursive: true });
  reportPath = path.join(root, 'report.md');
  process.env = {
    ...savedEnv,
    ...DUMMY_CREDS_ENV,
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
});

// The swallow was never X-specific — it lived in a platform-agnostic catch
// block. social/failed/2026-07-27-all-too-well-scarf-metaphor-ig.json is the
// proof it bit Instagram too: a real post killed by Meta error 9007/2207027
// on a green run. (The container-readiness race that CAUSED that error is
// issue #1897, deliberately not fixed here — this only asserts that when
// Instagram fails, we hear about it.)
describe('post-queue: an Instagram failure is reported just as loudly', () => {
  // Meta's real payload for the post we lost.
  const NOT_READY = {
    error: {
      message: 'Media ID is not available',
      type: 'OAuthException',
      code: 9007,
      error_subcode: 2207027,
      is_transient: false,
      error_user_title: 'Cannot Publish',
      error_user_msg: 'The media is not ready for publishing, please wait for a moment',
    },
  };

  it('reddens the run when an IG publish exhausts its attempts', async () => {
    // Media preflight passes and container creation succeeds; the publish
    // that follows is the failure.
    stubFetchSequence([
      PREFLIGHT_OK,
      { ok: true, status: 200, body: { id: 'container-1' } },
      { ok: false, status: 400, body: NOT_READY },
    ]);
    await seedQueueItem('2026-07-27-all-too-well-scarf-metaphor-ig.json', igItem({ attempts: 2 }));

    const outcomes = await runPoster();

    expect(process.exitCode).toBe(1);
    expect(outcomes[0]).toMatchObject({ kind: 'failed', platform: 'instagram', attempts: 3 });
    expect(outcomes[0].error).toContain('Instagram publish failed');
    expect(outcomes[0].error).toContain('2207027');
  });

  it('names Instagram, not just X, in the run report', async () => {
    stubFetchSequence([
      PREFLIGHT_OK,
      { ok: true, status: 200, body: { id: 'container-1' } },
      { ok: false, status: 400, body: NOT_READY },
    ]);
    await seedQueueItem('a-ig.json', igItem({ attempts: 2 }));

    await runPoster();

    const report = await readFile(reportPath, 'utf-8');
    expect(report).toContain('PERMANENTLY FAILED (instagram 1)');
    expect(report).toContain('The media is not ready for publishing');
  });

  it('surfaces a failure at the container step too, not only at publish', async () => {
    stubFetchSequence([
      PREFLIGHT_OK,
      { ok: false, status: 400, body: { error: { message: 'Invalid image URL' } } },
    ]);
    await seedQueueItem('a-ig.json', igItem({ attempts: 2 }));

    const outcomes = await runPoster();

    expect(process.exitCode).toBe(1);
    expect(outcomes[0].error).toContain('Instagram media container failed');
  });
});

// Every OTHER path into social/failed/ must be exactly as loud as an
// attempts-exhausted platform rejection — the swallow was in the run's exit
// code, not in any single failure branch.
describe('post-queue: every other route into social/failed/ also reddens the run', () => {
  it('a stale item (>48h past scheduledAt) fails loudly instead of vanishing quietly', async () => {
    const spy = stubFetch({ ok: true, status: 200, body: {} });
    await seedQueueItem('a-x.json', xItem({ scheduledAt: '2020-01-01T00:00:00Z' }));

    const outcomes = await runPoster();

    expect(process.exitCode).toBe(1);
    expect(outcomes[0]).toMatchObject({ kind: 'failed', platform: 'x' });
    expect(outcomes[0].error).toContain('48h');
    expect(spy).not.toHaveBeenCalled(); // never attempted — straight to failed/
    expect(await readdir(path.join(root, 'social', 'failed'))).toEqual(['a-x.json']);
    expect(await readFile(reportPath, 'utf-8')).toContain('PERMANENTLY FAILED');
  });

  it('an item with an invalid scheduledAt is quarantined loudly', async () => {
    stubFetch({ ok: true, status: 200, body: {} });
    await seedQueueItem('bad.json', xItem({ scheduledAt: 'not-a-date' }));

    const outcomes = await runPoster();

    expect(process.exitCode).toBe(1);
    expect(outcomes[0]).toMatchObject({ kind: 'failed', platform: 'x' });
    expect(outcomes[0].error).toContain('scheduledAt');
    expect(await readdir(path.join(root, 'social', 'failed'))).toEqual(['bad.json']);
  });

  it('an ambiguous transport failure fails loudly WITHOUT being retried', async () => {
    const spy = vi.fn(async () => {
      throw new Error('socket hang up');
    });
    vi.stubGlobal('fetch', spy);
    await seedQueueItem('a-x.json', xItem({ attempts: 0 }));

    const outcomes = await runPoster();

    expect(process.exitCode).toBe(1);
    expect(outcomes[0]).toMatchObject({ kind: 'failed', platform: 'x', attempts: 1 });
    expect(outcomes[0].error).toContain('NOT auto-retried');
    // Moved to failed/ on the FIRST attempt — never re-queued.
    expect(await readdir(path.join(root, 'social', 'queue'))).toEqual([]);
    const dead = JSON.parse(await readFile(path.join(root, 'social', 'failed', 'a-x.json'), 'utf-8'));
    expect(dead.lastError).toBe('ambiguous');
  });

  it('a run with due work but missing credentials aborts red, not green', async () => {
    const spy = stubFetch({ ok: true, status: 200, body: {} });
    delete process.env.X_ACCESS_TOKEN;
    delete process.env.X_ACCESS_TOKEN_SECRET;
    await seedQueueItem('a-x.json', xItem());

    const outcomes = await runPoster();

    expect(process.exitCode).toBe(1);
    expect(outcomes).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
    // Nothing was touched — the item is still queued, no attempt was burned.
    expect(await readdir(path.join(root, 'social', 'queue'))).toEqual(['a-x.json']);
    const report = await readFile(reportPath, 'utf-8');
    expect(report).toContain('RUN ABORTED');
    expect(report).toContain('X_ACCESS_TOKEN');
  });
});

describe('post-queue: blocked items are reported as skips, not silently deferred', () => {
  it('reports an era-art-guard block as a skipped outcome and leaves the item queued', async () => {
    const spy = stubFetch({ ok: true, status: 200, body: {} });
    await seedQueueItem('a-ig.json', igItem({ media: ['/eras/red.png'] }));

    const outcomes = await runPoster();

    expect(process.exitCode).toBe(0);
    expect(outcomes[0]).toMatchObject({ kind: 'skipped', platform: 'instagram' });
    expect(outcomes[0].error).toContain('era art');
    expect(spy).not.toHaveBeenCalled();
    expect(await readdir(path.join(root, 'social', 'queue'))).toEqual(['a-ig.json']);
    expect(await readFile(reportPath, 'utf-8')).toContain('skipped');
  });
});

describe('post-queue: a Facebook cross-post failure is visible, but never reddens the run', () => {
  it('records facebookError on the posted outcome and warns in the report', async () => {
    process.env.FB_PAGE_ID = 'dummy-page';
    stubFetchSequence([
      PREFLIGHT_OK,
      { ok: true, status: 200, body: { id: 'container-1' } },
      { ok: true, status: 200, body: { id: 'ig-post-9' } },
      { ok: false, status: 400, body: { error: { message: '(#200) requires pages_manage_posts' } } },
    ]);
    await seedQueueItem('a-ig.json', igItem());

    const outcomes = await runPoster();

    // The Instagram post landed — the run must stay green…
    expect(process.exitCode).toBe(0);
    expect(outcomes[0]).toMatchObject({ kind: 'posted', platform: 'instagram' });
    // …but the dead cross-post is carried on the outcome and in the report.
    expect(outcomes[0].facebookError).toContain('pages_manage_posts');
    const report = await readFile(reportPath, 'utf-8');
    expect(report).toContain('Facebook Page cross-post FAILED');
    const posted = JSON.parse(await readFile(path.join(root, 'social', 'posted', 'a-ig.json'), 'utf-8'));
    expect(posted.facebookPostId).toBeUndefined();
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

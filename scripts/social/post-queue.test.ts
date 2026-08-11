// End-to-end regression test for the 2026-08-11 silent-failure bug: an X post
// that the API rejects must be REPORTED — non-zero exit, an ::error::
// annotation, a report naming the item and the platform's error text — not
// swallowed into a green run. Twelve real posts died that way between
// 2026-07-21 and 2026-08-04 (eleven X, one Instagram — #1897) while every
// social-poster run stayed green.
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

function igItem(overrides: Record<string, unknown> = {}) {
  return {
    platform: 'instagram',
    body: 'there\'s a scarf in "all too well." you know the one.',
    media: ['/eras/red.png'],
    scheduledAt: '2020-01-01T00:00:00Z',
    campaign: 'test',
    ...overrides,
  };
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

type StubResponse = { ok?: boolean; status?: number; body?: unknown };

/**
 * URL-aware stub for the full Instagram flow, which is four distinct calls
 * now: the deploy-lag HEAD preflight, POST /media (container), GET the
 * container's status_code, POST /media_publish. Keyed by URL rather than by
 * call order so a test asserting on one step doesn't have to know how many
 * calls the others make.
 */
function stubIgFetch(steps: {
  preflight?: StubResponse;
  container?: StubResponse;
  status?: StubResponse;
  publish?: StubResponse;
} = {}) {
  const ok = (body: unknown): StubResponse => ({ ok: true, status: 200, body });
  const resolved = {
    preflight: steps.preflight ?? ok({}),
    container: steps.container ?? ok({ id: 'container-1' }),
    status: steps.status ?? ok({ status_code: 'FINISHED' }),
    publish: steps.publish ?? ok({ id: 'ig-post-1' }),
  };
  const spy = vi.fn(async (url: string, init?: { method?: string }) => {
    let step: StubResponse;
    if (init?.method === 'HEAD') step = resolved.preflight;
    else if (String(url).includes('/media_publish')) step = resolved.publish;
    else if (init?.method === 'POST') step = resolved.container;
    else step = resolved.status;
    return { ok: step.ok ?? true, status: step.status ?? 200, json: async () => step.body ?? {} };
  });
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

// The swallow was never X-specific — it lived in a platform-agnostic catch
// block. social/failed/2026-07-27-all-too-well-scarf-metaphor-ig.json is the
// proof it bit Instagram too: a real post killed by Meta error 9007/2207027
// on a green run. (The container-readiness race that CAUSED that error is
// issue #1897, fixed separately in lib/ig-container.mjs — these cases only
// assert that when Instagram fails, we hear about it.)
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
    // Media is live and the container reports FINISHED; the publish that
    // follows is still the failure.
    stubIgFetch({ publish: { ok: false, status: 400, body: NOT_READY } });
    await seedQueueItem('2026-07-27-all-too-well-scarf-metaphor-ig.json', igItem({ attempts: 2 }));

    const outcomes = await runPoster();

    expect(process.exitCode).toBe(1);
    expect(outcomes[0]).toMatchObject({ kind: 'failed', platform: 'instagram', attempts: 3 });
    expect(outcomes[0].error).toContain('Instagram publish failed');
    expect(outcomes[0].error).toContain('2207027');
  });

  it('names Instagram, not just X, in the run report', async () => {
    stubIgFetch({ publish: { ok: false, status: 400, body: NOT_READY } });
    await seedQueueItem('a-ig.json', igItem({ attempts: 2 }));

    await runPoster();

    const report = await readFile(reportPath, 'utf-8');
    expect(report).toContain('PERMANENTLY FAILED (instagram 1)');
    expect(report).toContain('The media is not ready for publishing');
  });

  it('surfaces a failure at the container step too, not only at publish', async () => {
    stubIgFetch({ container: { ok: false, status: 400, body: { error: { message: 'Invalid image URL' } } } });
    await seedQueueItem('a-ig.json', igItem({ attempts: 2 }));

    const outcomes = await runPoster();

    expect(process.exitCode).toBe(1);
    expect(outcomes[0].error).toContain('Instagram media container failed');
  });

  // #1897: publishing a container Meta hasn't finished is what killed the
  // real post above. The poll must fail the attempt instead of publishing.
  it('never publishes a container still stuck IN_PROGRESS', async () => {
    process.env.SOCIAL_IG_POLL_TIMEOUT_MS = '5';
    process.env.SOCIAL_IG_POLL_INTERVAL_MS = '0';
    const spy = stubIgFetch({ status: { body: { status_code: 'IN_PROGRESS' } } });
    await seedQueueItem('a-ig.json', igItem({ attempts: 2 }));

    const outcomes = await runPoster();

    expect(outcomes[0].error).toContain('still "IN_PROGRESS"');
    const published = spy.mock.calls.filter(([url]) => String(url).includes('/media_publish'));
    expect(published).toHaveLength(0);
  });
});

// --- item 1: the media gate, wired to the schedule ------------------------
// Instagram media is FETCHED by Meta from the live site, so an item whose
// image PR hasn't merged/deployed cannot post no matter what scheduledAt
// says. It must WAIT — visibly — not burn attempts and die.
describe('post-queue: media that is not live yet waits instead of failing', () => {
  /** Due 30 minutes ago — inside the stuck threshold. */
  const justDue = () => new Date(Date.now() - 30 * 60 * 1000).toISOString();

  it('does not publish, does not spend an attempt, and stays queued', async () => {
    const spy = stubIgFetch({ preflight: { ok: false, status: 404, body: {} } });
    await seedQueueItem('a-ig.json', igItem({ scheduledAt: justDue() }));

    const outcomes = await runPoster();

    expect(outcomes[0]).toMatchObject({ kind: 'waiting', platform: 'instagram' });
    expect(outcomes[0].error).toContain('not live at');
    // No container was ever created — no Graph write of any kind.
    expect(spy.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(0);
    // Still queued, attempts untouched.
    expect(await readdir(path.join(root, 'social', 'queue'))).toEqual(['a-ig.json']);
    const stillQueued = JSON.parse(await readFile(path.join(root, 'social', 'queue', 'a-ig.json'), 'utf-8'));
    expect(stillQueued.attempts).toBeUndefined();
    expect(await readdir(path.join(root, 'social', 'failed'))).toEqual([]);
  });

  it('stays green while waiting — this is holding, not breaking', async () => {
    stubIgFetch({ preflight: { ok: false, status: 404, body: {} } });
    await seedQueueItem('a-ig.json', igItem({ scheduledAt: justDue() }));

    await runPoster();

    expect(process.exitCode).toBe(0);
    const report = await readFile(reportPath, 'utf-8');
    expect(report).toContain('waiting on deploy');
    expect(report).toContain('a-ig.json');
    expect(report).not.toContain('PERMANENTLY FAILED');
  });

  it('ships itself on the next run once the deploy lands', async () => {
    stubIgFetch();
    await seedQueueItem('a-ig.json', igItem({ scheduledAt: justDue() }));

    const outcomes = await runPoster();

    expect(outcomes[0]).toMatchObject({ kind: 'posted', platform: 'instagram' });
    expect(await readdir(path.join(root, 'social', 'posted'))).toEqual(['a-ig.json']);
  });

  it('reddens the run once the wait passes the stuck threshold', async () => {
    stubIgFetch({ preflight: { ok: false, status: 404, body: {} } });
    // scheduledAt in 2020 — waiting for years, not minutes.
    await seedQueueItem('a-ig.json', igItem());

    const outcomes = await runPoster();

    expect(process.exitCode).toBe(1);
    expect(outcomes[0].kind).toBe('waiting');
    expect(await readFile(reportPath, 'utf-8')).toContain('STUCK more than');
  });

  it('does not preflight a text-only X item', async () => {
    const spy = stubFetch({ ok: true, status: 200, body: { data: { id: '1' } } });
    await seedQueueItem('a-x.json', xItem());

    await runPoster();

    expect(spy.mock.calls.filter(([, init]) => init?.method === 'HEAD')).toHaveLength(0);
  });
});

// --- item 4: a no-attempt skip must not be able to hide forever ----------
describe('post-queue: an indefinitely-skipped item escalates', () => {
  it('reddens the run when the era-art guard has skipped an item past the threshold', async () => {
    stubIgFetch();
    // A recent IG post using the same era tile makes the guard skip this one,
    // exactly as it has skipped the real 2026-08-09 item every 30 minutes.
    await writeFile(
      path.join(root, 'social', 'posted', 'earlier-ig.json'),
      JSON.stringify({ platform: 'instagram', media: ['/eras/folklore.png'], postedAt: '2026-08-04T19:37:29Z' }, null, 2),
    );
    await seedQueueItem('2026-08-09-august-augustine-ig.json', igItem({ media: ['/eras/folklore.png'] }));

    const outcomes = await runPoster();

    expect(outcomes[0].kind).toBe('skipped');
    expect(process.exitCode).toBe(1);
    const report = await readFile(reportPath, 'utf-8');
    expect(report).toContain('STUCK more than');
    expect(report).toContain('2026-08-09-august-augustine-ig.json');
    expect(report).toContain('a human has to change the item');
  });

  it('stays green for a skip that is still fresh', async () => {
    stubIgFetch();
    await writeFile(
      path.join(root, 'social', 'posted', 'earlier-ig.json'),
      JSON.stringify({ platform: 'instagram', media: ['/eras/folklore.png'], postedAt: '2026-08-04T19:37:29Z' }, null, 2),
    );
    await seedQueueItem(
      'fresh-ig.json',
      igItem({ media: ['/eras/folklore.png'], scheduledAt: new Date(Date.now() - 60 * 1000).toISOString() }),
    );

    const outcomes = await runPoster();

    expect(outcomes[0].kind).toBe('skipped');
    expect(process.exitCode).toBe(0);
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

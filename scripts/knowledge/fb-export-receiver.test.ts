import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startReceiver } from './fb-export-receiver.mjs';
import { gateExport } from './fb-export-run.mjs';

const TOKEN = 'a'.repeat(64);
const NOW = new Date('2026-09-30T12:00:00Z');
const groups = [
  { slug: 'group-a', label: 'Group A', groupId: '111' },
  { slug: 'group-b', label: 'Group B', groupId: '222', wallBudgetMs: 75 * 60_000 },
];

type Receiver = Awaited<ReturnType<typeof startReceiver>>;
const open: Receiver[] = [];
const dirs: string[] = [];

async function setup(extra: Record<string, unknown> = {}) {
  const outputDir = await mkdtemp(join(tmpdir(), 'fbx-recv-'));
  dirs.push(outputDir);
  const storeComments = vi.fn().mockResolvedValue({ path: 'p', posts: 1, comments: 2, replies: 1 });
  const log = vi.fn();
  const r = await startReceiver({
    groups,
    token: TOKEN,
    root: outputDir,
    outputDir,
    now: NOW,
    week: '2026-09-27',
    storeComments,
    log,
    ...extra,
  } as never);
  open.push(r);
  return { r, outputDir, storeComments, log };
}

afterEach(async () => {
  await Promise.all(open.splice(0).map((r) => r.close()));
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

const call = (
  r: Receiver,
  method: string,
  path: string,
  body?: unknown,
  token: string | null = TOKEN,
) =>
  fetch(`http://127.0.0.1:${r.port}${path}`, {
    method,
    headers: { ...(token ? { 'x-llfb-token': token } : {}), 'content-type': 'application/json' },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });

const unit = (position: number, text: string, ownTimestamp = '2h') => ({
  key: `pos:${position}`,
  position,
  ownTimestamp,
  ignoreForAge: false,
  reactions: 3,
  commentCount: 1,
  html: `<a aria-label="Person ${position}">Person ${position}</a><p>${text}</p>`,
});
const collected = (slug: string, units = [unit(1, 'Synthetic album discussion alpha')]) => ({
  v: 1,
  slug,
  extVersion: '0.1.0',
  status: 'collected',
  stopReason: 'seven-days',
  units,
  comments: [
    {
      postKey: 'pos:1',
      postUrl: 'https://example.invalid/p',
      comments: [{ id: 'c1', author: 'X', text: 'Synthetic', ts: '1h', reactions: 0, replies: [] }],
    },
  ],
  coverage: {
    harvestedCount: units.length,
    recentCount: units.length,
    slotCount: 10,
    coverageAgeMs: 8 * 86_400_000,
    partial: false,
    ageRuleMet: true,
    scrolls: 5,
    wallMs: 1000,
  },
  collectedAt: NOW.toISOString(),
});

describe('fb export receiver', () => {
  it('binds 127.0.0.1, returns a url with the token in the hash, serves /start without a token and without embedding it', async () => {
    const { r } = await setup();
    expect(r.url).toBe(`http://127.0.0.1:${r.port}/start#${TOKEN}`);
    const page = await call(r, 'GET', '/start', undefined, null);
    expect(page.status).toBe(200);
    expect(await page.text()).not.toContain(TOKEN);
  });

  it('rejects missing and wrong tokens with 403 on every API route', async () => {
    const { r } = await setup();
    for (const [m, p] of [
      ['GET', '/next'],
      ['POST', '/result'],
      ['POST', '/heartbeat'],
      ['POST', '/finished'],
    ]) {
      expect((await call(r, m, p, m === 'POST' ? {} : undefined, null)).status).toBe(403);
      expect((await call(r, m, p, m === 'POST' ? {} : undefined, 'b'.repeat(64))).status).toBe(403);
      expect((await call(r, m, p, m === 'POST' ? {} : undefined, 'short')).status).toBe(403);
    }
  });

  it('round-trips two groups into collected files the real gate accepts', async () => {
    const { r, outputDir, storeComments, log } = await setup();
    const first = await (await call(r, 'GET', '/next')).json();
    expect(first).toMatchObject({
      done: false,
      slug: 'group-a',
      groupId: '111',
      url: 'https://www.facebook.com/groups/111?sorting_setting=CHRONOLOGICAL',
      wallBudgetMs: 20 * 60_000,
      maxScrolls: 250,
      comments: { topN: 20, maxPerPost: 50, pacingMs: [2000, 5000] },
    });
    expect(
      await (
        await call(r, 'POST', '/heartbeat', { slug: 'group-a', scrolls: 1, slotCount: 4 })
      ).json(),
    ).toEqual({ ok: true });
    expect((await call(r, 'POST', '/result', collected('group-a'))).status).toBe(200);
    const second = await (await call(r, 'GET', '/next')).json();
    expect(second).toMatchObject({ slug: 'group-b', wallBudgetMs: 75 * 60_000 });
    expect(
      (
        await call(
          r,
          'POST',
          '/result',
          collected('group-b', [unit(1, 'Synthetic tour talk beta')]),
        )
      ).status,
    ).toBe(200);
    expect(await (await call(r, 'GET', '/next')).json()).toEqual({ done: true });
    await call(r, 'POST', '/finished', {});
    const results = await r.done;
    expect(results.map((x: { slug: string }) => x.slug)).toEqual(['group-a', 'group-b']);
    expect(results[0]).toEqual({
      slug: 'group-a',
      status: 'collected',
      filePath: join(outputDir, 'fb-group-a-2026-09-30.html'),
      ageRuleMet: true,
      stopReason: 'seven-days',
      harvestedCount: 1,
      recentCount: 1,
      slotCount: 10,
      coverageAgeMs: 8 * 86_400_000,
      partial: false,
      collectedAt: NOW.toISOString(),
    });
    expect(await readFile(results[0].filePath, 'utf8')).toContain('data-posinset="1"');
    for (let i = 0; i < 2; i += 1) {
      const gate = await gateExport(results[i], groups[i] as never);
      expect(gate, JSON.stringify(gate)).toMatchObject({ ok: true, postCount: 1 });
    }
    expect(storeComments).toHaveBeenCalledWith(
      expect.objectContaining({ week: '2026-09-27', slug: 'group-a' }),
    );
    const logged = log.mock.calls.map((c) => c[0]).join('\n');
    expect(logged).toContain('group-a: collected harvested=1');
    expect(logged).not.toContain('Synthetic');
  });

  it('maps extension statuses and stops the run after a run-stopping one', async () => {
    const { r } = await setup();
    await call(r, 'GET', '/next');
    await call(r, 'POST', '/result', {
      v: 1,
      slug: 'group-a',
      status: 'stunted',
      stopReason: 'stunted-feed',
    });
    expect(await (await call(r, 'GET', '/next')).json()).toEqual({ done: true });
    await call(r, 'POST', '/finished', {});
    expect(await r.done).toEqual([{ slug: 'group-a', status: 'stunted' }]);
  });

  it('resolves done with mapped results after a login stop', async () => {
    const { r } = await setup();
    await call(r, 'GET', '/next');
    await call(r, 'POST', '/result', { v: 1, slug: 'group-a', status: 'login' });
    expect(await (await call(r, 'GET', '/next')).json()).toEqual({ done: true });
    await call(r, 'POST', '/finished', {});
    expect(await r.done).toEqual([{ slug: 'group-a', status: 'login-failed' }]);
  });

  it('maps non-stopping statuses and zero units, and continues', async () => {
    const { r } = await setup();
    await call(r, 'GET', '/next');
    await call(r, 'POST', '/result', { v: 1, slug: 'group-a', status: 'not-member' });
    expect((await (await call(r, 'GET', '/next')).json()).slug).toBe('group-b');
    await call(r, 'POST', '/result', collected('group-b', []));
    await call(r, 'POST', '/finished', {});
    const res = await r.done;
    expect(res[0]).toEqual({ slug: 'group-a', status: 'not-member' });
    expect(res[1]).toMatchObject({ slug: 'group-b', status: 'no-recent-posts', harvestedCount: 0 });
  });

  it('rejects invalid schema (400), unexpected slug and duplicates (409)', async () => {
    const { r } = await setup();
    await call(r, 'GET', '/next');
    expect(
      (await call(r, 'POST', '/result', { v: 2, slug: 'group-a', status: 'collected' })).status,
    ).toBe(400);
    expect((await call(r, 'POST', '/result', 'not json')).status).toBe(400);
    expect((await call(r, 'POST', '/result', collected('group-b'))).status).toBe(409);
    expect((await call(r, 'POST', '/result', collected('group-a'))).status).toBe(200);
    expect((await call(r, 'POST', '/result', collected('group-a'))).status).toBe(409);
  });

  it('records a stalled group as failed and resolves done when heartbeats stop', async () => {
    const { r } = await setup({ stallMs: 150 });
    await call(r, 'GET', '/next');
    expect(await r.done).toEqual([{ slug: 'group-a', status: 'failed', reason: 'stalled' }]);
  });

  it('heartbeats keep the watchdog from firing', async () => {
    const { r } = await setup({ stallMs: 200 });
    await call(r, 'GET', '/next');
    for (let i = 0; i < 4; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      await call(r, 'POST', '/heartbeat', { slug: 'group-a' });
    }
    const state = await Promise.race([r.done.then(() => 'done'), Promise.resolve('pending')]);
    expect(state).toBe('pending');
  });

  it('answers 413 above 64 MB', async () => {
    const { r } = await setup();
    await call(r, 'GET', '/next');
    const res = await fetch(`http://127.0.0.1:${r.port}/result`, {
      method: 'POST',
      headers: { 'x-llfb-token': TOKEN, 'content-type': 'application/json' },
      body: Buffer.alloc(64 * 1024 * 1024 + 1, 0x20),
    });
    expect(res.status).toBe(413);
  }, 30_000);

  it('close() is idempotent', async () => {
    const { r } = await setup();
    await r.close();
    await r.close();
    expect(await r.done).toEqual([]);
  });
});

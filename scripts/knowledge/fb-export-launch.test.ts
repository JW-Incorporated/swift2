import { describe, expect, it, vi } from 'vitest';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { chromeProfileInUse, extensionCollect, launchPlainChrome } from './fb-export-launch.mjs';
import { startReceiver } from './fb-export-receiver.mjs';

const fakeSpawn = () => {
  const calls: { cmd: string; args: string[] }[] = [];
  const spawn = vi.fn((cmd: string, args: string[]) => {
    calls.push({ cmd, args });
    return { pid: 4242, unref: vi.fn(), on: vi.fn() };
  });
  return { spawn, calls };
};

describe('launchPlainChrome', () => {
  it('starts plain Chrome with no debugging port, pipe or extension flag', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'fbx-launch-'));
    try {
      const { spawn, calls } = fakeSpawn();
      const chrome = await launchPlainChrome({
        url: 'http://127.0.0.1:5555/start#tok',
        profileDir: dir,
        spawn: spawn as never,
        chromeExecutable: 'C:/fake/chrome.exe',
      });
      const args = calls[0].args;
      expect(args).toContain(`--user-data-dir=${dir}`);
      expect(args).toContain('--new-window');
      expect(args).toContain('--no-first-run');
      expect(args).toContain('http://127.0.0.1:5555/start#tok');
      expect(args.join(' ')).not.toMatch(/remote-debugging|load-extension/);
      // Tab-hidden: an occluded/background run window must not be throttled.
      for (const flag of [
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-background-timer-throttling',
        '--disable-features=CalculateNativeWinOcclusion',
      ])
        expect(args).toContain(flag);
      expect(args.at(-1)).toBe('http://127.0.0.1:5555/start#tok');
      expect(chrome.pid).toBe(4242);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('close() taskkills the process tree on win32', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'fbx-launch-'));
    try {
      const { spawn, calls } = fakeSpawn();
      const chrome = await launchPlainChrome({
        url: 'http://127.0.0.1:1/start',
        profileDir: dir,
        spawn: spawn as never,
        chromeExecutable: 'x',
        platform: 'win32',
      });
      await chrome.close();
      expect(calls[1]).toEqual({ cmd: 'taskkill', args: ['/PID', '4242', '/T', '/F'] });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe('launchPlainChrome close() is platform-explicit and once-only', () => {
  const launched = (platform: string) =>
    launchPlainChrome({
      url: 'http://127.0.0.1:1/start',
      profileDir: tmpdir(),
      spawn: fakeSpawn().spawn as never,
      chromeExecutable: 'x',
      platform: platform as never,
    });

  it('on linux signals the pid directly, and only on the first close()', async () => {
    const kill = vi.spyOn(process, 'kill').mockImplementation((() => true) as never);
    try {
      const chrome = await launched('linux');
      await chrome.close();
      await chrome.close();
      expect(kill).toHaveBeenCalledTimes(1);
      expect(kill).toHaveBeenCalledWith(4242);
    } finally {
      kill.mockRestore();
    }
  });

  it('on win32 taskkills once even when close() is called twice', async () => {
    const { spawn, calls } = fakeSpawn();
    const chrome = await launchPlainChrome({
      url: 'http://127.0.0.1:1/start',
      profileDir: tmpdir(),
      spawn: spawn as never,
      chromeExecutable: 'x',
      platform: 'win32',
    });
    await chrome.close();
    await chrome.close();
    expect(calls.filter((c) => c.cmd === 'taskkill')).toHaveLength(1);
  });
});

describe('chromeProfileInUse', () => {
  it('is false without a lockfile, false for a stale one, true when it cannot be opened', () => {
    const close = vi.fn();
    expect(chromeProfileInUse('p', { exists: () => false })).toBe(false);
    expect(chromeProfileInUse('p', { exists: () => true, open: (() => 3) as never, close })).toBe(
      false,
    );
    const busy = () => {
      throw Object.assign(new Error('busy'), { code: 'EBUSY' });
    };
    expect(chromeProfileInUse('p', { exists: () => true, open: busy as never, close })).toBe(true);
  });
});

describe('extensionCollect', () => {
  it('does not start Chrome or the receiver when the profile is already open', async () => {
    const startReceiver = vi.fn();
    const launch = vi.fn();
    const out = await extensionCollect({
      groups: [{ slug: 'a', label: 'A', groupId: '1' }],
      profileDir: 'p',
      profileInUse: () => true,
      startReceiver,
      launch,
    });
    expect(out.results).toEqual([{ slug: 'a', status: 'failed', reason: 'chrome-profile-open' }]);
    expect(launch).not.toHaveBeenCalled();
    expect(startReceiver).not.toHaveBeenCalled();
  });

  const groups = [
    { slug: 'a', label: 'A', groupId: '1', wallBudgetMs: 20 * 60_000 },
    { slug: 'b', label: 'B', groupId: '2', wallBudgetMs: 75 * 60_000 },
  ];

  it('runs receiver then Chrome, returns receiver results and closes both', async () => {
    const results = [{ slug: 'a', status: 'collected' }];
    const receiver = {
      url: 'http://127.0.0.1:9/start',
      done: Promise.resolve(results),
      close: vi.fn(),
    };
    const startReceiver = vi.fn().mockResolvedValue(receiver);
    const chrome = { pid: 1, close: vi.fn() };
    const launch = vi.fn().mockResolvedValue(chrome);
    const out = await extensionCollect({
      groups,
      root: 'r',
      outputDir: 'o',
      week: 'w',
      startReceiver,
      launch,
      token: 'tok',
    });
    expect(startReceiver).toHaveBeenCalledWith(expect.objectContaining({ token: 'tok', groups }));
    expect(launch).toHaveBeenCalledWith({ url: receiver.url });
    expect(out).toEqual({ results, actingPageId: null });
    expect(chrome.close).toHaveBeenCalled();
    expect(receiver.close).toHaveBeenCalled();
  });

  it('marks unfinished groups failed on the total wall budget (sum + 10 min)', async () => {
    const receiver = { url: 'u', done: new Promise(() => {}), close: vi.fn() };
    const chrome = { pid: 1, close: vi.fn() };
    let delay = 0;
    const out = await extensionCollect({
      groups,
      startReceiver: vi.fn().mockResolvedValue(receiver),
      launch: vi.fn().mockResolvedValue(chrome),
      setTimer: ((fn: () => void, ms: number) => {
        delay = ms;
        fn();
        return 0;
      }) as never,
      clearTimer: vi.fn() as never,
    });
    expect(delay).toBe((20 + 75 + 10) * 60_000);
    expect(out.results).toEqual([
      { slug: 'a', status: 'failed', reason: 'run-wall-budget' },
      { slug: 'b', status: 'failed', reason: 'run-wall-budget' },
    ]);
    expect(chrome.close).toHaveBeenCalled();
    expect(receiver.close).toHaveBeenCalled();
  });
});

describe('extensionCollect with the real receiver', () => {
  it('keeps the group reported before the wall budget and fails the rest', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'fbx-wall-'));
    const token = 'b'.repeat(64);
    const groups = [
      { slug: 'one', label: 'One', groupId: '1', wallBudgetMs: 50 },
      { slug: 'two', label: 'Two', groupId: '2', wallBudgetMs: 50 },
      { slug: 'three', label: 'Three', groupId: '3', wallBudgetMs: 50 },
    ];
    const chrome = { pid: 1, close: vi.fn() };
    const launch = vi.fn(async ({ url }: { url: string }) => {
      const base = new URL(url).origin;
      const headers = { 'x-llfb-token': token, 'content-type': 'application/json' };
      void (async () => {
        const first = await (await fetch(`${base}/next`, { headers })).json();
        await fetch(`${base}/result`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            v: 1,
            slug: first.slug,
            status: 'collected',
            stopReason: 'feed-end',
            units: [{ html: '<div>synthetic post</div>', position: 0 }],
            coverage: { ageRuleMet: true, harvestedCount: 1, slotCount: 1, partial: false },
            commentCoverage: { eligible: 0, processed: 0, failed: 0, timedOut: 0 },
          }),
        });
        await fetch(`${base}/next`, { headers }); // group two handed out, never reported
      })().catch(() => undefined);
      return chrome;
    });
    try {
      const out = await extensionCollect({
        groups,
        outputDir: dir,
        now: new Date('2026-09-30T12:00:00Z'),
        week: '2026-09-27',
        startReceiver,
        launch,
        token,
        runSlackMs: 300,
      });
      expect(out.results.map((r: { slug: string; status: string }) => [r.slug, r.status])).toEqual([
        ['one', 'collected'],
        ['two', 'failed'],
        ['three', 'failed'],
      ]);
      expect(out.results[1]).toMatchObject({ reason: 'run-wall-budget' });
      expect(out.results[2]).toMatchObject({ reason: 'run-wall-budget' });
      const collected = out.results[0] as { filePath: string };
      expect(await readdir(dir)).toContain(basename(collected.filePath));
      expect(chrome.close).toHaveBeenCalled();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe('extensionCollect relaunches Chrome after a stalled group', () => {
  const token = 'c'.repeat(64);
  const headers = { 'x-llfb-token': token, 'content-type': 'application/json' };
  const groups = [
    { slug: 'one', label: 'One', groupId: '1' },
    { slug: 'two', label: 'Two', groupId: '2' },
    { slug: 'three', label: 'Three', groupId: '3' },
  ];
  const collectedBody = (slug: string) =>
    JSON.stringify({
      v: 1,
      slug,
      status: 'collected',
      stopReason: 'feed-end',
      units: [{ html: '<div>synthetic post</div>', position: 0 }],
      coverage: { ageRuleMet: true, harvestedCount: 1, slotCount: 1, partial: false },
      commentCoverage: { eligible: 0, processed: 0, failed: 0, timedOut: 0 },
    });
  // The fake extension: takes groups until /next says done; `hang` makes it lose its tab on one slug
  // (/tab-lost, deterministic: no wall-clock watchdog is involved, so slow CI cannot flake).
  // Like background.js (api() retries, then retryLater()), a 503 {relaunching} on /next is retried:
  // the relaunched extension can ask before extensionCollect's launch() returns and resume() runs.
  const drive = async (base: string, hang?: string) => {
    for (;;) {
      let res = await fetch(`${base}/next`, { headers });
      for (let retries = 0; res.status === 503 && retries < 200; retries += 1) {
        await new Promise((resolve) => setTimeout(resolve, 10));
        res = await fetch(`${base}/next`, { headers });
      }
      if (res.status !== 200) return;
      const job = await res.json();
      if (job.done) {
        await fetch(`${base}/finished`, { method: 'POST', headers, body: '{}' });
        return;
      }
      if (job.slug === hang) {
        await fetch(`${base}/tab-lost`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ slug: job.slug, reason: 'tab-closed' }),
        });
        return;
      }
      await fetch(`${base}/result`, { method: 'POST', headers, body: collectedBody(job.slug) });
    }
  };

  it('kills the stalled Chrome, relaunches the profile and finishes the remaining groups', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'fbx-relaunch-'));
    try {
      const { spawn, calls } = fakeSpawn();
      let launches = 0;
      const launch = vi.fn(async ({ url }: { url: string }) => {
        launches += 1;
        void drive(new URL(url).origin, launches === 1 ? 'one' : undefined).catch(() => undefined);
        return launchPlainChrome({
          url,
          profileDir: dir,
          spawn: spawn as never,
          chromeExecutable: 'chrome.exe',
          platform: 'win32',
        });
      });
      const out = await extensionCollect({
        groups,
        outputDir: dir,
        now: new Date('2026-09-30T12:00:00Z'),
        week: '2026-09-27',
        startReceiver: ((args: Record<string, unknown>) =>
          startReceiver({ ...args, stallMs: 60_000, log: () => {} } as never)) as never,
        launch,
        token,
        profileDir: dir,
        profileInUse: () => false,
      });
      expect(out.results.map((r: { slug: string; status: string }) => [r.slug, r.status])).toEqual([
        ['one', 'failed'],
        ['two', 'collected'],
        ['three', 'collected'],
      ]);
      expect(out.results[0]).toMatchObject({ reason: 'tab-closed' });
      expect(launches).toBe(2);
      expect(calls.map((c) => c.cmd)).toEqual(['chrome.exe', 'taskkill', 'chrome.exe', 'taskkill']);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('waits for the profile lockfile to free before relaunching', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'fbx-relaunch-'));
    try {
      let busyChecks = 3;
      const sleep = vi.fn(async () => undefined);
      let launches = 0;
      const out = await extensionCollect({
        groups,
        outputDir: dir,
        now: new Date('2026-09-30T12:00:00Z'),
        week: '2026-09-27',
        startReceiver: ((args: Record<string, unknown>) =>
          startReceiver({ ...args, stallMs: 60_000, log: () => {} } as never)) as never,
        launch: async ({ url }: { url: string }) => {
          launches += 1;
          void drive(new URL(url).origin, launches === 1 ? 'one' : undefined).catch(
            () => undefined,
          );
          return { pid: 1, close: async () => undefined };
        },
        token,
        profileDir: dir,
        // pre-flight check passes (false); then busy for 3 polls after the kill, then free
        profileInUse: (() => {
          let first = true;
          return () => {
            if (first) {
              first = false;
              return false;
            }
            return busyChecks-- > 0;
          };
        })(),
        sleep,
      });
      expect(launches).toBe(2);
      expect(sleep).toHaveBeenCalledTimes(3);
      expect(out.results.map((r: { status: string }) => r.status)).toEqual([
        'failed',
        'collected',
        'collected',
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('fails the remaining groups chrome-relaunch-failed when the profile never frees', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'fbx-relaunch-'));
    try {
      let first = true;
      const launch = vi.fn(async ({ url }: { url: string }) => {
        void drive(new URL(url).origin, 'one').catch(() => undefined);
        return { pid: 1, close: async () => undefined };
      });
      const out = await extensionCollect({
        groups,
        outputDir: dir,
        now: new Date('2026-09-30T12:00:00Z'),
        week: '2026-09-27',
        startReceiver: ((args: Record<string, unknown>) =>
          startReceiver({ ...args, stallMs: 60_000, log: () => {} } as never)) as never,
        launch,
        token,
        profileDir: dir,
        profileInUse: () => {
          if (first) {
            first = false;
            return false;
          }
          return true;
        },
        sleep: async () => undefined,
        relaunchWaitMs: 2_000,
      });
      expect(launch).toHaveBeenCalledTimes(1);
      expect(out.results).toEqual([
        { slug: 'one', status: 'failed', reason: 'tab-closed' },
        { slug: 'two', status: 'failed', reason: 'chrome-relaunch-failed' },
        { slug: 'three', status: 'failed', reason: 'chrome-relaunch-failed' },
      ]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

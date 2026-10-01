import { spawn as nodeSpawn } from 'node:child_process';
import { closeSync, existsSync, openSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { join } from 'node:path';

const ROOT = process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'longlive-fb');
const RUN_SLACK_MS = 10 * 60_000;
const RELAUNCH_WAIT_MS = 30_000;

export function chromeExecutable(env = process.env) {
  const roots = [env.PROGRAMFILES, env['PROGRAMFILES(X86)'], env.LOCALAPPDATA].filter(Boolean);
  return roots.map((root) => join(root, 'Google', 'Chrome', 'Application', 'chrome.exe'));
}

// Facebook stunts the feed for CDP-controlled Chrome, so this is plain Chrome: a profile dir,
// a new window and the receiver URL. Never a debugging port/pipe; Chrome 137+ ignores
// --load-extension, so the extension is loaded once by hand in this profile.
// Tab-hidden (FB-EXTENSION-1): Chrome throttles occluded windows and background renderers, and
// Facebook's infinite scroll does not load there — these keep the run's own window working when
// another window covers it. (A tab switched away from inside the run's window is still paused by
// the extension and reported failed{tab-hidden}.)
export const ANTI_THROTTLE_FLAGS = Object.freeze([
  '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding',
  '--disable-background-timer-throttling',
]);

export function plainChromeArgs(profileDir, url) {
  return [
    `--user-data-dir=${profileDir}`,
    '--new-window',
    '--no-first-run',
    // A relaunch after a killed Chrome must not reopen the group page that froze it.
    '--hide-crash-restore-bubble',
    ...ANTI_THROTTLE_FLAGS,
    url,
  ];
}

// Chrome on Windows creates <profile>/lockfile and holds it open while it runs. A second launch
// on a running profile just hands the URL to that process and ignores our flags, so the run must
// start Chrome itself. Exists + cannot be opened read-write = in use; a stale file opens fine.
export function chromeProfileInUse(
  profileDir,
  { exists = existsSync, open = openSync, close = closeSync } = {},
) {
  const lockfile = join(profileDir, 'lockfile');
  if (!exists(lockfile)) return false;
  try {
    close(open(lockfile, 'r+'));
    return false;
  } catch (error) {
    return error?.code !== 'ENOENT';
  }
}

export const PROFILE_OPEN_MESSAGE =
  'The Long Live Chrome profile was already open — close that Chrome window and rerun (the export must start Chrome itself).';

export async function launchPlainChrome({
  url,
  profileDir = ROOT && join(ROOT, 'chrome-profile'),
  spawn = nodeSpawn,
  chromeExecutable: executable,
  platform = process.platform,
  mkdirImpl = mkdir,
} = {}) {
  if (!url) throw new Error('launchPlainChrome requires a url');
  if (!profileDir) throw new Error('LOCALAPPDATA is unavailable');
  const candidates = executable ? [executable] : chromeExecutable();
  const chrome = spawn === nodeSpawn ? candidates.find(existsSync) : candidates[0];
  if (!chrome) throw new Error('Google Chrome executable was not found');
  await mkdirImpl(profileDir, { recursive: true });
  const child = spawn(chrome, plainChromeArgs(profileDir, url), {
    detached: false,
    stdio: 'ignore',
    windowsHide: false,
  });
  child.unref?.();
  child.on?.('error', () => undefined);
  let livePid = child.pid;
  return {
    pid: child.pid,
    async close() {
      if (!livePid) return;
      // Once only: a second close() must never signal a pid the OS may have reused.
      const pid = livePid;
      livePid = null;
      try {
        if (platform === 'win32') {
          const killer = spawn('taskkill', ['/PID', String(pid), '/T', '/F'], {
            stdio: 'ignore',
            windowsHide: true,
          });
          killer.on?.('error', () => undefined);
        } else {
          process.kill(pid);
        }
      } catch {
        // already gone
      }
    },
  };
}

// A lost tab (the receiver's stall watchdog, or the extension's /tab-lost) fails only its group.
// extensionCollect then kills that Chrome (taskkill /T /F), waits for the profile lockfile to
// free, starts Chrome again on the same receiver URL and lets the remaining groups run (capped at
// maxRelaunches).
async function profileFree(profileDir, profileInUse, sleep, waitMs) {
  if (!profileDir) return true;
  for (let waited = 0; ; waited += 1_000) {
    if (!profileInUse(profileDir)) return true;
    if (waited >= waitMs) return false;
    await sleep(1_000);
  }
}

export async function extensionCollect({
  groups,
  root = ROOT,
  outputDir,
  now = new Date(),
  week,
  startReceiver,
  launch = launchPlainChrome,
  profileDir = ROOT && join(ROOT, 'chrome-profile'),
  profileInUse = launch === launchPlainChrome ? (dir) => chromeProfileInUse(dir) : () => false,
  token = randomBytes(32).toString('hex'),
  setTimer = setTimeout,
  clearTimer = clearTimeout,
  runSlackMs = RUN_SLACK_MS,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  maxRelaunches = groups.length,
  relaunchWaitMs = RELAUNCH_WAIT_MS,
} = {}) {
  if (profileDir && profileInUse(profileDir)) {
    return {
      results: groups.map((g) => ({
        slug: g.slug,
        status: 'failed',
        reason: 'chrome-profile-open',
      })),
      actingPageId: null,
    };
  }
  const start = startReceiver ?? (await import('./fb-export-receiver.mjs')).startReceiver;
  const totalMs = groups.reduce((sum, g) => sum + (g.wallBudgetMs ?? 20 * 60_000), 0) + runSlackMs;
  const receiver = await start({ groups, token, root, outputDir, now, week });
  let chrome;
  let timer;
  try {
    chrome = await launch({ url: receiver.url });
    const timeout = new Promise((resolve) => {
      timer = setTimer(() => resolve('timeout'), totalMs);
    });
    let outcome;
    for (let relaunches = 0; ; relaunches += 1) {
      outcome = await Promise.race([
        receiver.done,
        timeout,
        receiver.lostSignal?.() ?? new Promise(() => {}),
      ]);
      if (outcome !== 'lost') break;
      await chrome?.close?.();
      chrome = null;
      let relaunched = false;
      if (
        relaunches < maxRelaunches &&
        (await profileFree(profileDir, profileInUse, sleep, relaunchWaitMs))
      ) {
        try {
          chrome = await launch({ url: receiver.url });
          relaunched = true;
        } catch {
          // reported below as chrome-relaunch-failed
        }
      }
      if (!relaunched) {
        outcome = 'relaunch-failed';
        break;
      }
      receiver.resume?.();
    }
    if (outcome === 'timeout' || outcome === 'relaunch-failed') {
      const reason = outcome === 'timeout' ? 'run-wall-budget' : 'chrome-relaunch-failed';
      // Optional: a receiver that exposes results gathered so far keeps them.
      const results = receiver.partialResults?.();
      const have = Array.isArray(results) ? results : [];
      const seen = new Set(have.map((r) => r.slug));
      return {
        results: [
          ...have,
          ...groups
            .filter((g) => !seen.has(g.slug))
            .map((g) => ({ slug: g.slug, status: 'failed', reason })),
        ],
        actingPageId: null,
      };
    }
    return { results: outcome, actingPageId: null };
  } finally {
    if (timer) clearTimer(timer);
    await chrome?.close?.();
    await receiver.close?.();
  }
}

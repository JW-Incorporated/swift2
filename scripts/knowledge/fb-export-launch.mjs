import { spawn as nodeSpawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { join } from 'node:path';

const ROOT = process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'longlive-fb');
const RUN_SLACK_MS = 10 * 60_000;

export function chromeExecutable(env = process.env) {
  const roots = [env.PROGRAMFILES, env['PROGRAMFILES(X86)'], env.LOCALAPPDATA].filter(Boolean);
  return roots.map((root) => join(root, 'Google', 'Chrome', 'Application', 'chrome.exe'));
}

// Facebook stunts the feed for CDP-controlled Chrome, so this is plain Chrome: a profile dir,
// a new window and the receiver URL. Never a debugging port/pipe; Chrome 137+ ignores
// --load-extension, so the extension is loaded once by hand in this profile.
export function plainChromeArgs(profileDir, url) {
  return [`--user-data-dir=${profileDir}`, '--new-window', '--no-first-run', url];
}

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
  const pid = child.pid;
  return {
    pid,
    async close() {
      if (!pid) return;
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

export async function extensionCollect({
  groups,
  root = ROOT,
  outputDir,
  now = new Date(),
  week,
  startReceiver,
  launch = launchPlainChrome,
  token = randomBytes(32).toString('hex'),
  setTimer = setTimeout,
  clearTimer = clearTimeout,
  runSlackMs = RUN_SLACK_MS,
} = {}) {
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
    const outcome = await Promise.race([receiver.done, timeout]);
    if (outcome === 'timeout') {
      // Optional: a receiver that exposes results gathered so far keeps them.
      const results = receiver.partialResults?.();
      const have = Array.isArray(results) ? results : [];
      const seen = new Set(have.map((r) => r.slug));
      return {
        results: [
          ...have,
          ...groups
            .filter((g) => !seen.has(g.slug))
            .map((g) => ({ slug: g.slug, status: 'failed', reason: 'run-wall-budget' })),
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

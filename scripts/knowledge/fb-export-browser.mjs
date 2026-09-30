import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';

const ROOT = process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'longlive-fb');

export function chromeExecutable(env = process.env) {
  const roots = [env.PROGRAMFILES, env['PROGRAMFILES(X86)'], env.LOCALAPPDATA].filter(Boolean);
  return roots.map((root) => join(root, 'Google', 'Chrome', 'Application', 'chrome.exe'));
}

export function collectorLaunchOptions(executablePath, profileDir) {
  return {
    executablePath,
    userDataDir: profileDir,
    headless: false,
    defaultViewport: null,
    ignoreDefaultArgs: ['--enable-automation'],
    args: ['--disable-blink-features=AutomationControlled'],
  };
}

// Live 2026-09-30: a puppeteer.launch()ed Chrome (its ~20 default switches) stopped getting
// Facebook's infinite feed after a few runs, while plain Chrome on the SAME profile kept
// loading. So start Chrome exactly as a person would (only the profile dir plus a debugging
// port Chrome picks itself) and attach to it. Port 0 → Chrome writes DevToolsActivePort.
export function plainChromeArgs(profileDir) {
  return [
    `--user-data-dir=${profileDir}`,
    '--remote-debugging-port=0',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank',
  ];
}

async function readDevToolsEndpoint(profileDir, { timeoutMs = 30_000, sleep } = {}) {
  const file = join(profileDir, 'DevToolsActivePort');
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const text = await readFile(file, 'utf8').catch(() => '');
    const [port, path] = text.split(/\r?\n/);
    if (/^\d+$/.test(port ?? '') && path) return `ws://127.0.0.1:${port}${path}`;
    await sleep(250);
  }
  throw new Error('Chrome did not publish a DevTools endpoint (is the profile already open?)');
}

export async function launchCollectorBrowser({
  executablePath,
  profileDir = join(ROOT, 'chrome-profile'),
  spawnImpl = spawn,
  connect = (options) => puppeteer.connect(options),
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
} = {}) {
  const candidates = executablePath ? [executablePath] : chromeExecutable();
  const chrome = candidates.find(existsSync);
  if (!chrome) throw new Error('Google Chrome executable was not found');
  await mkdir(profileDir, { recursive: true });
  // A stale file from a previous session would point at a dead port.
  await rm(join(profileDir, 'DevToolsActivePort'), { force: true });
  const child = spawnImpl(chrome, plainChromeArgs(profileDir), {
    detached: false,
    stdio: 'ignore',
    windowsHide: false,
  });
  child.unref?.();
  const browserWSEndpoint = await readDevToolsEndpoint(profileDir, { sleep });
  return connect({ browserWSEndpoint, defaultViewport: null });
}

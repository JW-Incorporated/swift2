import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
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

export async function launchCollectorBrowser({
  executablePath,
  profileDir = join(ROOT, 'chrome-profile'),
} = {}) {
  const candidates = executablePath ? [executablePath] : chromeExecutable();
  const chrome = candidates.find(existsSync);
  if (!chrome) throw new Error('Google Chrome executable was not found');
  await mkdir(profileDir, { recursive: true });
  return puppeteer.launch(collectorLaunchOptions(chrome, profileDir));
}

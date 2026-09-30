#!/usr/bin/env node
/* global document, location, window */
import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import puppeteer from 'puppeteer-core';
import { FB_GROUPS_CHECKLIST } from './fb-groups-checklist.mjs';
import {
  classifyPage,
  exportFileName,
  localDate,
  oldestVisibleAge,
  stopDecision,
} from './fb-export-helpers.mjs';

const execFileAsync = promisify(execFile);
const ROOT = process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'longlive-fb');

export function chromeExecutable(env = process.env) {
  const roots = [env.PROGRAMFILES, env['PROGRAMFILES(X86)'], env.LOCALAPPDATA].filter(Boolean);
  return roots.map((root) => join(root, 'Google', 'Chrome', 'Application', 'chrome.exe'));
}

export async function readDpapiPassword({ exec = execFileAsync, root = ROOT } = {}) {
  if (!root) throw new Error('LOCALAPPDATA is unavailable');
  const credentialPath = join(root, 'fb-cred.xml');
  const command = `$c=Import-Clixml -LiteralPath '${credentialPath.replaceAll("'", "''")}'; [Console]::Out.Write($c.GetNetworkCredential().Password)`;
  try {
    const { stdout } = await exec(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', command],
      {
        windowsHide: true,
        maxBuffer: 64 * 1024,
      },
    );
    if (!stdout) throw new Error('empty credential');
    return stdout;
  } catch {
    throw new Error('Facebook DPAPI credential could not be read; recreate fb-cred.xml');
  }
}

async function inspectPage(page) {
  const state = await page.evaluate(() => {
    const elements = [...document.querySelectorAll('button, [role="button"], input')];
    const name = (el) =>
      el.getAttribute('aria-label') || el.textContent || el.getAttribute('value') || '';
    return {
      text: document.body?.innerText?.slice(0, 50_000) || '',
      hasPassword: Boolean(document.querySelector('input[type="password"], input[name="pass"]')),
      hasJoinGroup: elements.some((el) => /^Join group$/i.test(name(el).trim())),
    };
  });
  return classifyPage({ url: page.url(), ...state });
}

async function facebookSessionCookie(page) {
  const cookies = await page.cookies('https://www.facebook.com/');
  return cookies.some(
    (cookie) => cookie.name === 'c_user' && /(^|\.)facebook\.com$/i.test(cookie.domain),
  );
}

async function sessionStatus(page) {
  const classification = await inspectPage(page);
  if (classification === 'checkpoint' || classification === 'captcha') return 'checkpoint';
  if (classification === 'login') return 'login-failed';
  return (await facebookSessionCookie(page)) ? 'ready' : 'login-failed';
}

async function waitForSession(
  page,
  {
    timeoutMs,
    pollIntervalMs = 1_000,
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  },
) {
  const deadline = Date.now() + timeoutMs;
  do {
    const status = await sessionStatus(page);
    if (status === 'ready' || status === 'checkpoint') return status;
    if (Date.now() >= deadline) return 'login-failed';
    await sleep(Math.min(pollIntervalMs, Math.max(0, deadline - Date.now())));
  } while (true);
}

async function automatedLoginOnce(page, passwordReader) {
  const passwordInput = await page.$('input[type="password"], input[name="pass"]');
  if (!passwordInput) return false;
  const password = await passwordReader();
  try {
    await passwordInput.type(password, { delay: 35 });
  } finally {
    // Keep no second reference alive beyond the form fill.
  }
  const submit = await page.$('button[name="login"], button[type="submit"], input[type="submit"]');
  if (!submit) throw new Error('Facebook login submit control was not found');
  await Promise.allSettled([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 45_000 }),
    submit.click(),
  ]);
  return true;
}

export async function establishSession(page, options = {}) {
  await page.goto('https://www.facebook.com/', {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });
  const initialStatus = await sessionStatus(page);
  if (initialStatus === 'ready' || initialStatus === 'checkpoint') return initialStatus;

  const passwordInput = await page.$('input[type="password"], input[name="pass"]');
  const identity = passwordInput
    ? await page.$eval('input[name="email"]', (el) => el.value).catch(() => 'saved-account')
    : '';
  if (options.interactiveSetup && !identity) {
    console.log(
      'Facebook profile setup: sign in manually in the visible Chrome window; waiting up to 5 minutes.',
    );
    return waitForSession(page, {
      timeoutMs: options.interactiveTimeoutMs ?? 300_000,
      pollIntervalMs: options.pollIntervalMs,
      sleep: options.sleep,
    });
  }
  if (!passwordInput || !identity) return 'login-failed';

  try {
    await automatedLoginOnce(page, options.passwordReader ?? readDpapiPassword);
  } catch {
    return 'login-failed';
  }
  return waitForSession(page, {
    timeoutMs: options.automatedTimeoutMs ?? 45_000,
    pollIntervalMs: options.pollIntervalMs,
    sleep: options.sleep,
  });
}

async function clickSeeMore(page) {
  return page.evaluate(() => {
    let count = 0;
    for (const article of document.querySelectorAll('[role="article"]')) {
      for (const control of article.querySelectorAll('button, [role="button"]')) {
        const name = (control.getAttribute('aria-label') || control.textContent || '').trim();
        if (/^See more$/i.test(name)) {
          control.click();
          count += 1;
        }
      }
    }
    return count;
  });
}

async function visibleTimes(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('[role="article"]')].flatMap((article) =>
      [...article.querySelectorAll('abbr, time, a[aria-label]')]
        .map(
          (el) =>
            el.getAttribute('datetime') ||
            el.getAttribute('title') ||
            el.getAttribute('aria-label') ||
            el.textContent,
        )
        .filter(Boolean),
    ),
  );
}

export async function writeDiagnostic(page, directory, slug) {
  await mkdir(directory, { recursive: true });
  const screenshotPath = join(directory, `${slug}-selector-failure.png`);
  const dumpPath = join(directory, `${slug}-accessible-names.json`);
  await page.screenshot({ path: screenshotPath, fullPage: false }).catch(() => undefined);
  const names = await page
    .evaluate(() =>
      [...document.querySelectorAll('[role], [aria-label]')].slice(0, 500).map((el) => ({
        role: el.getAttribute('role'),
        name: el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 160) || '',
      })),
    )
    .catch(() => []);
  await writeFile(dumpPath, JSON.stringify({ url: page.url(), names }, null, 2), 'utf8');
  return { screenshotPath, dumpPath };
}

export async function collectGroup(page, group, options = {}) {
  const now = options.now ?? new Date();
  const outputDir = options.outputDir;
  const sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const random = options.random ?? Math.random;
  const url = `https://www.facebook.com/groups/${group.groupId}?sorting_setting=CHRONOLOGICAL`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });

  let classification = await inspectPage(page);
  if (classification === 'login') return { slug: group.slug, status: 'login-failed' };
  if (classification === 'captcha') classification = 'checkpoint';
  if (classification !== 'ready') return { slug: group.slug, status: classification };

  let previousHeight = 0;
  let stagnantScrolls = 0;
  for (let scrollCount = 0; ; scrollCount += 1) {
    await clickSeeMore(page);
    const oldestAgeMs = oldestVisibleAge(await visibleTimes(page), now);
    const decision = stopDecision({
      oldestAgeMs,
      stagnantScrolls,
      scrollCount,
      scrollCap: options.scrollCap,
    });
    if (decision.stop) {
      if (!decision.ageRuleMet)
        return { slug: group.slug, status: 'scroll-cap', ageRuleMet: false };
      const filePath = join(outputDir, exportFileName(group.slug, localDate(now)));
      await mkdir(outputDir, { recursive: true });
      await writeFile(filePath, await page.content(), 'utf8');
      return {
        slug: group.slug,
        status: 'collected',
        filePath,
        ageRuleMet: true,
        stopReason: decision.reason,
      };
    }
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    stagnantScrolls = height === previousHeight ? stagnantScrolls + 1 : 0;
    previousHeight = height;
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await sleep(2_000 + Math.floor(random() * 3_001));
  }
}

export async function launchCollectorBrowser({
  executablePath,
  profileDir = join(ROOT, 'chrome-profile'),
} = {}) {
  const candidates = executablePath ? [executablePath] : chromeExecutable();
  const { existsSync } = await import('node:fs');
  const chrome = candidates.find(existsSync);
  if (!chrome) throw new Error('Google Chrome executable was not found');
  await mkdir(profileDir, { recursive: true });
  return puppeteer.launch(collectorLaunchOptions(chrome, profileDir));
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

export async function collectAll({
  groups = FB_GROUPS_CHECKLIST,
  outputDir,
  browserFactory = launchCollectorBrowser,
  interactiveSetup = false,
  sessionOptions = {},
} = {}) {
  const browser = await browserFactory();
  const page = (await browser.pages())[0] ?? (await browser.newPage());
  const results = [];
  try {
    const session = await establishSession(page, {
      ...sessionOptions,
      interactiveSetup,
    });
    if (session !== 'ready') {
      if (groups[0]) results.push({ slug: groups[0].slug, status: session });
      return results;
    }
    for (const group of groups) {
      try {
        const result = await collectGroup(page, group, { outputDir });
        results.push(result);
        if (['checkpoint', 'login-failed'].includes(result.status)) break;
      } catch (error) {
        const diagnostic = await writeDiagnostic(page, outputDir, group.slug);
        results.push({
          slug: group.slug,
          status: 'selector-failure',
          diagnostic,
          message: error.message,
        });
      }
    }
  } finally {
    await browser.close();
  }
  return results;
}

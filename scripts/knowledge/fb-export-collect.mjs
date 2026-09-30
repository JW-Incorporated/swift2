#!/usr/bin/env node
/* global document, window */
import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { FB_GROUPS_CHECKLIST, FB_READ_AS } from './fb-groups-checklist.mjs';
import { launchCollectorBrowser } from './fb-export-browser.mjs';
import {
  buildHarvestedHtml,
  captureVisibleUnits,
  expandVisibleUnits,
  mergeHarvest,
} from './fb-export-harvest.mjs';
import { ensureActingAsPage, ensurePersonalProfile } from './fb-export-profile.mjs';
export { chromeExecutable, collectorLaunchOptions } from './fb-export-browser.mjs';
export { ensureActingAsPage } from './fb-export-profile.mjs';
import {
  classifyPage,
  exportFileName,
  harvestCoverageAge,
  localDate,
  recentHarvestUnits,
  stopDecision,
  trailingOldBoundary,
} from './fb-export-helpers.mjs';

const execFileAsync = promisify(execFile);
const ROOT = process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'longlive-fb');

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
  } while (Date.now() <= deadline);
  return 'login-failed';
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
  const clock = options.clock ?? Date.now;
  const startedAtMs = clock();
  const url = `https://www.facebook.com/groups/${group.groupId}?sorting_setting=CHRONOLOGICAL`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  // Live 2026-09-30: at domcontentloaded the group shell has no feed, join button or
  // "isn't available" text yet, so an unavailable group was misread as an empty feed.
  // Wait for one of the three to render before classifying.
  await page
    .waitForFunction?.(
      () =>
        document.querySelector('[role="feed"], [role="article"]') ||
        /this content isn['’]t available|join group/i.test(document.body?.innerText ?? ''),
      { timeout: 20_000 },
    )
    ?.catch(() => {});

  let classification = await inspectPage(page);
  if (classification === 'login') return { slug: group.slug, status: 'login-failed' };
  if (classification === 'captcha') classification = 'checkpoint';
  if (classification !== 'ready') return { slug: group.slug, status: classification };

  let harvest = { units: [], nextSyntheticPosition: 1, maxPosinset: 0 };
  let previousHarvestCount = 0;
  let previousMaxPosinset = 0;
  let stagnantScrolls = 0;
  for (let scrollCount = 0; ; scrollCount += 1) {
    const expanded = await expandVisibleUnits(page);
    if (expanded) await sleep(options.expandWaitMs ?? 500);
    const snapshot = await captureVisibleUnits(page);
    harvest = mergeHarvest(harvest, snapshot);
    const madeProgress = snapshot.maxPosinset
      ? snapshot.maxPosinset > previousMaxPosinset
      : harvest.units.length > previousHarvestCount;
    stagnantScrolls = madeProgress ? 0 : stagnantScrolls + 1;
    previousHarvestCount = harvest.units.length;
    previousMaxPosinset = Math.max(previousMaxPosinset, snapshot.maxPosinset);
    const ageBoundary = trailingOldBoundary(harvest.units, now);
    const decision = stopDecision({
      ageStopMet: Boolean(ageBoundary),
      stagnantScrolls,
      scrollCount,
      elapsedMs: clock() - startedAtMs,
      scrollCap: options.scrollCap,
      wallBudgetMs: options.wallBudgetMs,
    });
    if (decision.stop) {
      const recentUnits = recentHarvestUnits(harvest.units, now);
      const coverageAgeMs = harvestCoverageAge(harvest.units, now, decision.reason);
      if (harvest.units.length > 0 && recentUnits.length === 0) {
        return {
          slug: group.slug,
          status: 'no-recent-posts',
          ageRuleMet: decision.ageRuleMet,
          stopReason: decision.reason,
          harvestedCount: harvest.units.length,
          recentCount: 0,
          slotCount: harvest.maxPosinset,
          coverageAgeMs,
          partial: ['scroll-cap', 'wall-budget'].includes(decision.reason),
          collectedAt: now.toISOString(),
        };
      }
      const filePath = join(outputDir, exportFileName(group.slug, localDate(now)));
      await mkdir(outputDir, { recursive: true });
      await writeFile(
        filePath,
        buildHarvestedHtml(`${group.label} Facebook export`, recentUnits),
        'utf8',
      );
      return {
        slug: group.slug,
        status: 'collected',
        filePath,
        ageRuleMet: decision.ageRuleMet,
        stopReason: decision.reason,
        harvestedCount: harvest.units.length,
        recentCount: recentUnits.length,
        slotCount: harvest.maxPosinset,
        coverageAgeMs,
        partial: ['scroll-cap', 'wall-budget'].includes(decision.reason),
        collectedAt: now.toISOString(),
      };
    }
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await sleep(2_000 + Math.floor(random() * 3_001));
  }
}

export async function collectAll({
  groups = FB_GROUPS_CHECKLIST,
  outputDir,
  browserFactory = launchCollectorBrowser,
  interactiveSetup = false,
  sessionOptions = {},
  profileOptions = {},
  probeProfile = false,
  readAs = FB_READ_AS,
  groupOptions = {},
} = {}) {
  const browser = await browserFactory();
  const page = (await browser.pages())[0] ?? (await browser.newPage());
  const results = [];
  let discoveredActingPageId;
  try {
    const session = await establishSession(page, {
      ...sessionOptions,
      interactiveSetup,
    });
    if (session !== 'ready') {
      results.push({ slug: groups[0]?.slug ?? 'profile', status: session });
      return { results, actingPageId: null };
    }
    const ensureProfile = readAs === 'page' ? ensureActingAsPage : ensurePersonalProfile;
    const profile = await ensureProfile(page, { ...profileOptions, probe: probeProfile });
    discoveredActingPageId = profile.actingPageId;
    if (profile.status !== 'ready')
      return {
        results: [{ slug: 'profile', status: 'wrong-profile' }],
        actingPageId: profile.actingPageId,
      };
    if (probeProfile) return { results: [], actingPageId: profile.actingPageId };
    for (const group of groups) {
      try {
        const result = await collectGroup(page, group, { outputDir, ...groupOptions });
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
  return { results, actingPageId: discoveredActingPageId };
}

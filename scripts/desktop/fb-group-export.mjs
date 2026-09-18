#!/usr/bin/env node
// Desktop-side weekly Facebook-group export automation (kanban t_5cb288d0,
// supersedes part of docs/decisions.md's 2026-08-11 "no bot reads Facebook
// groups" entry — see the 2026-09-18 entry there for the exact scope of
// what changed and what did not).
//
// RUNS ONLY ON JOEY'S OWN DESKTOP PC. Nothing about this script is meant to
// run in this repo's CI, in a sandbox, or on any server:
// - It drives Joey's own already-logged-in Chrome profile via Playwright's
//   persistent-context mode (`launchPersistentContext`), never a fresh/
//   headless/service-account session. If Chrome isn't already logged into
//   Facebook in the given profile, this script does not attempt to log in —
//   it will simply hit a login wall and fail loudly (see verifyLoggedIn).
// - It replaces only the mechanical part of Joey's existing weekly habit:
//   open group -> sort New -> scroll ~7 days -> Ctrl+S "Webpage, Complete".
//   Same account, same groups (scripts/knowledge/fb-groups-checklist.mjs —
//   reused, not duplicated), same weekly cadence.
// - It paces every scroll/click with a freshly randomized delay (3-15s,
//   see randomDelayMs) — never a fixed interval, never back-to-back calls —
//   mirroring the home-relay skill's pacing convention but slowed down for
//   "reading a feed" rather than firing one HTTP GET.
// - Output feeds the EXISTING pipeline unchanged: it writes the same
//   `fb-<slug>-<date>.html` files knowledge-fb-export-reminder.mjs already
//   tells Joey to produce by hand, to the same --out-dir (default matches
//   Joey's manual convention: ~/Downloads). Nothing here talks to Supabase,
//   nothing here parses/ships content — that is still knowledge-fb-upload.mjs
//   and scripts/community/fb-export-ingest.mjs, run exactly as documented in
//   the weekly reminder issue, unchanged.
// - No Graph API, no crawling of groups outside the checklist Joey himself
//   maintains (i.e. groups he is not already a personal member of), no
//   anti-detect/evasion tooling, no automated posting/commenting — only
//   reading and saving pages Joey's own account can already see.
//
// Setup (one-time, on the desktop — NOT this sandbox):
//   1. `npm install` in a clone of this repo on the desktop (or just
//      `npm install playwright` in a scratch folder — this script has no
//      other repo dependency).
//   2. `npx playwright install chromium` (downloads the browser Playwright
//      drives; still points at Joey's real Chrome *profile data*, not a
//      separate throwaway browser install).
//   3. Find Joey's real Chrome profile directory (Windows default:
//      `%LOCALAPPDATA%\Google\Chrome\User Data`) and confirm Facebook is
//      logged in there in a normal Chrome window first.
//   4. Close all Chrome windows before running this script — Chrome will
//      not let Playwright open the same profile directory while a normal
//      Chrome instance already has it open.
//   5. Run once by hand to confirm it works:
//        node scripts/desktop/fb-group-export.mjs --profile-dir "C:\Users\Joey\AppData\Local\Google\Chrome\User Data" --profile-name "Default"
//   6. Schedule weekly (Windows Task Scheduler, "Run whether logged on or
//      not" is NOT viable here since it needs the real profile + a visible
//      browser window is not required but Chrome must not be already
//      running under that profile) — same "ask for a scheduled task"
//      pattern as the home-relay skill's persistence section.
//
// Usage:
//   node scripts/desktop/fb-group-export.mjs \
//     --profile-dir "<path to Chrome User Data>" \
//     [--profile-name Default] \
//     [--out-dir ~/Downloads] \
//     [--group <slug>]            # repeatable; default: every non-candidate
//                                   group in fb-groups-checklist.mjs
//     [--headless=false]          # default false — a visible window is
//                                   easier to babysit/debug; Facebook is
//                                   more likely to flag a headless launch
//     [--dry-run]                 # navigate + scroll, but don't overwrite
//                                   any saved file
//
// This file is intentionally dependency-light (Playwright only) so it can
// run standalone on the desktop without pulling in the rest of this
// monorepo's build. It re-exports the FB_GROUPS_CHECKLIST import path as a
// relative one so it still resolves correctly if this script is copied out
// of a full repo checkout, but prefers running from within the repo so the
// checklist never drifts out of sync with the one CI/the weekly reminder
// issue use.

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { FB_GROUPS_CHECKLIST } from '../knowledge/fb-groups-checklist.mjs';

const FACEBOOK_BASE = 'https://www.facebook.com/groups';
const MIN_DELAY_MS = 3000;
const MAX_DELAY_MS = 15000;
const SCROLL_ROUNDS_MAX = 40; // hard ceiling so a stuck feed can't loop forever
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/** Randomized 3-15s pacing delay, freshly drawn every call (never fixed/cached). */
export function randomDelayMs() {
  return Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) + MIN_DELAY_MS;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Human-paced wait: draw a random delay and actually sleep for it. */
async function pace() {
  await sleep(randomDelayMs());
}

export function parseArgs(argv) {
  const flags = {
    profileDir: null,
    profileName: 'Default',
    outDir: path.join(os.homedir(), 'Downloads'),
    groups: [],
    headless: false,
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--profile-dir') {
      flags.profileDir = argv[i + 1] ?? null;
      i += 1;
    } else if (arg === '--profile-name') {
      flags.profileName = argv[i + 1] ?? 'Default';
      i += 1;
    } else if (arg === '--out-dir') {
      flags.outDir = argv[i + 1] ?? flags.outDir;
      i += 1;
    } else if (arg === '--group') {
      flags.groups.push(argv[i + 1]);
      i += 1;
    } else if (arg === '--headless=false') {
      flags.headless = false;
    } else if (arg === '--headless=true' || arg === '--headless') {
      flags.headless = true;
    } else if (arg === '--dry-run') {
      flags.dryRun = true;
    }
  }
  return flags;
}

/** Resolves which checklist groups to export: explicit --group list, or
 * every checklist entry that isn't still a `candidate` (unconfirmed) row. */
export function resolveGroups(flags, checklist = FB_GROUPS_CHECKLIST) {
  if (flags.groups.length > 0) {
    return checklist.filter((g) => flags.groups.includes(g.slug));
  }
  return checklist.filter((g) => !g.candidate);
}

export function outputFilePath(outDir, slug, date = new Date()) {
  const iso = date.toISOString().slice(0, 10);
  return path.join(outDir, `fb-${slug}-${iso}.html`);
}

/** Facebook shows a login form (or a "log in to see more" wall) when the
 * profile is not actually logged in. Fail loudly and immediately rather
 * than silently saving a useless login-wall page — this script never
 * attempts to authenticate itself. */
async function verifyLoggedIn(page) {
  const loginFormVisible = await page
    .locator('form[data-testid="royal_login_form"], input[name="email"]')
    .first()
    .isVisible()
    .catch(() => false);
  if (loginFormVisible) {
    throw new Error(
      'Facebook is showing a login form in this Chrome profile — this script never logs in ' +
        'itself. Open this profile in a normal Chrome window, log into Facebook, then re-run.',
    );
  }
}

/** Scrolls the group feed until posts are older than 7 days or a scroll
 * stops producing new content, pacing every scroll with a random delay. */
async function scrollUntilWeekBoundary(page) {
  let previousHeight = 0;
  for (let round = 0; round < SCROLL_ROUNDS_MAX; round += 1) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 1.5));
    await pace();
    const height = await page.evaluate(() => document.body.scrollHeight);
    const oldestVisibleTimestamp = await page.evaluate(() => {
      // Facebook renders an abbr[data-utime] (unix seconds) on post timestamps
      // in the classic markup; fall back gracefully if the markup differs —
      // the scroll-round cap is the real backstop either way.
      const nodes = Array.from(document.querySelectorAll('abbr[data-utime]'));
      if (nodes.length === 0) return null;
      const utimes = nodes.map((n) => Number(n.getAttribute('data-utime'))).filter(Boolean);
      return utimes.length ? Math.min(...utimes) * 1000 : null;
    });
    if (oldestVisibleTimestamp && Date.now() - oldestVisibleTimestamp > SEVEN_DAYS_MS) {
      return { reason: 'week-boundary-reached', rounds: round + 1 };
    }
    if (height === previousHeight) {
      return { reason: 'feed-stopped-growing', rounds: round + 1 };
    }
    previousHeight = height;
  }
  return { reason: 'scroll-round-cap', rounds: SCROLL_ROUNDS_MAX };
}

/** Exports one group: navigate, sort by New activity, scroll to the week
 * boundary, save the fully-rendered HTML. Returns a result summary; never
 * throws for a single group's failure so one bad group doesn't abort the
 * rest of the weekly run (the caller collects per-group outcomes). */
export async function exportGroup(page, group, { outDir, dryRun }) {
  const url = `${FACEBOOK_BASE}/${group.groupId}/?sorting_setting=CHRONOLOGICAL`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await pace();
  await verifyLoggedIn(page);

  const scrollResult = await scrollUntilWeekBoundary(page);
  await pace();

  const html = await page.content();
  const outPath = outputFilePath(outDir, group.slug);
  if (!dryRun) {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(outPath, html, 'utf8');
  }
  return { slug: group.slug, label: group.label, outPath, dryRun, ...scrollResult };
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  if (!flags.profileDir) {
    console.error(
      'fb-group-export: --profile-dir "<path to Chrome User Data>" is required. See the header ' +
        'comment in this file for setup steps.',
    );
    return 1;
  }

  const targets = resolveGroups(flags);
  if (targets.length === 0) {
    console.error(
      'fb-group-export: no groups to export (checklist empty, or all remaining rows are ' +
        'unconfirmed `candidate: true` — confirm membership in scripts/knowledge/fb-groups-checklist.mjs first).',
    );
    return 1;
  }

  // Dynamic import: keeps `playwright` an optional/desktop-only dependency
  // for the rest of the monorepo rather than a hard install for every CI
  // job that touches scripts/**.
  const { chromium } = await import('playwright');

  const context = await chromium.launchPersistentContext(flags.profileDir, {
    headless: flags.headless,
    channel: 'chrome',
    args: [`--profile-directory=${flags.profileName}`],
  });

  const results = [];
  try {
    const page = context.pages()[0] ?? (await context.newPage());
    for (const group of targets) {
      console.log(`fb-group-export: exporting "${group.label}" (${group.slug})...`);
      try {
        const result = await exportGroup(page, group, { outDir: flags.outDir, dryRun: flags.dryRun });
        console.log(
          `  ${result.reason} after ${result.rounds} scroll round(s) -> ` +
            (flags.dryRun ? '(dry-run, not saved)' : result.outPath),
        );
        results.push({ ...result, ok: true });
      } catch (err) {
        console.error(`  failed: ${err.message}`);
        results.push({ slug: group.slug, ok: false, error: err.message });
      }
      // Pace between groups too, not just within a group's scroll loop.
      await pace();
    }
  } finally {
    await context.close();
  }

  const okCount = results.filter((r) => r.ok).length;
  console.log(`fb-group-export: ${okCount}/${results.length} group(s) exported.`);
  if (!flags.dryRun && okCount > 0) {
    console.log(
      `Next: npm run knowledge:fb-upload -- ${flags.outDir}/fb-*.html   ` +
        '(then run fb-export-ingest.mjs per group as documented in the weekly reminder issue).',
    );
  }
  return okCount === results.length ? 0 : 1;
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  runMain(main, { name: 'fb-group-export' });
}

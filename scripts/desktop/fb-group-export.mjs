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
// - **No headless option.** The decision this script implements is scoped
//   to a normal, visible, human-usable browser window — the same reasoning
//   the home-relay skill gives for randomized pacing (defeating rate
//   heuristics is not the same as defeating headless/automation-framework
//   fingerprinting) applies doubly to headless mode, which is itself a
//   detectable automation signal. There is deliberately no CLI flag for
//   this; it always launches headed.
// - **Known caveat, read before relying on this in a real weekly run:**
//   Chrome 136+ blocks CDP-based automation (which `launchPersistentContext`
//   uses under the hood) from attaching to the *default* User Data
//   directory for security reasons. The practical workaround Playwright
//   itself documents is pointing `--profile-dir` at a **copy** of the real
//   profile directory (so the copy still carries the real, already-logged-in
//   Facebook session cookies) rather than the live one Chrome uses day to
//   day, or using a dedicated Chrome profile Joey stays logged into
//   specifically for this script. See the Setup section below — this is a
//   one-time decision Joey makes once, not something this script can detect
//   or work around automatically. If `launchPersistentContext` refuses to
//   start against a given directory, that is very likely why; it is not
//   this script silently failing.
// - It replaces only the mechanical part of Joey's existing weekly habit:
//   open group -> sort New -> scroll ~7 days, expanding "See more" on long
//   posts -> Ctrl+S "Webpage, Complete". Same account, same groups
//   (scripts/knowledge/fb-groups-checklist.mjs — reused, not duplicated),
//   same weekly cadence.
// - It paces every scroll/click/expand with a freshly randomized delay
//   (3-15s, see randomDelayMs) — never a fixed interval, never back-to-back
//   calls — mirroring the home-relay skill's pacing convention but slowed
//   down for "reading a feed" rather than firing one HTTP GET. Pacing
//   defeats simple rate heuristics; it does not defeat detection generally
//   (see docs/decisions.md's 2026-08-11 entry, which this script's own
//   decision explicitly does not disclaim) — the residual account-
//   enforcement risk is real and is Joey's to accept for his own account,
//   not eliminated by pacing alone.
// - Output feeds the EXISTING pipeline unchanged: it writes the same
//   `fb-<slug>-<date>.html` files knowledge-fb-export-reminder.mjs already
//   tells Joey to produce by hand, to the same --out-dir (default matches
//   Joey's manual convention: ~/Downloads). Nothing here talks to Supabase,
//   nothing here parses/ships content — that is still knowledge-fb-upload.mjs
//   and scripts/community/fb-export-ingest.mjs, run exactly as documented in
//   the weekly reminder issue, unchanged.
// - No Graph API, no crawling of groups outside the checklist Joey himself
//   maintains, and never a `candidate: true` (unconfirmed-membership) row —
//   confirming membership by dropping `candidate` from a checklist entry is
//   the only way to make a group eligible, for both the default group list
//   AND an explicit `--group` selection. No anti-detect/evasion tooling, no
//   automated posting/commenting — only reading and saving pages Joey's own
//   confirmed-member account can already see.
//
// Setup (one-time, on the desktop — NOT this sandbox):
//   1. `npm install` in a clone of this repo on the desktop (or just
//      `npm install playwright` in a scratch folder — this script has no
//      other repo dependency).
//   2. `npx playwright install chromium` (downloads the browser Playwright
//      drives; still points at Joey's real Chrome *profile data*, not a
//      separate throwaway browser install).
//   3. Because Chrome 136+ won't let Playwright attach to the live default
//      profile directory (see the caveat above), make a dedicated copy:
//      close Chrome, copy `%LOCALAPPDATA%\Google\Chrome\User Data` to e.g.
//      `%LOCALAPPDATA%\fb-export-chrome-profile`, then point --profile-dir
//      at the copy. Open that copy once in a normal Chrome window
//      (`chrome.exe --user-data-dir="...\fb-export-chrome-profile"`) and
//      confirm Facebook is logged in there — this is a one-time setup step,
//      not something re-done every run.
//   4. Close all Chrome windows using that profile copy before running this
//      script — Chrome will not let Playwright open a profile directory
//      that's already open elsewhere.
//   5. Run once by hand to confirm it works:
//        node scripts/desktop/fb-group-export.mjs --profile-dir "C:\Users\Joey\AppData\Local\fb-export-chrome-profile" --profile-name "Default"
//   6. Schedule weekly (Windows Task Scheduler) once step 5 is confirmed
//      working — same "ask for a scheduled task" pattern as the home-relay
//      skill's persistence section. The profile copy will drift out of
//      sync with the live one over time (cookies rotate); if the login
//      check below starts failing, refresh the copy from a freshly
//      logged-in live profile.
//
// Usage:
//   node scripts/desktop/fb-group-export.mjs \
//     --profile-dir "<path to a dedicated Chrome profile copy>" \
//     [--profile-name Default] \
//     [--out-dir ~/Downloads] \
//     [--group <slug>]            # repeatable; default: every confirmed
//                                   (non-candidate) group in
//                                   fb-groups-checklist.mjs. A `candidate`
//                                   row is never eligible, explicit or not.
//     [--dry-run]                 # navigate + scroll, but don't overwrite
//                                   any saved file
//
// This file is intentionally dependency-light (Playwright only) so it can
// run standalone on the desktop without pulling in the rest of this
// monorepo's build. It imports FB_GROUPS_CHECKLIST via a relative path so
// it still resolves correctly when run from within a full repo checkout —
// keeping the checklist the single source of truth the weekly reminder
// issue also reads from, rather than a duplicated list that can drift.

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
const STALL_ROUNDS_LIMIT = 3; // consecutive no-growth scrolls before giving up (lets lazy-load catch up)
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
    } else if (arg === '--dry-run') {
      flags.dryRun = true;
    }
  }
  return flags;
}

/** Resolves which checklist groups to export: explicit --group list, or
 * every checklist entry that isn't still a `candidate` (unconfirmed) row.
 * A `candidate: true` row is NEVER eligible — not even via an explicit
 * --group — because it means nobody has confirmed Joey is actually a
 * member; confirming membership means removing `candidate` from the
 * checklist entry itself, not passing a flag here. */
export function resolveGroups(flags, checklist = FB_GROUPS_CHECKLIST) {
  const confirmed = checklist.filter((g) => !g.candidate);
  if (flags.groups.length > 0) {
    return confirmed.filter((g) => flags.groups.includes(g.slug));
  }
  return confirmed;
}

export function outputFilePath(outDir, slug, date = new Date()) {
  const iso = date.toISOString().slice(0, 10);
  return path.join(outDir, `fb-${slug}-${iso}.html`);
}

/** Facebook shows a login form, a checkpoint/two-factor interstitial, or a
 * "log in to see more" wall when the profile is not actually usable right
 * now. This must return an affirmative "yes, this looks like a real,
 * logged-in group feed" rather than merely "no login form was found" —
 * failing open on a thrown/ambiguous check is exactly how a hidden
 * interstitial would silently produce a garbage export. This script never
 * attempts to authenticate or dismiss a checkpoint itself; any of these
 * states is a hard stop. */
async function verifyLoggedIn(page) {
  const blockingStateVisible = await page
    .locator(
      [
        'form[data-testid="royal_login_form"]',
        'input[name="email"][type="email"]',
        '[data-testid="checkpoint_title"]',
      ].join(', '),
    )
    .first()
    .isVisible()
    .catch((err) => {
      throw new Error(`could not determine Facebook login state (page evaluation failed): ${err.message}`);
    });
  const identityWallVisible = blockingStateVisible
    ? false // already caught by the structural selectors above; skip the extra text scan
    : await page
        .getByText(/Enter your (login code|password to continue)|Confirm your identity/i)
        .first()
        .isVisible()
        .catch(() => false);
  if (blockingStateVisible || identityWallVisible) {
    throw new Error(
      'Facebook is showing a login form, checkpoint, or identity-confirmation wall in this Chrome ' +
        'profile — this script never logs in or clears a checkpoint itself. Open this profile in a ' +
        'normal Chrome window, resolve it there, then re-run.',
    );
  }
  // Affirmative check: the feed itself must actually be present, not just
  // "no known blocking element was found" (which a markup change or an
  // unrecognized interstitial would also satisfy).
  const feedVisible = await page
    .locator('[role="feed"], [role="main"] [role="article"]')
    .first()
    .isVisible()
    .catch(() => false);
  if (!feedVisible) {
    throw new Error(
      'Facebook group feed did not render as expected (no [role="feed"]/[role="article"] found) — ' +
        'refusing to export what may be a login wall, checkpoint, or empty/broken page in an ' +
        'unrecognized shape. Check the profile in a normal Chrome window.',
    );
  }
}

/** Expands every collapsed "See more" post so its full text is present in
 * the saved HTML (the manual procedure step this replaces does this too —
 * skipping it would silently truncate posts the parser and redline screen
 * both need the full text of). Paced per-click, capped so a feed with an
 * unexpectedly large number of collapsed posts can't run indefinitely. */
async function expandSeeMore(page) {
  const MAX_EXPANSIONS = 60;
  for (let i = 0; i < MAX_EXPANSIONS; i += 1) {
    const clicked = await page.evaluate(() => {
      // Scope to actual post content (article-like containers), not the
      // whole page — Facebook's sidebar/chrome has its own "See more"-
      // labeled controls (e.g. "See more about this group") that are not
      // post text and must never be clicked here.
      const postContainers = Array.from(
        document.querySelectorAll('[role="article"], [data-testid*="post"]'),
      );
      for (const container of postContainers) {
        const button = Array.from(container.querySelectorAll('div[role="button"], span[role="button"]')).find(
          (el) => /^see more$/i.test((el.textContent || '').trim()),
        );
        if (button) {
          button.click();
          return true;
        }
      }
      return false;
    });
    if (!clicked) break;
    await pace();
  }
}

/** Scrolls the group feed until posts are older than 7 days, or the feed
 * stops growing across several consecutive scrolls (lazy-load can take
 * more than one round to append new content, so a single unchanged height
 * reading is not itself proof of exhaustion), pacing every scroll with a
 * random delay. */
async function scrollUntilWeekBoundary(page) {
  let previousHeight = 0;
  let stallRounds = 0;
  for (let round = 0; round < SCROLL_ROUNDS_MAX; round += 1) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await pace();
    await expandSeeMore(page);
    const height = await page.evaluate(() => document.body.scrollHeight);
    const oldestVisibleTimestamp = await page.evaluate(() => {
      // Facebook renders an abbr[data-utime] (unix seconds) on post timestamps
      // in the classic markup; fall back gracefully if the markup differs —
      // the scroll-round cap is the real backstop either way. A pinned post
      // can carry an old timestamp while genuinely new posts sit below it,
      // so this takes the NEWEST-of-the-last-few rather than the single
      // oldest node on the page, to avoid a pinned post falsely ending the
      // scroll early; still conservative because the round cap and the
      // stall-detection below are the actual backstops.
      const nodes = Array.from(document.querySelectorAll('abbr[data-utime]'));
      if (nodes.length === 0) return null;
      const utimes = nodes.map((n) => Number(n.getAttribute('data-utime'))).filter(Boolean);
      if (utimes.length === 0) return null;
      // Take the LAST 5 posts in DOM order (bottom of the currently-loaded
      // feed, i.e. the most recently appended by scrolling) BEFORE sorting
      // — sorting first would pick the 5 chronologically newest timestamps
      // anywhere on the page, which is not the same thing when a pinned
      // post sits at the top. Only after isolating "the posts we just
      // scrolled to" do we sort those few and take the median, so one
      // outlier among them still can't dominate.
      const tailInDomOrder = utimes.slice(-5);
      const sortedTail = [...tailInDomOrder].sort((a, b) => a - b);
      return sortedTail[Math.floor(sortedTail.length / 2)] * 1000;
    });
    if (oldestVisibleTimestamp && Date.now() - oldestVisibleTimestamp > SEVEN_DAYS_MS) {
      return { reason: 'week-boundary-reached', rounds: round + 1 };
    }
    if (height === previousHeight) {
      stallRounds += 1;
      if (stallRounds >= STALL_ROUNDS_LIMIT) {
        return { reason: 'feed-stopped-growing', rounds: round + 1 };
      }
    } else {
      stallRounds = 0;
    }
    previousHeight = height;
  }
  return { reason: 'scroll-round-cap', rounds: SCROLL_ROUNDS_MAX };
}

/** Exports one group: navigate, sort by New activity, scroll to the week
 * boundary (expanding "See more" posts along the way), save the fully-
 * rendered HTML. Returns a result summary; never throws for a single
 * group's failure so one bad group doesn't abort the rest of the weekly
 * run (the caller collects per-group outcomes). */
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
      'fb-group-export: --profile-dir "<path to a dedicated Chrome profile copy>" is required. See ' +
        'the header comment in this file for setup steps.',
    );
    return 1;
  }

  const targets = resolveGroups(flags);
  if (targets.length === 0) {
    console.error(
      'fb-group-export: no confirmed groups to export (checklist empty, or every remaining row is ' +
        'still `candidate: true` — confirm membership by removing `candidate` in ' +
        'scripts/knowledge/fb-groups-checklist.mjs first; a candidate row is never eligible here, ' +
        'even via an explicit --group).',
    );
    return 1;
  }

  // Dynamic import: keeps `playwright` an optional/desktop-only dependency
  // for the rest of the monorepo rather than a hard install for every CI
  // job that touches scripts/**.
  const { chromium } = await import('playwright');

  // Always headed — see the header comment's "No headless option" note.
  // Chrome 136+ also refuses CDP attach to a LIVE default profile
  // directory; --profile-dir is expected to point at a dedicated copy
  // (see Setup step 3), not the profile Chrome uses day to day.
  const context = await chromium.launchPersistentContext(flags.profileDir, {
    headless: false,
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
        '(uploads then deletes the local copies — run fb-export-ingest.mjs per group BEFORE ' +
        'upload if you want a local dry-run check first, since upload removes the source file).',
    );
  }
  return okCount === results.length ? 0 : 1;
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  runMain(main, { name: 'fb-group-export' });
}

#!/usr/bin/env node
// CLI: capture a clean, chrome-free screenshot of a live Long Live site
// surface for use as Instagram media (IG media must be a URL on the
// deployed site, but we still want a NAMED, versioned PNG in the repo
// rather than a link to a page that can change).
//
//   node scripts/social/capture-screens.mjs --lens the-proposal \
//     --out apps/web/public/social/library/thread-end-game-screen.png
//
//   node scripts/social/capture-screens.mjs --mood \
//     --out apps/web/public/social/library/mood-chat-starters.png
//
//   node scripts/social/capture-screens.mjs --era midnights --viewport desktop \
//     --out apps/web/public/social/library/era-midnights-desktop.png
//
// Targets (pass exactly one):
//   --lens <id>      /?lens=<id> — one of the six threads
//   --era <id>       /?era=<id> — an era timeline
//   --item <id>      /?item=<id> — a single moment's detail sheet
//   --mood           the Mood tab (no deep link exists — clicks the TopBar toggle)
//   --url <path>     escape hatch: any relative path/query on the site
//
// Options:
//   --out <path>         required, output PNG path
//   --viewport mobile|desktop   default mobile (390x844 @2x, IG-friendly)
//   --base-url <url>     default https://www.longlivets.com
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { resolveTarget, VIEWPORTS } from './lib/capture-targets.mjs';

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) {
      out[key] = true;
    } else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

function usage() {
  return `Usage: capture-screens.mjs --out <path> [target] [options]

Targets (pass exactly one):
  --lens <id>      the-proposal | love-story | fashion | taylors-version | easter-eggs | hidden-clues
  --era <id>       e.g. midnights, tloas
  --item <id>      a moment id
  --mood           the Mood tab (clicked, not deep-linked)
  --url <path>     escape hatch — any relative path/query

Options:
  --out <path>            required
  --viewport mobile|desktop   default mobile
  --base-url <url>        default https://www.longlivets.com
`;
}

/** Waits for the surface named by `readiness` to be visibly settled before
 * the screenshot is taken. Each case mirrors a locator already proven out in
 * e2e/vault.spec.ts (same site, same patterns) rather than inventing new
 * hooks — see that file's block comment for why role/label locators are
 * preferred over markup we'd have to add just for screenshots. */
async function waitForReady(page, readiness) {
  if (readiness === 'era') {
    await page.getByRole('slider', { name: /timeline scrubber$/i }).waitFor({ state: 'visible' });
    // First-visit-only "Got it" hint over the timeline ridge
    // (TimelineScrubber.tsx) — always fires in a fresh Playwright context
    // (no localStorage history) and would otherwise cover content in the shot.
    const hint = page.getByRole('button', { name: 'Got it' });
    if (await hint.isVisible().catch(() => false)) {
      await hint.click();
    }
  } else if (readiness === 'lens') {
    await page.getByRole('tab', { name: 'Threads', selected: true }).waitFor({ state: 'visible' });
  } else if (readiness === 'item') {
    await page.getByRole('dialog').first().waitFor({ state: 'visible' });
  } else if (readiness === 'mood') {
    const moodTab = page.getByRole('tab', { name: 'Mood' });
    await moodTab.waitFor({ state: 'visible' });
    await moodTab.click();
    // The mood textarea's aria-label (MoodChat.tsx) isn't always present in
    // the deployed markup; its placeholder is the stable, verified-on-prod
    // signal that the chat (and starter chips beside it) has rendered.
    await page.getByPlaceholder('however you want to say it').waitFor({ state: 'visible' });
  } else {
    await page.getByRole('tab', { name: 'Eras' }).waitFor({ state: 'visible' });
  }
  // Settle CSS transitions/animations (mode switches, dialog open, era-skin
  // theme swap) before the pixels are captured.
  await page.waitForTimeout(600);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) {
    console.log(usage());
    return;
  }
  if (!args.out) {
    console.error(usage());
    process.exitCode = 1;
    return;
  }

  let target;
  try {
    target = resolveTarget(args);
  } catch (err) {
    console.error(err.message);
    console.error(usage());
    process.exitCode = 1;
    return;
  }

  const viewportKey = args.viewport ?? 'mobile';
  const viewport = VIEWPORTS[viewportKey];
  if (!viewport) {
    console.error(
      `Unknown --viewport "${viewportKey}". Expected: ${Object.keys(VIEWPORTS).join(', ')}`,
    );
    process.exitCode = 1;
    return;
  }

  const baseUrl = args['base-url'] ?? 'https://www.longlivets.com';

  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.deviceScaleFactor,
    });
    const page = await context.newPage();
    await page.goto(new URL(target.path, baseUrl).toString(), { waitUntil: 'networkidle' });
    await waitForReady(page, target.readiness);

    await mkdir(path.dirname(args.out), { recursive: true });
    // fullPage: false — a fixed IG-frame crop of exactly the viewport, no
    // browser chrome and no arbitrarily-tall scroll capture.
    await page.screenshot({ path: args.out, fullPage: false });
    console.log(
      `Wrote ${args.out} (${viewport.width}x${viewport.height} @${viewport.deviceScaleFactor}x)`,
    );
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

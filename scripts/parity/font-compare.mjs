// One UI WP2.1-C: real-font pixel comparison of two production web builds.
// A = the build with next/font (origin/main), B = the build with self-hosted
// fonts. Real fonts (no ParityFont override), fonts awaited, animations off.
// Each page is captured as viewport-height strips so lazy images load and tall
// pages never hit a screenshot size limit; strips are diffed per pixel.
//
//   node scripts/parity/font-compare.mjs --a http://127.0.0.1:3101 \
//        --b http://127.0.0.1:3102 [--out .scratch/font-compare] [--max-strips 80] [--only home,merch]
//
// Exits 1 if any strip differs. Needs both servers running (`next start`).
//
// Noise handling (main-vs-main runs otherwise flip between 0 and ~27 px):
//  1. Tolerance: a pixel counts only if its max per-channel delta exceeds 2
//     (1-2 level antialiasing jitter on fractional-offset rounded borders is
//     ignored). Both counts are reported: rawDiffPixels (any delta) and
//     diffPixels (tolerant); the pass criterion uses diffPixels.
//  2. Retry: a page/width with a nonzero tolerant diff (or height mismatch) is
//     re-captured once; only the second result is reported, so a regression
//     is flagged only if it reproduces.
//  3. Fonts: loaded faces compare as family + style only (deduped). Weight is
//     dropped because a variable face ("400 800") and static next/font faces
//     (400, 600, ...) of one family render identical pixels; the pixel diff
//     is the real weight check.
/* global document, window, localStorage */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import sharp from 'sharp';

const arg = (name, dflt) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : dflt;
};
const A = arg('a');
const B = arg('b');
const OUT = arg('out', '.scratch/font-compare');
const ONLY = arg('only');
const MAX_STRIPS = Number(arg('max-strips', '80'));
if (!A || !B) {
  process.stderr.write('usage: font-compare.mjs --a <baseUrl> --b <baseUrl> [--out dir]\n');
  process.exit(2);
}

const TOLERANCE = 2;

const PAGES = [
  { name: 'home', path: '/' },
  // Dancing Script: the Speak Now era is the only one themed with it.
  {
    name: 'speak-now',
    maxStrips: 10, // the era feed is effectively endless; the hero + first cards carry the script face
    path: '/',
    steps: async (p) => {
      await p
        .getByRole('button', { name: /open the eras menu/ })
        .first()
        .click();
      await p
        .getByRole('button', { name: /^Speak Now/ })
        .first()
        .click();
    },
  },
  // Bodoni Moda (normal + italic): the Merch tab.
  {
    name: 'merch',
    path: '/',
    steps: async (p) => {
      await p
        .getByRole('button', { name: 'Merch', exact: true })
        .first()
        .click();
    },
  },
  { name: 'support', path: '/support' },
  { name: 'privacy', path: '/privacy' },
];
const WIDTHS = [
  { w: 390, h: 844 },
  { w: 1440, h: 900 },
];
const FREEZE =
  '*,*::before,*::after{animation:none!important;transition:none!important;' +
  'caret-color:transparent!important;scroll-behavior:auto!important}' +
  // Masked: the timeline scrubber's density curve is a non-text SVG whose
  // antialiased edge differs run to run even main-vs-main (27px measured).
  '[aria-label$="timeline scrubber"] svg{visibility:hidden!important}';
// 1x1 PNG so remote images (never part of a font comparison) are identical.
const PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

async function capture(browser, base, page, vp) {
  const ctx = await browser.newContext({
    viewport: { width: vp.w, height: vp.h },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
    bypassCSP: true,
  });
  const p = await ctx.newPage();
  await p.clock.setFixedTime(new Date('2026-01-01T12:00:00Z'));
  await p.addInitScript(() => {
    try {
      localStorage.setItem('ll-feedback-dismissed-v1', '1');
      localStorage.setItem('ll-track-swipe-hint-seen-v1', '1');
    } catch {
      /* storage may be unavailable */
    }
  });
  await p.route('**/*', (route) => {
    const u = new URL(route.request().url());
    if (u.hostname === '127.0.0.1' || u.hostname === 'localhost') {
      if (u.pathname.startsWith('/_vercel/')) {
        return route.fulfill({ status: 200, contentType: 'text/javascript', body: '' });
      }
      return route.continue();
    }
    if (route.request().resourceType() === 'image') {
      return route.fulfill({ status: 200, contentType: 'image/png', body: PX });
    }
    return route.abort();
  });
  await p.goto(`${base}${page.path}`, { waitUntil: 'load' });
  await p.addStyleTag({ content: FREEZE });
  if (page.steps) {
    await page.steps(p);
    await p.waitForTimeout(1500);
  }
  await p.evaluate(() => window.scrollTo(0, 0));
  const height = await p.evaluate(() => document.documentElement.scrollHeight);
  const strips = [];
  const n = Math.min(page.maxStrips ?? MAX_STRIPS, Math.ceil(height / vp.h));
  for (let i = 0; i < n; i += 1) {
    await p.evaluate((y) => window.scrollTo(0, y), i * vp.h);
    await p.evaluate(async () => {
      await Promise.all(
        [...document.images].map((im) => (im.complete ? im.decode().catch(() => {}) : null)),
      );
      await document.fonts.ready;
    });
    await p.waitForTimeout(150);
    strips.push(await p.screenshot());
  }
  const fonts = await p.evaluate(() =>
    [...document.fonts]
      .filter((f) => f.status === 'loaded')
      .map((f) => `${f.family.replaceAll('"', '')} ${f.style}`)
      .filter((s, i, all) => all.indexOf(s) === i)
      .sort(),
  );
  await ctx.close();
  return { strips, fonts, height };
}

async function diff(a, b) {
  const [ra, rb] = await Promise.all(
    [a, b].map((buf) => sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })),
  );
  if (ra.info.width !== rb.info.width || ra.info.height !== rb.info.height) {
    return { count: -1, png: null };
  }
  const { width, height } = ra.info;
  const out = Buffer.alloc(width * height * 4);
  let count = 0;
  let raw = 0;
  for (let i = 0; i < width * height; i += 1) {
    const o = i * 4;
    const delta = Math.max(
      Math.abs(ra.data[o] - rb.data[o]),
      Math.abs(ra.data[o + 1] - rb.data[o + 1]),
      Math.abs(ra.data[o + 2] - rb.data[o + 2]),
    );
    if (delta > 0) raw += 1;
    if (delta > TOLERANCE) {
      count += 1;
      out[o] = 255;
      out[o + 3] = 255;
    } else {
      out[o] = ra.data[o] >> 2;
      out[o + 1] = ra.data[o + 1] >> 2;
      out[o + 2] = ra.data[o + 2] >> 2;
      out[o + 3] = 255;
    }
  }
  const png = await sharp(out, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();
  return { count, raw, png };
}

async function comparePage(page, vp) {
  const [ca, cb] = [await capture(browser, A, page, vp), await capture(browser, B, page, vp)];
  let total = 0;
  let rawTotal = 0;
  const files = [];
  const n = Math.min(ca.strips.length, cb.strips.length);
  for (let i = 0; i < n; i += 1) {
    const d = await diff(ca.strips[i], cb.strips[i]);
    rawTotal += Math.max(d.raw ?? 0, 0);
    if (d.count !== 0) {
      total += Math.max(d.count, 0);
      const base = join(OUT, `${page.name}-${vp.w}-strip${i}`);
      writeFileSync(`${base}-a.png`, ca.strips[i]);
      writeFileSync(`${base}-b.png`, cb.strips[i]);
      if (d.png) writeFileSync(`${base}-diff.png`, d.png);
      files.push(`${base}-diff.png`);
    }
  }
  return { ca, cb, n, total, rawTotal, files };
}

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const rows = [];
for (const page of PAGES.filter((q) => !ONLY || ONLY.split(',').includes(q.name))) {
  for (const vp of WIDTHS) {
    let r = await comparePage(page, vp);
    let retried = false;
    if (r.total !== 0 || r.ca.height !== r.cb.height) {
      retried = true;
      r = await comparePage(page, vp);
    }
    const { ca, cb, n, total, rawTotal, files } = r;
    const sameFonts = JSON.stringify(ca.fonts) === JSON.stringify(cb.fonts);
    rows.push({
      page: page.name,
      width: vp.w,
      heightA: ca.height,
      heightB: cb.height,
      strips: n,
      diffPixels: total,
      rawDiffPixels: rawTotal,
      retried,
      loadedFacesEqual: sameFonts,
      loadedFacesA: ca.fonts,
      loadedFaces: cb.fonts,
      diffFiles: files,
    });
    process.stdout.write(
      `${page.name} @${vp.w}: strips=${n} heightA=${ca.height} heightB=${cb.height} diffPixels=${total} rawDiffPixels=${rawTotal}${retried ? ' (retried)' : ''} fonts(${cb.fonts.length}) equal=${sameFonts}\n`,
    );
  }
}
await browser.close();
writeFileSync(join(OUT, 'report.json'), `${JSON.stringify(rows, null, 2)}\n`);
process.exit(rows.some((r) => r.diffPixels !== 0 || r.heightA !== r.heightB) ? 1 : 0);

#!/usr/bin/env -S npx tsx
// Regenerates the whole reusable social asset library (apps/web/public/
// social/library/**) from one declarative list, instead of re-typing ~19
// render-card.mjs / capture-screens.mjs invocations by hand every time copy
// or an era palette changes (CLAUDE.md rule 8: codify repetition). This is
// the actual seeding mechanism for WS2's initial library and the way to
// regenerate it later — run it, don't hand-roll the individual commands.
//
//   npx tsx scripts/social/seed-library.mjs            # everything
//   npx tsx scripts/social/seed-library.mjs --cards     # cards only (fast, no browser/network)
//   npx tsx scripts/social/seed-library.mjs --screens   # screenshots only (hits the live site)
//
// Cards render in-process (renderCardPng). Screenshots shell out to
// capture-screens.mjs one at a time (not in parallel) — it drives a real
// browser against the live production site, and there's no reason to hammer
// it with concurrent requests for a handful of one-time library assets.
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderCardPng, SIZES } from './lib/card-render.mjs';
import { eraPalette } from './lib/era-palette.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const LIBRARY_DIR = path.join(ROOT, 'apps', 'web', 'public', 'social', 'library');

// THREADS metadata (id, display title, kicker) is lifted from
// apps/web/lib/longlive/lenses.ts by hand here rather than imported —
// seed-library.mjs only needs 6 stable, rarely-changing strings, and
// importing lenses.ts drags in its content-vault.generated.ts dependency
// chain for no benefit to a card-copy list. If a thread's title/kicker
// changes on the site, update it here too.
//
// `era` picks each card's accent palette. Deliberately NOT the same era the
// site uses as that thread's hero image (the-proposal and love-story both
// use lover.png on-site) — the WS2 design-review fix asked for six visually
// distinct cards in a grid, so each thread gets its own era here purely for
// color variety.
//
// `stat`/`stat2`/`detail` are the proof-element centerpiece the design
// review demanded in place of the old faint watermark glyph — one real,
// verified number per thread (counted straight from apps/web/lib/longlive/
// lenses.ts on 2026-08-11; re-verify by running scripts/social/_count.mjs-
// style queries against lenses.ts if these arrays change materially):
//   hidden-clues:      CLUE_PAIRS.length = 42, .filter(c => c.confirmed).length = 24,
//                       longest plant->payoff gap = "The Karma graffiti" at 953 days (2.6 yrs)
//   easter-eggs:        EGG_NODES.length = 30, MOTIFS.length (trails) = 7
//   fashion:            RUNWAY_LOOKS.length = 12, covering all 12 ERAS ids (verified: one look/era)
//   taylors-version:    RERECORDS.length = 6, .filter(r => r.reclaimedYear).length = 4 (released as TV)
//   the-proposal:       threadPoints('the-proposal').length = 17 dated moments,
//                       2023-07-26 (bracelet) through 2026-07-03 (wedding at MSG)
//   love-story:         RELATIONSHIPS.length = 10 named eras/chapters
const THREADS = [
  {
    id: 'the-proposal',
    title: 'End Game',
    kicker: 'A love story, in real time',
    era: 'lover',
    stat: { value: '17', label: 'Dated moments' },
    detail: 'Bracelet to altar, tracked in real time',
  },
  {
    id: 'love-story',
    title: 'Blank Spaces',
    kicker: 'The one that stuck',
    era: 'red',
    stat: { value: '10', label: 'Chapters' },
    detail: 'Every era has a name',
  },
  {
    id: 'fashion',
    title: 'The Runway',
    kicker: 'Twelve wardrobes, one story',
    era: '1989',
    stat: { value: '12', label: 'Eras' },
    stat2: { value: '12', label: 'Looks' },
    detail: 'One signature look, every era',
  },
  {
    id: 'taylors-version',
    title: "Taylor's Version",
    kicker: 'Owning the masters',
    era: 'fearless',
    stat: { value: '6', label: 'Albums' },
    detail: '4 already out as Taylor’s Version',
  },
  {
    id: 'easter-eggs',
    title: 'The Clue Web',
    kicker: 'The secrets she plants',
    era: 'midnights',
    stat: { value: '30', label: 'Easter eggs' },
    detail: '7 trails to pull, all mapped',
  },
  {
    id: 'hidden-clues',
    title: 'The Decode',
    kicker: 'One clue, one payoff',
    era: 'ttpd',
    stat: { value: '42', label: 'Hidden clues' },
    detail: '24 confirmed · longest gap 2.6 years',
  },
];

const CARD_JOBS = [
  ...THREADS.map((t) => ({
    out: `thread-${t.id}-intro.png`,
    opts: {
      variant: 'thread',
      palette: eraPalette(t.era),
      ...SIZES.portrait,
      eyebrow: 'The Threads',
      headline: t.title,
      kicker: t.kicker,
      stat: t.stat,
      stat2: t.stat2,
      detail: t.detail,
      icon: 'layers',
    },
  })),
  {
    out: 'mood-feature.png',
    opts: {
      variant: 'text',
      palette: eraPalette(null),
      ...SIZES.portrait,
      eyebrow: 'Mood',
      headline: 'Tell it how you feel',
      kicker: "We'll find the song that fits. Nothing you type is saved.",
      icon: 'sparkles',
    },
  },
  // Real, sourced quote already used in the site's own End Game thread
  // content (content-vault.generated.ts's `pullQuote`, sourced to Billboard
  // / E! Online — see that file's "friendship-bracelet" moment) — not
  // invented for this card.
  {
    out: 'feature-quote-demo-kelce.png',
    opts: {
      variant: 'quote',
      palette: eraPalette('midnights'),
      ...SIZES.portrait,
      eyebrow: 'End Game',
      headline: "I was a little butthurt I didn't get to meet her.",
      kicker: 'Travis Kelce',
    },
  },
  // Openly-framed speculation attributed to Long Live itself (not to any
  // real person or community whose words we'd otherwise be putting words
  // in the mouth of) — a template for the fan-theory content vertical.
  {
    out: 'feature-quote-demo-theory.png',
    opts: {
      variant: 'quote',
      palette: eraPalette('folklore'),
      ...SIZES.portrait,
      eyebrow: 'Fan theory',
      headline: 'The cardigan was never about the sweater',
      kicker: 'a Long Live fan theory',
    },
  },
  // Bonus beyond the spec's card list: a photo-background demo using a
  // Commons (free-license) photo already vetted by the site's own content
  // pipeline (see lenses.ts RELATIONSHIPS['rel-kelce']) — this is the
  // "clearly-safe real photo" half of the founder's brief, not just the
  // designed-card half.
  {
    out: 'thread-the-proposal-photo.png',
    opts: {
      variant: 'photo',
      palette: eraPalette('midnights'),
      ...SIZES.portrait,
      eyebrow: 'The Threads',
      headline: 'The friendship bracelet that started it',
      kicker: 'End Game — the sourced, dated story of the proposal',
      credit: 'Adam Schultz / The White House, Public domain, via Wikimedia Commons',
      photoUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Travis_Kelce_in_the_Oval_Office_of_the_White_House_on_June_5%2C_2023_-_P20230605AS-0902_%28cropped%29.jpg/960px-Travis_Kelce_in_the_Oval_Office_of_the_White_House_on_June_5%2C_2023_-_P20230605AS-0902_%28cropped%29.jpg',
    },
  },
];

// ig-portrait (1080x1350 @2x, see capture-targets.mjs) — the mobile preset's
// 780x1688 output is rejected by Instagram outright (issue #3156/#3157); every
// screen job here feeds the IG queue, so every job captures at that preset.
const SCREEN_JOBS = [
  ...THREADS.map((t) => ({
    out: `thread-${t.id}-screen.png`,
    args: ['--lens', t.id, '--viewport', 'ig-portrait'],
  })),
  { out: 'mood-chat-screen.png', args: ['--mood', '--viewport', 'ig-portrait'] },
  { out: 'era-midnights-screen.png', args: ['--era', 'midnights', '--viewport', 'ig-portrait'] },
  { out: 'era-tloas-screen.png', args: ['--era', 'tloas', '--viewport', 'ig-portrait'] },
];

async function runCards() {
  const { loadImageAsDataUri } = await import('./lib/image-source.mjs');
  await mkdir(LIBRARY_DIR, { recursive: true });
  for (const job of CARD_JOBS) {
    const { photoUrl, ...opts } = job.opts;
    if (photoUrl) opts.photoDataUri = await loadImageAsDataUri(photoUrl);
    const png = await renderCardPng(opts);
    const out = path.join(LIBRARY_DIR, job.out);
    await writeFile(out, png);
    console.log(`card   ${job.out} (${(png.length / 1024).toFixed(0)} KB)`);
  }
}

async function runScreens() {
  await mkdir(LIBRARY_DIR, { recursive: true });
  const script = path.join(ROOT, 'scripts', 'social', 'capture-screens.mjs');
  for (const job of SCREEN_JOBS) {
    const out = path.join(LIBRARY_DIR, job.out);
    execFileSync('node', [script, ...job.args, '--out', out], { stdio: 'inherit' });
  }
}

async function main() {
  const args = process.argv.slice(2);
  const cardsOnly = args.includes('--cards');
  const screensOnly = args.includes('--screens');
  if (!screensOnly) await runCards();
  if (!cardsOnly) await runScreens();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

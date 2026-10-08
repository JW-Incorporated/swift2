#!/usr/bin/env node
// J3.5 depth audit (Fable ruling FR-t_a0ad2392-7, card t_2fdaaafa): scores a
// single era file against the Active-tier rubric in
// docs/marketing/content-framework-2026-07-03.md — "every month of an era
// should carry 2-4 real, sourceable items ... weighted toward
// category: 'relationship' | 'sighting' | 'fashion'" (decisions.md
// 2026-07-04). Wavetop months (a seeded milestone) may carry up to 5-8,
// never padded.
//
// Deterministic, no LLM, no network: buckets an era's supabase/seed/content/
// <era>.mjs items by month, counts them per category, and flags:
//   - months below 2 items (under the Active floor; Quiet-tier 0-1 is
//     allowed by design for a NON-wavetop month, but every month below 2
//     is still listed so a human/report can judge whether it's really a
//     Quiet month or a gap)
//   - months with 0 of the three weighted categories
//     (relationship/sighting/fashion)
//   - months over 4 items that are NOT wavetop (padding/pacing flag)
//
// Usage:
//   node scripts/content/depth-audit.mjs <era-slug>          # table on stdout
//   node scripts/content/depth-audit.mjs <era-slug> --json    # JSON on stdout
//   npm run content:depth-audit -- <era-slug>
//
// Companion to scripts/depth-rows-per-month.mjs (which audits ALL eras
// against the wavetop-floor launch bar). This script is scoped to ONE era at
// a time with a sharper per-category breakdown, for the flagship
// Midnights/Tortured-Poets Active-tier depth push specifically.
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runMain } from '../lib/cli.mjs';

const WEIGHTED_CATEGORIES = ['relationship', 'sighting', 'fashion'];
export const ACTIVE_FLOOR = 2;
export const ACTIVE_CEILING = 4;
export const WAVETOP_CEILING = 8;

const ym = (y, m) => `${String(y)}-${String(m).padStart(2, '0')}`;

function* monthsBetween(startDate, endDate) {
  let [y, m] = startDate.split('-').map(Number);
  const [ey, em] = endDate.split('-').map(Number);
  while (y < ey || (y === ey && m <= em)) {
    yield { y, m };
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
}

/**
 * Pure scoring function — exported for tests. Takes already-loaded era
 * metadata + items (no filesystem/import work), so the fixture test never
 * has to touch a real .mjs seed file.
 *
 * @param {{ slug: string, start_date: string, end_date: string }} era
 * @param {Array<{ era_slug: string, date: string, title?: string }>} milestones
 * @param {Array<{ year: number, month: number, category: string, title?: string }>} items
 * @param {string} [today] ISO date string (YYYY-MM-DD); defaults to now. The
 *   current era's window is only audited through this month so a rolling
 *   placeholder end_date doesn't read as a run of empty future months.
 */
export function scoreEra(era, milestones, items, today = new Date().toISOString().slice(0, 10)) {
  const byMonth = new Map(); // ym -> { total, byCat: Map }
  const outOfWindow = [];
  const startYm = era.start_date.slice(0, 7);
  const endYm = era.end_date.slice(0, 7);
  for (const it of items) {
    const key = ym(it.year, it.month);
    if (key < startYm || key > endYm) {
      outOfWindow.push({ key, title: it.title, category: it.category });
      continue;
    }
    if (!byMonth.has(key)) byMonth.set(key, { total: 0, byCat: new Map(), items: [] });
    const bucket = byMonth.get(key);
    bucket.total += 1;
    bucket.byCat.set(it.category, (bucket.byCat.get(it.category) ?? 0) + 1);
    bucket.items.push(it);
  }

  const wavetopMonths = new Set(
    milestones.filter((m) => m.era_slug === era.slug).map((m) => m.date.slice(0, 7)),
  );

  const endForAudit = endYm > today.slice(0, 7) ? `${today.slice(0, 7)}-01` : era.end_date;

  const months = [];
  for (const { y, m } of monthsBetween(era.start_date, endForAudit)) {
    const key = ym(y, m);
    const bucket = byMonth.get(key) ?? { total: 0, byCat: new Map(), items: [] };
    const wavetop = wavetopMonths.has(key);
    const ceiling = wavetop ? WAVETOP_CEILING : ACTIVE_CEILING;
    const weightedCounts = Object.fromEntries(
      WEIGHTED_CATEGORIES.map((c) => [c, bucket.byCat.get(c) ?? 0]),
    );
    const zeroWeighted = WEIGHTED_CATEGORIES.filter((c) => weightedCounts[c] === 0);
    months.push({
      key,
      wavetop,
      total: bucket.total,
      byCategory: Object.fromEntries(bucket.byCat),
      weightedCounts,
      belowFloor: !wavetop && bucket.total < ACTIVE_FLOOR,
      zeroWeighted,
      overCeiling: bucket.total > ceiling,
      titles: bucket.items.map((it) => it.title).filter(Boolean),
    });
  }

  return {
    eraSlug: era.slug,
    months,
    outOfWindow,
    summary: {
      monthCount: months.length,
      belowFloorCount: months.filter((m) => m.belowFloor).length,
      zeroWeightedCount: months.filter((m) => m.zeroWeighted.length > 0).length,
      overCeilingCount: months.filter((m) => m.overCeiling).length,
      totalsByCategory: months.reduce((acc, m) => {
        for (const [cat, n] of Object.entries(m.byCategory)) acc[cat] = (acc[cat] ?? 0) + n;
        return acc;
      }, {}),
    },
  };
}

function renderTable(result) {
  const lines = [];
  const out = (s = '') => lines.push(s);
  out(`# Depth audit — ${result.eraSlug}`);
  out();
  out(
    `${result.summary.monthCount} months · below-floor (non-wavetop, <2 items) ${result.summary.belowFloorCount} · zero-weighted-category months ${result.summary.zeroWeightedCount} · over-ceiling months ${result.summary.overCeilingCount}`,
  );
  out();
  out(`Category totals: ${JSON.stringify(result.summary.totalsByCategory)}`);
  out();
  out(`| month | wavetop | total | relationship | sighting | fashion | flags |`);
  out(`|---|---|---|---|---|---|---|`);
  for (const m of result.months) {
    const flags = [];
    if (m.belowFloor) flags.push('BELOW_FLOOR');
    if (m.zeroWeighted.length) flags.push(`ZERO(${m.zeroWeighted.join(',')})`);
    if (m.overCeiling) flags.push('OVER_CEILING');
    out(
      `| ${m.key} | ${m.wavetop ? 'yes' : ''} | ${m.total} | ${m.weightedCounts.relationship} | ${m.weightedCounts.sighting} | ${m.weightedCounts.fashion} | ${flags.join(' ') || '-'} |`,
    );
  }
  if (result.outOfWindow.length) {
    out();
    out(
      `Out-of-window rows (dated outside the era's start/end — runup content, not misfiles): ${result.outOfWindow.length}`,
    );
  }
  return lines.join('\n') + '\n';
}

async function loadEraItems(eraSlug) {
  const here = dirname(fileURLToPath(import.meta.url));
  const seedRoot = join(here, '..', '..', 'supabase', 'seed');
  const { eras, milestones } = await import(pathToFileURL(join(seedRoot, 'eras-data.mjs')).href);
  const era = eras.find((e) => e.slug === eraSlug);
  if (!era) throw new Error(`unknown era slug: ${eraSlug}`);

  const contentDir = join(seedRoot, 'content');
  const files = readdirSync(contentDir).filter((f) => f.endsWith('.mjs') && !f.startsWith('_'));
  const items = [];
  for (const file of files) {
    const data = (await import(pathToFileURL(join(contentDir, file)).href)).default;
    if (data?.eraSlug !== eraSlug) continue;
    for (const it of data.items ?? []) {
      items.push({ year: it.year, month: it.month, category: it.category, title: it.title });
    }
  }
  return { era, milestones, items };
}

async function main() {
  const args = process.argv.slice(2);
  const asJson = args.includes('--json');
  const eraSlug = args.find((a) => !a.startsWith('--'));
  if (!eraSlug) {
    console.error('usage: node scripts/content/depth-audit.mjs <era-slug> [--json]');
    return 1;
  }
  const { era, milestones, items } = await loadEraItems(eraSlug);
  const result = scoreEra(era, milestones, items);
  if (asJson) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } else {
    process.stdout.write(renderTable(result));
  }
  return 0;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) runMain(main, { name: 'depth-audit' });

// DEPTH gate audit — rows per month vs the curated-depth tier rubric.
//
// This is the audit `docs/launch-readiness.md` (DEPTH row) has named as the
// gate's next action since 2026-07-11: compute month_item rows per month for
// every era and score them against `docs/content-ops/depth-rubric.md`'s
// 3-tier rubric (Wavetop / Active / Quiet) and the 2026-07-04 launch bar
// (docs/decisions.md: all wavetop months populated everywhere, PLUS
// Midnights + Tortured Poets at Active-tier depth weighted toward
// relationship / sighting / fashion).
//
// Report-only, deterministic, no network, no deps — companion to
// scripts/content-coverage.mjs (which owns per-era totals and policy hard
// gates; this script owns the month axis). Emits markdown on stdout so a run
// can be committed under docs/audits/ as the gate's evidence artifact:
//
//   node scripts/depth-rows-per-month.mjs > docs/audits/YYYY-MM-DD-depth-rows-per-month.md
//
// What counts as a DEFICIT here (per the rubric — quiet months with 0-1 rows
// are fine BY DESIGN, so bare zeros are not findings):
//   - a Wavetop month (contains a seeded milestone) with 0 rows — launch-bar
//     violation, must never ship;
//   - a Wavetop month with 1 row — technically populated, but a milestone
//     month carrying less than the Active floor is thin for a wavetop;
//   - flagship eras (midnights, tortured-poets) below Active-tier depth on
//     the weighted axes (relationship, sighting, fashion).
// Over-ceiling months (>8 rows in a wavetop month, >4 in a non-wavetop) are
// reported as pacing flags — either an undeclared wavetop or padding — not
// as deficits.
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SHALLOW_CONTEXT_CHARS } from './lib/content-caps.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const seed = join(here, '..', 'supabase', 'seed');

const FLAGSHIP_ERAS = ['midnights', 'tortured-poets'];
const WEIGHTED_CATEGORIES = ['relationship', 'sighting', 'fashion'];
// The launch bar says "Active-tier depth" for the flagship eras' weighted
// axes. Active's per-month band is 2-4 rows; as an era-level floor we read
// that as: each weighted category should average at least one row per six
// era months (a fan scrolling the era hits that axis at least twice a year)
// — deliberately conservative. The reading is stated in the report so a
// founder can dispute the constant rather than the arithmetic.
const WEIGHTED_AXIS_MONTHS_PER_ROW = 6;

const { eras, milestones } = await import(pathToFileURL(join(seed, 'eras-data.mjs')).href);

const contentDir = join(seed, 'content');
const files = readdirSync(contentDir)
  .filter((f) => f.endsWith('.mjs') && !f.startsWith('_'))
  .sort();

const itemsByEra = new Map(); // slug -> [{ year, month, category, title, contextLen }]
for (const file of files) {
  const data = (await import(pathToFileURL(join(contentDir, file)).href)).default;
  for (const it of data?.items ?? []) {
    const era = it.eraSlug ?? data.eraSlug;
    if (!itemsByEra.has(era)) itemsByEra.set(era, []);
    itemsByEra.get(era).push({
      year: it.year,
      month: it.month,
      category: it.category,
      title: it.title,
      contextLen: (it.moment?.context ?? '').length,
    });
  }
}

const ym = (y, m) => `${y}-${String(m).padStart(2, '0')}`;
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

const milestoneMonths = new Map(); // eraSlug -> Map(ym -> [titles])
for (const ms of milestones) {
  const [y, m] = ms.date.split('-').map(Number);
  if (!milestoneMonths.has(ms.era_slug)) milestoneMonths.set(ms.era_slug, new Map());
  const em = milestoneMonths.get(ms.era_slug);
  const key = ym(y, m);
  if (!em.has(key)) em.set(key, []);
  em.get(key).push(ms.title);
}

const today = new Date().toISOString().slice(0, 10);
const lines = [];
const out = (s = '') => lines.push(s);

const eraRows = [];

for (const era of [...eras].sort((a, b) => a.sort_order - b.sort_order)) {
  const items = itemsByEra.get(era.slug) ?? [];
  const byMonth = new Map();
  const byCat = new Map();
  // Items dated outside the era's eras-data window are a known authoring
  // convention, not misfiles: eras-data windows run album-release to
  // album-release, while authors date runup content (lead singles, the
  // announcement, a pre-album engagement) to when it actually happened.
  // They count toward the era's rows but sit outside the month grid.
  const outOfWindow = [];
  for (const it of items) {
    const key = ym(it.year, it.month);
    byCat.set(it.category, (byCat.get(it.category) ?? 0) + 1);
    if (key < era.start_date.slice(0, 7) || key > era.end_date.slice(0, 7)) outOfWindow.push(key);
    else byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
  }

  // For the current era the window's end is a rolling placeholder; audit only
  // through the current month so future placeholder months don't read as gaps.
  const endForAudit =
    era.end_date.slice(0, 7) > today.slice(0, 7) ? `${today.slice(0, 7)}-01` : era.end_date;

  const msMonths = milestoneMonths.get(era.slug) ?? new Map();
  const months = [];
  for (const { y, m } of monthsBetween(era.start_date, endForAudit)) {
    const key = ym(y, m);
    months.push({
      key,
      rows: byMonth.get(key) ?? 0,
      wavetop: msMonths.has(key),
      milestones: msMonths.get(key) ?? [],
    });
  }

  const totalRows = months.reduce((a, x) => a + x.rows, 0);
  const zeroMonths = months.filter((x) => x.rows === 0);
  const quiet = months.filter((x) => x.rows <= 1).length;
  const active = months.filter((x) => x.rows >= 2 && x.rows <= 4).length;
  const wavetopBand = months.filter((x) => x.rows >= 5).length;
  const wavetopViolations = months.filter((x) => x.wavetop && x.rows === 0);
  const wavetopThin = months.filter((x) => x.wavetop && x.rows === 1);
  const pacingFlags = months.filter((x) => (x.wavetop ? x.rows > 8 : x.rows > 4));

  eraRows.push({
    era,
    months,
    totalRows,
    itemCount: items.length,
    monthCount: months.length,
    perMonth: totalRows / months.length,
    zeroMonths,
    quiet,
    active,
    wavetopBand,
    wavetopViolations,
    wavetopThin,
    pacingFlags,
    outOfWindow,
    byCat,
    wavetopMonthCount: months.filter((x) => x.wavetop).length,
    shallow: items.filter((it) => it.contextLen < SHALLOW_CONTEXT_CHARS),
  });
}

out(`# DEPTH audit — rows per month vs the curated-depth tier rubric`);
out();
out(
  `Run: ${today} · corpus: \`supabase/seed/content/**\` (${[...itemsByEra.values()].reduce((a, x) => a + x.length, 0)} items) · rubric: \`docs/content-ops/depth-rubric.md\` · launch bar: \`docs/decisions.md\` 2026-07-04`,
);
out();
out(
  `First run of the audit named as the DEPTH gate's next action in \`docs/launch-readiness.md\` since 2026-07-11. Generated by \`scripts/depth-rows-per-month.mjs\` (report-only, deterministic). Month tiers: **Wavetop** = month contains a seeded milestone (album release / tour opening, \`eras-data.mjs\`); **Active** = 2–4 rows; **Quiet** = 0–1 rows (fine by design — a bare zero month is NOT a deficit). The current era's window is audited only through the current month.`,
);
out();

out(`## Ranked deficit table`);
out();
out(
  `Ranked by launch-bar severity: wavetop months with 0 rows first, then thin (1-row) wavetop months, then rows/month. "Zero months" is context, not a violation — most months are Quiet by design.`,
);
out();
out(
  `| # | era | months | rows | rows/mo | wavetop months | **wavetop @ 0 rows** | wavetop @ 1 row | zero months | pacing flags (over-ceiling) |`,
);
out(`|---|---|---|---|---|---|---|---|---|---|`);
const ranked = [...eraRows].sort(
  (a, b) =>
    b.wavetopViolations.length - a.wavetopViolations.length ||
    b.wavetopThin.length - a.wavetopThin.length ||
    a.perMonth - b.perMonth,
);
ranked.forEach((r, i) => {
  out(
    `| ${i + 1} | ${r.era.slug} | ${r.monthCount} | ${r.totalRows} | ${r.perMonth.toFixed(2)} | ${r.wavetopMonthCount} | **${r.wavetopViolations.length}**${r.wavetopViolations.length ? ` (${r.wavetopViolations.map((x) => x.key).join(', ')})` : ''} | ${r.wavetopThin.length}${r.wavetopThin.length ? ` (${r.wavetopThin.map((x) => x.key).join(', ')})` : ''} | ${r.zeroMonths.length} | ${r.pacingFlags.length} |`,
  );
});
out();

out(`## Launch-bar check`);
out();
const allViolations = eraRows.flatMap((r) =>
  r.wavetopViolations.map((x) => ({ era: r.era.slug, ...x })),
);
if (allViolations.length === 0) {
  out(
    `- **Wavetop floor (all 11+1 eras): MET.** Every month containing a seeded milestone carries at least one row. (This re-verifies the 2026-07-04 finding from issue #38 against today's corpus.)`,
  );
} else {
  out(`- **Wavetop floor: VIOLATED** — milestone months with zero rows:`);
  for (const v of allViolations) out(`  - ${v.era} ${v.key} — ${v.milestones.join('; ')}`);
}
out();
out(
  `- **Flagship Active-tier depth (Midnights + Tortured Poets), weighted axes** — the 2026-07-04 bar says these two eras must reach Active-tier depth weighted toward relationship / sighting / fashion:`,
);
out();
out(`| era | relationship | sighting | fashion | verdict |`);
out(`|---|---|---|---|---|`);
for (const slug of FLAGSHIP_ERAS) {
  const r = eraRows.find((x) => x.era.slug === slug);
  const floor = Math.ceil(r.monthCount / WEIGHTED_AXIS_MONTHS_PER_ROW);
  const cells = WEIGHTED_CATEGORIES.map((c) => r.byCat.get(c) ?? 0);
  const short = WEIGHTED_CATEGORIES.filter((c) => (r.byCat.get(c) ?? 0) < floor);
  const verdict =
    short.length === 0
      ? `meets the floor (≥${floor} per axis)`
      : `**below bar — ${short.map((c) => `${c} ${r.byCat.get(c) ?? 0}/${floor}`).join(', ')}**`;
  out(`| ${slug} | ${cells.join(' | ')} | ${verdict} |`);
}
out();
out(
  `Reading used: each weighted category should average at least one row per ${WEIGHTED_AXIS_MONTHS_PER_ROW} era months (a fan scrolling the era hits that axis about twice a year) — a deliberately conservative floor for "Active-tier depth, weighted". Dispute the constant, not the arithmetic.`,
);
out();

out(`## Per-era month grids`);
out();
out(
  `Row counts per month. \`*\` marks a wavetop (milestone) month. Flags: \`!0\` wavetop month with zero rows, \`!1\` wavetop month with one row, \`^\` over-ceiling pacing flag.`,
);
out();
for (const r of eraRows) {
  out(
    `### ${r.era.slug} — ${r.totalRows} in-window rows / ${r.monthCount} months (${r.perMonth.toFixed(2)}/mo) · quiet ${r.quiet} · active ${r.active} · 5+ ${r.wavetopBand}${r.outOfWindow.length ? ` · +${r.outOfWindow.length} runup/out-of-window row(s) (${[...new Set(r.outOfWindow)].sort().join(', ')})` : ''}`,
  );
  out();
  const cells = r.months.map((x) => {
    let flag = '';
    if (x.wavetop && x.rows === 0) flag = '!0';
    else if (x.wavetop && x.rows === 1) flag = '!1';
    else if (x.wavetop ? x.rows > 8 : x.rows > 4) flag = '^';
    return `${x.key}${x.wavetop ? '*' : ''}:${x.rows}${flag}`;
  });
  out('```');
  for (let i = 0; i < cells.length; i += 8) out(cells.slice(i, i + 8).join('  '));
  out('```');
  if (r.pacingFlags.length) {
    out(
      `Pacing flags (over-ceiling, report-only): ${r.pacingFlags.map((x) => `${x.key} (${x.rows}${x.wavetop ? ', wavetop' : ''})`).join('; ')}`,
    );
    out();
  }
}

out(`## Thin pages (item-level, cross-reference)`);
out();
out(
  `Items whose \`moment.context\` is under ${SHALLOW_CONTEXT_CHARS} chars — the month axis above says where rows are missing; this says which existing rows are captions rather than coverage (same gate as \`content:coverage\`'s depth section). Per era:`,
);
out();
for (const r of [...eraRows].sort((a, b) => b.shallow.length - a.shallow.length)) {
  if (!r.shallow.length) continue;
  out(
    `- **${r.era.slug}** (${r.shallow.length}): ${r.shallow.map((s) => `"${String(s.title).slice(0, 48)}" (${s.contextLen})`).join('; ')}`,
  );
}
out();

process.stdout.write(lines.join('\n') + '\n');

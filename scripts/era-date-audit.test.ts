import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

import { eras } from '../supabase/seed/eras-data.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

type SeedRow = Record<string, unknown> & {
  day?: number;
  month?: number;
  slug?: string;
  title?: string;
  year?: number;
};

async function loadSeedDir(directory: string, listKey: string) {
  const dir = join(ROOT, 'supabase', 'seed', directory);
  const files = readdirSync(dir)
    .filter((file) => file.endsWith('.mjs') && !file.startsWith('_'))
    .sort();
  const rows: Array<{ file: string; fileEra: string; row: SeedRow }> = [];
  for (const file of files) {
    const mod = (await import(pathToFileURL(join(dir, file)).href)).default as {
      eraSlug: string;
      [key: string]: unknown;
    };
    for (const row of (mod[listKey] as SeedRow[]) ?? []) {
      rows.push({ file, fileEra: mod.eraSlug, row });
    }
  }
  return { files, rows };
}

function possibleEras(row: SeedRow) {
  if (!Number.isInteger(row.year) || !Number.isInteger(row.month)) return [];
  const year = row.year as number;
  const month = row.month as number;
  const mm = String(month).padStart(2, '0');
  if (Number.isInteger(row.day)) {
    const date = `${year}-${mm}-${String(row.day).padStart(2, '0')}`;
    return eras.filter((era) => date >= era.start_date && date <= era.end_date).map((era) => era.slug);
  }
  const lo = `${year}-${mm}-01`;
  const hi = `${year}-${mm}-${new Date(Date.UTC(year, month, 0)).getUTCDate()}`;
  return eras.filter((era) => lo <= era.end_date && hi >= era.start_date).map((era) => era.slug);
}

const DELIBERATE_SHOWGIRL_CAMPAIGN_EXCEPTIONS = [
  'showgirl-announced-on-new-heights',
  'showgirl-mert-marcus-portraits',
  'showgirl-david-koma-graham-norton',
  'showgirl-orange-reformation-versace',
  'showgirl-graham-norton-destination-wedding',
].sort();

describe('era-by-date seed audit (#3314)', () => {
  it('checks all dated content rows against the canonical era ranges', async () => {
    const { files, rows } = await loadSeedDir('content', 'items');
    expect(files).toHaveLength(12);

    const mismatches: string[] = [];
    const outsideAllRanges: Array<{ era: string; year: number }> = [];
    for (const { fileEra, row } of rows) {
      expect(Number.isInteger(row.year) && Number.isInteger(row.month)).toBe(true);
      const candidates = possibleEras(row);
      if (candidates.length === 0) {
        outsideAllRanges.push({ era: fileEra, year: row.year as number });
      } else if (!candidates.includes(fileEra)) {
        mismatches.push(row.slug ?? row.title ?? '(untitled)');
      }
    }

    // The canonical table starts on debut's album-release date. Earlier
    // career history has no alternate era file it could truthfully move to.
    expect(outsideAllRanges.every(({ era, year }) => era === 'debut' && year <= 2006)).toBe(true);
    // These campaign/promo records are the deliberate prior call documented
    // in the Showgirl seed and PR #2035; #3314 explicitly leaves them intact.
    expect(mismatches.sort()).toEqual(DELIBERATE_SHOWGIRL_CAMPAIGN_EXCEPTIONS);
  });

  it('checks every theory file and records that theories have no event-date field', async () => {
    const { files, rows } = await loadSeedDir('theories', 'theories');
    expect(files).toHaveLength(12);
    const eventDateKeys = [
      'date',
      'day',
      'eventDate',
      'firstSeenOn',
      'month',
      'observedOn',
      'publishedOn',
      'releasedOn',
      'revealedOn',
      'year',
    ];
    expect(rows.flatMap(({ row }) => eventDateKeys.filter((key) => key in row))).toEqual([]);
  });
});

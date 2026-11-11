import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { deepLinkTarget } from '../packages/experience/src/deepLink';
import { destinationFor } from '@swift2/shared';
import { ON_THIS_DAY_STARTER_POOL } from '../supabase/seed/on-this-day/starter-pool.mjs';
import { eras } from '../supabase/seed/eras-data.mjs';
import { momentIds } from './lib/moment-ids.mjs';
import trackKeys from '../apps/web/lib/longlive/lyric-track-keys.json';

type PoolRow = { month: number; day: number; text: string; deepLink: string | null };

// On This Day entries allowed to carry no link (none today; add a
// `MM-DD` key here only with a reason).
const NULL_DEEP_LINK_ALLOWLIST = new Set<string>([]);

const seedDir = join(__dirname, '..', 'supabase', 'seed', 'content');

async function seededMomentIds(): Promise<Set<string>> {
  const ids = new Set<string>();
  for (const f of readdirSync(seedDir).filter((n) => n.endsWith('.mjs') && !n.startsWith('_'))) {
    const mod = await import(pathToFileURL(join(seedDir, f)).href);
    const { eraSlug, items } = mod.default;
    for (const id of momentIds(eraSlug, items)) ids.add(id);
  }
  return ids;
}

describe('On This Day starter pool deep links', () => {
  it('every entry links to a real item, song or era the site deep-link reader opens', async () => {
    const momentSet = await seededMomentIds();
    const songSet = new Set(Object.values(trackKeys as Record<string, string>));
    const eraSet = new Set((eras as { id: string }[]).map((e) => e.id));
    const problems: string[] = [];
    for (const row of ON_THIS_DAY_STARTER_POOL as PoolRow[]) {
      const label = `${row.month}-${row.day}`;
      if (row.deepLink === null) {
        if (!NULL_DEEP_LINK_ALLOWLIST.has(label)) problems.push(`${label}: null deepLink not allowlisted`);
        continue;
      }
      const url = new URL(row.deepLink);
      if (url.origin !== 'https://www.longlivets.com') problems.push(`${label}: wrong origin`);
      const target = deepLinkTarget(url.search, []);
      if (target?.kind === 'item') {
        if (!momentSet.has(target.id)) problems.push(`${label}: unknown item ${target.id}`);
        const shell = destinationFor(row.deepLink);
        if (shell.kind !== 'moment' || shell.itemId !== target.id) problems.push(`${label}: shell does not open item`);
      } else if (target?.kind === 'song') {
        if (!songSet.has(target.key)) problems.push(`${label}: unknown song ${target.key}`);
      } else if (target?.kind === 'era') {
        if (!eraSet.has(target.id)) problems.push(`${label}: unknown era ${target.id}`);
      } else {
        problems.push(`${label}: link does not parse to item/song/era: ${row.deepLink}`);
      }
    }
    expect(problems).toEqual([]);
  });

  it('every month has at least 6 entries (#6669)', () => {
    const thin: string[] = [];
    for (let month = 1; month <= 12; month++) {
      const count = (ON_THIS_DAY_STARTER_POOL as PoolRow[]).filter((row) => row.month === month).length;
      if (count < 6) thin.push(`month ${month}: ${count}`);
    }
    expect(thin).toEqual([]);
  });
});

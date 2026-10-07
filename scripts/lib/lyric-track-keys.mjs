// slug -> composite trackKey (`${era}::n::title`) for every seeded track, so the
// lyric_of_day producer can link the song dossier without importing the whole
// track corpus. Same normalization/dedupe as sync-longlive-tracks.mjs.
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from './longlive-sync-shared.mjs';
import { buildTrackGuide } from '../sync-longlive-tracks.mjs';

const SEED_DIR = path.join(ROOT, 'supabase', 'seed', 'tracks');
export const OUT_FILE = path.join(ROOT, 'apps', 'web', 'lib', 'longlive', 'lyric-track-keys.json');

export async function buildLyricTrackKeys() {
  const files = (await readdir(SEED_DIR)).filter(
    (f) => f.endsWith('.mjs') && !f.startsWith('_') && !f.endsWith('.dossiers.mjs'),
  );
  const entries = [];
  for (const file of files.sort()) {
    const mod = await import(pathToFileURL(path.join(SEED_DIR, file)).href);
    const { eraSlug, tracks } = mod.default ?? mod;
    if (!eraSlug || !Array.isArray(tracks)) continue;
    for (const t of tracks) entries.push({ eraSlug, ...t });
  }
  const byEra = buildTrackGuide(entries);
  const map = {};
  for (const eraId of Object.keys(byEra).sort()) {
    for (const t of byEra[eraId]) {
      if (t.slug) map[t.slug] = `${eraId}::${t.trackNumber ?? 'x'}::${t.title}`;
    }
  }
  return map;
}

export const renderLyricTrackKeys = (map) => `${JSON.stringify(map, null, 1)}\n`;

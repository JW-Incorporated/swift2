// Regenerates apps/web/lib/longlive/lyric-track-keys.json (committed; a drift
// test in lyric-track-key.test.ts fails if it is stale).
//   node scripts/sync-lyric-track-keys.mjs
import { writeFile } from 'node:fs/promises';
import { OUT_FILE, buildLyricTrackKeys, renderLyricTrackKeys } from './lib/lyric-track-keys.mjs';

const map = await buildLyricTrackKeys();
await writeFile(OUT_FILE, renderLyricTrackKeys(map), 'utf-8');
console.log(`Wrote ${Object.keys(map).length} slug -> trackKey entries to ${OUT_FILE}`);

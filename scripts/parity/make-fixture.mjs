#!/usr/bin/env node
// One UI WP1.1c part 2: parity fixture generator. Run after `npm run sync:content`:
//   npx tsx --tsconfig apps/web/tsconfig.json scripts/parity/make-fixture.mjs
// Copies the published content bundle (apps/web/public/content, built from this
// commit) to apps/mobile/dist/parity-fixture/content, which serve.mjs serves at
// /content for the app's DOM entry (side b, no network). Builds the ReaderSnapshot
// from the baked web modules (what side a renders) and from the bundle files
// (what side b renders); exits non-zero unless the hashes are equal. Writes
// parity-fixture/fixture.json { bundleVersion, hash, itemId } for the specs.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/** The moment-detail route. Must exist in the bundle; changing it re-baselines `item.png`. */
export const FIXED_ITEM_ID = process.env.PARITY_ITEM_ID ?? 'vault-fearless-fifteen-written-for-her-best-friend-abigail';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const published = join(repo, 'apps/web/public/content');
const out = join(repo, 'apps/mobile/dist/parity-fixture');
const web = pathToFileURL(join(repo, 'apps/web/lib/longlive')) + '/';

const { eraVideoFeed } = await import('@swift2/content-enrichment');
const { fromBaked, fromBundle, hashSnapshot, diffSnapshots } = await import(
  '@swift2/experience/reader-snapshot'
);
const { ERAS } = await import(pathToFileURL(join(repo, 'packages/experience/src/eras.ts')).href);

const { bundleVersion } = JSON.parse(readFileSync(join(published, 'current.json'), 'utf-8'));
const dir = join(published, bundleVersion);
const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf-8'));
const files = {};
for (const [name, entry] of Object.entries(manifest.files)) {
  files[name] = JSON.parse(readFileSync(join(dir, entry.path), 'utf-8'));
}

const [content, tracks, theories, videos, secrets, merch, moods, search] = await Promise.all(
  ['content', 'tracks', 'theories', 'videos', 'era-secrets', 'merch', 'song-moods.generated', 'search'].map(
    (m) => import(`${web}${m}.ts`),
  ),
);
const baked = fromBaked(
  {
    ERAS,
    CONTENT: content.CONTENT,
    MILESTONES: content.MILESTONES,
    MERCH_CATALOGUE: merch.MERCH_CATALOGUE,
    SONG_MOODS: moods.SONG_MOODS,
    tracksForEra: tracks.tracksForEra,
    theoriesForEra: theories.theoriesForEra,
    allVideoRecordsForEra: videos.allVideoRecordsForEra,
    eraSecretsForEra: secrets.eraSecretsForEra,
    getSearchIndex: search.getSearchIndex,
  },
  { eraVideoFeed },
);
const bundled = fromBundle({ manifest, files }, { eraVideoFeed });

const diverging = await diffSnapshots(baked, bundled);
const { hash } = await hashSnapshot(bundled);
if (diverging.length > 0 || (await hashSnapshot(baked)).hash !== hash) {
  console.error(`parity fixture: baked and bundle snapshots diverge: ${diverging.join(', ') || '(hash)'}`);
  process.exit(1);
}
if (!Object.values(bundled.domains.content).some((items) => items.some((i) => i.id === FIXED_ITEM_ID))) {
  console.error(`parity fixture: item ${FIXED_ITEM_ID} is not in the bundle`);
  process.exit(1);
}

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'content'), { recursive: true });
cpSync(dir, join(out, 'content', bundleVersion), { recursive: true });
cpSync(join(published, 'current.json'), join(out, 'content', 'current.json'));
writeFileSync(join(out, 'fixture.json'), JSON.stringify({ bundleVersion, hash, itemId: FIXED_ITEM_ID }));
console.log(`parity fixture: ${bundleVersion.slice(0, 12)} hash ${hash.slice(0, 12)} item ${FIXED_ITEM_ID}`);

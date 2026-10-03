#!/usr/bin/env node
// One UI WP1.1c: the FROZEN parity content snapshot (scripts/parity/fixture/,
// committed). Both sides render from it, so baselines do not move when live
// content (supabase/seed/**) changes. Run with tsx:
//   npx tsx --tsconfig apps/web/tsconfig.json scripts/parity/make-fixture.mjs [mode]
//
//   (no mode) / --check   verify: the baked web modules now under apps/web must hash
//                         equal to the fixture bundle and to fixture.json. Exits 1 otherwise.
//   --apply               CI (build-web): copy the frozen baked modules and bundle over
//                         apps/web, then verify. Run after `npm run sync:content`, then
//                         `next build` directly (NOT `npm run build`: its prebuild re-syncs).
//   --regenerate          deliberate, manual or dispatch only: freeze the LIVE synced tree
//                         (after `npm run sync:content`) into scripts/parity/fixture/ and
//                         write fixture.json. CI never runs this.
//
// fixture.json = { bundleVersion, hash, itemId }; itemId is the moment-detail route.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const fixtureDir = join(repo, 'scripts/parity/fixture');
const published = join(repo, 'apps/web/public/content');
const longlive = join(repo, 'apps/web/lib/longlive');
const web = pathToFileURL(longlive) + '/';

/** Baked modules the snapshot (and so both rendered sides) is built from. */
const BAKED = [
  'content-vault',
  'tracks',
  'theories-bundle',
  'videos-bundle',
  'era-secrets',
  'merch',
  'song-moods',
].map((n) => `${n}.generated.ts`);

const mode = process.argv[2] ?? '--check';
if (!['--check', '--apply', '--regenerate'].includes(mode)) {
  console.error(`parity fixture: unknown mode ${mode}`);
  process.exit(2);
}

const FIXED_ITEM_ID =
  mode === '--regenerate'
    ? (process.env.PARITY_ITEM_ID ?? 'vault-fearless-fifteen-written-for-her-best-friend-abigail')
    : JSON.parse(readFileSync(join(fixtureDir, 'fixture.json'), 'utf-8')).itemId;

if (mode === '--regenerate') {
  rmSync(fixtureDir, { recursive: true, force: true });
  mkdirSync(join(fixtureDir, 'web'), { recursive: true });
  const { bundleVersion } = JSON.parse(readFileSync(join(published, 'current.json'), 'utf-8'));
  cpSync(join(published, bundleVersion), join(fixtureDir, 'content', bundleVersion), { recursive: true });
  cpSync(join(published, 'current.json'), join(fixtureDir, 'content', 'current.json'));
  for (const f of BAKED) cpSync(join(longlive, f), join(fixtureDir, 'web', f));
}
if (mode === '--apply') {
  for (const f of BAKED) cpSync(join(fixtureDir, 'web', f), join(longlive, f));
  rmSync(published, { recursive: true, force: true });
  cpSync(join(fixtureDir, 'content'), published, { recursive: true });
}

const { eraVideoFeed } = await import('@swift2/content-enrichment');
const { fromBaked, fromBundle, hashSnapshot, diffSnapshots } = await import(
  '@swift2/experience/reader-snapshot'
);
const { ERAS } = await import('@swift2/experience');

const { bundleVersion } = JSON.parse(readFileSync(join(fixtureDir, 'content/current.json'), 'utf-8'));
const dir = join(fixtureDir, 'content', bundleVersion);
if (!existsSync(dir)) {
  console.error(`parity fixture: ${dir} missing`);
  process.exit(1);
}
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

if (mode === '--regenerate') {
  writeFileSync(
    join(fixtureDir, 'fixture.json'),
    JSON.stringify({ bundleVersion, hash, itemId: FIXED_ITEM_ID }, null, 2) + '\n',
  );
  console.log(`parity fixture: FROZEN ${bundleVersion.slice(0, 12)} hash ${hash.slice(0, 12)} item ${FIXED_ITEM_ID}`);
} else {
  const committed = JSON.parse(readFileSync(join(fixtureDir, 'fixture.json'), 'utf-8'));
  if (committed.hash !== hash || committed.bundleVersion !== bundleVersion) {
    console.error(
      `parity fixture: committed fixture.json (${committed.hash.slice(0, 12)}) != computed ${hash.slice(0, 12)}; ` +
        `the frozen snapshot was edited or is stale - regenerate deliberately (docs/one-ui/parity.md)`,
    );
    process.exit(1);
  }
  console.log(`parity fixture: ${mode.slice(2)} ok, ${bundleVersion.slice(0, 12)} hash ${hash.slice(0, 12)}`);
}

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
//   --lenses              CI (build-dom): copy only the frozen lenses module over packages/experience.
//   --regenerate          deliberate, manual or dispatch only: freeze the LIVE synced tree
//                         (after `npm run sync:content`) into scripts/parity/fixture/, prune it
//                         (below) and write fixture.json. CI never runs this.
//   --prune               prune the committed fixture in place (idempotent), then verify and
//                         rewrite fixture.json. Keeps only the eras the two routes render (the
//                         current era and the fixed item's era), in BOTH the bundle and the baked
//                         modules, and renames the hash-named content dir to `frozen`.
//
// fixture.json = { bundleVersion, hash, lensesSha256, itemId }; itemId is the moment-detail route,
// lensesSha256 is the sha256 (LF-normalised) of the frozen experience/lenses.generated.ts.
import { createHash } from 'node:crypto';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const fixtureDir = join(repo, 'scripts/parity/fixture');
const published = join(repo, 'apps/web/public/content');
const longlive = join(repo, 'apps/web/lib/longlive');
const web = pathToFileURL(longlive) + '/';
const experienceSrc = join(repo, 'packages/experience/src');
/** Frozen lens data (packages/experience), copied by --apply and --lenses so supabase/seed/lenses/** cannot move baselines. */
const LENSES = 'lenses.generated.ts';

/** Baked modules the snapshot (and so both rendered sides) is built from. */
const BAKED = [
  'content-vault',
  'tracks',
  'theories-bundle',
  'videos-bundle',
  'era-secrets',
  'merch',
  'song-moods',
  'clownbot-lore',
].map((n) => `${n}.generated.ts`);

/** Baked modules keyed by era at two-space indent (`  "<era>": [ ... ],`); pruned in step with the bundle. */
const ERA_KEYED = [
  'content-vault',
  'era-secrets',
  'theories-bundle',
  'tracks',
  'videos-bundle',
].map((n) => `${n}.generated.ts`);
/** Bundle catalogues that are one `{ eraId, <field>: [...] }` entry per era. */
const PER_ERA = { tracks: 'tracks', theories: 'theories', videos: 'videos', eraSecrets: 'secrets' };
/** Short stand-in for the 64-hex content hash: directory name, current.json and manifest.bundleVersion. */
const ALIAS = 'frozen';

const mode = process.argv[2] ?? '--check';
if (
  !['--check', '--apply', '--lenses', '--regenerate', '--prune', '--verify-lenses'].includes(mode)
) {
  console.error(`parity fixture: unknown mode ${mode}`);
  process.exit(2);
}

if (mode === '--verify-lenses') {
  const got = createHash('sha256')
    .update(readFileSync(join(experienceSrc, LENSES), 'utf-8').replaceAll('\r\n', '\n'))
    .digest('hex');
  const want = JSON.parse(readFileSync(join(fixtureDir, 'fixture.json'), 'utf-8')).lensesSha256;
  if (got !== want) {
    console.error(
      `parity fixture: packages/experience/src/${LENSES} (${got.slice(0, 12)}) != fixture.json lensesSha256 (${String(want).slice(0, 12)}); ` +
        `a build step regenerated the lens data after the freeze`,
    );
    process.exit(1);
  }
  console.log('parity fixture: live lenses match the frozen snapshot');
  process.exit(0);
}

const FIXED_ITEM_ID =
  mode === '--regenerate'
    ? (process.env.PARITY_ITEM_ID ?? 'vault-fearless-fifteen-written-for-her-best-friend-abigail')
    : JSON.parse(readFileSync(join(fixtureDir, 'fixture.json'), 'utf-8')).itemId;

const { ERAS, CURRENT_ERA_ID } = await import('@swift2/experience');
const writing = mode === '--regenerate' || mode === '--prune';

const writeJson = (path, value) => {
  const text = JSON.stringify(value, null, 2) + '\n';
  writeFileSync(path, text);
  return {
    sha256: createHash('sha256').update(text).digest('hex'),
    bytes: Buffer.byteLength(text),
  };
};

/**
 * Keep only what the two routes render: the current era (first screen of `/`) and the
 * fixed item's era. Dropped eras lose their content file and have their per-era catalogue
 * entries emptied (not removed: the baked accessors answer [] for them, so the bundle must too);
 * the same eras' blocks are cut from the era-keyed baked modules. Milestones and the
 * shop-the-look merch are derived from the baked content, so they are filtered to the same eras. Idempotent.
 */
function pruneFixture() {
  const pointerPath = join(fixtureDir, 'content/current.json');
  const pointer = JSON.parse(readFileSync(pointerPath, 'utf-8'));
  const oldDir = join(fixtureDir, 'content', pointer.bundleVersion);
  const manifestPath = join(oldDir, 'manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  let itemEra;
  for (const [name, entry] of Object.entries(manifest.files)) {
    if (!name.startsWith('content:')) continue;
    const file = JSON.parse(readFileSync(join(oldDir, entry.path), 'utf-8'));
    if (file.items.some((i) => i.id === FIXED_ITEM_ID)) itemEra = name.slice('content:'.length);
  }
  if (!itemEra) {
    console.error(`parity fixture: item ${FIXED_ITEM_ID} is not in the bundle`);
    process.exit(1);
  }
  const keep = new Set([CURRENT_ERA_ID, itemEra]);
  for (const [name, entry] of Object.entries(manifest.files)) {
    if (name.startsWith('content:') && !keep.has(name.slice('content:'.length))) {
      rmSync(join(oldDir, entry.path), { force: true });
      delete manifest.files[name];
    } else if (name === 'milestones') {
      const all = JSON.parse(readFileSync(join(oldDir, entry.path), 'utf-8'));
      Object.assign(
        entry,
        writeJson(
          join(oldDir, entry.path),
          all.filter((m) => keep.has(m.eraId)),
        ),
      );
    } else if (name === 'merch') {
      const all = JSON.parse(readFileSync(join(oldDir, entry.path), 'utf-8'));
      all.shopTheLook = all.shopTheLook.filter((m) => keep.has(m.source?.eraId));
      Object.assign(entry, writeJson(join(oldDir, entry.path), all));
    } else if (name in PER_ERA) {
      const field = PER_ERA[name];
      const pruned = JSON.parse(readFileSync(join(oldDir, entry.path), 'utf-8')).map((e) =>
        keep.has(e.eraId) ? e : { ...e, [field]: [] },
      );
      Object.assign(entry, writeJson(join(oldDir, entry.path), pruned));
    }
  }
  manifest.bundleVersion = ALIAS;
  writeJson(manifestPath, manifest);
  writeJson(pointerPath, { ...pointer, bundleVersion: ALIAS });
  if (pointer.bundleVersion !== ALIAS) renameSync(oldDir, join(fixtureDir, 'content', ALIAS));
  for (const f of ERA_KEYED) {
    const path = join(fixtureDir, 'web', f);
    let skipping = false;
    const kept = [];
    for (const line of readFileSync(path, 'utf-8').split('\n')) {
      if (skipping) {
        skipping = !/^ {2}\],?\s*$/.test(line);
        continue;
      }
      const m = /^ {2}"?([a-z0-9-]+)"?: \[\s*$/.exec(line);
      if (m && !keep.has(m[1])) skipping = true;
      else kept.push(line);
    }
    writeFileSync(path, kept.join('\n'));
  }
}

if (mode === '--lenses') {
  cpSync(join(fixtureDir, 'experience', LENSES), join(experienceSrc, LENSES));
  console.log('parity fixture: lenses applied');
  process.exit(0);
}
if (mode === '--regenerate') {
  rmSync(fixtureDir, { recursive: true, force: true });
  mkdirSync(join(fixtureDir, 'web'), { recursive: true });
  const { bundleVersion } = JSON.parse(readFileSync(join(published, 'current.json'), 'utf-8'));
  cpSync(join(published, bundleVersion), join(fixtureDir, 'content', bundleVersion), {
    recursive: true,
  });
  cpSync(join(published, 'current.json'), join(fixtureDir, 'content', 'current.json'));
  for (const f of BAKED) cpSync(join(longlive, f), join(fixtureDir, 'web', f));
  mkdirSync(join(fixtureDir, 'experience'), { recursive: true });
  cpSync(join(experienceSrc, LENSES), join(fixtureDir, 'experience', LENSES));
}
if (writing) pruneFixture();
if (mode === '--apply' || writing) {
  for (const f of BAKED) cpSync(join(fixtureDir, 'web', f), join(longlive, f));
  cpSync(join(fixtureDir, 'experience', LENSES), join(experienceSrc, LENSES));
  rmSync(published, { recursive: true, force: true });
  cpSync(join(fixtureDir, 'content'), published, { recursive: true });
}

const { eraVideoFeed } = await import('@swift2/content-enrichment');
const { fromBaked, fromBundle, hashSnapshot, diffSnapshots } =
  await import('@swift2/experience/reader-snapshot');

const { bundleVersion } = JSON.parse(
  readFileSync(join(fixtureDir, 'content/current.json'), 'utf-8'),
);
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

const [content, tracks, theories, videos, secrets, merch, moods, loreMod] = await Promise.all(
  [
    'content',
    'tracks',
    'theories',
    'videos',
    'era-secrets',
    'merch',
    'song-moods.generated',
    'clownbot-lore',
  ].map((m) => import(`${web}${m}.ts`)),
);
const baked = fromBaked(
  {
    ERAS,
    CONTENT: content.CONTENT,
    MILESTONES: content.MILESTONES,
    MERCH_CATALOGUE: merch.MERCH_CATALOGUE,
    SONG_MOODS: moods.SONG_MOODS,
    LORE: loreMod.LORE,
    tracksForEra: tracks.tracksForEra,
    theoriesForEra: theories.theoriesForEra,
    allVideoRecordsForEra: videos.allVideoRecordsForEra,
    eraSecretsForEra: secrets.eraSecretsForEra,
  },
  { eraVideoFeed },
);
const bundled = fromBundle({ manifest, files }, { eraVideoFeed });

const diverging = await diffSnapshots(baked, bundled);
const { hash } = await hashSnapshot(bundled);
if (diverging.length > 0 || (await hashSnapshot(baked)).hash !== hash) {
  console.error(
    `parity fixture: baked and bundle snapshots diverge: ${diverging.join(', ') || '(hash)'}`,
  );
  process.exit(1);
}
if (
  !Object.values(bundled.domains.content).some((items) => items.some((i) => i.id === FIXED_ITEM_ID))
) {
  console.error(`parity fixture: item ${FIXED_ITEM_ID} is not in the bundle`);
  process.exit(1);
}

const lensesSha256 = createHash('sha256')
  .update(readFileSync(join(fixtureDir, 'experience', LENSES), 'utf-8').replaceAll('\r\n', '\n'))
  .digest('hex');

if (writing) {
  writeFileSync(
    join(fixtureDir, 'fixture.json'),
    JSON.stringify({ bundleVersion, hash, lensesSha256, itemId: FIXED_ITEM_ID }, null, 2) + '\n',
  );
  console.log(
    `parity fixture: ${mode.slice(2).toUpperCase()} ${bundleVersion.slice(0, 12)} hash ${hash.slice(0, 12)} item ${FIXED_ITEM_ID}`,
  );
} else {
  const committed = JSON.parse(readFileSync(join(fixtureDir, 'fixture.json'), 'utf-8'));
  if (committed.lensesSha256 !== lensesSha256) {
    console.error(
      `parity fixture: frozen ${LENSES} (${lensesSha256.slice(0, 12)}) != fixture.json lensesSha256 (${String(committed.lensesSha256).slice(0, 12)}); ` +
        `the frozen lens module was edited or is stale - regenerate deliberately (docs/one-ui/parity.md)`,
    );
    process.exit(1);
  }
  if (committed.hash !== hash || committed.bundleVersion !== bundleVersion) {
    console.error(
      `parity fixture: committed fixture.json (${committed.hash.slice(0, 12)}) != computed ${hash.slice(0, 12)}; ` +
        `the frozen snapshot was edited or is stale - regenerate deliberately (docs/one-ui/parity.md)`,
    );
    process.exit(1);
  }
  console.log(
    `parity fixture: ${mode.slice(2)} ok, ${bundleVersion.slice(0, 12)} hash ${hash.slice(0, 12)}`,
  );
}

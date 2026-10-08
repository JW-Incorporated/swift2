#!/usr/bin/env node
// OS-014b-3 (kanban t_a68139a4, docs/proposals/2026-09-vault-read-path.md):
// regenerates apps/web/lib/longlive/{theories,videos}-bundle.generated.ts
// FROM the published content bundle (apps/web/public/content/<bundleVersion>/
// {theories,videos}.json) — the artifacts `theories.ts`/`videos.ts` import
// their raw per-era data from, instead of importing
// `theories.generated.ts`/`videos.generated.ts` (the seed-derived
// intermediates that feed the bundle BUILD, via
// `scripts/lib/dump-longlive-sources.ts`) directly.
//
// Why a generated file, not a runtime `fs.readFileSync` in `theories.ts`
// itself: `theories.ts`/`videos.ts` are imported by 'use client' components
// (TheoryGuide.tsx, VideoMomentCard.tsx), so Next/Turbopack must bundle
// their whole import graph for the BROWSER too — Node's `fs`/`path`/`url`
// don't exist there, and a browser bundle must never make a per-user
// network fetch for this static data either (CLAUDE.md: "Vault stays
// static, no per-user LLM/network calls"). A generated TS module with the
// bundle's data inlined as a plain object literal is bundler-safe on every
// target (server, client, RSC) exactly like the old `*.generated.ts` files
// were — the only change is WHERE the data comes from (the published
// bundle, not a second parse of `supabase/seed/**`).
//
// `content.ts`/`tracks.ts` (OS-014b-2) took the OTHER accepted pattern
// instead (per Fable rulings FR-t_cd5741fc-1/-2, same as era-secrets.ts/
// merch.ts/clownbot-lore.ts's OS-014b-4/5): those keep importing their
// `.generated.ts` literal directly (no bundle-backed regeneration step
// here) and rely on a byte-identical-to-the-published-bundle regression
// test instead — content.ts is on `era-secrets.ts`'s own import graph
// (`era-secrets.ts` imports `getContentItem`/`CONTENT` from `content.ts`),
// so giving `content.ts` a bundle-backed generated module here would create
// the exact fixed-point circularity this script already avoids for
// `theories.ts`/`videos.ts` (see `dump-longlive-sources.ts`'s doc comment).
//
// Run as a `prebuild` step AFTER `scripts/publish-content-bundle.mjs`, so
// the bundle already exists on disk at `apps/web/public/content/` by the
// time this script reads it.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { register } from 'tsx/esm/api';
import { ROOT } from './lib/generated-content.mjs';
import { runMain } from './lib/cli.mjs';

const CONTENT_ROOT = path.join(ROOT, 'apps', 'web', 'public', 'content');
const OUT_DIR = path.join(ROOT, 'apps', 'web', 'lib', 'longlive');

function readJson(p) {
  return JSON.parse(readFileSync(p, 'utf-8'));
}

/** Reads + validates one named bundle file against its `@swift2/content` schema. Exported for tests. */
export function readBundleFile(name, schema) {
  const { bundleVersion } = readJson(path.join(CONTENT_ROOT, 'current.json'));
  const manifest = readJson(path.join(CONTENT_ROOT, bundleVersion, 'manifest.json'));
  const entry = manifest.files[name];
  if (!entry) {
    throw new Error(`generate-bundle-backed-modules: manifest has no entry named "${name}"`);
  }
  const raw = readJson(path.join(CONTENT_ROOT, bundleVersion, entry.path));
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `generate-bundle-backed-modules: "${name}" failed schema validation: ` +
        JSON.stringify(parsed.error.issues),
    );
  }
  return parsed.data;
}

/** Renders a `name -> value[]` bundle-file array into a `Partial<Record<EraId, T[]>>` TS module. Exported for tests. */
export function renderByEraModule({ constName, typeImport, files, key }) {
  const byEra = {};
  for (const file of files) byEra[file.eraId] = file[key];
  return (
    `// GENERATED FILE — do not hand-edit.\n` +
    `// Produced by scripts/generate-bundle-backed-modules.mjs from the published\n` +
    `// content bundle (apps/web/public/content/<bundleVersion>/${key}.json).\n` +
    `// Re-run "npm run prebuild" (apps/web) after the bundle changes; don't edit\n` +
    `// this file directly.\n\n` +
    `${typeImport}\n\n` +
    `export const ${constName}: Partial<Record<EraId, ${constName === 'THEORIES_RAW' ? 'TheoryNote' : 'VideoNote'}[]>> = ${JSON.stringify(byEra, null, 2)};\n`
  );
}

async function main() {
  const unregister = register();
  let schema;
  try {
    schema = await import(
      pathToFileURL(path.join(ROOT, 'packages', 'content', 'src', 'schema.ts')).href
    );
  } finally {
    await unregister();
  }

  const theoriesFiles = readBundleFile('theories', schema.theoriesBundleFileSchema.array());
  writeFileSync(
    path.join(OUT_DIR, 'theories-bundle.generated.ts'),
    renderByEraModule({
      constName: 'THEORIES_RAW',
      typeImport: "import type { EraId, TheoryNote } from '@swift2/experience';",
      files: theoriesFiles,
      key: 'theories',
    }),
    'utf-8',
  );

  const videosFiles = readBundleFile('videos', schema.videosBundleFileSchema.array());
  writeFileSync(
    path.join(OUT_DIR, 'videos-bundle.generated.ts'),
    renderByEraModule({
      constName: 'VIDEOS_RAW',
      typeImport: "import type { EraId, VideoNote } from '@swift2/experience';",
      files: videosFiles,
      key: 'videos',
    }),
    'utf-8',
  );

  console.log(
    `Generated theories-bundle.generated.ts (${theoriesFiles.length} eras) and ` +
      `videos-bundle.generated.ts (${videosFiles.length} eras) from the published content bundle.`,
  );
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  runMain(main, { name: 'generate-bundle-backed-modules' });
}

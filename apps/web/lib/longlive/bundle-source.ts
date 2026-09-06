/**
 * Synchronous, filesystem-based reader for the published content bundle
 * (OS-014b-2, `docs/specs/2026-09-05-one-source-three-surfaces.md` §6).
 * `content.ts`/`tracks.ts` need plain, synchronous, module-level constants —
 * ~100+ call sites across server components, API routes, and tests already
 * import `CONTENT`/`TRACKS_RAW`-derived data as values, not promises — so
 * this does NOT call `packages/content`'s `loadBundle()` (async, designed
 * for a network `fetch` with ETag/last-good caching mobile needs, OS-015).
 * Instead it re-reads the exact same on-disk artifact `loadBundle()` would
 * fetch over HTTP (`apps/web/public/content/`, written by
 * `scripts/publish-content-bundle.mjs` during `prebuild`/CI's `content:bundle`
 * step) directly off disk with `node:fs`, and validates every file against
 * the SAME zod schemas (`@swift2/content`'s `contentBundleSchemas`) the real
 * loader uses — same integrity contract (byte length + sha256 per manifest
 * entry), no network stack, no cache/ETag bookkeeping a one-shot per-process
 * build-time read doesn't need.
 *
 * Every read function here returns `null` (never throws) when the bundle
 * isn't available or fails to parse/validate, so callers can fall back to
 * computing straight from the locally generated `*.generated.ts` — the same
 * output the bundle itself is built from, so the two paths are byte-
 * identical whenever both are available (see `content.bundle-source.test.ts`).
 * That fallback exists for two real cases, not just belt-and-suspenders:
 *
 *  1. A fresh checkout, or any `test`/`typecheck` run, before `content:bundle`
 *     has ever run — `apps/web/public/content/` simply doesn't exist yet.
 *  2. `scripts/build-content-bundle.mjs` producing the bundle in the first
 *     place: its `loadSources()` step runs `scripts/lib/dump-longlive-
 *     sources.ts` in a child process, which imports `era-secrets.ts`, which
 *     imports `getContentItem`/`CONTENT` from THIS package's `content.ts` —
 *     so `content.ts` is on the bundle builder's own import graph. Reading a
 *     STALE on-disk bundle at that moment (left over from a previous build)
 *     would let a fresh content run silently mix new era data with an old
 *     published snapshot. `build-content-bundle.mjs` sets
 *     `LONGLIVE_BUNDLE_BUILD=1` on that child process for exactly this
 *     reason; `bundleRootAvailable()`/every reader below treats it as "act as
 *     if no bundle is published" so the builder always recomputes fresh.
 */
import type { ContentItem, EraId, TrackNote } from '@swift2/experience';
import { contentBundleFileSchema, manifestSchema, tracksBundleFileSchema } from '@swift2/content';
import { z } from 'zod';

// `content.ts`/`tracks.ts` (this module's only callers) are imported by both
// server code AND client components ('use client' files like
// TimelineScrubber.tsx already import `contentForEra`/`milestonesForEra`
// from `content.ts` directly — that's pre-existing, unrelated to OS-014b-2).
// Turbopack/webpack build the FULL module graph for every entrypoint,
// server or client, so a top-level `import 'node:fs'` here — even one only
// ever CALLED from server code — makes the client bundler try to resolve
// `node:fs` for the browser and fail the build ("does not support external
// modules (request: node:fs)"). Node builtins are loaded through a
// `require()` whose specifier is built at runtime (string concatenation)
// instead of a static `import`/`require('node:fs')` literal, so neither
// bundler's static import graph ever sees "node:fs"/"node:path"/etc as a
// dependency of this module — it becomes plain untraced code, exactly like
// the `typeof window === 'undefined'` guards already used elsewhere in this
// app (local-storage-adapter.ts, in-app.ts) for the same client/server
// dual-target constraint. The `typeof require === 'function'` check also
// means this never executes in the browser at runtime even if some future
// bundler DID decide to trace it.
type NodeFsModule = typeof import('node:fs');
type NodeCryptoModule = typeof import('node:crypto');
type NodePathModule = typeof import('node:path');
type NodeUrlModule = typeof import('node:url');

function nodeRequire<T>(specifier: string): T | null {
  if (typeof window !== 'undefined') return null;
  if (typeof require !== 'function') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require(specifier) as T;
  } catch {
    return null;
  }
}

const fsMod = nodeRequire<NodeFsModule>('node' + ':fs');
const cryptoMod = nodeRequire<NodeCryptoModule>('node' + ':crypto');
const pathMod = nodeRequire<NodePathModule>('node' + ':path');
const urlMod = nodeRequire<NodeUrlModule>('node' + ':url');

const __dirname =
  pathMod && urlMod ? pathMod.dirname(urlMod.fileURLToPath(import.meta.url)) : '';

/**
 * Where `scripts/publish-content-bundle.mjs` writes the web's copy of the
 * bundle (`publishBundle()`'s `DEFAULT_OUT_ROOT`) — `apps/web/public/content/`.
 * Overridable via `LONGLIVE_CONTENT_BUNDLE_DIR` so tests can point this at a
 * throwaway bundle built into a temp directory without touching the real
 * `public/content/` a local `npm run build` may have already populated.
 */
function bundleRoot(): string {
  if (!pathMod) return '';
  return (
    process.env.LONGLIVE_CONTENT_BUNDLE_DIR ??
    pathMod.join(__dirname, '..', '..', 'public', 'content')
  );
}

interface RawBundle {
  files: Record<string, unknown>;
}

/** Reads + validates the published bundle's manifest and every file it lists. Never throws — returns `null` on any missing file, integrity mismatch, or schema failure, and `null` unconditionally while `LONGLIVE_BUNDLE_BUILD` is set (see module doc, case 2). Also `null` outside a Node runtime (the browser) — this reader is server/build-only, see the module doc above `nodeRequire()`. */
function readPublishedBundle(): RawBundle | null {
  // `build-content-bundle.mjs` sets this on the child process that produces
  // the bundle in the first place (`loadSources()`) — that process must
  // never read a bundle (fresh or stale) while it is the one building it.
  if (process.env.LONGLIVE_BUNDLE_BUILD) return null;
  if (!fsMod || !pathMod || !cryptoMod) return null;
  const fs = fsMod;
  const path = pathMod;
  const crypto = cryptoMod;

  try {
    const root = bundleRoot();
    const currentPath = path.join(root, 'current.json');
    if (!fs.existsSync(/* turbopackIgnore: true */ currentPath)) return null;

    const pointerSchema = z.object({ bundleVersion: z.string().min(1) });
    const { bundleVersion } = pointerSchema.parse(
      // turbopackIgnore: dynamic bundle-version dir name — the actual path
      // read is scoped to apps/web/public/content/ (or a test temp dir via
      // LONGLIVE_CONTENT_BUNDLE_DIR), not project-wide; see bundleRoot().
      JSON.parse(fs.readFileSync(/* turbopackIgnore: true */ currentPath, 'utf-8')),
    );

    const versionDir = path.join(root, bundleVersion);
    const manifestPath = path.join(versionDir, 'manifest.json');
    if (!fs.existsSync(/* turbopackIgnore: true */ manifestPath)) return null;
    const manifest = manifestSchema.parse(
      JSON.parse(fs.readFileSync(/* turbopackIgnore: true */ manifestPath, 'utf-8')),
    );

    const files: Record<string, unknown> = {};
    for (const [name, entry] of Object.entries(manifest.files)) {
      const filePath = path.join(versionDir, entry.path);
      if (!fs.existsSync(/* turbopackIgnore: true */ filePath)) return null;
      const text = fs.readFileSync(/* turbopackIgnore: true */ filePath, 'utf-8');

      const byteLength = Buffer.byteLength(text, 'utf-8');
      if (byteLength !== entry.bytes) return null;
      const actualHash = crypto.createHash('sha256').update(text).digest('hex');
      if (actualHash !== entry.sha256) return null;

      files[name] = JSON.parse(text);
    }
    return { files };
  } catch {
    return null;
  }
}

/**
 * `CONTENT` (apps/web/lib/longlive/content.ts) from the published bundle's
 * `content:<eraId>` entries, or `null` if the bundle is unavailable/invalid.
 * Era order is alphabetical by era id — the same order
 * `scripts/sync-longlive-content.mjs` writes `VAULT_RAW` in (`Object.keys
 * (byEra).sort()`) and `assembleBundleEntries` preserves via `buildManifest`'s
 * own sorted-key insertion — so the flattened array matches `buildContent`'s
 * output item-for-item, not just set-for-set.
 */
export function contentFromPublishedBundle(): ContentItem[] | null {
  const bundle = readPublishedBundle();
  if (!bundle) return null;

  const eraIds = Object.keys(bundle.files)
    .filter((k) => k.startsWith('content:'))
    .map((k) => k.slice('content:'.length))
    .sort();
  if (eraIds.length === 0) return null;

  try {
    const out: ContentItem[] = [];
    for (const eraId of eraIds) {
      const file = contentBundleFileSchema.parse(bundle.files[`content:${eraId}`]);
      out.push(...file.items);
    }
    return out;
  } catch {
    return null;
  }
}

/**
 * `TRACKS_RAW` (apps/web/lib/longlive/tracks.ts) from the published bundle's
 * single `tracks` entry (`TracksBundleFile[]`, one per era —
 * `scripts/build-content-bundle.mjs`'s `assembleBundleEntries` always emits
 * this domain flat, never per-era-split), or `null` if unavailable/invalid.
 * Keys are inserted in sorted era-id order (matching
 * `scripts/sync-longlive-tracks.mjs`'s `Object.keys(byEra).sort()`
 * convention) and an era with zero tracks is omitted entirely — the same
 * `Partial<Record<EraId, TrackNote[]>>` shape `tracks.generated.ts` produces.
 *
 * Returns `null` (never `{}`) when EVERY era's track list came back empty —
 * with 700+ hand-researched tracks across the real corpus, an all-empty
 * result means the bundle's `tracks` domain failed to populate at build
 * time (a build defect, not genuine content), so this deliberately refuses
 * to let a broken-but-parseable bundle silently ship "no tracks anywhere"
 * to callers. `{}` is truthy for `??`, so without this guard `tracks.ts`'s
 * `tracksRawFromPublishedBundle() ?? GENERATED_TRACKS_RAW` would keep the
 * broken empty result instead of falling back to the known-good generated
 * data — the exact failure this repo's own `dump-longlive-sources.ts`
 * child-process build step can hit (see that file's module doc).
 */
export function tracksRawFromPublishedBundle(): Partial<Record<EraId, TrackNote[]>> | null {
  const bundle = readPublishedBundle();
  if (!bundle) return null;

  const tracksEntry = bundle.files.tracks;
  if (tracksEntry === undefined) return null;

  try {
    const parsed = z.array(tracksBundleFileSchema).parse(tracksEntry);
    const byEra = new Map(parsed.map((f) => [f.eraId, f.tracks]));
    const out: Partial<Record<EraId, TrackNote[]>> = {};
    for (const eraId of [...byEra.keys()].sort()) {
      const tracks = byEra.get(eraId)!;
      if (tracks.length > 0) out[eraId] = tracks;
    }
    if (Object.keys(out).length === 0) return null;
    return out;
  } catch {
    return null;
  }
}

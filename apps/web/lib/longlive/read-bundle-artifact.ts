/**
 * Synchronous reader for the published content bundle's own JSON artifacts
 * (OS-014b, per Fable ruling FR-t_cd5741fc-1). RESERVED FOR SERVER-ONLY
 * DOMAIN MODULES — see FR-t_cd5741fc-2: a module that is reachable from a
 * `'use client'` component's import graph MUST NOT use this helper (Next.js/
 * Turbopack statically bundles everything in that graph for the browser,
 * and `node:fs`/`node:path` cannot be bundled for the browser — confirmed
 * via a real `TurbopackInternalError` build failure, not a theoretical
 * concern). For such modules, keep importing the `.generated.ts` literal
 * directly as the runtime value, and add a regression test asserting
 * byte-identity against the published bundle artifact instead (see
 * clownbot-lore.test.ts for the pattern).
 *
 * WHY NOT `packages/content`'s `loadBundle()`: that loader is an async HTTP
 * client built for a genuinely remote, distributed consumer (mobile, OS-015)
 * — fetch + ETag caching + offline last-good fallback. `apps/web`'s own
 * build is not a remote consumer of its own bundle: `apps/web/package.json`'s
 * `prebuild` script runs `scripts/publish-content-bundle.mjs`, which writes
 * `apps/web/public/content/<bundleVersion>/<file>.json` (plus
 * `current.json`) to LOCAL DISK before the Next.js build (and therefore
 * before any module in this directory is even imported) — so by the time
 * this file's exports are evaluated, the exact JSON this reads already
 * exists on the same filesystem, produced by the same CI run. Fetching it
 * back over HTTP would be a circular, purely-cosmetic network round trip:
 * real added latency and a real new failure mode (build-time dependency on
 * the bundle's own publish step reaching an HTTP server) for zero benefit
 * over reading the file directly. Reading it via Node's synchronous `fs`
 * API also keeps every existing consumer's synchronous import contract
 * unchanged — this migration's explicit "zero pixel/behavior change" bar
 * (~100+ import sites read these modules synchronously today).
 *
 * WHAT THIS BUYS OVER importing the app-layer `.generated.ts` files
 * directly: those files are typed TypeScript re-derivations of
 * `supabase/seed/**`, each with its own generator script
 * (`scripts/sync-*.mjs`) and its own chance to drift from the actual
 * published bundle. Reading the bundle's own `manifest.json`-listed,
 * schema-validated JSON file makes the published artifact the single
 * source every surface (web, mobile) reads — exactly OS-014b's stated goal
 * — instead of web privately re-deriving the same shape a second way.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { z } from 'zod';

/**
 * `apps/web/public/content` — same default `publish-content-bundle.mjs`
 * uses for the web build. Resolved relative to this module's own file
 * location (not `process.cwd()`): `process.cwd()` is `apps/web` when the
 * Next.js build runs from that workspace directory, but is the monorepo
 * ROOT when the full vitest suite runs from there instead — an
 * import-relative path is correct under both invocations.
 */
const CONTENT_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'content');

export class BundleArtifactMissingError extends Error {
  constructor(pointerOrFilePath: string, cause?: unknown) {
    super(
      `Content bundle artifact not found at "${pointerOrFilePath}". The web build's ` +
        '`prebuild` script (scripts/publish-content-bundle.mjs) must run before this module ' +
        'is imported — run `npm run prebuild` (or `npm run build`) from apps/web, or ' +
        '`npm run sync:content && node scripts/publish-content-bundle.mjs` from the repo root.' +
        (cause instanceof Error ? ` (${cause.message})` : ''),
    );
    this.name = 'BundleArtifactMissingError';
  }
}

interface CurrentPointer {
  bundleVersion: string;
}

function readCurrentPointer(): CurrentPointer {
  const pointerPath = path.join(CONTENT_ROOT, 'current.json');
  if (!existsSync(pointerPath)) {
    throw new BundleArtifactMissingError(pointerPath);
  }
  return JSON.parse(readFileSync(pointerPath, 'utf8')) as CurrentPointer;
}

/**
 * Synchronously reads and zod-validates one named file out of the currently
 * published content bundle (`apps/web/public/content/<bundleVersion>/<relativePath>`).
 * Throws `BundleArtifactMissingError` if the bundle hasn't been published yet
 * (never silently falls back — a missing/invalid artifact is a build bug to
 * surface loudly, not paper over), and re-throws the schema's own error
 * (with file context) on a validation failure.
 */
export function readBundleArtifact<T>(relativePath: string, schema: z.ZodType<T>): T {
  const { bundleVersion } = readCurrentPointer();
  const filePath = path.join(CONTENT_ROOT, bundleVersion, relativePath);
  if (!existsSync(filePath)) {
    throw new BundleArtifactMissingError(filePath);
  }
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (err) {
    throw new BundleArtifactMissingError(filePath, err);
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Content bundle file "${relativePath}" failed schema validation: ${JSON.stringify(parsed.error.issues)}`,
    );
  }
  return parsed.data;
}

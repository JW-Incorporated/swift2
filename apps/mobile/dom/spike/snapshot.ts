// WP0.5b: cache envelope -> ReaderSnapshot. The native loader stores the
// `last-good` record as JSON `{ manifest, files }` (packages/content load.ts);
// this unwraps it and builds the snapshot in-webview (C6).
import {
  attachExtensions,
  extensionsFromBundle,
  fromBundleCore,
  hashSnapshot,
  type BundleLike,
} from '@swift2/experience/reader-snapshot';
import type {
  ReaderSnapshotCore,
  ReaderSnapshotDeps,
  ReaderSnapshotExtensions,
} from '@swift2/experience/reader-snapshot';

export function unwrapEnvelope(text: string): BundleLike {
  const rec = JSON.parse(text) as Partial<BundleLike> | null;
  const version = rec?.manifest?.bundleVersion;
  if (!rec || typeof version !== 'string' || !rec.files || typeof rec.files !== 'object') {
    throw new Error('cache envelope is not { manifest, files }');
  }
  return { manifest: rec.manifest as BundleLike['manifest'], files: rec.files };
}

export function snapshotFromEnvelope(text: string, deps: ReaderSnapshotDeps) {
  const bundle = unwrapEnvelope(text);
  return {
    core: fromBundleCore(bundle, deps),
    extensions: extensionsFromBundle(bundle),
    version: bundle.manifest.bundleVersion,
  };
}

/** The hash is diagnostics only: a throw must not stop the reader mounting, so it becomes a recorded error. */
export async function describeSnapshotSafe(core: ReaderSnapshotCore, extensions: ReaderSnapshotExtensions) {
  try {
    return { snapshot: await describeSnapshot(core, extensions), error: null as string | null };
  } catch (e) {
    return { snapshot: null, error: `snapshot hash: ${e instanceof Error ? e.message : String(e)}` };
  }
}

/** Hashing needs all 13 domains, so the extensions are attached first; a core-only snapshot is never hashed. */
export async function describeSnapshot(core: ReaderSnapshotCore, extensions: ReaderSnapshotExtensions) {
  const snapshot = attachExtensions(core, extensions);
  const d = snapshot.domains;
  const { hash } = await hashSnapshot(snapshot);
  const items = d.eras.reduce((n, e) => n + (d.content[e.id]?.length ?? 0), 0);
  return { hash, items, eras: d.eras.length };
}

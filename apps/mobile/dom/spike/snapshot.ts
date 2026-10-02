// WP0.5b: cache envelope -> ReaderSnapshot. The native loader stores the
// `last-good` record as JSON `{ manifest, files }` (packages/content load.ts);
// this unwraps it and builds the snapshot in-webview (C6).
import { fromBundle, hashSnapshot, type BundleLike } from '@swift2/experience/reader-snapshot';
import type { ReaderSnapshot, ReaderSnapshotDeps } from '@swift2/experience/reader-snapshot';

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
  return { snapshot: fromBundle(bundle, deps), version: bundle.manifest.bundleVersion };
}

export async function describeSnapshot(snapshot: ReaderSnapshot) {
  const d = snapshot.domains;
  const { hash } = await hashSnapshot(snapshot);
  const items = d.eras.reduce((n, e) => n + (d.content[e.id]?.length ?? 0), 0);
  return { hash, items, eras: d.eras.length };
}

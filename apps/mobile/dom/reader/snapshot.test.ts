import { describe, expect, it } from 'vitest';
import { eraVideoFeed } from '@swift2/content-enrichment';
import { describeSnapshot, describeSnapshotSafe, snapshotFromEnvelope, unwrapEnvelope } from './snapshot';

const envelope = () =>
  JSON.stringify({
    manifest: { bundleVersion: 'v-test' },
    files: { eras: [], milestones: [], merch: { shopTheLook: [], officialStore: [], fanMade: [] } },
  });

describe('cache envelope to snapshot', () => {
  it('unwraps the loader last-good record { manifest, files }', () => {
    const b = unwrapEnvelope(envelope());
    expect(b.manifest.bundleVersion).toBe('v-test');
    expect(Object.keys(b.files)).toContain('eras');
  });

  it.each([
    ['not json'],
    ['{}'],
    [JSON.stringify({ manifest: {}, files: {} })],
    [JSON.stringify({ manifest: { bundleVersion: 'x' } })],
  ])('rejects a malformed envelope: %s', (text) => {
    expect(() => unwrapEnvelope(text)).toThrow();
  });

  it('builds a bundle-origin snapshot and a stable hash', async () => {
    const { core, extensions, version } = snapshotFromEnvelope(envelope(), { eraVideoFeed });
    expect(version).toBe('v-test');
    expect(core.origin).toEqual({ kind: 'bundle', bundleVersion: 'v-test' });
    const a = await describeSnapshot(core, extensions);
    const next = snapshotFromEnvelope(envelope(), { eraVideoFeed });
    const b = await describeSnapshot(next.core, next.extensions);
    expect(a).toEqual({ hash: b.hash, items: 0, eras: 0 });
    expect(a.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('turns a hash/describe throw into a recorded error so the reader still mounts', async () => {
    const r = await describeSnapshotSafe(undefined as never, undefined as never);
    expect(r.snapshot).toBeNull();
    expect(r.error).toMatch(/^snapshot hash: /);
    const loaded = snapshotFromEnvelope(envelope(), { eraVideoFeed });
    const ok = await describeSnapshotSafe(loaded.core, loaded.extensions);
    expect(ok.error).toBeNull();
  });
});

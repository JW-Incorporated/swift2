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
    const { snapshot, version } = snapshotFromEnvelope(envelope(), { eraVideoFeed });
    expect(version).toBe('v-test');
    expect(snapshot.origin).toEqual({ kind: 'bundle', bundleVersion: 'v-test' });
    const a = await describeSnapshot(snapshot);
    const b = await describeSnapshot(snapshotFromEnvelope(envelope(), { eraVideoFeed }).snapshot);
    expect(a).toEqual({ hash: b.hash, items: 0, eras: 0 });
    expect(a.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('turns a hash/describe throw into a recorded error so the reader still mounts', async () => {
    const r = await describeSnapshotSafe(undefined as never);
    expect(r.snapshot).toBeNull();
    expect(r.error).toMatch(/^snapshot hash: /);
    const ok = await describeSnapshotSafe(snapshotFromEnvelope(envelope(), { eraVideoFeed }).snapshot);
    expect(ok.error).toBeNull();
  });
});

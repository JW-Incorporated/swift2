import { describe, expect, it, vi } from 'vitest';
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

describe('object-literal twin (no second parse)', () => {
  const tricky = {
    manifest: { bundleVersion: 'v-tricky' },
    files: {
      eras: [],
      milestones: [],
      merch: { shopTheLook: [], officialStore: [], fanMade: [] },
      note: ['q"uote', String.fromCharCode(92) + 'slash', String.fromCharCode(0x2028), String.fromCharCode(0x2029), 'end'].join(' '),
    },
  };

  it('an already-parsed object builds the same snapshot as the text path, without JSON.parse', async () => {
    const text = JSON.stringify(tricky);
    const spy = vi.spyOn(JSON, 'parse');
    const fromObject = snapshotFromEnvelope(JSON.parse(text) as object, { eraVideoFeed });
    spy.mockClear();
    const again = snapshotFromEnvelope(tricky, { eraVideoFeed });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
    const fromText = snapshotFromEnvelope(text, { eraVideoFeed });
    expect(again.version).toBe(fromText.version);
    expect(again.core).toEqual(fromText.core);
    expect(again.extensions).toEqual(fromText.extensions);
    expect(await describeSnapshot(fromObject.core, fromObject.extensions)).toEqual(
      await describeSnapshot(fromText.core, fromText.extensions),
    );
  });

  it('records parse and build timings', () => {
    const t = snapshotFromEnvelope(envelope(), { eraVideoFeed }).timings;
    expect(t.parseMs).toBeGreaterThanOrEqual(0);
    expect(t.buildMs).toBeGreaterThanOrEqual(0);
  });

  it('the snapshot path never hashes (the hash is deferred off the mount path)', async () => {
    vi.resetModules();
    const hashSnapshot = vi.fn(async () => ({ hash: 'h' }));
    vi.doMock('@swift2/experience/reader-snapshot', async (orig) => ({
      ...(await orig<typeof import('@swift2/experience/reader-snapshot')>()),
      hashSnapshot,
    }));
    const mod = await import('./snapshot');
    const hashMod = await import('./deferred-hash');
    const loaded = mod.snapshotFromEnvelope(envelope(), { eraVideoFeed });
    expect(hashSnapshot).not.toHaveBeenCalled();
    const queue: Array<() => void> = [];
    const probe = { report: { snapshot: null, error: null, timings: { readMs: 1 } } } as never as ReturnType<typeof import('./probe').createProbe>;
    const publish = vi.fn(async () => {});
    hashMod.scheduleSnapshotHash(loaded.core, loaded.extensions, probe, publish, (cb) => queue.push(cb));
    expect(hashSnapshot).not.toHaveBeenCalled();
    queue.shift()!();
    await vi.waitFor(() => expect(publish).toHaveBeenCalledTimes(1));
    expect(hashSnapshot).toHaveBeenCalledTimes(1);
    expect(probe.report.snapshot).toMatchObject({ hash: 'h' });
    expect(probe.report.timings).toMatchObject({ readMs: 1 });
    vi.doUnmock('@swift2/experience/reader-snapshot');
  });
});

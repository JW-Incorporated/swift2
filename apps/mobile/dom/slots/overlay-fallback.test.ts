import { describe, expect, it, vi } from 'vitest';
import { MODE_PATHS, OVERLAY_FALLBACK_ROWS, modeFallbackPath, runFallbackRows, type FallbackRow } from './overlay-fallback';

const closed = { mode: 'era', theoryGuideEraId: null } as const;
const actions = () => ({ closeTheoryGuide: vi.fn() });
// No shipped row has a native screen any more, so the native-handoff mechanics run on a synthetic row with a path.
const NATIVE_ROWS: readonly FallbackRow[] = [
  { id: 'theory-guide', value: (s) => s.theoryGuideEraId, path: (v) => `/?screen=probe&era=${v}`, clear: (a) => a.closeTheoryGuide() },
];
const flush = () => new Promise((r) => setTimeout(r, 0));
const run = async (state: unknown, seen: Map<string, string>, ok = true, a = actions(), rows = OVERLAY_FALLBACK_ROWS) => {
  const io = { openNative: vi.fn(async () => ok), diag: vi.fn() };
  runFallbackRows(rows, state as never, seen, io, a as never);
  await flush();
  return { io, a };
};

describe('overlay fallback table', () => {
  it('has the stable row ids (moment, track guide, song are slots; thread is the ModeFallback)', () => {
    expect(OVERLAY_FALLBACK_ROWS.map((r) => r.id)).toEqual(['theory-guide']);
  });

  it('a row with a native screen goes native once and is cleared only after native presented it', async () => {
    const { io, a } = await run({ ...closed, theoryGuideEraId: 'debut' }, new Map(), true, actions(), NATIVE_ROWS);
    expect(io.openNative).toHaveBeenCalledTimes(1);
    expect(io.openNative).toHaveBeenCalledWith('/?screen=probe&era=debut');
    expect(a.closeTheoryGuide).toHaveBeenCalledTimes(1);
  });

  it('a failed native handoff keeps the DOM state and emits a diag (never a silent clear)', async () => {
    const { io, a } = await run({ ...closed, theoryGuideEraId: 'debut' }, new Map(), false, actions(), NATIVE_ROWS);
    expect(a.closeTheoryGuide).not.toHaveBeenCalled();
    expect(io.diag).toHaveBeenCalledWith('fallback-native-failed', 'theory-guide');
  });

  it('a row with no native screen: state kept, diag emitted once, no navigation', async () => {
    const seen = new Map<string, string>();
    const { io, a } = await run({ ...closed, theoryGuideEraId: 'folklore' }, seen);
    expect(io.openNative).not.toHaveBeenCalled();
    expect(io.diag).toHaveBeenCalledWith('fallback-no-native-screen', 'theory-guide');
    expect(a.closeTheoryGuide).not.toHaveBeenCalled();
    expect((await run({ ...closed, theoryGuideEraId: 'folklore' }, seen)).io.diag).not.toHaveBeenCalled();
  });

  it('loop guard: navigate, native, back, re-render does not re-trigger; a fresh open does', async () => {
    const seen = new Map<string, string>();
    const open = { ...closed, theoryGuideEraId: 'debut' };
    const go = (s: unknown) => run(s, seen, true, actions(), NATIVE_ROWS);
    expect((await go(open)).io.openNative).toHaveBeenCalledTimes(1);
    expect((await go(open)).io.openNative).not.toHaveBeenCalled();
    expect((await go(closed)).io.openNative).not.toHaveBeenCalled();
    expect((await go(open)).io.openNative).toHaveBeenCalledTimes(1);
  });

  it('a stale handoff does not clear a newer opening', async () => {
    const seen = new Map<string, string>();
    const releases: ((ok: boolean) => void)[] = [];
    const io = { openNative: vi.fn(() => new Promise<boolean>((r) => releases.push(r))), diag: vi.fn() };
    const a = actions();
    runFallbackRows(NATIVE_ROWS, { ...closed, theoryGuideEraId: 'debut' } as never, seen, io, a as never);
    runFallbackRows(NATIVE_ROWS, { ...closed, theoryGuideEraId: 'folklore' } as never, seen, io, a as never);
    releases[0]!(true);
    await flush();
    expect(a.closeTheoryGuide).not.toHaveBeenCalled();
    releases[1]!(true);
    await flush();
    expect(a.closeTheoryGuide).toHaveBeenCalledTimes(1);
  });
});

describe('D-6 mode fallback paths', () => {
  it.each([
    ['threads', '/?mode=threads'],
    ['community', '/?mode=community'],
    ['clownbot', '/?screen=clownbot'],
    ['mood', '/?screen=clownbot'],
    ['era', '/?screen=era-stream'],
  ] as const)('%s -> %s', (mode, path) => expect(modeFallbackPath(mode)).toBe(path));

  it('covers every unslotted mode', () => {
    expect(Object.keys(MODE_PATHS).sort()).toEqual(['clownbot', 'community', 'mood', 'threads']);
    expect(MODE_PATHS.merch).toBeUndefined();
  });
});

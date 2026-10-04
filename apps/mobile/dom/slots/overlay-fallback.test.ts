import { describe, expect, it, vi } from 'vitest';
import { MODE_PATHS, OVERLAY_FALLBACK_ROWS, modeFallbackPath, runFallbackRows } from './overlay-fallback';

const closed = { mode: 'era', trackGuideEraId: null, openTrackKey: null, theoryGuideEraId: null } as const;
const actions = () => ({ closeTrackGuide: vi.fn(), closeTheoryGuide: vi.fn() });
const flush = () => new Promise((r) => setTimeout(r, 0));
const run = async (state: unknown, seen: Map<string, string>, ok = true, a = actions()) => {
  const io = { openNative: vi.fn(async () => ok), diag: vi.fn() };
  runFallbackRows(OVERLAY_FALLBACK_ROWS, state as never, seen, io, a as never);
  await flush();
  return { io, a };
};

describe('overlay fallback table', () => {
  it('has the stable row ids (moment is a slot, thread is the ModeFallback)', () => {
    expect(OVERLAY_FALLBACK_ROWS.map((r) => r.id).sort()).toEqual(['song', 'theory-guide', 'track-guide']);
  });

  it.each([
    [{ trackGuideEraId: 'debut' }, '/?screen=track-guide&era=debut'],
    [{ trackGuideEraId: 'debut', openTrackKey: 'debut::1::Tim' }, '/?screen=song&key=debut%3A%3A1%3A%3ATim'],
  ])('%j goes native once as %s and is cleared only after native presented it', async (patch, path) => {
    const { io, a } = await run({ ...closed, ...patch }, new Map());
    expect(io.openNative).toHaveBeenCalledTimes(1);
    expect(io.openNative).toHaveBeenCalledWith(path);
    expect(a.closeTrackGuide).toHaveBeenCalledTimes(1);
  });

  it('a failed native handoff keeps the DOM state and emits a diag (never a silent clear)', async () => {
    const { io, a } = await run({ ...closed, trackGuideEraId: 'debut' }, new Map(), false);
    expect(a.closeTrackGuide).not.toHaveBeenCalled();
    expect(io.diag).toHaveBeenCalledWith('fallback-native-failed', 'track-guide');
  });

  it.each([
    [{ theoryGuideEraId: 'folklore' }, 'theory-guide'],
  ])('%j has no native screen: state kept, diag emitted once, no navigation', async (patch, id) => {
    const seen = new Map<string, string>();
    const { io, a } = await run({ ...closed, ...patch }, seen);
    expect(io.openNative).not.toHaveBeenCalled();
    expect(io.diag).toHaveBeenCalledWith('fallback-no-native-screen', id);
    expect(a.closeTheoryGuide).not.toHaveBeenCalled();
    expect((await run({ ...closed, ...patch }, seen)).io.diag).not.toHaveBeenCalled();
  });

  it('a song over its guide hands native the song only (one navigation)', async () => {
    const { io } = await run({ ...closed, trackGuideEraId: 'debut', openTrackKey: 'debut::1::Tim' }, new Map());
    expect(io.openNative).toHaveBeenCalledTimes(1);
  });

  it('loop guard: navigate, native, back, re-render does not re-trigger; a fresh open does', async () => {
    const seen = new Map<string, string>();
    const open = { ...closed, trackGuideEraId: 'debut' };
    expect((await run(open, seen)).io.openNative).toHaveBeenCalledTimes(1);
    expect((await run(open, seen)).io.openNative).not.toHaveBeenCalled();
    expect((await run(closed, seen)).io.openNative).not.toHaveBeenCalled();
    expect((await run(open, seen)).io.openNative).toHaveBeenCalledTimes(1);
  });

  it('a stale handoff does not clear a newer opening', async () => {
    const seen = new Map<string, string>();
    const releases: ((ok: boolean) => void)[] = [];
    const io = { openNative: vi.fn(() => new Promise<boolean>((r) => releases.push(r))), diag: vi.fn() };
    const a = actions();
    runFallbackRows(OVERLAY_FALLBACK_ROWS, { ...closed, trackGuideEraId: 'debut' } as never, seen, io, a as never);
    runFallbackRows(OVERLAY_FALLBACK_ROWS, { ...closed, trackGuideEraId: 'folklore' } as never, seen, io, a as never);
    releases[0]!(true);
    await flush();
    expect(a.closeTrackGuide).not.toHaveBeenCalled();
    releases[1]!(true);
    await flush();
    expect(a.closeTrackGuide).toHaveBeenCalledTimes(1);
  });
});

describe('D-6 mode fallback paths', () => {
  it.each([
    ['threads', '/?mode=threads'],
    ['community', '/?mode=community'],
    ['clownbot', '/?screen=era-stream'],
    ['mood', '/?screen=era-stream'],
    ['era', '/?screen=era-stream'],
  ] as const)('%s -> %s', (mode, path) => expect(modeFallbackPath(mode)).toBe(path));

  it('covers every unslotted mode', () => {
    expect(Object.keys(MODE_PATHS).sort()).toEqual(['community', 'threads']);
    expect(MODE_PATHS.merch).toBeUndefined();
    expect(MODE_PATHS.clownbot).toBeUndefined();
    expect(MODE_PATHS.mood).toBeUndefined();
  });
});

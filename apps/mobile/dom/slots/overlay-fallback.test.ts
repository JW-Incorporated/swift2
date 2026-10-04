import { describe, expect, it, vi } from 'vitest';
import { MODE_PATHS, OVERLAY_FALLBACK_ROWS, modeFallbackPath, runFallbackRows } from './overlay-fallback';

const closed = { mode: 'era', trackGuideEraId: null, openTrackKey: null, theoryGuideEraId: null, searchOpen: false, lensId: null } as const;
const actions = () => ({ closeItem: vi.fn(), closeTrackGuide: vi.fn(), closeTheoryGuide: vi.fn(), setSearchOpen: vi.fn(), clearLens: vi.fn() });
const run = (state: Parameters<typeof runFallbackRows>[1], seen: Map<string, string>, a = actions()) => {
  const openNative = vi.fn();
  runFallbackRows(OVERLAY_FALLBACK_ROWS, state, seen, openNative, a as never);
  return { openNative, a };
};

describe('overlay fallback table', () => {
  it('has the stable row ids', () => {
    expect(OVERLAY_FALLBACK_ROWS.map((r) => r.id).sort()).toEqual(['search', 'song', 'theory-guide', 'thread', 'track-guide']);
  });

  it.each([
    [{ trackGuideEraId: 'debut' }, '/?screen=track-guide&era=debut', 'closeTrackGuide'],
    [{ trackGuideEraId: 'debut', openTrackKey: 'debut::1::Tim' }, '/?screen=song&key=debut%3A%3A1%3A%3ATim', 'closeTrackGuide'],
    [{ theoryGuideEraId: 'folklore' }, '/?screen=era-stream', 'closeTheoryGuide'],
    [{ searchOpen: true }, '/?screen=era-stream', 'setSearchOpen'],
    [{ lensId: 'easter-eggs' }, '/?mode=threads', 'clearLens'],
  ] as const)('%j goes native once as %s and is cleared', (patch, path, clear) => {
    const { openNative, a } = run({ ...closed, ...patch } as never, new Map());
    expect(openNative).toHaveBeenCalledTimes(1);
    expect(openNative).toHaveBeenCalledWith(path);
    expect(a[clear]).toHaveBeenCalledTimes(1);
  });

  it('a song over its guide hands native the song only (one navigation)', () => {
    const { openNative } = run({ ...closed, trackGuideEraId: 'debut', openTrackKey: 'debut::1::Tim' } as never, new Map());
    expect(openNative).toHaveBeenCalledTimes(1);
  });

  it('loop guard: navigate, native, back, re-render does not re-trigger; a fresh open does', () => {
    const seen = new Map<string, string>();
    const open = { ...closed, searchOpen: true } as never;
    expect(run(open, seen).openNative).toHaveBeenCalledTimes(1);
    // the store clear has not committed yet: the same open state re-renders
    expect(run(open, seen).openNative).not.toHaveBeenCalled();
    // cleared, then back from native and the DOM re-renders closed: still nothing
    expect(run(closed as never, seen).openNative).not.toHaveBeenCalled();
    expect(run(closed as never, seen).openNative).not.toHaveBeenCalled();
    // the user opens the same item again: that is a new opening
    expect(run(open, seen).openNative).toHaveBeenCalledTimes(1);
  });
});

describe('D-6 mode fallback paths', () => {
  it.each([
    ['threads', '/?mode=threads'],
    ['merch', '/?mode=merch'],
    ['clownbot', '/?screen=clownbot'],
    ['mood', '/?screen=clownbot'],
    ['era', '/?screen=era-stream'],
  ] as const)('%s -> %s', (mode, path) => expect(modeFallbackPath(mode)).toBe(path));

  it('covers every unslotted mode', () => {
    expect(Object.keys(MODE_PATHS).sort()).toEqual(['clownbot', 'merch', 'mood', 'threads']);
  });
});

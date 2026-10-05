import { describe, expect, it } from 'vitest';
import { TheoryGuide } from '@swift2/ui/reader/threads/TheoryGuide';
import { register, slots } from './instance';
import { THREADS_SLICE } from './threads';
import { MODE_PATHS, OVERLAY_FALLBACK_ROWS } from './overlay-fallback';

describe('threads slice', () => {
  it('registers the threads surface and theory-guide overlay from @swift2/ui', () => {
    const s = slots();
    expect(s['surface:threads']).toBeTypeOf('function');
    expect(s['overlay:theory-guide']).toBe(TheoryGuide);
  });

  it('re-registering identically is a no-op; a duplicate theory-guide slot from another slice throws', () => {
    register({ slice: THREADS_SLICE, slots: { 'surface:threads': slots()['surface:threads'], 'overlay:theory-guide': TheoryGuide } });
    expect(() => register({ slice: 'tracks', slots: { 'overlay:theory-guide': TheoryGuide } })).toThrow(/duplicate slot/);
  });

  it('claims no native routes (threads and theories render in the DOM)', async () => {
    const { isNativeRoute } = await import('./routes');
    for (const p of ['/', '/?mode=threads', '/?lens=hidden-clues', '/threads/crossing']) expect(isNativeRoute(p)).toBe(false);
  });

  it('the Threads tab and theories no longer fall back to native (rows deleted)', () => {
    expect(MODE_PATHS.threads).toBeUndefined();
    const ids: string[] = OVERLAY_FALLBACK_ROWS.map((r) => r.id);
    expect(ids).not.toContain('theory-guide');
    expect(ids).not.toContain('thread');
  });
});

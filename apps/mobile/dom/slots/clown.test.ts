import { describe, expect, it } from 'vitest';
import { ClownChat } from '@swift2/ui/reader/clown/ClownChat';
import { MoodChat } from '@swift2/ui/reader/clown/MoodChat';
import { register, slots } from './instance';
import { CLOWN_SLICE } from './clown';

describe('clown slice', () => {
  it('registers the clownbot and mood surfaces from @swift2/ui', () => {
    const s = slots();
    expect(s['surface:clownbot']).toBe(ClownChat);
    expect(s['surface:mood']).toBe(MoodChat);
  });

  it('re-registering identically is a no-op; a duplicate surface from another slice throws', () => {
    register({ slice: CLOWN_SLICE, slots: { 'surface:clownbot': ClownChat, 'surface:mood': MoodChat } });
    expect(() => register({ slice: 'other', slots: { 'surface:mood': MoodChat } })).toThrow(/duplicate slot/);
  });

  it('claims no native routes (clownbot and mood render in the DOM)', async () => {
    const { isNativeRoute } = await import('./routes');
    for (const p of ['/?mode=clownbot', '/?mode=mood', '/clownbot/transcript']) expect(isNativeRoute(p)).toBe(false);
  });
});

import { beforeEach, describe, expect, it } from 'vitest';
import { register, resetSlotsForTests, slots } from './instance';
import { buildReaderSlots } from './reader-slots';

const C = (name: string) => Object.assign(() => null, { displayName: name });
const app = { overlays: [C('bridge'), C('fallback-overlay')], fallback: C('mode-fallback') };

describe('buildReaderSlots', () => {
  beforeEach(() => resetSlotsForTests());

  it('maps surface:/overlay:/footer/floating onto ReaderSlots, app overlays first', () => {
    const era = C('era'), moment = C('moment'), footer = C('footer'), floating = C('floating');
    const s = buildReaderSlots({ 'surface:era': era, 'overlay:moment': moment, footer, floating }, app);
    expect(s.surfaces).toEqual({ era });
    expect(s.overlays).toEqual([...app.overlays, moment]);
    expect(s.footer).toBe(footer);
    expect(s.floating).toBe(floating);
    expect(s.fallback).toBe(app.fallback);
  });

  it('keeps registration order across slices, so track-guide stacks below song', () => {
    const guide = C('track-guide'), song = C('song'), theory = C('theory');
    register({ slice: 'tracks-guide', slots: { 'overlay:track-guide': guide } });
    register({ slice: 'tracks-song', slots: { 'overlay:song': song } });
    register({ slice: 'theories', slots: { 'overlay:theory-guide': theory } });
    expect(buildReaderSlots(slots(), app).overlays.slice(2)).toEqual([guide, song, theory]);
  });

  it('throws on a slot name outside the convention', () => {
    expect(() => buildReaderSlots({ sidebar: C('x') }, app)).toThrow(/unknown slot name "sidebar"/);
  });

  it('an empty registry still yields the app overlays and fallback (nothing slotted)', () => {
    const s = buildReaderSlots({}, app);
    expect(s.surfaces).toEqual({});
    expect(s.overlays).toEqual(app.overlays);
  });
});

import { describe, expect, it } from 'vitest';
import { navReducer, navInitialState, type NavState } from './navigation';
import { CURRENT_ERA_ID, ERAS } from '@swift2/experience';
import type { LensId } from '@swift2/experience';

const otherEraId = ERAS[0].id;

describe('navReducer', () => {
  it('has the expected initial state', () => {
    const state = navInitialState(CURRENT_ERA_ID as never);
    expect(state).toEqual<NavState>({
      mode: 'era',
      eraId: CURRENT_ERA_ID,
      eraJumpSeq: 0,
      lensId: null,
      crossing: null,
      selectorOpen: false,
      scrubbing: false,
    });
  });

  it('setEra jumps era, closes the selector, and bumps eraJumpSeq', () => {
    const start = navInitialState(CURRENT_ERA_ID as never);
    const next = navReducer(start, { type: 'setEra', eraId: otherEraId as never });
    expect(next.eraId).toBe(otherEraId);
    expect(next.mode).toBe('era');
    expect(next.selectorOpen).toBe(false);
    expect(next.eraJumpSeq).toBe(1);
  });

  it('setActiveEra updates theming without bumping eraJumpSeq', () => {
    const start = navInitialState(CURRENT_ERA_ID as never);
    const next = navReducer(start, { type: 'setActiveEra', eraId: otherEraId as never });
    expect(next.eraId).toBe(otherEraId);
    expect(next.eraJumpSeq).toBe(0);
  });

  it('setActiveEra is a no-op (same reference-equal fields) when the era is unchanged', () => {
    const start = navInitialState(CURRENT_ERA_ID as never);
    const next = navReducer(start, { type: 'setActiveEra', eraId: CURRENT_ERA_ID });
    expect(next).toBe(start);
  });

  it('setMode to threads resets lens/crossing', () => {
    const start: NavState = {
      ...navInitialState(CURRENT_ERA_ID as never),
      lensId: 'reputation' as LensId,
      crossing: { a: 'reputation' as LensId, b: 'lover' as LensId },
    };
    const next = navReducer(start, { type: 'setMode', mode: 'threads' });
    expect(next.mode).toBe('threads');
    expect(next.lensId).toBeNull();
    expect(next.crossing).toBeNull();
  });

  it('setMode to a non-threads mode leaves lens/crossing untouched', () => {
    const start: NavState = {
      ...navInitialState(CURRENT_ERA_ID as never),
      lensId: 'reputation' as LensId,
    };
    const next = navReducer(start, { type: 'setMode', mode: 'mood' });
    expect(next.mode).toBe('mood');
    expect(next.lensId).toBe('reputation');
  });

  it('openThread switches to threads mode, clears crossing, closes selector', () => {
    const start: NavState = { ...navInitialState(CURRENT_ERA_ID as never), selectorOpen: true };
    const next = navReducer(start, { type: 'openThread', lensId: 'reputation' as LensId });
    expect(next.mode).toBe('threads');
    expect(next.lensId).toBe('reputation');
    expect(next.crossing).toBeNull();
    expect(next.selectorOpen).toBe(false);
  });

  it('openEra switches to era mode, bumps eraJumpSeq, clears lens/crossing/selector', () => {
    const start: NavState = {
      ...navInitialState(CURRENT_ERA_ID as never),
      mode: 'threads',
      lensId: 'reputation' as LensId,
      selectorOpen: true,
    };
    const next = navReducer(start, { type: 'openEra', eraId: otherEraId as never });
    expect(next.mode).toBe('era');
    expect(next.eraId).toBe(otherEraId);
    expect(next.eraJumpSeq).toBe(1);
    expect(next.lensId).toBeNull();
    expect(next.selectorOpen).toBe(false);
  });

  it('setLensId sets the raw lens without touching mode (setLens/clearLens contract)', () => {
    const start = navInitialState(CURRENT_ERA_ID as never);
    const set = navReducer(start, { type: 'setLensId', lensId: 'reputation' as LensId });
    expect(set.lensId).toBe('reputation');
    expect(set.mode).toBe('era');
    const cleared = navReducer(set, { type: 'setLensId', lensId: null });
    expect(cleared.lensId).toBeNull();
  });

  it('openCrossing sets threads mode with a and b, clears lens', () => {
    const start: NavState = { ...navInitialState(CURRENT_ERA_ID as never), lensId: 'reputation' as LensId };
    const next = navReducer(start, {
      type: 'openCrossing',
      a: 'reputation' as LensId,
      b: 'lover' as LensId,
    });
    expect(next.mode).toBe('threads');
    expect(next.lensId).toBeNull();
    expect(next.crossing).toEqual({ a: 'reputation', b: 'lover' });
  });

  it('closeCrossing clears the crossing overlay', () => {
    const start: NavState = {
      ...navInitialState(CURRENT_ERA_ID as never),
      crossing: { a: 'reputation' as LensId, b: 'lover' as LensId },
    };
    const next = navReducer(start, { type: 'closeCrossing' });
    expect(next.crossing).toBeNull();
  });

  it('goHome resets to era mode on the given era, bumps eraJumpSeq, clears overlays', () => {
    const start: NavState = {
      ...navInitialState(otherEraId as never),
      mode: 'threads',
      lensId: 'reputation' as LensId,
      crossing: { a: 'reputation' as LensId, b: 'lover' as LensId },
      selectorOpen: true,
    };
    const next = navReducer(start, { type: 'goHome', currentEraId: CURRENT_ERA_ID as never });
    expect(next.mode).toBe('era');
    expect(next.eraId).toBe(CURRENT_ERA_ID);
    expect(next.eraJumpSeq).toBe(1);
    expect(next.lensId).toBeNull();
    expect(next.crossing).toBeNull();
    expect(next.selectorOpen).toBe(false);
  });

  it('restoreNav restores a nav snapshot and conditionally bumps eraJumpSeq', () => {
    const start = navInitialState(CURRENT_ERA_ID as never);
    const prev = {
      mode: 'threads' as const,
      eraId: otherEraId as never,
      lensId: 'reputation' as LensId,
      crossing: null,
    };
    const bumped = navReducer(start, { type: 'restoreNav', prev, bumpJump: true });
    expect(bumped.mode).toBe('threads');
    expect(bumped.eraId).toBe(otherEraId);
    expect(bumped.lensId).toBe('reputation');
    expect(bumped.eraJumpSeq).toBe(1);

    const notBumped = navReducer(start, { type: 'restoreNav', prev, bumpJump: false });
    expect(notBumped.eraJumpSeq).toBe(0);
  });

  it('setSelectorOpen / setScrubbing toggle their own flag only', () => {
    const start = navInitialState(CURRENT_ERA_ID as never);
    const opened = navReducer(start, { type: 'setSelectorOpen', open: true });
    expect(opened.selectorOpen).toBe(true);
    expect(opened.scrubbing).toBe(false);
    const scrubbing = navReducer(opened, { type: 'setScrubbing', v: true });
    expect(scrubbing.scrubbing).toBe(true);
    expect(scrubbing.selectorOpen).toBe(true);
  });
});

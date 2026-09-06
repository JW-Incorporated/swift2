import { describe, expect, it } from 'vitest';
import { navReducer, navInitialState } from './navigation';
import { overlaysReducer, overlaysInitialState } from './overlays';
import { CURRENT_ERA_ID, ERAS } from '@swift2/experience';
import type { LensId } from '@swift2/experience';

/**
 * Integration coverage for store/index.tsx's AppProvider composition —
 * specifically the cross-slice overlay-closing behavior that `openThread`/
 * `openEra`/`openCrossing` reproduce from the original monolithic
 * store.tsx (each of those actions also closed one or more overlays this
 * slice doesn't own). This can't render `AppProvider` itself (no jsdom/
 * @testing-library/react harness is wired into this worktree yet — see
 * R19), so it instead drives the exact two reducers AppProvider composes
 * and asserts the SAME field-clearing contract AppProvider's wrapper
 * functions apply. If AppProvider's composition in index.tsx ever drifts
 * from this (e.g. someone reverts to wiring `nav.openThread` straight
 * through without the overlay-clearing side effect), this test's modeled
 * behavior will no longer match a manual trace of index.tsx and should be
 * caught in review — a true renderHook test should replace this once the
 * jsdom harness lands.
 */

const eraA = CURRENT_ERA_ID;
const eraB = ERAS[0].id;

/** Mirrors AppProvider's composed `openThread` in store/index.tsx exactly. */
function composedOpenThread(nav: ReturnType<typeof navReducer>, overlays: ReturnType<typeof overlaysReducer>, id: LensId) {
  return {
    nav: navReducer(nav, { type: 'openThread', lensId: id }),
    overlays: overlaysReducer(overlays, { type: 'closeMomentAndEraGuides' }),
  };
}

/** Mirrors AppProvider's composed `openEra` in store/index.tsx exactly. */
function composedOpenEra(nav: ReturnType<typeof navReducer>, overlays: ReturnType<typeof overlaysReducer>, id: string) {
  return {
    nav: navReducer(nav, { type: 'openEra', eraId: id as never }),
    overlays: overlaysReducer(overlays, { type: 'closeMomentAndEraGuides' }),
  };
}

/** Mirrors AppProvider's composed `openCrossing` in store/index.tsx exactly. */
function composedOpenCrossing(
  nav: ReturnType<typeof navReducer>,
  overlays: ReturnType<typeof overlaysReducer>,
  a: LensId,
  b: LensId,
) {
  return {
    nav: navReducer(nav, { type: 'openCrossing', a, b }),
    overlays: overlaysReducer(overlays, { type: 'closeMomentOnly' }),
  };
}

describe('AppProvider composition (modeled) — cross-slice overlay closing', () => {
  it('openThread closes the moment overlay + both era-hero guides while navigating to threads mode', () => {
    const navStart = navInitialState(eraA as never);
    const overlaysStart = {
      ...overlaysInitialState(),
      openItemId: 'moment-1',
      trackGuideEraId: eraA as never,
      theoryGuideEraId: eraB as never,
    };

    const { nav, overlays } = composedOpenThread(navStart, overlaysStart, 'reputation' as LensId);

    expect(nav.mode).toBe('threads');
    expect(nav.lensId).toBe('reputation');
    expect(overlays.openItemId).toBeNull();
    expect(overlays.trackGuideEraId).toBeNull();
    expect(overlays.theoryGuideEraId).toBeNull();
  });

  it('openEra closes the moment overlay + both era-hero guides while jumping era', () => {
    const navStart = { ...navInitialState(eraA as never), mode: 'threads' as const, lensId: 'reputation' as LensId };
    const overlaysStart = {
      ...overlaysInitialState(),
      openItemId: 'moment-1',
      trackGuideEraId: eraA as never,
      theoryGuideEraId: eraB as never,
    };

    const { nav, overlays } = composedOpenEra(navStart, overlaysStart, eraB);

    expect(nav.mode).toBe('era');
    expect(nav.eraId).toBe(eraB);
    expect(overlays.openItemId).toBeNull();
    expect(overlays.trackGuideEraId).toBeNull();
    expect(overlays.theoryGuideEraId).toBeNull();
  });

  it('openCrossing closes only the moment overlay, leaving era-hero guides untouched', () => {
    const navStart = navInitialState(eraA as never);
    const overlaysStart = {
      ...overlaysInitialState(),
      openItemId: 'moment-1',
      trackGuideEraId: eraA as never,
      theoryGuideEraId: eraB as never,
    };

    const { nav, overlays } = composedOpenCrossing(
      navStart,
      overlaysStart,
      'reputation' as LensId,
      'lover' as LensId,
    );

    expect(nav.mode).toBe('threads');
    expect(nav.crossing).toEqual({ a: 'reputation', b: 'lover' });
    expect(overlays.openItemId).toBeNull();
    // openCrossing never closed the era-hero guides in the original store.tsx.
    expect(overlays.trackGuideEraId).toBe(eraA);
    expect(overlays.theoryGuideEraId).toBe(eraB);
  });
});

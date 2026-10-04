// React wiring for the native-route overlay (One UI D-7): owns the presenter state,
// the deadline tick, the surface-driven reset and hardware-back ownership. The pure
// logic lives in dom-host-handlers.ts.
import { useEffect, useRef, useState } from 'react';
import { BackHandler } from 'react-native';
import { isNativeRoute } from '../dom/slots/routes';
import {
  INITIAL_NATIVE_ROUTE_STATE,
  createNativeRoutePresenter,
  msUntilDeadline,
  reconcileOverlay,
  type NativeRouteState,
} from './dom-host-handlers';

export type NativeOverlayPresenter = ReturnType<typeof createNativeRoutePresenter>;

/** `domRendered`: the DOM surface is on screen (see `domSurfaceRendered`); false resets the overlay. */
export function useNativeOverlay(domRendered: boolean): {
  state: NativeRouteState;
  presenter: NativeOverlayPresenter;
} {
  const [state, setState] = useState<NativeRouteState>(INITIAL_NATIVE_ROUTE_STATE);
  const ref = useRef<NativeOverlayPresenter | null>(null);
  if (!ref.current) {
    ref.current = createNativeRoutePresenter({ isNativeRoute, now: Date.now, onChange: setState });
  }
  const presenter = ref.current;
  useEffect(() => {
    const ms = msUntilDeadline(state, Date.now());
    if (ms === null) return;
    const h = setTimeout(() => presenter.tick(), ms);
    return () => clearTimeout(h);
  }, [state, presenter]);
  useEffect(() => {
    reconcileOverlay(presenter, domRendered);
  }, [domRendered, presenter]);
  // Native owns hardware back in every phase but idle (including closing).
  const active = state.phase !== 'idle';
  useEffect(() => {
    if (!active) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => presenter.handleBack());
    return () => sub.remove();
  }, [active, presenter]);
  return { state, presenter };
}

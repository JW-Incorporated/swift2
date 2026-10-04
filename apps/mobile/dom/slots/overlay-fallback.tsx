// overlayFallback + D-6 mode fallback (D2). packages/ui ReaderSlots has no overlayFallback member, so this is
// an app-side component placed in the overlays array: every overlay the shell can open that has no slot yet is
// handed to native ONCE (bridge `navigate`, X4 URLs) and its store state cleared at once, so the DOM never shows
// a half-working overlay and returning from native finds nothing open (no loop). One row per overlay id; each
// slice D deletes its own row (and, for modes, its entry in MODE_PATHS) when it registers the real slot.
import { useEffect, useRef } from 'react';
import { useAppActions, useAppState, type AppMode, type AppState } from '@swift2/ui/reader/store/index';
import { useReaderControls } from '../bridge/reader-controls';

type Actions = ReturnType<typeof useAppActions>;
type FallbackState = Pick<AppState, 'mode' | 'theoryGuideEraId' | 'searchOpen' | 'lensId'>;

export type FallbackRow = {
  id: 'search' | 'theory-guide' | 'thread';
  /** The open overlay's value, or null while closed. */
  value: (s: FallbackState) => string | null;
  path: (value: string) => string;
  clear: (a: Actions) => void;
};

const ERA_STREAM = '/?screen=era-stream';

export const OVERLAY_FALLBACK_ROWS: readonly FallbackRow[] = [
  { id: 'theory-guide', value: (s) => s.theoryGuideEraId, path: () => ERA_STREAM, clear: (a) => a.closeTheoryGuide() },
  { id: 'search', value: (s) => (s.searchOpen ? 'open' : null), path: () => ERA_STREAM, clear: (a) => a.setSearchOpen(false) },
  { id: 'thread', value: (s) => (s.mode === 'era' ? s.lensId : null), path: () => '/?mode=threads', clear: (a) => a.clearLens() },
];

/** Fires each open row exactly once per opening: `seen` holds the value already handed to native until the row closes. */
export function runFallbackRows(
  rows: readonly FallbackRow[],
  state: FallbackState,
  seen: Map<string, string>,
  openNative: (path: string) => void,
  actions: Actions,
): void {
  for (const row of rows) {
    const v = row.value(state);
    if (v === null) {
      seen.delete(row.id);
    } else if (seen.get(row.id) !== v) {
      seen.set(row.id, v);
      openNative(row.path(v));
      row.clear(actions);
    }
  }
}

/** Where each unslotted mode goes natively (D-6). Mood shares the native Clownbot screen. */
export const MODE_PATHS: Partial<Record<AppMode, string>> = {
  threads: '/?mode=threads',
  merch: '/?mode=merch',
  community: '/?mode=community',
  clownbot: '/?screen=clownbot',
  mood: '/?screen=clownbot',
};

export const modeFallbackPath = (mode: AppMode): string => MODE_PATHS[mode] ?? ERA_STREAM;

export function OverlayFallback() {
  const { openNative } = useReaderControls();
  const actions = useAppActions();
  const state = useAppState();
  const seen = useRef(new Map<string, string>());
  useEffect(() => {
    runFallbackRows(OVERLAY_FALLBACK_ROWS, state, seen.current, openNative, actions);
  }, [state.theoryGuideEraId, state.searchOpen, state.lensId, state.mode]);
  return null;
}

/** ReaderSlots.fallback: a mode with no surface goes native once, then the reader returns to the last slotted mode. */
export function ModeFallback({ mode }: { mode: AppMode }) {
  const { openNative, lastSlotted } = useReaderControls();
  const { setMode } = useAppActions();
  useEffect(() => {
    openNative(modeFallbackPath(mode));
    setMode(lastSlotted.current as AppMode);
  }, [mode]);
  return null;
}

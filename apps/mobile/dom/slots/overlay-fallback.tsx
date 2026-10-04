// overlayFallback + D-6 mode fallback (D2). packages/ui ReaderSlots has no overlayFallback member, so this is
// an app-side component placed in the overlays array: every overlay the shell can open that has no slot yet is
// handed to native ONCE (bridge `navigate`, X4 URLs). The DOM state is cleared ONLY after the bridge reports the
// native screen was presented; a failed handoff keeps the state and emits a diag (never a silent dead end).
// Overlays with no native screen at all (search, theory guide) keep their state, emit a diag, and are an interim
// gap until their slices land (#4972 search, #4974 theories, after iOS-1). One row per overlay id; each slice D
// deletes its own row (and, for modes, its entry in MODE_PATHS) when it registers the real slot.
import { useEffect, useRef } from 'react';
import { useAppActions, useAppState, type AppMode, type AppState } from '@swift2/ui/reader/store/index';
import { useReaderControls } from '../bridge/reader-controls';

type Actions = ReturnType<typeof useAppActions>;
type FallbackState = Pick<AppState, 'mode' | 'theoryGuideEraId' | 'searchOpen'>;

export type FallbackRow = {
  id: 'search' | 'theory-guide';
  /** The open overlay's value, or null while closed. */
  value: (s: FallbackState) => string | null;
  /** The native route, or null when no native screen exists for this overlay. */
  path: (value: string) => string | null;
  clear: (a: Actions) => void;
};

export type FallbackIo = {
  /** Resolves true only when native presented the route. */
  openNative: (path: string) => Promise<boolean>;
  diag: (stage: string, detail?: string) => void;
};

export const OVERLAY_FALLBACK_ROWS: readonly FallbackRow[] = [
  { id: 'theory-guide', value: (s) => s.theoryGuideEraId, path: () => null, clear: (a) => a.closeTheoryGuide() },
  { id: 'search', value: (s) => (s.searchOpen ? 'open' : null), path: () => null, clear: (a) => a.setSearchOpen(false) },
];

/** Fires each open row exactly once per opening: `seen` holds the value already handled until the row closes. */
export function runFallbackRows(rows: readonly FallbackRow[], state: FallbackState, seen: Map<string, string>, io: FallbackIo, actions: Actions): void {
  for (const row of rows) {
    const v = row.value(state);
    if (v === null) {
      seen.delete(row.id);
      continue;
    }
    if (seen.get(row.id) === v) continue;
    seen.set(row.id, v);
    const path = row.path(v);
    if (path === null) {
      io.diag('fallback-no-native-screen', row.id);
      continue;
    }
    void io.openNative(path).then((ok) => {
      if (!ok) io.diag('fallback-native-failed', row.id);
      else if (seen.get(row.id) === v) row.clear(actions);
    });
  }
}

/** Where each unslotted mode goes natively (D-6). Mood shares the native Clownbot screen. A selected lens is not carried yet (the native threads screen takes no lens param). */
export const MODE_PATHS: Partial<Record<AppMode, string>> = {
  threads: '/?mode=threads',
  merch: '/?mode=merch',
  community: '/?mode=community',
  clownbot: '/?screen=clownbot',
  mood: '/?screen=clownbot',
};

export const modeFallbackPath = (mode: AppMode): string => MODE_PATHS[mode] ?? '/?screen=era-stream';

export function OverlayFallback() {
  const { openNative, diag } = useReaderControls();
  const actions = useAppActions();
  const state = useAppState();
  const seen = useRef(new Map<string, string>());
  useEffect(() => {
    runFallbackRows(OVERLAY_FALLBACK_ROWS, state, seen.current, { openNative, diag }, actions);
  }, [state.theoryGuideEraId, state.searchOpen]);
  return null;
}

/** ReaderSlots.fallback: a mode with no surface goes native once; the reader returns to the last slotted mode only after native presented it. */
export function ModeFallback({ mode }: { mode: AppMode }) {
  const { openNative, diag, lastSlotted } = useReaderControls();
  const { setMode, clearLens } = useAppActions();
  useEffect(() => {
    let live = true;
    void openNative(modeFallbackPath(mode)).then((ok) => {
      if (!ok) return diag('fallback-native-failed', `mode:${mode}`);
      if (!live) return;
      if (mode === 'threads') clearLens();
      setMode(lastSlotted.current as AppMode);
    });
    return () => {
      live = false;
    };
  }, [mode]);
  return null;
}

// overlayFallback + D-6 mode fallback (D2). packages/ui ReaderSlots has no overlayFallback member, so this is
// an app-side component placed in the overlays array: every overlay the shell can open that has no slot yet is
// handed to native ONCE (bridge `navigate`, X4 URLs). The DOM state is cleared ONLY after the bridge reports the
// native screen was presented; a failed handoff keeps the state and emits a diag (never a silent dead end).
// Overlays with no native screen at all would keep their state and emit a diag (none remain). One row per overlay id; each slice D
// deletes its own row (and, for modes, its entry in MODE_PATHS) when it registers the real slot.
import { useEffect, useRef, useState } from 'react';
import { useAppActions, useAppState, type AppMode, type AppState } from '@swift2/ui/reader/store/index';
import { useReaderControls } from '../bridge/reader-controls';

type Actions = ReturnType<typeof useAppActions>;
type FallbackState = Pick<AppState, 'mode' | 'theoryGuideEraId'>;

export type FallbackRow = {
  id: string;
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

/** Where each unslotted mode goes natively (D-6). Every mode is slotted now, so the table is empty. */
export const MODE_PATHS: Partial<Record<AppMode, string>> = {
};

export const modeFallbackPath = (mode: AppMode): string => MODE_PATHS[mode] ?? '/?screen=era-stream';

export function OverlayFallback() {
  const { openNative, diag } = useReaderControls();
  const actions = useAppActions();
  const state = useAppState();
  const seen = useRef(new Map<string, string>());
  useEffect(() => {
    runFallbackRows(OVERLAY_FALLBACK_ROWS, state, seen.current, { openNative, diag }, actions);
  }, [state.mode]);
  return null;
}

/** ReaderSlots.fallback: a mode with no surface goes native once; the reader returns to the last slotted mode only after native presented it. A failed handoff shows a visible placeholder, never a blank screen. */
export function ModeFallback({ mode }: { mode: AppMode }) {
  const { openNative, diag, lastSlotted } = useReaderControls();
  const { setMode } = useAppActions();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    setFailed(false);
    void openNative(modeFallbackPath(mode)).then((ok) => {
      if (!live) return;
      if (!ok) {
        diag('fallback-native-failed', `mode:${mode}`);
        setFailed(true);
        return;
      }
      setMode(lastSlotted.current as AppMode);
    });
    return () => {
      live = false;
    };
  }, [mode]);
  if (!failed) return null;
  return (
    <section role="status" className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-lg font-semibold capitalize">{mode}</p>
      <p className="text-sm opacity-70">Coming in the next update.</p>
      <button type="button" className="rounded-full border border-white/30 px-5 py-2 text-sm" onClick={() => setMode(lastSlotted.current as AppMode)}>
        Back to eras
      </button>
    </section>
  );
}

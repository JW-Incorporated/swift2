// What AppReader hands the in-reader app components (ReaderBridge, the fallbacks) that live in the slot
// overlays array and so cannot take props. One object per mount, provided through context.
import { createContext, useContext } from 'react';
import type { ReaderSnap } from '@swift2/ui';

export type ReaderControls = {
  registerBack: (fn: (() => 'handled' | 'exit') | null) => void;
  /** Installed by ReaderBridge: applies a reader search through the store; resolves false when the target did not resolve; rejects until the reader is mounted. */
  setApplier: (fn: ((search: string) => Promise<boolean>) | null) => void;
  /** Hands a web path to native over the bridge `navigate` (the presenter opens it); never routes in the DOM. Resolves true only when native presented it. */
  openNative: (path: string) => Promise<boolean>;
  /** Installed by ReaderBridge: replays a native-held reader snapshot through the store after a re-key (#5114). */
  setRestorer: (fn: ((snap: ReaderSnap) => void) | null) => void;
  /** Bridge diag (`sendDiag`); a no-op without a native host. */
  diag: (stage: string, detail?: string) => void;
  /** Modes that have a registered surface; the fallback reverts to the last of these. */
  slottedModes: ReadonlySet<string>;
  lastSlotted: { current: string };
};

export const ReaderControlsContext = createContext<ReaderControls | null>(null);

export function useReaderControls(): ReaderControls {
  const c = useContext(ReaderControlsContext);
  if (!c) throw new Error('useReaderControls must be used inside AppReader');
  return c;
}

// What AppReader hands the in-reader app components (ReaderBridge, the fallbacks) that live in the slot
// overlays array and so cannot take props. One object per mount, provided through context.
import { createContext, useContext } from 'react';

export type ReaderControls = {
  registerBack: (fn: (() => 'handled' | 'exit') | null) => void;
  /** Installed by ReaderBridge: applies a reader search through the store; rejects until the reader is mounted. */
  setApplier: (fn: ((search: string) => Promise<void>) | null) => void;
  /** Hands a web path to native over the bridge `navigate` (the presenter opens it); never routes in the DOM. */
  openNative: (path: string) => void;
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

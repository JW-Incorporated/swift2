import { bridgeToken } from './transport-expo';
import type { AppReaderProps } from '../AppReader';

/** Every DOM-to-native action with the per-epoch token appended; failures are swallowed (an unhandled rejection would re-enter reportError). */
export function createNativeCalls(ref: { current: AppReaderProps }) {
  const via = <T>(f: (t: string) => Promise<T> | undefined) => bridgeToken(ref.current.bridgeHello).then(f).catch(() => undefined);
  return {
    onReady: () => via((t) => ref.current.onReady(t)),
    reportError: (m: string) => via((t) => ref.current.reportError(m, t)),
    reportProbe: (j: string) => via((t) => ref.current.reportProbe(j, t)),
    reportImageLoad: (v: boolean) => via((t) => ref.current.reportImageLoad?.(v, t)),
    reportProtocolFatal: (r: string) => via((t) => ref.current.reportProtocolFatal?.(r, t)),
  };
}

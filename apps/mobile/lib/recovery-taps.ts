// While the Recovery screen is mounted there is no surface that can open a destination (the DOM host
// failed, the legacy router is not mounted). Notification taps and deep links are consumed here —
// acked by the gate so nothing stays queued — and logged as a diag mark, never navigated.
import { diagCollector } from './diagnostics';

export function recoveryTapDiscard(mark: (name: string, detail?: string) => void = (n, d) => diagCollector.mark(n, d)) {
  return (_url: string): void => mark('recovery-tap-dropped');
}

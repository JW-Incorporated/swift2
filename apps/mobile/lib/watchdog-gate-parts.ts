// Pieces of useDomMount (watchdog-gate.ts) that need no React: the attempt monitor wiring, the DomWatch the DOM
// host reports into, and the late-record reconcile for a launch that mounted before the watchdog record was read.
import { AppState } from 'react-native';
import { diagCollector } from './diagnostics';
import {
  beginAttempt,
  createAttemptMonitor,
  markReady,
  markReloading,
  recordLaunchFailure,
  shouldMountDom,
  type AttemptMonitor,
  type MountDecision,
  type RecordSource,
  type Scheduler,
  type WatchdogRecord,
} from './watchdog';
import { refundExpiredFallback } from './watchdog-policy';
import { plannedReloadStep } from './watchdog-planned-reload';
import type { DomWatch } from './watchdog-gate';

type Ref<T> = { current: T };
type Write = (r: RecordSource, retries?: number) => Promise<boolean>;

/** A DOM launch that started before the watchdog record resolved: nothing is persisted until it does. */
export interface LateRecord {
  held: boolean;
  ready: boolean;
  strike: string | null;
}

export function createGateMonitor(o: {
  scheduler: Scheduler;
  now: () => number;
  recordRef: Ref<WatchdogRecord | null>;
  late: Ref<LateRecord>;
  write: Write;
  onStrike: (reason: string, record: WatchdogRecord, persisted: boolean) => void;
}): AttemptMonitor {
  return createAttemptMonitor({
    scheduler: o.scheduler,
    now: o.now,
    active: AppState.currentState === 'active',
    onReady: () => {
      if (!o.recordRef.current) return;
      o.recordRef.current = markReady(o.recordRef.current, Date.now());
      if (o.late.current.held) return void (o.late.current.ready = true);
      void o.write(o.recordRef.current, 1).then((ok) => {
        if (!ok) diagCollector.mark('watchdog-ready-save-failed');
      });
    },
    onStrike: (reason) => {
      if (!o.recordRef.current) return;
      const record = recordLaunchFailure(o.recordRef.current, reason, Date.now());
      o.recordRef.current = record;
      if (o.late.current.held) o.late.current.strike = reason;
      else void o.write(record);
      o.onStrike(reason, record, !o.late.current.held);
    },
  });
}

/**
 * The real record arrived after a DOM launch began: persist ONE record that folds in what already happened. The fold runs
 * INSIDE the write queue's turn (decideMount's `d` came from the read; the events and any earlier queued write are seen at
 * write time), so it can neither regress a record an earlier write persisted nor miss an event that landed meanwhile.
 */
export function reconcileLateRecord(
  prev: WatchdogRecord | null | 'corrupt',
  d: MountDecision,
  late: Ref<LateRecord>,
  recordRef: Ref<WatchdogRecord | null>,
  write: Write,
  onFolded: (strikeReason: string | null, record: WatchdogRecord) => void,
): void {
  void write((current) => {
    const l = late.current;
    late.current = { held: false, ready: false, strike: null };
    // Positive evidence (an owed fallback / quarantine) arrives too late to swap the UI: keep this launch's DOM, refund the
    // launch it would have consumed, and let the next launch honour it.
    let rec = shouldMountDom(true, d) ? beginAttempt(d.record, Date.now()) : refundExpiredFallback(prev, d.record, true);
    if (l.ready && rec.state === 'attempting') rec = markReady(rec, Date.now());
    let struck: string | null = null;
    if (l.strike && rec.state === 'attempting') {
      rec = recordLaunchFailure(rec, l.strike, Date.now());
      struck = l.strike;
    }
    if (current?.state === 'ready' && rec.state === 'attempting') rec = current;
    recordRef.current = rec;
    onFolded(struck, rec);
    return rec;
  });
}

export function createDomWatch(monitorRef: Ref<AttemptMonitor | null>, recordRef: Ref<WatchdogRecord | null>, write: Write, late: Ref<LateRecord>): DomWatch {
  return {
    ready: () => monitorRef.current?.ready(),
    error: (m) => monitorRef.current?.error(m),
    crashed: async (k) => {
      const outcome = monitorRef.current?.crashed(k);
      const r = recordRef.current;
      if (outcome !== 'reload' || !r) return outcome;
      recordRef.current = markReloading(r, Date.now());
      if (!late.current.held && (await write(recordRef.current, 1))) return 'reload';
      diagCollector.mark('watchdog-reload-save-failed');
      return monitorRef.current?.crashed(k);
    },
    protocol: () => monitorRef.current?.protocolFatal(),
    plannedReload: () =>
      late.current.held
        ? Promise.resolve(false)
        : plannedReloadStep({
          getRecord: () => recordRef.current,
          setRecord: (r) => void (recordRef.current = r),
          write,
          arm: () => monitorRef.current?.plannedReload() ?? false,
          onWriteFailed: () => diagCollector.mark('watchdog-reload-save-failed'),
          now: Date.now,
        }),
  };
}

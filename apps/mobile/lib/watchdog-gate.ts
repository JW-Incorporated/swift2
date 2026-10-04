// One UI WP0.4b / WP2.14: React wiring for the watchdog. App.tsx asks
// `useDomMount` whether the DOM host may render. The DOM-or-native choice is
// made ONCE per launch from local state only (quarantine > override > cached
// flag > compiled default, watchdog-policy.ts); a network config applies on the
// next launch. The launch-attempt record is AWAITED before 'dom' is returned;
// if that write fails the launch mounts native (fail closed). `pending` is
// bounded by PENDING_MAX_MS, after which native mounts and the DOM never swaps in.
//
// NOT YET WIRED (explicit follow-ups, not done in WP2.14):
// DONE (WP2.4-D1): App.tsx clears the native-route overlay whenever `mount` leaves 'dom' (watchdog fallback). TODO(PM, WP2.4-D2): the pending/launch overlay.
// TODO(PM, WP2.3-E): the notification-tap queue (a tap while quarantined/fallback must land on the native screen).
// Bridge host onProtocolFatal -> `watch.protocol` is wired in SharedUiHost (H0).
import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { diagCollector } from './diagnostics';
import { sendDiagReport } from './diagnostics-send';
import { getForceDomFailure, setForceSharedUi } from './diagnostics-override';
import { DEFAULT_ROUTE_FLAGS } from './routes';
import {
  createAttemptMonitor,
  createWriteQueue,
  decideMount,
  markReady,
  recordStrike,
  shouldMountDom,
  startAttempt,
  type AttemptMonitor,
  type DomFailureMode,
  type MountDecision,
  type WatchdogRecord,
} from './watchdog';
import { armPendingBound, reasonCategory, refundExpiredFallback, resolveWantsDom } from './watchdog-policy';
import {
  currentBuildKey,
  loadReportsRaw,
  loadWatchdogRecord,
  saveReportsRaw,
  saveWatchdogRecord,
} from './watchdog-store';
import { createTelemetry } from './watchdog-telemetry';

export type MountState = 'pending' | 'dom' | 'native';

/** Everything the launch decision reads, all local: null until App has resolved them. */
export interface LaunchInputs {
  /** C4 "Force shared UI (this device)". */
  override: boolean;
  /** Last-good cached remote sharedUi (loadLaunchFlags); null = none cached. */
  sharedUi: boolean | null;
  /** Last-good cached watchdogReports; reports are on ONLY when this is true (null/false = off). */
  watchdogReports: boolean | null;
}

/** What the DOM host reports into; stable identity, safe to call before/after a monitor exists. */
export interface DomWatch {
  ready: () => void;
  error: (message: string) => void;
  crashed: (kind: 'terminated' | 'render-gone') => void;
  protocol: () => void;
}

// Monotonic within a launch where available, so a wall-clock step cannot stretch or shrink the ready timeout.
const monotonicNow = (): number => (typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now());

const scheduler = { setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms), clearTimeout: (h: unknown) => clearTimeout(h as never) };

export function useDomMount(inputs: LaunchInputs | null): {
  mount: MountState;
  watch: DomWatch;
  forceFailure: DomFailureMode;
} {
  const [decision, setDecision] = useState<MountDecision | null>(null);
  const [mount, setMount] = useState<MountState>('pending');
  const [forceFailure, setForceFailure] = useState<DomFailureMode>('off');
  const recordRef = useRef<WatchdogRecord | null>(null);
  const monitorRef = useRef<AttemptMonitor | null>(null);
  const startedRef = useRef(false);
  const expiredRef = useRef(false);
  const decidedStrikeRef = useRef<WatchdogRecord | null>(null);
  const inputsRef = useRef(inputs);
  inputsRef.current = inputs;
  const writeRef = useRef<ReturnType<typeof createWriteQueue> | null>(null);
  writeRef.current ??= createWriteQueue(saveWatchdogRecord);
  const write = writeRef.current;
  const telemetryRef = useRef<ReturnType<typeof createTelemetry> | null>(null);
  telemetryRef.current ??= createTelemetry({
    load: loadReportsRaw,
    save: saveReportsRaw,
    send: sendDiagReport,
    platform: () => (Platform.OS === 'ios' ? 'ios' : 'android'),
    now: Date.now,
  });
  const telemetry = telemetryRef.current;
  const reportsOn = () => inputsRef.current?.watchdogReports === true;
  const report = (reason: string, buildKey: string) =>
    void telemetry.report(reasonCategory(reason), buildKey, reportsOn());

  useEffect(
    () =>
      armPendingBound(scheduler, () => {
        expiredRef.current = true;
        setMount((m) => (m === 'pending' ? 'native' : m));
      }),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const prev = await loadWatchdogRecord();
      const d = decideMount(prev, currentBuildKey(), Date.now());
      recordRef.current = d.record;
      await write(refundExpiredFallback(prev, d.record, expiredRef.current));
      if (d.clearOverride) void setForceSharedUi(false);
      if (prev !== 'corrupt' && prev?.state === 'attempting' && (d.record.state === 'fallback' || d.record.state === 'quarantined')) {
        decidedStrikeRef.current = d.record;
      }
      if (!cancelled) setDecision(d);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (inputs) void telemetry.flush(reportsOn());
  }, [inputs]);

  useEffect(() => {
    if (!decision || !inputs || startedRef.current) return;
    startedRef.current = true;
    // A strike folded in at launch (an attempt that died last launch) is reported once the flag is known.
    const struck = decidedStrikeRef.current;
    if (struck) report(struck.lastReason, struck.buildKey);
    if (expiredRef.current) return;
    const want = resolveWantsDom({
      quarantined: decision.record.state === 'quarantined',
      override: inputs.override,
      cachedSharedUi: inputs.sharedUi,
      defaultSharedUi: DEFAULT_ROUTE_FLAGS.sharedUi,
    });
    if (!shouldMountDom(want.wantsDom, decision)) {
      setMount('native');
      return;
    }
    void (async () => {
      setForceFailure(await getForceDomFailure());
      const attempt = await startAttempt(decision, Date.now(), write, () => !expiredRef.current);
      if (!attempt) {
        setMount('native');
        return;
      }
      recordRef.current = attempt;
      if (AppState.currentState !== 'active') {
        recordRef.current = { ...attempt, backgrounded: true };
        void write(recordRef.current);
      }
      monitorRef.current = createAttemptMonitor({
        scheduler,
        now: monotonicNow,
        active: AppState.currentState === 'active',
        onReady: () => {
          if (!recordRef.current) return;
          recordRef.current = markReady(recordRef.current, Date.now());
          void write(recordRef.current, 1).then((ok) => {
            if (!ok) diagCollector.mark('watchdog-ready-save-failed');
          });
        },
        onStrike: (reason) => {
          if (!recordRef.current) return;
          const { record, clearOverride } = recordStrike(recordRef.current, reason, Date.now());
          recordRef.current = record;
          void write(record);
          if (clearOverride) void setForceSharedUi(false);
          if (record.state === 'fallback' || record.state === 'quarantined') {
            report(reason, record.buildKey);
          }
          setMount('native');
        },
      });
      setMount('dom');
    })();
  }, [decision, inputs]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      monitorRef.current?.setActive(s === 'active');
      const r = recordRef.current;
      if (r?.state === 'attempting' && r.backgrounded !== (s !== 'active')) {
        recordRef.current = { ...r, backgrounded: s !== 'active' };
        void write(recordRef.current);
      }
    });
    return () => {
      sub.remove();
      monitorRef.current?.dispose();
    };
  }, []);

  const watch = useMemo<DomWatch>(
    () => ({
      ready: () => monitorRef.current?.ready(),
      error: (m) => monitorRef.current?.error(m),
      crashed: (k) => monitorRef.current?.crashed(k),
      protocol: () => monitorRef.current?.protocolFatal(),
    }),
    [],
  );

  return { mount, watch, forceFailure };
}

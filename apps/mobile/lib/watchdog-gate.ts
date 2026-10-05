// One UI WP0.4b / WP2.14: React wiring for the watchdog. App.tsx asks
// `useDomMount` whether the DOM host may render. The DOM-or-native choice is
// made ONCE per launch from local state only (quarantine > cached
// flag > compiled default, watchdog-policy.ts); a network config applies on the
// next launch. The launch-attempt record is AWAITED before 'dom' is returned;
// if that write fails the launch mounts native (fail closed). `pending` is
// bounded by PENDING_MAX_MS, after which native mounts (logged as mount-pending-expired); expiry is terminal for the launch (no late swap; the next launch decides).
//
// Wiring closed (proved end to end by lib/watchdog-closure.test.ts):
// App.tsx clears the native-route overlay whenever `mount` leaves 'dom' (watchdog fallback; D1). While pending no
// overlay can exist (the DOM host is not mounted), so the pending/launch overlay needs no clearing.
// Notification taps while quarantined/fallback land natively via lib/notification-tap-gate.ts (H3).
// Bridge host onProtocolFatal -> `watch.protocol` is wired in SharedUiHost (H0).
import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { diagCollector, setMountInfo } from './diagnostics';
import { sendDiagReport } from './diagnostics-send';
import { getForceDomFailure } from './diagnostics-override';
import { DEFAULT_ROUTE_FLAGS } from './routes';
import {
  createAttemptMonitor,
  decideMount,
  markReady,
  markReloading,
  recordStrike,
  shouldMountDom,
  startAttempt,
  type AttemptMonitor,
  type CrashOutcome,
  type DomFailureMode,
  type MountDecision,
  type WatchdogRecord,
} from './watchdog';
import {
  armPendingBound,
  nativeReasonFor,
  reasonCategory,
  refundExpiredFallback,
  resolveWantsDom,
  type NativeReason,
  type WantSource,
} from './watchdog-policy';
import {
  currentBuildKey,
  loadReportsRaw,
  loadWatchdogRecord,
  saveReportsRaw,
} from './watchdog-store';
import { createTelemetry } from './watchdog-telemetry';
import { createWatchdogWriter, type WatchdogWriter } from './watchdog-writer';

/** A storage write that never settles must not hang the launch: treat it as a failed attempt write (native). */
const ATTEMPT_WRITE_MAX_MS = 3000;

export type MountState = 'pending' | 'dom' | 'native';

/** Everything the launch decision reads, all local: null until App has resolved them. */
export interface LaunchInputs {
  /** Last-good cached remote sharedUi (loadLaunchFlags); null = none cached. */
  sharedUi: boolean | null;
  /** Last-good cached iOS-only gate (iOS reads this instead of sharedUi); null = none cached. */
  sharedUiIos: boolean | null;
  /** Last-good cached watchdogReports; reports are on ONLY when this is true (null/false = off). */
  watchdogReports: boolean | null;
}

/** What the DOM host reports into; stable identity, safe to call before/after a monitor exists. */
export interface DomWatch {
  ready: () => void;
  error: (message: string) => void;
  /** 'reload' = a post-ready process termination the monitor wants healed by a DOM reload (resolved only after the record was persisted as an unresolved attempt); otherwise struck. */
  crashed: (kind: 'terminated' | 'render-gone') => Promise<CrashOutcome | undefined>;
  protocol: () => void;
}

// Monotonic within a launch where available, so a wall-clock step cannot stretch or shrink the ready timeout.
const monotonicNow = (): number => (typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now());

const elapsedMs = (): number => Math.round(diagCollector.elapsed());

const scheduler = { setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms), clearTimeout: (h: unknown) => clearTimeout(h as never) };

export function useDomMount(inputs: LaunchInputs | null): {
  mount: MountState;
  watch: DomWatch;
  forceFailure: DomFailureMode;
  nativeReason: NativeReason | null;
} {
  const [decision, setDecision] = useState<MountDecision | null>(null);
  const [mount, setMount] = useState<MountState>('pending');
  const [forceFailure, setForceFailure] = useState<DomFailureMode>('off');
  const recordRef = useRef<WatchdogRecord | null>(null);
  const monitorRef = useRef<AttemptMonitor | null>(null);
  const startedRef = useRef(false);
  const expiredRef = useRef(false);
  const committedRef = useRef(false);
  const decidedRef = useRef(false);
  const decidedStrikeRef = useRef<WatchdogRecord | null>(null);
  const inputsRef = useRef(inputs);
  inputsRef.current = inputs;
  const writerRef = useRef<WatchdogWriter | null>(null);
  writerRef.current ??= createWatchdogWriter();
  const write = writerRef.current.write;
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

  const [nativeReason, setNativeReason] = useState<NativeReason | null>(null);
  const mountRef = useRef<MountState>('pending');
  const apply = (m: MountState, reason: NativeReason | null = null, source: WantSource | null = null) => {
    mountRef.current = m;
    setMount(m);
    setNativeReason(m === 'native' ? reason : null);
    setMountInfo({ mount: m, reason: m === 'native' ? reason : null, source: m === 'dom' ? source : null });
  };

  useEffect(
    () =>
      armPendingBound(scheduler, () => {
        expiredRef.current = true;
        diagCollector.mark('mount-pending-expired', `${inputsRef.current ? 'inputs-ready' : 'inputs-pending'},${decidedRef.current ? 'decision-ready' : 'decision-pending'},${elapsedMs()}ms`);
        if (mountRef.current === 'pending' && !committedRef.current) apply('native', 'pending-expired');
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
      if (prev !== 'corrupt' && prev?.state === 'attempting' && (d.record.state === 'fallback' || d.record.state === 'quarantined')) {
        decidedStrikeRef.current = d.record;
      }
      if (!cancelled) {
        decidedRef.current = true;
        diagCollector.mark('mount-decision-resolved', `${elapsedMs()}ms`);
        setDecision(d);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (inputs) {
      diagCollector.mark('mount-inputs-resolved', `${elapsedMs()}ms`);
      void telemetry.flush(reportsOn());
    }
  }, [inputs]);

  useEffect(() => {
    if (!decision || !inputs || startedRef.current) return;
    startedRef.current = true;
    // A strike folded in at launch (an attempt that died last launch) is reported once the flag is known.
    const struck = decidedStrikeRef.current;
    if (struck) report(struck.lastReason, struck.buildKey);
    const ios = Platform.OS === 'ios';
    const want = resolveWantsDom({
      quarantined: decision.record.state === 'quarantined',
      override: false,
      cachedSharedUi: ios ? inputs.sharedUiIos : inputs.sharedUi,
      defaultSharedUi: ios ? DEFAULT_ROUTE_FLAGS.sharedUiIos : DEFAULT_ROUTE_FLAGS.sharedUi,
    });
    // Pending expiry is terminal for this launch: native stays mounted (never swap an interactive UI); the next launch decides normally.
    if (expiredRef.current) return;
    if (!shouldMountDom(want.wantsDom, decision)) {
      if (mountRef.current !== 'pending') void write(decision.record);
      apply('native', nativeReasonFor(want, decision.fallbackActive));
      return;
    }
    void (async () => {
      const failure = await getForceDomFailure();
      if (expiredRef.current) return;
      committedRef.current = true;
      setForceFailure(failure);
      let timer: unknown;
      const bound = new Promise<null>((resolve) => {
        timer = scheduler.setTimeout(() => resolve(null), ATTEMPT_WRITE_MAX_MS);
      });
      const attempt = await Promise.race([startAttempt(decision, Date.now(), write), bound]);
      scheduler.clearTimeout(timer);
      if (!attempt) {
        apply('native', 'attempt-failed');
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
          const { record } = recordStrike(recordRef.current, reason, Date.now());
          recordRef.current = record;
          void write(record);
          if (record.state === 'fallback' || record.state === 'quarantined') {
            report(reason, record.buildKey);
          }
          apply('native', 'dom-strike');
        },
      });
      apply('dom', null, want.source);
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
      crashed: async (k) => {
        const outcome = monitorRef.current?.crashed(k);
        const r = recordRef.current;
        if (outcome !== 'reload' || !r) return outcome;
        recordRef.current = markReloading(r, Date.now());
        if (await write(recordRef.current, 1)) return 'reload';
        diagCollector.mark('watchdog-reload-save-failed');
        return monitorRef.current?.crashed(k);
      },
      protocol: () => monitorRef.current?.protocolFatal(),
    }),
    [],
  );

  return { mount, watch, forceFailure, nativeReason };
}

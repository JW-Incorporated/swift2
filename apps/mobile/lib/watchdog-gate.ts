// One UI WP0.4b / WP2.14: React wiring for the watchdog. App.tsx asks
// `useDomMount` whether the DOM host may render. The DOM-or-native choice is
// made ONCE per launch from local state only (quarantine > cached
// flag > compiled default, watchdog-policy.ts); a network config applies on the
// next launch. The launch-attempt record is AWAITED before 'dom' is returned;
// if that write fails the launch mounts native (fail closed). `pending` is
// bounded by PENDING_MAX_MS, after which native mounts (logged as mount-pending-expired); expiry is terminal for the launch (no late swap; the next launch decides).
//
// Wiring closed (proved end to end by App.watchdog.test.tsx):
// App.tsx clears the native-route overlay whenever `mount` leaves 'dom' (watchdog fallback; D1). While pending no
// overlay can exist (the DOM host is not mounted), so the pending/launch overlay needs no clearing.
// Notification taps while quarantined/fallback land natively via lib/notification-tap-gate.ts (H3).
// Bridge host onProtocolFatal -> `watch.protocol` is wired in SharedUiHost (H0).
import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { diagCollector, setMountInfo } from './diagnostics';
import { sendDiagReport } from './diagnostics-send';
import { DEFAULT_ROUTE_FLAGS } from './routes';
import { createDomWatch, createGateMonitor, reconcileLateRecord, type LateRecord } from './watchdog-gate-parts';
import {
  beginAttempt,
  createWriteQueue,
  decideMount,
  shouldMountDom,
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
  resolveWantsDom,
  type NativeReason,
  type WantSource,
} from './watchdog-policy';
import {
  currentBuildKey,
  loadReportsRaw,
  loadWatchdogRecord,
  saveReportsRaw,
  saveWatchdogRecord,
} from './watchdog-store';
import { DEFAULT_DEPS, boundedForceFailure, startAttemptBounded, useContentGate, type GateDeps } from './watchdog-gate-content';
import { createTelemetry } from './watchdog-telemetry';

export type MountState = 'pending' | 'awaiting-content' | 'dom' | 'native';

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
  /** A planned DOM re-key (content adoption): persists the attempt as unresolved FIRST, then re-arms the ready timeout; false (nothing persisted or armed) means do not reload. The reload itself is never a strike. */
  plannedReload?: () => Promise<boolean>;
}

// Monotonic within a launch where available, so a wall-clock step cannot stretch or shrink the ready timeout.
const monotonicNow = (): number => (typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now());

const NO_INPUTS: LaunchInputs = { sharedUi: null, sharedUiIos: null, watchdogReports: null };

const elapsedMs = (): number => Math.round(diagCollector.elapsed());

const scheduler = { setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms), clearTimeout: (h: unknown) => clearTimeout(h as never) };

export function useDomMount(inputs: LaunchInputs | null, deps: GateDeps = DEFAULT_DEPS): {
  mount: MountState;
  watch: DomWatch;
  forceFailure: DomFailureMode;
  nativeReason: NativeReason | null;
  /** awaiting-content only: the load failed (offline) / re-run it. */
  contentFailed: boolean;
  retryContent: () => void;
} {
  const [decision, setDecision] = useState<MountDecision | null>(null);
  const [mount, setMount] = useState<MountState>('pending');
  const [forceFailure, setForceFailure] = useState<DomFailureMode>('off');
  const recordRef = useRef<WatchdogRecord | null>(null);
  const monitorRef = useRef<AttemptMonitor | null>(null);
  const startedRef = useRef(false);
  const committedRef = useRef(false);
  const decidedRef = useRef(false);
  const prevRef = useRef<WatchdogRecord | null | 'corrupt'>(null);
  const pendingRealRef = useRef<{ prev: WatchdogRecord | null | 'corrupt'; d: MountDecision } | null>(null);
  const lateRef = useRef<LateRecord>({ held: false, ready: false, strike: null });
  const beginRef = useRef<(d: MountDecision, i: LaunchInputs, slowRecord: boolean) => void>(() => undefined);
  const decisionRef = useRef<MountDecision | null>(null);
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

  const { contentFailed, depsRef, unmountedRef, waiterRef, noContentRef } = useContentGate(deps);
  const cancelBoundRef = useRef<() => void>(() => undefined);
  const [nativeReason, setNativeReason] = useState<NativeReason | null>(null);
  const mountRef = useRef<MountState>('pending');
  const apply = (m: MountState, reason: NativeReason | null = null, source: WantSource | null = null) => {
    mountRef.current = m;
    setMount(m);
    setNativeReason(m === 'native' ? reason : null);
    setMountInfo({ mount: m, reason: m === 'native' ? reason : null, source: m === 'dom' ? source : null });
  };

  useEffect(() => {
    // No cache on disk: the launch waits natively for the download, so the pending bound is never armed.
    noContentRef.current = !depsRef.current.hasLocalContent();
    cancelBoundRef.current = noContentRef.current ? () => undefined : armPendingBound(scheduler, () => {
        diagCollector.mark('mount-pending-expired', `${inputsRef.current ? 'inputs-ready' : 'inputs-pending'},${decidedRef.current ? 'decision-ready' : 'decision-pending'},${elapsedMs()}ms`);
        if (mountRef.current !== 'pending' || startedRef.current) return;
        // Slow reads never decide: start from the compiled default / a fresh record; evidence that arrives later applies next launch.
        const slowRecord = decisionRef.current === null;
        if (slowRecord) lateRef.current.held = true;
        beginRef.current(decisionRef.current ?? decideMount(null, currentBuildKey(), Date.now()), inputsRef.current ?? NO_INPUTS, slowRecord);
      });
    return () => cancelBoundRef.current();
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const prev = await loadWatchdogRecord();
      const d = decideMount(prev, currentBuildKey(), Date.now());
      recordRef.current = d.record;
      prevRef.current = prev;
      decisionRef.current = d;
      if (prev !== 'corrupt' && prev?.state === 'attempting' && (d.record.state === 'fallback' || d.record.state === 'quarantined')) {
        decidedStrikeRef.current = d.record;
      }
      if (!cancelled) {
        decidedRef.current = true;
        diagCollector.mark('mount-decision-resolved', `${elapsedMs()}ms`);
        if (lateRef.current.held) {
          pendingRealRef.current = { prev, d };
          if (monitorRef.current) reconcileLateRecord(prev, d, lateRef, recordRef, write);
        } else setDecision(d);
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

  // slowRecord: the watchdog record was still unread when the bound passed; nothing is persisted until it resolves.
  beginRef.current = (decision, inputs, slowRecord) => {
    if (startedRef.current) return;
    startedRef.current = true;
    const run = (d: MountDecision, slow: boolean) => {
      // A strike folded in at launch (an attempt that died last launch) is reported once the flag is known.
      const struck = decidedStrikeRef.current;
      if (struck) report(struck.lastReason, struck.buildKey);
      const ios = Platform.OS === 'ios';
      const want = resolveWantsDom({
        quarantined: d.record.state === 'quarantined',
        override: false,
        cachedSharedUi: ios ? inputs.sharedUiIos : inputs.sharedUi,
        defaultSharedUi: ios ? DEFAULT_ROUTE_FLAGS.sharedUiIos : DEFAULT_ROUTE_FLAGS.sharedUi,
      });
      if (!shouldMountDom(want.wantsDom, d)) {
        if (!slow) void write(d.record);
        return apply('native', nativeReasonFor(want, d.fallbackActive));
      }
      void (async () => {
        if (noContentRef.current) {
          apply('awaiting-content');
          const t0 = monotonicNow();
          if (!(await waiterRef.current?.run())) return;
          diagCollector.mark('first-download-ms', `${Math.round(monotonicNow() - t0)}ms`);
        }
        const failure = await boundedForceFailure(scheduler);
        if (unmountedRef.current) return;
        const real = pendingRealRef.current;
        if (slow && real) {
          // The record resolved before anything mounted: decide from it normally (an owed fallback is honoured now).
          lateRef.current = { held: false, ready: false, strike: null };
          prevRef.current = real.prev;
          recordRef.current = real.d.record;
          return run(real.d, false);
        }
        committedRef.current = true;
        setForceFailure(failure);
        const attempt = slow
          ? beginAttempt(d.record, Date.now())
          : await startAttemptBounded(d, write, scheduler, () => !unmountedRef.current, () => diagCollector.mark('watchdog-attempt-late-save-failed'));
        if (unmountedRef.current) return;
        if (!attempt) return apply('native', 'attempt-failed');
        recordRef.current = attempt;
        if (!slow && AppState.currentState !== 'active') {
          recordRef.current = { ...attempt, backgrounded: true };
          void write(recordRef.current);
        }
        monitorRef.current = createGateMonitor({
          scheduler,
          now: monotonicNow,
          recordRef,
          late: lateRef,
          write,
          onStrike: (reason, record, persisted) => {
            if (persisted && (record.state === 'fallback' || record.state === 'quarantined')) report(reason, record.buildKey);
            apply('native', 'dom-strike');
          },
        });
        apply('dom', null, want.source);
      })();
    };
    run(decision, slowRecord);
  };

  useEffect(() => {
    if (decision && inputs) beginRef.current(decision, inputs, false);
  }, [decision, inputs]);

  useEffect(() => {
    unmountedRef.current = false;
    const sub = AppState.addEventListener('change', (s) => {
      monitorRef.current?.setActive(s === 'active');
      if (s === 'active') waiterRef.current?.onActive();
      const r = recordRef.current;
      if (!lateRef.current.held && r?.state === 'attempting' && r.backgrounded !== (s !== 'active')) {
        recordRef.current = { ...r, backgrounded: s !== 'active' };
        void write(recordRef.current);
      }
    });
    return () => {
      unmountedRef.current = true;
      waiterRef.current?.release();
      sub.remove();
      monitorRef.current?.dispose();
    };
  }, []);

  const watch = useMemo<DomWatch>(() => createDomWatch(monitorRef, recordRef, write, lateRef), []);

  return { mount, watch, forceFailure, nativeReason, contentFailed, retryContent: () => waiterRef.current?.retry() };
}

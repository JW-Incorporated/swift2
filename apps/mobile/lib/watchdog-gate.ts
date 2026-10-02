// One UI WP0.4b: React wiring for the watchdog. App.tsx asks `useDomMount`
// whether the DOM host may render. The launch-attempt record is AWAITED before
// 'dom' is returned; if that write fails the launch mounts native (fail closed).
import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { getForceDomFailure, setForceSharedUi } from './diagnostics-override';
import {
  createAttemptMonitor,
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
import { currentBuildKey, loadWatchdogRecord, saveWatchdogRecord } from './watchdog-store';

export type MountState = 'pending' | 'dom' | 'native';

/** What the DOM host reports into; stable identity, safe to call before/after a monitor exists. */
export interface DomWatch {
  ready: () => void;
  error: (message: string) => void;
  crashed: (kind: 'terminated' | 'render-gone') => void;
}

export function useDomMount(wantsDom: boolean): {
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

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const d = decideMount(await loadWatchdogRecord(), currentBuildKey(), Date.now());
      recordRef.current = d.record;
      await saveWatchdogRecord(d.record);
      if (!cancelled) setDecision(d);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!decision || startedRef.current || !wantsDom) return;
    startedRef.current = true;
    if (!shouldMountDom(wantsDom, decision)) {
      setMount('native');
      return;
    }
    void (async () => {
      const attempt = await startAttempt(decision, Date.now(), saveWatchdogRecord);
      if (!attempt) {
        setMount('native');
        return;
      }
      recordRef.current = attempt;
      setForceFailure(await getForceDomFailure());
      monitorRef.current = createAttemptMonitor({
        scheduler: { setTimeout: (fn, ms) => setTimeout(fn, ms), clearTimeout: (h) => clearTimeout(h as never) },
        now: Date.now,
        active: AppState.currentState === 'active',
        onReady: () => {
          if (recordRef.current) {
            recordRef.current = markReady(recordRef.current, Date.now());
            void saveWatchdogRecord(recordRef.current);
          }
        },
        onStrike: (reason) => {
          if (!recordRef.current) return;
          const { record, clearOverride } = recordStrike(recordRef.current, reason, Date.now());
          recordRef.current = record;
          void saveWatchdogRecord(record);
          if (clearOverride) void setForceSharedUi(false);
          setMount('native');
        },
      });
      setMount('dom');
    })();
  }, [decision, wantsDom]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => monitorRef.current?.setActive(s === 'active'));
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
    }),
    [],
  );

  return { mount, watch, forceFailure };
}

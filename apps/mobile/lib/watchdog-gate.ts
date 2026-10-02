// One UI WP0.4b: React wiring for the watchdog. App.tsx asks `useDomMount`
// whether the DOM host may render. The launch-attempt record is AWAITED before
// 'dom' is returned; if that write fails the launch mounts native (fail closed).
import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { diagCollector } from './diagnostics';
import { getForceDomFailure, setForceSharedUi } from './diagnostics-override';
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
  const wantsRef = useRef(wantsDom);
  wantsRef.current = wantsDom;
  const writeRef = useRef<ReturnType<typeof createWriteQueue> | null>(null);
  writeRef.current ??= createWriteQueue(saveWatchdogRecord);
  const write = writeRef.current;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const d = decideMount(await loadWatchdogRecord(), currentBuildKey(), Date.now());
      recordRef.current = d.record;
      await write(d.record);
      if (d.clearOverride) void setForceSharedUi(false);
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
      setForceFailure(await getForceDomFailure());
      const attempt = await startAttempt(decision, Date.now(), write, () => wantsRef.current);
      if (!attempt) {
        setMount('native');
        return;
      }
      recordRef.current = attempt;
      monitorRef.current = createAttemptMonitor({
        scheduler: { setTimeout: (fn, ms) => setTimeout(fn, ms), clearTimeout: (h) => clearTimeout(h as never) },
        now: Date.now,
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
          setMount('native');
        },
      });
      setMount('dom');
    })();
  }, [decision, wantsDom]);

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
    }),
    [],
  );

  return { mount, watch, forceFailure };
}

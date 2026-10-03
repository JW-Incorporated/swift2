// One UI WP2.14 / G4: a scripted drill. Forces each failure mode through the
// real pure rules (decideMount, attempt monitor, strikes, quarantine, launch
// precedence) on a fake clock and returns the launch-by-launch table, so the
// fallback behaviour can be observed without a device. The on-device version of
// the same drill is docs/one-ui/dom-host.md ("G4 drill"). Run:
//   npx vitest run apps/mobile/lib/watchdog-drill.test.ts --reporter=verbose
import {
  beginAttempt,
  createAttemptMonitor,
  decideMount,
  markReady,
  recordStrike,
  shouldMountDom,
  READY_TIMEOUT_MS,
  type WatchdogRecord,
} from './watchdog';
import { reasonCategory, resolveWantsDom, type WantSource, type WatchdogReason } from './watchdog-policy';

export type DrillFailure = 'hang' | 'throw' | 'terminated' | 'render-gone' | 'protocol' | 'abandon' | 'none';

export interface DrillRow {
  launch: number;
  mount: 'dom' | 'native';
  source: WantSource;
  /** Native without an attempt because the record owes a fallback or is quarantined. */
  skipped: boolean;
  outcome: 'ready' | 'strike' | 'abandoned' | 'skipped';
  category: WatchdogReason | null;
  state: WatchdogRecord['state'];
  strikes: number;
  fallbackCycles: number;
  /** Time burned on the DOM attempt before native took over. */
  burnedMs: number;
}

export interface DrillOptions {
  launches?: number;
  override?: boolean;
  cachedSharedUi?: boolean | null;
  defaultSharedUi?: boolean;
  buildKey?: string;
  /** Starting record (e.g. a prior launch's); null = first launch. */
  record?: WatchdogRecord | null;
}

export function runDrill(failure: DrillFailure, opts: DrillOptions = {}): DrillRow[] {
  const { launches = 9, override = false, cachedSharedUi = true, defaultSharedUi = false, buildKey = '1:drill' } = opts;
  let record: WatchdogRecord | null = opts.record ?? null;
  const rows: DrillRow[] = [];
  for (let launch = 1; launch <= launches; launch += 1) {
    const d = decideMount(record, buildKey, launch);
    const want = resolveWantsDom({
      quarantined: d.record.state === 'quarantined',
      override,
      cachedSharedUi,
      defaultSharedUi,
    });
    record = d.record;
    const base = { launch, source: want.source };
    if (!shouldMountDom(want.wantsDom, d)) {
      rows.push({ ...base, mount: 'native', skipped: d.fallbackActive, outcome: 'skipped', category: null, state: record.state, strikes: record.strikes, fallbackCycles: record.fallbackCycles, burnedMs: 0 });
      continue;
    }
    let t = 0;
    const timers = new Map<number, { at: number; fn: () => void }>();
    let id = 0;
    let struck: string | null = null;
    let ready = false;
    const m = createAttemptMonitor({
      now: () => t,
      active: true,
      onReady: () => {
        ready = true;
      },
      onStrike: (reason) => {
        struck = reason;
      },
      scheduler: {
        setTimeout: (fn, ms) => {
          timers.set(++id, { at: t + ms, fn });
          return id;
        },
        clearTimeout: (h) => void timers.delete(h as number),
      },
    });
    record = beginAttempt(record, launch);
    if (failure === 'none') m.ready();
    else if (failure === 'throw') m.error('drill');
    else if (failure === 'terminated' || failure === 'render-gone') m.crashed(failure);
    else if (failure === 'protocol') m.protocolFatal();
    else if (failure === 'abandon') record = { ...record, backgrounded: true };
    else {
      t = READY_TIMEOUT_MS;
      for (const [k, v] of [...timers]) if (v.at <= t) { timers.delete(k); v.fn(); }
    }
    let outcome: DrillRow['outcome'] = 'abandoned';
    let category: WatchdogReason | null = null;
    if (ready) {
      record = markReady(record, launch);
      outcome = 'ready';
    } else if (struck !== null) {
      record = recordStrike(record, struck, launch).record;
      category = reasonCategory(struck);
      outcome = 'strike';
    }
    const burnedMs = failure === 'hang' ? READY_TIMEOUT_MS : 0;
    rows.push({ ...base, mount: outcome === 'ready' || outcome === 'abandoned' ? 'dom' : 'native', skipped: false, outcome, category, state: record.state, strikes: record.strikes, fallbackCycles: record.fallbackCycles, burnedMs });
  }
  return rows;
}

export const drillTable = (rows: DrillRow[]): string[] =>
  rows.map((r) => `#${r.launch} ${r.mount.padEnd(6)} via ${r.source.padEnd(10)} ${r.outcome.padEnd(9)} ${String(r.category ?? '-').padEnd(20)} state=${r.state} strikes=${r.strikes} cycles=${r.fallbackCycles} burned=${r.burnedMs}ms`);

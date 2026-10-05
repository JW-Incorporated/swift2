// Planned DOM reload (content adoption) as a watchdog transition: persist the attempt as unresolved FIRST, arm the
// ready timeout only once that write succeeded. Arming first would let the timeout strike a reload that was never
// recorded (and then never happened). Pure: the gate injects the record slot, the write queue and the monitor.
import { markReloading, type WatchdogRecord } from './watchdog';

export interface PlannedReloadDeps {
  getRecord: () => WatchdogRecord | null;
  setRecord: (r: WatchdogRecord) => void;
  write: (r: WatchdogRecord, retries: number) => Promise<boolean>;
  /** Re-arms the monitor's ready timeout; false when it is already struck. */
  arm: () => boolean;
  onWriteFailed: () => void;
  now: () => number;
}

/** True only when the reload was persisted as `attempting` and the monitor armed; false changes nothing the next launch could read. */
export async function plannedReloadStep(deps: PlannedReloadDeps): Promise<boolean> {
  const r = deps.getRecord();
  if (!r || r.state !== 'ready') return false;
  const next = markReloading(r, deps.now());
  if (!(await deps.write(next, 1))) {
    deps.onWriteFailed();
    return false;
  }
  if (deps.getRecord() !== r) return false;
  deps.setRecord(next);
  return deps.arm();
}

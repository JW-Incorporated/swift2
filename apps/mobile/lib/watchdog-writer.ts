// The serialized writer for the watchdog record. The gate's hook creates it (one per launch) and it
// registers itself as the current writer, so the Recovery screen's Retry writes through the SAME
// queue and can never be overwritten by an earlier-queued strike/ready/reload write. `settled()`
// resolves once every write queued so far has finished.
import { createWriteQueue, type WatchdogRecord } from './watchdog';
import { saveWatchdogRecord } from './watchdog-store';

export interface WatchdogWriter {
  write(record: WatchdogRecord, retries?: number): Promise<boolean>;
  settled(): Promise<void>;
}

let current: WatchdogWriter | null = null;

export function createWatchdogWriter(): WatchdogWriter {
  const queue = createWriteQueue((r) => saveWatchdogRecord(r));
  let last: Promise<unknown> = Promise.resolve();
  const writer: WatchdogWriter = {
    write(record, retries = 0) {
      const result = queue(record, retries);
      last = result;
      return result;
    },
    async settled() {
      let seen: Promise<unknown>;
      do {
        seen = last;
        await seen.catch(() => {});
      } while (seen !== last);
    },
  };
  current = writer;
  return writer;
}

/** The writer Retry must use: the gate's, or a fresh one if the gate never mounted. */
export const currentWatchdogWriter = (): WatchdogWriter => current ?? createWatchdogWriter();

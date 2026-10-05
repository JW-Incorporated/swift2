// Persistence plumbing for the reader's `local` storage: the native blob is loaded once before the reader mounts
// (the in-memory Map seeds from it), and later changes are sent as full-map snapshots, debounced.
import type { BridgeClient } from '@swift2/ui';

type Caller = Pick<BridgeClient, 'call'>;

export const WRITE_DEBOUNCE_MS = 250;
export const RETRY_START_MS = 500;
export const RETRY_CAP_MS = 8000;
export const MAX_RETRIES = 6;

/** The native blob, or an empty seed on any failure (logged via `log`); never throws. */
export async function loadStorageSeed(client: Caller, log: (detail: string) => void = () => {}): Promise<Record<string, string>> {
  try {
    const r = await client.call('storage.load', {});
    if (r.ok && r.value && typeof r.value.entries === 'object' && r.value.entries !== null) return { ...r.value.entries };
    log(`storage.load: ${r.ok ? 'bad reply' : r.error.code}`);
  } catch (e) {
    log(`storage.load: ${String(e).slice(0, 120)}`);
  }
  return {};
}

/**
 * Sends the full in-memory map (`getSnapshot`) as `storage.write`, debounced. `dirty` + one write in flight: the
 * snapshot is taken at send time, so a changed key can never be lost or reordered. An `invalid` answer (too large)
 * clears `dirty`, emits one diag, and resends only on the next push; a transport failure keeps `dirty` and retries the
 * latest snapshot with bounded backoff.
 */
export function createWriteCoalescer(
  client: Caller,
  getSnapshot: () => Record<string, string>,
  log: (detail: string) => void = () => {},
  ms = WRITE_DEBOUNCE_MS,
) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let dirty = false;
  let inFlight = false;
  let failures = 0;
  let warnedInvalid = false;
  let gaveUp = false;

  const arm = (delay: number) => {
    if (timer !== null) return;
    timer = setTimeout(() => {
      timer = null;
      send();
    }, delay);
  };
  const backoff = () => Math.min(RETRY_START_MS * 2 ** (failures - 1), RETRY_CAP_MS);

  function settle(ok: boolean, invalid: boolean, detail: string): void {
    inFlight = false;
    if (ok) {
      failures = 0;
      gaveUp = false;
    } else if (invalid) {
      dirty = false;
      if (!warnedInvalid) {
        warnedInvalid = true;
        log(`storage.write rejected (${detail}); kept in memory only`);
      }
    } else {
      failures += 1;
      if (failures > MAX_RETRIES) {
        if (!gaveUp) log(`storage.write: giving up after retries (${detail})`);
        gaveUp = true;
        return;
      }
      arm(backoff());
      return;
    }
    if (dirty) arm(ms);
  }

  function send(): void {
    if (inFlight || !dirty) return;
    dirty = false;
    inFlight = true;
    client.call('storage.write', { entries: getSnapshot() }).then(
      (r) => {
        if (!r.ok && r.error.code !== 'invalid') dirty = true;
        settle(r.ok, !r.ok && r.error.code === 'invalid', r.ok ? '' : r.error.code);
      },
      (e) => {
        dirty = true;
        settle(false, false, String(e).slice(0, 120));
      },
    );
  }

  /** Call after every mutation of the map. */
  function push(): void {
    dirty = true;
    gaveUp = false;
    arm(failures > 0 ? backoff() : ms);
  }

  /** Send now (page hidden / teardown); a failure still retries on the backoff timer. */
  function flush(): void {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    send();
  }
  return { push, flush };
}

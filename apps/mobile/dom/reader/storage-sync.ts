// Persistence plumbing for the reader's `local` storage: the native blob is loaded once before the reader mounts
// (the in-memory Map seeds from it), and later changes are sent as full-map snapshots, debounced.
import type { BridgeClient } from '@swift2/ui';

type Caller = Pick<BridgeClient, 'call'>;

export const WRITE_DEBOUNCE_MS = 250;
export const RETRY_START_MS = 500;
export const RETRY_CAP_MS = 8000;
export const MAX_RETRIES = 6;

export const LOAD_RETRY_MS = 2000;

/** The native blob, or null on any failure (logged via `log`); never throws. null is NOT "empty": persisting over it would wipe the file. */
export async function loadStorageSeed(client: Caller, log: (detail: string) => void = () => {}): Promise<Record<string, string> | null> {
  try {
    const r = await client.call('storage.load', {});
    if (r.ok && r.value && typeof r.value.entries === 'object' && r.value.entries !== null) return { ...r.value.entries };
    log(`storage.load: ${r.ok ? 'bad reply' : r.error.code}`);
  } catch (e) {
    log(`storage.load: ${String(e).slice(0, 120)}`);
  }
  return null;
}

type Recoverable = { track(): void; rebase(base: Record<string, string>): boolean };

/**
 * The seed load failed: the reader runs in memory only (`sync` held, no snapshot is sent) and the load is retried once.
 * On success the loaded entries are the base, in-memory changes since are applied key by key, and pushing resumes.
 */
export function recoverStorage(
  client: Caller,
  local: Recoverable,
  sync: { hold(): void; release(changed: boolean): void },
  log: (detail: string) => void = () => {},
  ms = LOAD_RETRY_MS,
): () => void {
  let disposed = false;
  local.track();
  sync.hold();
  const timer = setTimeout(() => {
    if (disposed) return;
    void loadStorageSeed(client, log).then((base) => {
      if (disposed) return;
      if (!base) return log('storage.load retry failed; not persisting this session');
      sync.release(local.rebase(base));
    });
  }, ms);
  /** Teardown (unmount / re-key): the dead adapter must never load or push through its old client. */
  return () => {
    disposed = true;
    clearTimeout(timer);
  };
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
  let held = false;

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
    if (held || inFlight || !dirty) return;
    dirty = false;
    inFlight = true;
    const entries = getSnapshot();
    // An empty map is only ever sent deliberately (the host refuses an unflagged empty overwrite of saved data).
    client.call('storage.write', Object.keys(entries).length === 0 ? { entries, allowEmpty: true } : { entries }).then(
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
  /** No snapshot is sent while held; pushes still mark the map dirty. */
  function hold(): void {
    held = true;
  }
  function release(changed: boolean): void {
    held = false;
    if (changed || dirty) push();
  }
  return { push, flush, hold, release };
}

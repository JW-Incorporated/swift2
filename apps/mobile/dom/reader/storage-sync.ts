// Persistence plumbing for the reader's `local` storage: the native blob is loaded once before the reader mounts
// (the in-memory Map seeds from it), and later writes are coalesced and sent fire-and-forget.
import type { BridgeClient } from '@swift2/ui';

type Caller = Pick<BridgeClient, 'call'>;
export type StorageChange = { set?: Record<string, string>; remove?: string[] };

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

type Batch = { set: Map<string, string>; remove: Set<string> };

/**
 * Coalesces set/remove calls into one `storage.write` per quiet period (last write per key wins). One write is in
 * flight at a time (so writes never reorder); a batch is only forgotten once the host acknowledged it, otherwise it is
 * merged back under newer changes and retried with bounded backoff. An `invalid` answer (blob too large) is final for
 * that batch: the in-memory state is kept, one diag is emitted, and nothing loops.
 */
export function createWriteCoalescer(client: Caller, log: (detail: string) => void = () => {}, ms = WRITE_DEBOUNCE_MS) {
  const set = new Map<string, string>();
  const remove = new Set<string>();
  let timer: ReturnType<typeof setTimeout> | null = null;
  let inFlight = false;
  let failures = 0;
  let warnedInvalid = false;
  let gaveUp = false;

  const pending = () => set.size > 0 || remove.size > 0;
  const arm = (delay: number) => {
    if (timer !== null) return;
    timer = setTimeout(() => {
      timer = null;
      send();
    }, delay);
  };
  const backoff = () => Math.min(RETRY_START_MS * 2 ** (failures - 1), RETRY_CAP_MS);

  function requeue(batch: Batch): void {
    for (const [k, v] of batch.set) if (!set.has(k) && !remove.has(k)) set.set(k, v);
    for (const k of batch.remove) if (!set.has(k) && !remove.has(k)) remove.add(k);
  }

  function settle(batch: Batch, ok: boolean, invalid: boolean, detail: string): void {
    inFlight = false;
    if (ok) {
      failures = 0;
      gaveUp = false;
    } else if (invalid) {
      if (!warnedInvalid) {
        warnedInvalid = true;
        log(`storage.write rejected (${detail}); kept in memory only`);
      }
    } else {
      failures += 1;
      requeue(batch);
      if (failures > MAX_RETRIES) {
        if (!gaveUp) log(`storage.write: giving up after retries (${detail})`);
        gaveUp = true;
        return;
      }
      arm(backoff());
      return;
    }
    if (pending()) arm(ms);
  }

  function send(): void {
    if (inFlight || !pending()) return;
    const batch: Batch = { set: new Map(set), remove: new Set(remove) };
    set.clear();
    remove.clear();
    const payload: StorageChange = {};
    if (batch.set.size) payload.set = Object.fromEntries(batch.set);
    if (batch.remove.size) payload.remove = [...batch.remove];
    inFlight = true;
    client.call('storage.write', payload).then(
      (r) => settle(batch, r.ok, !r.ok && r.error.code === 'invalid', r.ok ? '' : r.error.code),
      (e) => settle(batch, false, false, String(e).slice(0, 120)),
    );
  }

  function push(change: { set?: [string, string]; remove?: string }): void {
    if (change.set) {
      remove.delete(change.set[0]);
      set.set(change.set[0], change.set[1]);
    }
    if (change.remove !== undefined) {
      set.delete(change.remove);
      remove.add(change.remove);
    }
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

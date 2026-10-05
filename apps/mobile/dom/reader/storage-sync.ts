// Persistence plumbing for the reader's `local` storage: the native blob is loaded once before the reader mounts
// (the in-memory Map seeds from it), and later writes are coalesced and sent fire-and-forget.
import type { BridgeClient } from '@swift2/ui';

type Caller = Pick<BridgeClient, 'call'>;
export type StorageChange = { set?: Record<string, string>; remove?: string[] };

export const WRITE_DEBOUNCE_MS = 250;

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

/** Coalesces set/remove calls into one `storage.write` per quiet period (last write per key wins). */
export function createWriteCoalescer(client: Caller, log: (detail: string) => void = () => {}, ms = WRITE_DEBOUNCE_MS) {
  const set = new Map<string, string>();
  const remove = new Set<string>();
  let timer: ReturnType<typeof setTimeout> | null = null;
  function flush(): void {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    if (set.size === 0 && remove.size === 0) return;
    const payload: StorageChange = {};
    if (set.size) payload.set = Object.fromEntries(set);
    if (remove.size) payload.remove = [...remove];
    set.clear();
    remove.clear();
    client.call('storage.write', payload).then(
      (r) => {
        if (!r.ok) log(`storage.write: ${r.error.code}`);
      },
      (e) => log(`storage.write: ${String(e).slice(0, 120)}`),
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
    if (timer === null) timer = setTimeout(flush, ms);
  }
  return { push, flush };
}

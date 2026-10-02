export type PoolSettled<R> = { ok: true; value: R } | { ok: false; error: unknown };

/**
 * Runs `fn` over `items` with at most `limit` in flight. Never rejects: each
 * slot is a settled result, index-aligned with `items`. After the first failure
 * no NEW item is started (in-flight ones finish and are kept); unstarted slots
 * stay `undefined`. Items start in order, so every slot before a failed one is
 * always populated.
 */
export async function mapPool<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<Array<PoolSettled<R> | undefined>> {
  const results: Array<PoolSettled<R> | undefined> = new Array(items.length).fill(undefined);
  let next = 0;
  let failed = false;
  const worker = async (): Promise<void> => {
    while (!failed && next < items.length) {
      const i = next++;
      try {
        results[i] = { ok: true, value: await fn(items[i] as T, i) };
      } catch (error) {
        failed = true;
        results[i] = { ok: false, error };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, worker));
  return results;
}

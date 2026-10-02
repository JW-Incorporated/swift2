export type PoolSettled<R> = { ok: true; value: R } | { ok: false; error: unknown };

/**
 * Starts `fn` over `items` with at most `limit` in flight and returns, at once,
 * one promise per item (index-aligned). Each promise settles to a result and
 * NEVER rejects, so a caller that stops consuming after a decisive failure
 * leaves no unhandled rejection and need not await the rest. After the first
 * failure no NEW item is started; items never started resolve to a failure.
 * Items start in order, so every slot before a failed one was started.
 */
export function mapPool<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Array<Promise<PoolSettled<R>>> {
  const resolvers: Array<(r: PoolSettled<R>) => void> = [];
  const slots = items.map(
    () => new Promise<PoolSettled<R>>((resolve) => void resolvers.push(resolve)),
  );
  let next = 0;
  let failed = false;
  const worker = async (): Promise<void> => {
    while (!failed && next < items.length) {
      const i = next++;
      try {
        resolvers[i]!({ ok: true, value: await fn(items[i] as T, i) });
      } catch (error) {
        failed = true;
        resolvers[i]!({ ok: false, error });
      }
    }
    if (failed) {
      for (; next < items.length; next++) {
        resolvers[next]!({ ok: false, error: new Error('fetch not started: an earlier fetch failed') });
      }
    }
  };
  for (let w = 0; w < Math.max(1, Math.min(limit, items.length)); w++) void worker();
  return slots;
}

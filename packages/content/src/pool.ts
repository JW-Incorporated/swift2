export type PoolSettled<R> = { ok: true; value: R } | { ok: false; error: unknown };

/**
 * Starts `fn` over `items` with at most `limit` in flight and returns, at once,
 * one promise per item (`slots`, index-aligned) plus `stop()`. Each slot settles
 * to a result and NEVER rejects, so a caller that stops consuming after a
 * decisive failure leaves no unhandled rejection and need not await the rest.
 *
 * Contract: no new item launches after a decisive failure of `fn` itself. For a
 * failure the caller detects downstream, at most one further launch can occur
 * (the freed worker relaunches before the caller observes the result) and then
 * `stop()` prevents any more. At most
 * `limit - 1` already-in-flight calls still complete and are discarded (there is
 * no AbortSignal). Items never started resolve to a failure. Items start in
 * order, so every slot before a failed one was started.
 */
export function mapPool<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): { slots: Array<Promise<PoolSettled<R>>>; stop: () => void } {
  const resolvers: Array<(r: PoolSettled<R>) => void> = [];
  const slots = items.map(
    () => new Promise<PoolSettled<R>>((resolve) => void resolvers.push(resolve)),
  );
  let next = 0;
  let failed = false;
  const drain = (): void => {
    for (; next < items.length; next++) {
      resolvers[next]!({ ok: false, error: new Error('fetch not started: an earlier fetch failed') });
    }
  };
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
    if (failed) drain();
  };
  const stop = (): void => {
    failed = true;
    drain();
  };
  for (let w = 0; w < Math.max(1, Math.min(limit, items.length)); w++) void worker();
  return { slots, stop };
}

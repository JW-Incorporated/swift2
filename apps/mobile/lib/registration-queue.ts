// Serializes every device-registration mutation (cold refresh, explicit register, unregister) through one
// queue. `supersede: true` bumps the intent generation synchronously at call time, so a stalled older operation
// sees `isCurrent() === false` when it resumes and must abort before its network upsert. Every op is bounded by
// a timeout: a hung op is treated as failed, marked stale, and the tail advances so a later unregister still runs.
export const OP_TIMEOUT_MS = 15_000;

let generation = 0;
let tail: Promise<unknown> = Promise.resolve();

export function enqueueRegistration<T>(
  op: (isCurrent: () => boolean) => Promise<T>,
  opts: { supersede: boolean; timeoutMs?: number },
): Promise<T> {
  if (opts.supersede) generation += 1;
  const mine = generation;
  const run = tail.then(() => {
    let timedOut = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        timedOut = true;
        reject(new Error('registration operation timed out'));
      }, opts.timeoutMs ?? OP_TIMEOUT_MS);
    });
    return Promise.race([op(() => !timedOut && mine === generation), timeout]).finally(() => clearTimeout(timer));
  });
  tail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

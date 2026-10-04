// Serializes every device-registration mutation (cold refresh, explicit register, unregister) through one
// queue. `supersede: true` bumps the intent generation synchronously at call time, so a stalled older operation
// sees `isCurrent() === false` when it resumes and must abort before its network upsert.
let generation = 0;
let tail: Promise<unknown> = Promise.resolve();

export function enqueueRegistration<T>(
  op: (isCurrent: () => boolean) => Promise<T>,
  opts: { supersede: boolean },
): Promise<T> {
  if (opts.supersede) generation += 1;
  const mine = generation;
  const run = tail.then(() => op(() => mine === generation));
  tail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

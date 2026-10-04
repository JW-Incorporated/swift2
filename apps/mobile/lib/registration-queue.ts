// Serializes every device-registration mutation (cold refresh, explicit register, unregister) through one
// queue that OWNS the network write. Each op has a LOCAL phase (device id, token fetch, flag IO) bounded by a
// timeout, returning the intended write (or null to skip). The queue then re-checks intent, performs the single
// write and awaits it to settlement before the tail advances, so two writes can never overlap and a stale op never
// reaches the network. `supersede: true` bumps the intent generation synchronously at call time.
import type { DevicePlatform } from '@swift2/shared';

export const OP_TIMEOUT_MS = 15_000;

export type RegistrationWrite = { deviceId: string; platform: DevicePlatform; pushToken: string | null };
export type LocalPhase<T> = (isCurrent: () => boolean) => Promise<{ write: RegistrationWrite | null; result: T }>;

let generation = 0;
let tail: Promise<unknown> = Promise.resolve();

export function enqueueRegistration<T>(
  local: LocalPhase<T>,
  send: (write: RegistrationWrite) => Promise<void>,
  opts: { supersede: boolean; timeoutMs?: number },
): Promise<T> {
  if (opts.supersede) generation += 1;
  const mine = generation;
  const run = tail.then(async () => {
    let timedOut = false;
    const isCurrent = () => !timedOut && mine === generation;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        timedOut = true;
        reject(new Error('registration local phase timed out'));
      }, opts.timeoutMs ?? OP_TIMEOUT_MS);
    });
    const { write, result } = await Promise.race([local(isCurrent), timeout]).finally(() => clearTimeout(timer));
    if (write && isCurrent()) await send(write);
    return result;
  });
  tail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

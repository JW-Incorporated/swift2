/**
 * Shared failure handling for the two chat surfaces (Mood, Clownbot): one
 * timeout wrapper and one error-to-copy mapping, so a hung request ends in
 * the existing error line (the composer keeps its text) and a 429 says so.
 * Timeout values come from the bridge's `api-timeout.ts`, the same ones the
 * app's native path already enforces.
 */
export const NETWORK_ERROR = "That didn't go through. Try again in a moment?";
export const RATE_LIMITED_ERROR = 'Too many requests, try again in a moment.';

/** Both hosts surface a non-2xx as `new Error(String(status))`. */
export function chatErrorMessage(err: unknown): string {
  return err instanceof Error && err.message === '429' ? RATE_LIMITED_ERROR : NETWORK_ERROR;
}

/**
 * Runs `run` under `controller`, aborting it after `ms` without progress.
 * `keepAlive` restarts the clock (a streamed answer calls it per event, so a
 * long but live stream is never cut). Rejects on abort even when the host's
 * transport ignores the signal.
 */
export async function withTimeout<T>(
  ms: number,
  run: (signal: AbortSignal, keepAlive: () => void) => Promise<T>,
  controller: AbortController = new AbortController(),
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const arm = () => {
    clearTimeout(timer);
    timer = setTimeout(() => controller.abort(), ms);
  };
  const aborted = new Promise<never>((_, reject) => {
    const fail = () => reject(new Error('aborted'));
    if (controller.signal.aborted) fail();
    else controller.signal.addEventListener('abort', fail, { once: true });
  });
  arm();
  try {
    return await Promise.race([run(controller.signal, arm), aborted]);
  } finally {
    clearTimeout(timer);
  }
}

const USAGE_LOG_TIMEOUT_MS = 2_000;

export async function safelyLog(
  logger: () => void | Promise<void>,
  warn: (message: string) => void,
  failureMessage: string,
): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(
        () => reject(new Error('LLM usage logging timed out')),
        USAGE_LOG_TIMEOUT_MS,
      );
      (timer as ReturnType<typeof setTimeout> & { unref?: () => void }).unref?.();
    });
    await Promise.race([Promise.resolve().then(logger), timeout]);
    return true;
  } catch {
    try { warn(failureMessage); } catch { /* logging cannot fail the call */ }
    return false;
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

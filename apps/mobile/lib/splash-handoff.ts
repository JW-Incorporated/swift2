// Holds the native splash past the first React Native frame so the fan goes splash -> first real screen with no dark
// `launch-pending` gap. JS-only: expo-splash-screen is already in the native build (app.json plugin). The module is
// loaded defensively because an OTA update can reach an older store build without it; absent or failing = the native
// auto-hide behaviour, unchanged. `hide` is idempotent and a hard timer guarantees the splash can never stay up.
import type { MountState } from './watchdog-gate';
import { PENDING_MAX_MS } from './watchdog-policy';

export const SPLASH_SAFETY_MS = PENDING_MAX_MS * 2;
/** Longest hide() waits for a hung preventAutoHideAsync before calling hideAsync anyway. */
export const HIDE_WAIT_MS = 500;
export const HIDE_RETRY_MS = 300;
export const HIDE_ATTEMPTS = 3;

export interface SplashModule {
  preventAutoHideAsync: () => Promise<unknown>;
  hideAsync: () => Promise<unknown>;
}

export interface SplashHandoff {
  hide: () => void;
}

interface Timers {
  setTimeout: (fn: () => void, ms: number) => unknown;
  clearTimeout: (h: unknown) => void;
}

const defaultTimers: Timers = { setTimeout: (fn, ms) => setTimeout(fn, ms), clearTimeout: (h) => clearTimeout(h as never) };

export function createSplashHandoff(
  load: () => SplashModule | null | undefined,
  timers: Timers = defaultTimers,
  safetyMs: number = SPLASH_SAFETY_MS,
): SplashHandoff {
  let mod: SplashModule | null = null;
  let held: Promise<unknown> = Promise.resolve();
  try {
    mod = load() ?? null;
    if (mod) held = Promise.resolve(mod.preventAutoHideAsync()).catch(() => undefined);
  } catch {
    mod = null;
  }
  let done = false;
  let timer: unknown;
  const hide = (): void => {
    if (done) return;
    done = true;
    if (timer !== undefined) timers.clearTimeout(timer);
    const m = mod;
    if (!m) return;
    let begun = false;
    const attempt = (n: number): void => {
      const again = (): void => {
        if (n < HIDE_ATTEMPTS) timers.setTimeout(() => attempt(n + 1), HIDE_RETRY_MS);
      };
      try {
        Promise.resolve(m.hideAsync()).catch(again);
      } catch {
        again();
      }
    };
    const begin = (): void => {
      if (begun) return;
      begun = true;
      timers.clearTimeout(waitTimer);
      attempt(1);
    };
    const waitTimer = timers.setTimeout(begin, HIDE_WAIT_MS);
    void held.then(begin);
  };
  if (mod) timer = timers.setTimeout(hide, safetyMs);
  return { hide };
}

/** First real screen is showing without the DOM host: UpdateRequired, FirstLaunch (awaiting-content) or Recovery (native). The DOM path hides on its ready signal instead. */
export const splashCanHideWithoutDom = (mount: MountState, updateRequired: boolean): boolean => updateRequired || mount === 'awaiting-content' || mount === 'native';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- sync require inside try/catch: the module can be absent from an older store build
const loadNative = (): SplashModule | null => require('expo-splash-screen') as SplashModule;

let shared: SplashHandoff | null = null;

/** Process-wide handoff; first call holds the splash (call at module load), later calls return the same instance. */
export function splashHandoff(): SplashHandoff {
  shared ??= createSplashHandoff(loadNative);
  return shared;
}

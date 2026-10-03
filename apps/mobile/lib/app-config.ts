// Remote kill switch for native screens (docs/mobile-release.md). Startup never
// waits on this: App.tsx starts from DEFAULT_ROUTE_FLAGS and applies the result
// when it arrives. Resolution: network -> last-good cache -> compiled defaults.
import {
  ROUTE_FLAG_KEYS,
  appConfigSchema,
  type AppConfig,
  type StorageAdapter,
} from '@swift2/content';
import { contentBaseUrl, expoFileSystemStorageAdapter } from './vault-storage';
import { DEFAULT_ROUTE_FLAGS, type RouteFlags } from './routes';

export const APP_CONFIG_CACHE_KEY = 'swift2:app-config:last-good:v1';
const FETCH_TIMEOUT_MS = 3000;

export interface AppConfigDeps {
  fetchImpl?: typeof fetch;
  storage?: StorageAdapter;
  baseUrl?: string;
  timeoutMs?: number;
}

/** Defaults overlaid with only the known flag keys that carry a boolean; everything else is ignored. */
export function routeFlagsFrom(config: unknown): RouteFlags {
  const flags: RouteFlags = { ...DEFAULT_ROUTE_FLAGS };
  const incoming =
    config && typeof config === 'object'
      ? (config as { routeFlags?: unknown }).routeFlags
      : undefined;
  if (!incoming || typeof incoming !== 'object') return flags;
  for (const key of ROUTE_FLAG_KEYS) {
    const value = (incoming as Record<string, unknown>)[key];
    if (typeof value === 'boolean') flags[key] = value;
  }
  return flags;
}

async function readLastGood(storage: StorageAdapter): Promise<AppConfig | null> {
  try {
    const raw = await storage.getItem(APP_CONFIG_CACHE_KEY);
    if (!raw) return null;
    const parsed = appConfigSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export interface LaunchFlags {
  /** Last-good cached remote `sharedUi`; null when nothing was cached. */
  sharedUi: boolean | null;
  /** Last-good cached `watchdogReports`; null = not set (reports on). */
  watchdogReports: boolean | null;
}

/**
 * WP2.14: the flags a launch is decided on. One local read of the last-good
 * cache, never the network, so the DOM-or-native choice is made once at launch
 * and a fresh fetch applies on the NEXT launch. Never throws.
 */
export async function loadLaunchFlags(deps: { storage?: StorageAdapter } = {}): Promise<LaunchFlags> {
  try {
    const storage = deps.storage ?? expoFileSystemStorageAdapter();
    const cached = await readLastGood(storage);
    const sharedUi = cached?.routeFlags.sharedUi;
    return {
      sharedUi: typeof sharedUi === 'boolean' ? sharedUi : null,
      watchdogReports: typeof cached?.watchdogReports === 'boolean' ? cached.watchdogReports : null,
    };
  } catch {
    return { sharedUi: null, watchdogReports: null };
  }
}

async function fetchConfig(deps: AppConfigDeps): Promise<AppConfig> {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const baseUrl = deps.baseUrl ?? contentBaseUrl();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), deps.timeoutMs ?? FETCH_TIMEOUT_MS);
  try {
    const res = await fetchImpl(`${baseUrl}/app-config.json`, { signal: controller.signal });
    if (!res.ok) throw new Error(`app-config HTTP ${res.status}`);
    return appConfigSchema.parse(await res.json());
  } finally {
    clearTimeout(timer);
  }
}

/** Never throws: returns the freshest valid config, else last-good, else `{ routeFlags: {} }` (= compiled defaults). */
export async function loadAppConfig(deps: AppConfigDeps = {}): Promise<AppConfig> {
  let storage: StorageAdapter | null = null;
  try {
    storage = deps.storage ?? expoFileSystemStorageAdapter();
  } catch {
    storage = null;
  }
  try {
    const config = await fetchConfig(deps);
    try {
      await storage?.setItem(APP_CONFIG_CACHE_KEY, JSON.stringify(config));
    } catch {
      // A failed cache write must not discard a config we just validated.
    }
    return config;
  } catch {
    const lastGood = storage ? await readLastGood(storage) : null;
    return lastGood ?? { routeFlags: {} };
  }
}

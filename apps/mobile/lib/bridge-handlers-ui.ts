// UI-capability bridge handlers (One UI WP2.3-D1). Pure and transport-neutral: no
// React/RN/Expo imports; every native capability is injected. Wired into
// SharedUiHost (H1) through lib/ui-deps.ts and createWiredHandlers.
import {
  isExternalUrl,
  isWebPath,
  resErr,
  resOk,
  type HandlerMap,
  type HapticKind,
  type Insets,
  type ResResult,
  type SharePayload,
  type WebPath,
} from '@swift2/ui';
import { isAppOpenableUrl } from './mailto-allowlist';
import { MAX_KEY_LENGTH, type HostStorage } from './host-storage';

export type UiHandlerDeps = {
  /** Performs the in-app navigation for an already validated web path. */
  navigate: (path: WebPath, replace: boolean) => void | Promise<void>;
  /** Required route allow-list; a path it rejects answers `invalid`. No default. */
  isNativeRoute: (path: WebPath) => boolean;
  /** Native-side only; failure details never reach the WebView reply. */
  log: (stage: string, detail: string) => void;
  /** `Linking.openURL` in the host. */
  openURL: (url: string) => Promise<void>;
  /** RN `Share.share` in the host; resolves once the sheet has closed. */
  share: (payload: SharePayload & { image?: { url: string } }) => Promise<void | { imageCopied: boolean }>;
  /** Host of the one origin a share card may be downloaded from (the site); absent = images rejected. */
  imageHost?: string;
  /** Absent when the haptics module is unavailable: no-op success. */
  haptic?: (kind: HapticKind) => void | Promise<void>;
  /** The persistent reader `local` blob; absent -> `failed` (the DOM then runs on an empty, non-persistent seed). */
  hostStorage?: HostStorage;
};

export type UiHandlers = Pick<HandlerMap, 'navigate' | 'share' | 'haptic' | 'openExternal' | 'storage.load' | 'storage.write'>;

const HAPTIC_KINDS: readonly string[] = ['selection', 'light', 'medium', 'heavy', 'success', 'warning', 'error'];
const SHARE_KEYS = ['title', 'text', 'url'] as const;
const MAX_SHARE_FIELD = 2048;

const invalid = (message: string): ResResult<never> => resErr('invalid', message);
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function isCardUrl(u: string, host: string | undefined): boolean {
  if (!host) return false;
  try {
    const url = new URL(u);
    return url.protocol === 'https:' && url.host === host && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function createHandlers(deps: UiHandlerDeps): UiHandlers {
  async function run(fn: () => void | Promise<void>, what: string): Promise<ResResult<null>> {
    try {
      await fn();
      return resOk(null);
    } catch (e) {
      try {
        deps.log(`bridge-${what}-failed`, String(e).slice(0, 200));
      } catch {
        // logging must never change the reply
      }
      return resErr('failed', `${what} failed`);
    }
  }

  return {
    navigate: async (payload) => {
      const p: unknown = payload;
      if (!isRecord(p) || !isWebPath(p.path)) return invalid('navigate: not a web path');
      if (p.replace !== undefined && typeof p.replace !== 'boolean') return invalid('navigate: replace');
      const path = p.path;
      let owned: boolean;
      try {
        owned = deps.isNativeRoute(path) === true;
      } catch {
        owned = false;
      }
      if (!owned) return invalid('navigate: unknown route');
      return run(() => deps.navigate(path, p.replace === true), 'navigate');
    },
    openExternal: async (payload) => {
      const p: unknown = payload;
      if (!isRecord(p) || !isAppOpenableUrl(p.url)) return invalid('openExternal: https or allow-listed mailto urls only');
      const url = p.url;
      return run(() => deps.openURL(url), 'openExternal');
    },
    share: async (payload) => {
      const p: unknown = payload;
      if (!isRecord(p)) return invalid('share: payload');
      const out: SharePayload = {};
      for (const k of SHARE_KEYS) {
        const v = p[k];
        if (v === undefined) continue;
        if (typeof v !== 'string' || v.length > MAX_SHARE_FIELD) return invalid(`share: ${k}`);
        out[k] = v;
      }
      if (out.url !== undefined && !isExternalUrl(out.url)) return invalid('share: url scheme');
      if (out.title === undefined && out.text === undefined && out.url === undefined) return invalid('share: empty');
      let image: { url: string } | undefined;
      if (p.image !== undefined) {
        const u = isRecord(p.image) ? p.image.url : undefined;
        if (typeof u !== 'string' || u.length > MAX_SHARE_FIELD || !isCardUrl(u, deps.imageHost)) return invalid('share: image');
        image = { url: u };
      }
      let outcome: { imageCopied: boolean } | null = null;
      const res = await run(async () => {
        const v = await deps.share(image ? { ...out, image } : out);
        if (v) outcome = { imageCopied: v.imageCopied === true };
      }, 'share');
      return res.ok ? resOk(outcome) : res;
    },
    haptic: async (payload) => {
      const p: unknown = payload;
      if (!isRecord(p) || typeof p.kind !== 'string' || !HAPTIC_KINDS.includes(p.kind)) return invalid('haptic: kind');
      const kind = p.kind as HapticKind;
      const fn = deps.haptic;
      if (!fn) return resOk(null);
      return run(() => fn(kind), 'haptic');
    },
    'storage.load': async () => {
      const s = deps.hostStorage;
      if (!s) return resErr('failed', 'storage.load unavailable');
      try {
        return resOk({ entries: s.load() });
      } catch (e) {
        deps.log('bridge-storage.load-failed', String(e).slice(0, 200));
        return resErr('failed', 'storage.load failed');
      }
    },
    'storage.write': async (payload) => {
      const p: unknown = payload;
      if (!isRecord(p)) return invalid('storage.write: payload');
      const { entries } = p;
      if (Object.keys(p).length !== 1 || !isRecord(entries) || !Object.values(entries).every((v) => typeof v === 'string')) return invalid('storage.write: entries');
      if (Object.keys(entries).some((k) => k.length > MAX_KEY_LENGTH)) return invalid('storage.write: key too long');
      const s = deps.hostStorage;
      if (!s) return resErr('failed', 'storage.write unavailable');
      try {
        if (!s.write(entries as Record<string, string>)) {
          deps.log('bridge-storage.write-rejected', 'blob over the size cap');
          return invalid('storage.write: too large');
        }
        return resOk(null);
      } catch (e) {
        deps.log('bridge-storage.write-failed', String(e).slice(0, 200));
        return resErr('failed', 'storage.write failed');
      }
    },
  };
}

export const DEFAULT_BACK_TIMEOUT_MS = 1000;

export type BackHost = {
  isReady: () => boolean;
  request: (type: 'back', payload: Record<string, never>, opts?: { timeoutMs?: number }) => Promise<ResResult<'handled' | 'exit'>>;
};

/**
 * Hardware-back listener body. Returns true when the press is consumed.
 * Before ready: false (native default). After ready: consumed; anything but
 * `handled` (exit, timeout, error) calls `exitApp`.
 */
export function createBackHandler(host: BackHost, exitApp: () => void, timeoutMs = DEFAULT_BACK_TIMEOUT_MS) {
  return function onHardwareBack(): boolean {
    if (!host.isReady()) return false;
    host
      .request('back', {}, { timeoutMs })
      .then((r) => {
        if (!(r.ok && r.value === 'handled')) exitApp();
      })
      .catch(() => exitApp());
    return true;
  };
}

const sameInsets = (a: Insets, b: Insets) =>
  a.top === b.top && a.right === b.right && a.bottom === b.bottom && a.left === b.left;

/** Emits `insets` only when the (finite, non-negative) values changed. */
export function createInsetsEmitter(emit: (insets: Insets) => void) {
  let last: Insets | null = null;
  return function update(next: Insets): void {
    const ok = [next.top, next.right, next.bottom, next.left].every((n) => Number.isFinite(n) && n >= 0);
    if (!ok) return;
    if (last && sameInsets(last, next)) return;
    last = { top: next.top, right: next.right, bottom: next.bottom, left: next.left };
    emit(last);
  };
}

/** Emits `contentVersion` only when the token changed. */
export function createContentVersionEmitter(emit: (e: { token: string }) => void) {
  let last: string | null = null;
  return function update(token: string): void {
    if (token === last) return;
    last = token;
    emit({ token });
  };
}

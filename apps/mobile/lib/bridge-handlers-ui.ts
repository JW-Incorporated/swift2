// UI-capability bridge handlers (One UI WP2.3-D1). Pure and transport-neutral: no
// React/RN/Expo imports; every native capability is injected. Not wired into
// the host component yet (D2, after G0).
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
  share: (payload: SharePayload) => Promise<void>;
  /** Absent when the haptics module is unavailable: no-op success. */
  haptic?: (kind: HapticKind) => void | Promise<void>;
};

export type UiHandlers = Pick<HandlerMap, 'navigate' | 'share' | 'haptic' | 'openExternal'>;

const HAPTIC_KINDS: readonly string[] = ['selection', 'light', 'medium', 'heavy', 'success', 'warning', 'error'];
const SHARE_KEYS = ['title', 'text', 'url'] as const;
const MAX_SHARE_FIELD = 2048;

const invalid = (message: string): ResResult<never> => resErr('invalid', message);
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

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
      if (!isRecord(p) || !isExternalUrl(p.url)) return invalid('openExternal: https urls only');
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
      return run(() => deps.share(out), 'share');
    },
    haptic: async (payload) => {
      const p: unknown = payload;
      if (!isRecord(p) || typeof p.kind !== 'string' || !HAPTIC_KINDS.includes(p.kind)) return invalid('haptic: kind');
      const kind = p.kind as HapticKind;
      const fn = deps.haptic;
      if (!fn) return resOk(null);
      return run(() => fn(kind), 'haptic');
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

import { isAnyNotificationCategory, isValidCadenceForCategory } from '@swift2/shared';
import { isBridgeId, isWebPath, sanitizeApiRequest } from '@swift2/ui';
import type { DomCommandType, JsonValue, NativeCommandType, ThemeChange } from '@swift2/ui';
import { isAppOpenableUrl } from './mailto-allowlist';

const HAPTIC_KINDS = ['selection', 'light', 'medium', 'heavy', 'success', 'warning', 'error'];
const MAX_SHARE_FIELD = 2048;
/** The `theme` event payload: light|dark enum + #rrggbb only; anything else is null (dropped). */
export function validTheme(p: unknown): ThemeChange | null {
  if (!isRecord(p) || (p.statusBarStyle !== 'light' && p.statusBarStyle !== 'dark')) return null;
  return typeof p.background === 'string' && /^#[0-9a-fA-F]{6}$/.test(p.background)
    ? { statusBarStyle: p.statusBarStyle, background: p.background }
    : null;
}

export const MAX_PREFS = 64;
export const MAX_PREF_KEY = 64;

export const isRecord = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);

function validShare(p: Record<string, unknown>): JsonValue | null {
  const out: Record<string, JsonValue> = {};
  for (const k of ['title', 'text', 'url']) {
    const v = p[k];
    if (v === undefined) continue;
    if (typeof v !== 'string' || v.length > MAX_SHARE_FIELD) return null;
    out[k] = v;
  }
  return out;
}

export function validPrefs(prefs: unknown): JsonValue | null {
  if (!isRecord(prefs)) return null;
  const keys = Object.keys(prefs);
  if (keys.length > MAX_PREFS) return null;
  const out: Record<string, JsonValue> = {};
  for (const k of keys) {
    if (k === '__proto__' || k.length === 0 || k.length > MAX_PREF_KEY || typeof prefs[k] !== 'boolean') return null;
    out[k] = prefs[k] as boolean;
  }
  return { prefs: out };
}

/** Strict variant: validPrefs plus keys restricted to the canonical notification categories (shared isAnyNotificationCategory). */
export function validKnownPrefs(prefs: unknown): JsonValue | null {
  const v = validPrefs(prefs);
  if (!v) return null;
  const out = (v as { prefs: Record<string, JsonValue> }).prefs;
  return Object.keys(out).every((k) => isAnyNotificationCategory(k)) ? v : null;
}

const SETTINGS_NUMERIC = ['dailyCap', 'quietStart', 'quietEnd', 'digestHour'] as const;

/** Bounded validator for notifications.savePrefs: the prefs-API PUT body, known keys only, nothing else passes. */
export function validPrefsUpdate(p: Record<string, unknown>): JsonValue | null {
  if (Object.keys(p).some((k) => k !== 'settings' && k !== 'prefs')) return null;
  const out: Record<string, JsonValue> = {};
  if (p.settings !== undefined) {
    const s = p.settings;
    if (!isRecord(s)) return null;
    const settings: Record<string, JsonValue> = {};
    for (const k of Object.keys(s)) {
      const v = s[k];
      if (k === 'masterEnabled' && typeof v === 'boolean') settings[k] = v;
      else if (k === 'snoozeUntil' && (v === null || (typeof v === 'string' && v.length <= 64))) settings[k] = v;
      else if ((SETTINGS_NUMERIC as readonly string[]).includes(k) && typeof v === 'number' && Number.isFinite(v)) settings[k] = v;
      else return null;
    }
    out.settings = settings;
  }
  if (p.prefs !== undefined) {
    if (!Array.isArray(p.prefs) || p.prefs.length > MAX_PREFS) return null;
    const prefs: JsonValue[] = [];
    for (const e of p.prefs) {
      if (!isRecord(e) || Object.keys(e).length !== 2) return null;
      const { category, cadence } = e;
      if (typeof category !== 'string' || !isAnyNotificationCategory(category)) return null;
      if (typeof cadence !== 'string' || !isValidCadenceForCategory(category, cadence)) return null;
      prefs.push({ category, cadence });
    }
    out.prefs = prefs;
  }
  return out;
}

/** Per-command payload validation; returns the cleaned payload or null. */
export function validateCommand(type: DomCommandType, p: JsonValue): JsonValue | null {
  if (!isRecord(p)) return null;
  switch (type) {
    case 'navigate':
      if (!isWebPath(p.path) || (p.replace !== undefined && typeof p.replace !== 'boolean')) return null;
      return p.replace === undefined ? { path: p.path } : { path: p.path, replace: p.replace };
    case 'openExternal':
      return isAppOpenableUrl(p.url) ? { url: p.url } : null;
    case 'api': {
      const req = sanitizeApiRequest(p.req);
      return req ? { req: req as unknown as JsonValue } : null;
    }
    case 'cancel':
      return isBridgeId(p.targetId) ? { targetId: p.targetId } : null;
    case 'share':
      return validShare(p);
    case 'haptic':
      return typeof p.kind === 'string' && HAPTIC_KINDS.includes(p.kind) ? { kind: p.kind } : null;
    case 'notifications.updatePrefs':
      return validPrefs(p.prefs);
    case 'notifications.savePrefs':
      return validPrefsUpdate(p);
    default:
      return {};
  }
}

const NATIVE_RESULT: Record<NativeCommandType, (v: unknown) => boolean> = {
  back: (v) => v === 'handled' || v === 'exit',
};

/** True when `value` has the expected result shape for a native-to-DOM command. */
export const isExpectedResult = (type: NativeCommandType, value: unknown): boolean => NATIVE_RESULT[type](value);

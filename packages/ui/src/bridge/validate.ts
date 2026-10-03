/**
 * Pure runtime validators for the bridge (One UI WP2.3-A). Transport-neutral,
 * dependency-free, never throw on hostile input.
 */
import type { ApiRequest } from '@swift2/content';
import type { JsonValue } from './envelope';

declare const webPathBrand: unique symbol;
declare const externalUrlBrand: unique symbol;
/** A web path (X4): `/era/<id>?...`. Produced only by `isWebPath`/`toWebPath`. */
export type WebPath = `/${string}` & { readonly [webPathBrand]: true };
/** An `https:` URL. Produced only by `isExternalUrl`/`toExternalUrl`. */
export type ExternalUrl = `https://${string}` & { readonly [externalUrlBrand]: true };

export const MAX_PAYLOAD_DEPTH = 32;
/** Serialized payload cap in UTF-16 code units. Content never crosses the bridge. */
export const MAX_PAYLOAD_SIZE = 256 * 1024;

// eslint-disable-next-line no-control-regex -- rejecting control chars is the point
const CONTROL = /[\u0000-\u001f\u007f]/;
const BAD_ENCODED = /%(?:2f|5c|2e|00|0[0-9a-f]|1[0-9a-f]|7f)/i;

/**
 * Exactly one leading `/`; no `//`, backslash, control chars, `..` segments or
 * encoded slash/backslash/dot/control variants (`%2F`, `%5C`, `%2E`, ...).
 */
export function isWebPath(s: unknown): s is WebPath {
  if (typeof s !== 'string' || s.length > 2048 || !s.startsWith('/') || s.startsWith('//')) return false;
  if (s.includes('\\') || CONTROL.test(s) || BAD_ENCODED.test(s)) return false;
  return !s.split(/[?#]/, 1)[0]!.split('/').some((seg) => seg === '..' || seg === '.');
}
export const toWebPath = (s: unknown): WebPath | null => (isWebPath(s) ? s : null);

/**
 * `https:` only. `mailto:` is deliberately excluded: the only reader mailto
 * (the share-fallback toast) is a web-only fallback that native never routes
 * through `openExternal`; the support page's mailto links are outside the
 * reader. `http:`, `javascript:`, `intent:`, `file:`, `data:` are rejected.
 */
export function isExternalUrl(s: unknown): s is ExternalUrl {
  if (typeof s !== 'string' || s.length > 2048 || CONTROL.test(s) || s.includes('\\')) return false;
  if (!/^https:\/\/[^/?#\s@]+/i.test(s)) return false;
  try {
    const u = new URL(s);
    return u.protocol === 'https:' && u.hostname !== '' && u.username === '' && u.password === '';
  } catch {
    return false;
  }
}
export const toExternalUrl = (s: unknown): ExternalUrl | null => (isExternalUrl(s) ? s : null);

/** Ids: non-empty, at most 64 chars, `[A-Za-z0-9_-]`. */
export const isBridgeId = (s: unknown): s is string => typeof s === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(s);

export type JsonFailure = 'bad-json' | 'too-deep' | 'too-large';

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function walk(x: unknown, depth: number): JsonFailure | null {
  if (x === null || typeof x === 'string' || typeof x === 'boolean') return null;
  if (typeof x === 'number') return Number.isFinite(x) ? null : 'bad-json';
  if (typeof x !== 'object') return 'bad-json';
  if (depth > MAX_PAYLOAD_DEPTH) return 'too-deep';
  if (Array.isArray(x)) {
    if (Object.getPrototypeOf(x) !== Array.prototype) return 'bad-json';
    if (Reflect.ownKeys(x).length !== x.length + 1) return 'bad-json'; // holes or extra props
    for (let i = 0; i < x.length; i++) {
      const d = Object.getOwnPropertyDescriptor(x, i);
      if (!d || !('value' in d)) return 'bad-json';
      const r = walk(d.value, depth + 1);
      if (r) return r;
    }
    return null;
  }
  const proto = Object.getPrototypeOf(x);
  if (proto !== Object.prototype && proto !== null) return 'bad-json';
  for (const key of Reflect.ownKeys(x)) {
    if (typeof key !== 'string' || FORBIDDEN_KEYS.has(key)) return 'bad-json';
    const d = Object.getOwnPropertyDescriptor(x, key);
    if (!d || !('value' in d) || !d.enumerable) return 'bad-json';
    const r = walk(d.value, depth + 1);
    if (r) return r;
  }
  return null;
}

/** Strict JSON check: null/boolean/finite number/string/array/plain object only. Never throws. */
export function checkStrictJson(x: unknown): { ok: true; value: JsonValue } | { ok: false; reason: JsonFailure } {
  try {
    const bad = walk(x, 0);
    if (bad) return { ok: false, reason: bad };
    if (JSON.stringify(x).length > MAX_PAYLOAD_SIZE) return { ok: false, reason: 'too-large' };
    return { ok: true, value: x as JsonValue };
  } catch {
    return { ok: false, reason: 'bad-json' };
  }
}

/**
 * The `api` command's request: only CORS-safelisted request headers cross
 * (no Authorization, Cookie or arbitrary headers). `api-fetch.ts` defines no
 * safelist of its own, so this is the bridge's; `Content-Type` additionally
 * allows `application/json` because reader POSTs (e.g. `/api/mood`) send JSON
 * and native fetch is not CORS-bound.
 */
export type BridgeApiHeaderName = 'accept' | 'accept-language' | 'content-language' | 'content-type';
export type BridgeApiRequest = {
  method: ApiRequest['method'];
  path: `/api/${string}`;
  headers?: Partial<Record<BridgeApiHeaderName, string>>;
  body?: string;
};

export const MAX_API_BODY = 64 * 1024;
const API_HEADERS: readonly BridgeApiHeaderName[] = ['accept', 'accept-language', 'content-language', 'content-type'];
const CONTENT_TYPES = /^(application\/json|text\/plain|application\/x-www-form-urlencoded|multipart\/form-data)\s*(;.*)?$/i;
const METHODS: readonly string[] = ['GET', 'POST', 'PUT', 'DELETE'];

/** Returns a clean copy, or null when the request is not allowed to cross. Never throws. */
export function sanitizeApiRequest(raw: unknown): BridgeApiRequest | null {
  try {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
    const r = raw as Record<string, unknown>;
    if (typeof r.method !== 'string' || !METHODS.includes(r.method)) return null;
    if (typeof r.path !== 'string' || !r.path.startsWith('/api/') || !isWebPath(r.path)) return null;
    const out: BridgeApiRequest = { method: r.method as ApiRequest['method'], path: r.path as `/api/${string}` };
    if (r.body !== undefined) {
      if (typeof r.body !== 'string' || r.body.length > MAX_API_BODY) return null;
      out.body = r.body;
    }
    if (r.headers !== undefined) {
      const h = r.headers;
      if (typeof h !== 'object' || h === null || Array.isArray(h)) return null;
      const clean: Partial<Record<BridgeApiHeaderName, string>> = {};
      for (const [name, value] of Object.entries(h)) {
        const lower = name.toLowerCase();
        if (!(API_HEADERS as readonly string[]).includes(lower)) return null;
        if (typeof value !== 'string' || value.length > 256 || CONTROL.test(value)) return null;
        if (lower === 'content-type' && !CONTENT_TYPES.test(value)) return null;
        clean[lower as BridgeApiHeaderName] = value;
      }
      out.headers = clean;
    }
    return out;
  } catch {
    return null;
  }
}

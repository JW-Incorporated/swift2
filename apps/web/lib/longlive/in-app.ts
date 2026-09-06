// Detects whether the site is running inside the Long Live native app shell.
//
// apps/mobile/components/SiteShell.tsx sets `applicationNameForUserAgent` to
// `LongLiveApp/<version> (ios|android)`, which the WebView appends to the
// standard user-agent string. This module gives the server (and RSC layout)
// a single, shared way to detect that marker and expose the native platform
// it's running on — so pages can hide "get the app" CTAs and, later, adapt
// chrome (OS-002) once inside the app. See docs/specs/2026-09-05-one-source-
// three-surfaces.md, card OS-001.
export type InAppPlatform = 'ios' | 'android';

const UA_MARKER_RE = /LongLiveApp\/[^\s]+\s*\(([^)]+)\)/i;

/** Parses the app's UA marker out of a raw user-agent string, if present. */
export function inAppPlatformFromUserAgent(userAgent: string | null | undefined): InAppPlatform | null {
  if (!userAgent) return null;
  const match = UA_MARKER_RE.exec(userAgent);
  if (!match) return null;
  const platform = match[1]?.trim().toLowerCase();
  if (platform === 'ios' || platform === 'android') return platform;
  return null;
}

/** True when the given user-agent carries the native app's marker. */
export function isInApp(userAgent: string | null | undefined): boolean {
  return inAppPlatformFromUserAgent(userAgent) !== null;
}

/**
 * Client-side counterpart to `isInApp`, for components that can't read the
 * request's user-agent (e.g. a `'use client'` component rendering before its
 * own effect runs). Reads the `data-app` attribute RootLayout already set on
 * `<html>` from the server-side UA check, so there is exactly one place
 * (this module) that decides what counts as "in app" — the client never
 * re-parses `navigator.userAgent` itself. Returns `false` during SSR and on
 * the very first client render, matching every other hydration-safe read in
 * this codebase (see ProgressProvider in `store/index.tsx`): callers should
 * read it inside a `useEffect`, not during render, to avoid a hydration
 * mismatch.
 */
export function isInAppDocument(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.dataset.app != null;
}

// ---------------------------------------------------------------------------
// Web → native bridge (OS-002)
//
// One-way messages the in-page UI sends into the native shell via
// `window.ReactNativeWebView.postMessage`. `apps/mobile/components/
// SiteShell.tsx` listens for these on its WebView's `onMessage` and routes
// them to a native screen (see `apps/mobile/App.tsx`'s `go`/`destinationFor`).
// Documented in `docs/architecture.md`.
export type NativeBridgeMessage =
  | { type: 'openNotificationSettings' }
  | { type: 'openInbox' };

interface ReactNativeWebViewBridge {
  postMessage(message: string): void;
}

declare global {
  interface Window {
    ReactNativeWebView?: ReactNativeWebViewBridge;
  }
}

/**
 * Sends a message to the native shell, if one is listening. Returns `false`
 * (and does nothing) outside the app — a plain browser tab has no
 * `window.ReactNativeWebView`, so callers can invoke this unconditionally
 * and fall back to normal web navigation when it returns `false`.
 */
export function postToNativeApp(message: NativeBridgeMessage): boolean {
  if (typeof window === 'undefined' || !window.ReactNativeWebView) return false;
  window.ReactNativeWebView.postMessage(JSON.stringify(message));
  return true;
}

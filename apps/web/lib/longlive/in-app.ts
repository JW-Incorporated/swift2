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

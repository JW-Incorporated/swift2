// One UI WP2.14: strict handling of `[watchdog]` fallback/quarantine reports.
// Category-only: platform, buildKey and one fixed category, nothing else (no
// device model, OS, update id field or timings). Like `[diag]`, the GitHub
// comment is rebuilt from validated values via a fixed template, never from
// client text. The user-initiated `[diag]` path (./diag.ts) is separate.

export const WATCHDOG_PREFIX = '[watchdog]';
export const WATCHDOG_CATEGORIES = [
  'ready-timeout',
  'dom-error',
  'webview-terminated',
  'webview-render-gone',
  'abandoned',
  'protocol',
] as const;

export interface WatchdogReport {
  platform: 'ios' | 'android';
  buildKey: string;
  category: (typeof WATCHDOG_CATEGORIES)[number];
}

const KEYS = ['platform', 'buildKey', 'category'];
const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const BUILD_KEY_RE = new RegExp(`^[A-Za-z0-9._?-]{1,20}:(embedded|${UUID})$`, 'i');

export const isWatchdogMessage = (message: string): boolean => message.startsWith(WATCHDOG_PREFIX);

export function parseWatchdogReport(raw: unknown): { ok: true; report: WatchdogReport } | { ok: false } {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { ok: false };
  const o = raw as Record<string, unknown>;
  if (Object.keys(o).length !== KEYS.length || Object.keys(o).some((k) => !KEYS.includes(k))) return { ok: false };
  const { platform, buildKey, category } = o;
  if (platform !== 'ios' && platform !== 'android') return { ok: false };
  if (typeof buildKey !== 'string' || !BUILD_KEY_RE.test(buildKey)) return { ok: false };
  if (!(WATCHDOG_CATEGORIES as readonly unknown[]).includes(category)) return { ok: false };
  return { ok: true, report: { platform, buildKey, category: category as WatchdogReport['category'] } };
}

export function watchdogCommentFrom(r: WatchdogReport): string {
  return [
    '**[watchdog] DOM host fallback report**',
    '',
    '| Field | Value |',
    '|---|---|',
    `| Platform | ${r.platform} |`,
    `| Build key | \`${r.buildKey}\` |`,
    `| Category | ${r.category} |`,
    '',
    '<!-- watchdog:v1 -->',
  ].join('\n');
}

export const WATCHDOG_WINDOW_MS = 10 * 60_000;
export const WATCHDOG_MAX_PER_WINDOW = 5;
const MAX_TRACKED_KEYS = 500;
const seen = new Map<string, number[]>();

/**
 * Per-buildKey flood guard (in-memory, per server instance, best effort): at
 * most WATCHDOG_MAX_PER_WINDOW accepted per buildKey per window. Returns false when over.
 */
export function watchdogAllowed(buildKey: string, now: number = Date.now()): boolean {
  const recent = (seen.get(buildKey) ?? []).filter((t) => now - t < WATCHDOG_WINDOW_MS);
  if (recent.length >= WATCHDOG_MAX_PER_WINDOW) {
    seen.set(buildKey, recent);
    return false;
  }
  if (!seen.has(buildKey) && seen.size >= MAX_TRACKED_KEYS) seen.delete(seen.keys().next().value as string);
  seen.set(buildKey, [...recent, now]);
  return true;
}

export const resetWatchdogAllowed = (): void => seen.clear();

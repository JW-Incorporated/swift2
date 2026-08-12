import { NextResponse } from 'next/server';

// Sink for CSP violation reports (`report-uri` / `report-to` in
// lib/security-headers.mjs). It exists so the Report-Only policy is
// actionable: without somewhere to send violations, "ship report-only first"
// just means "hope somebody has devtools open on the right page".
//
// PRIVACY: this is a public, unauthenticated endpoint that browsers POST to
// automatically, so it is written to capture as little as possible. We log the
// violated directive and the ORIGIN of the blocked resource — never the full
// blocked URL, never the referrer, never the sample of inline script/style
// that Chrome offers in `script-sample`. Origin is all we need to decide
// whether to allowlist a host; the rest is visitor browsing detail we have no
// reason to keep. Same reasoning as the feedback route: diagnosable without
// capturing content.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Both report shapes browsers send. */
type CspReportBody = {
  // report-uri (application/csp-report)
  'csp-report'?: Record<string, unknown>;
  // report-to (application/reports+json) — an array of report envelopes
  [k: string]: unknown;
};

/**
 * Reduce a blocked-uri to something safe to log: a bare origin, or one of
 * CSP's keyword values (`inline`, `eval`, `data`, ...) which carry no URL.
 * Anything unrecognised collapses to 'other' rather than being echoed.
 */
export function safeBlockedOrigin(raw: unknown): string {
  if (typeof raw !== 'string' || !raw) return 'unknown';
  const keyword = raw.toLowerCase();
  if (['inline', 'eval', 'self', 'data', 'blob', 'filesystem', 'wasm-eval'].includes(keyword)) {
    return keyword;
  }
  try {
    return new URL(raw).origin;
  } catch {
    // Some browsers send a bare scheme ("data", "about") or a relative path.
    return /^[a-z][a-z0-9+.-]*:$/i.test(raw) ? raw.toLowerCase() : 'other';
  }
}

/** Pull (directive, blocked origin) out of either report shape. */
export function summarize(body: CspReportBody): { directive: string; blocked: string }[] {
  const reports: Record<string, unknown>[] = [];

  if (body['csp-report'] && typeof body['csp-report'] === 'object') {
    reports.push(body['csp-report'] as Record<string, unknown>);
  }
  if (Array.isArray(body)) {
    for (const entry of body as Record<string, unknown>[]) {
      const b = entry?.body;
      if (b && typeof b === 'object') reports.push(b as Record<string, unknown>);
    }
  }

  return reports.slice(0, 20).map((r) => ({
    directive:
      typeof r['effective-directive'] === 'string'
        ? r['effective-directive']
        : typeof r.effectiveDirective === 'string'
          ? r.effectiveDirective
          : typeof r['violated-directive'] === 'string'
            ? r['violated-directive']
            : 'unknown',
    blocked: safeBlockedOrigin(r['blocked-uri'] ?? r.blockedURL),
  }));
}

// Browsers can fire a report per blocked resource; a bad policy on a
// 500-image page would otherwise flood the log. Per-instance, best-effort.
const HITS = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (HITS.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  HITS.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

export async function POST(req: Request): Promise<Response> {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  // Always 204 — a violation report is fire-and-forget and the browser does
  // nothing useful with an error.
  if (rateLimited(ip)) return new NextResponse(null, { status: 204 });

  try {
    const body = (await req.json()) as CspReportBody;
    for (const { directive, blocked } of summarize(body)) {
      console.warn(`csp-violation directive=${directive} blocked=${blocked}`);
    }
  } catch {
    // Malformed/absent body: nothing to learn, nothing to say.
  }

  return new NextResponse(null, { status: 204 });
}

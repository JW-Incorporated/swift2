import { NextResponse } from 'next/server';
import {
  validateUrl,
  domainFromUrl,
  platformGuessFromDomain,
  hashClientId,
  submitLink,
  verifyTurnstile,
  SECTIONS,
  type Section,
  type SubmissionRecord,
} from '../../../lib/longlive/submit-link';
import { trustedClientIp } from '../../../lib/longlive/client-ip';

// The Community/Merch "submit a link" form. A visitor pastes a URL and picks
// a section (community/merch) — that's the whole input. Nothing submitted
// here ever renders on the site (issue #36's no-go on UGC hosting); it only
// ever reaches Joey via up to three independently-optional sinks (GitHub
// issue always, a Google Sheet + an email when configured). See
// docs/ops/community-merch-submissions.md and lib/longlive/submit-link.ts.
//
// Shape copied from /api/feedback: per-IP burst limit + a honeypot that
// returns 200 as if it worked, so bots learn nothing. IP resolution uses the
// shared trustedClientIp (#1973 fix, propagated repo-wide 2026-09-02 per
// security audit follow-up t_07025f1e) — Vercel-set x-real-ip, or the
// edge-appended rightmost x-forwarded-for hop, never the client-spoofable
// leftmost XFF value. A Cloudflare Turnstile check runs after those, before
// any sink — inert (skipped) until TURNSTILE_SECRET_KEY is set, then
// mandatory. See verifyTurnstile's doc comment in lib/longlive/submit-link.ts
// for the fail-open/fail-closed split.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Best-effort per-instance rate limit only — this keys off the shared
// trustedClientIp (#1973 fix; Vercel-set x-real-ip, falling back to the
// edge-appended rightmost x-forwarded-for hop, never the client-spoofable
// leftmost value), which is still not a hard security guarantee behind a
// proxy in general — the honeypot field above (`hp`) is the real floor
// against automated abuse; this limiter only blunts accidental bursts (e.g.
// a retry loop or a slow double-click).
const HITS = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const SWEEP_INTERVAL_MS = 5 * 60_000;
let lastSweep = Date.now();

/** Drops every IP whose hits have all aged out of the window. Without this,
 * an IP that hits once and never returns keeps its (eventually empty) key
 * forever — this is what let the map grow unbounded. Runs at most once per
 * `SWEEP_INTERVAL_MS`, not on every request. */
function sweepExpiredHits(now: number): void {
  for (const [ip, hits] of HITS) {
    if (hits.every((t) => now - t >= WINDOW_MS)) HITS.delete(ip);
  }
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  if (now - lastSweep > SWEEP_INTERVAL_MS) {
    sweepExpiredHits(now);
    lastSweep = now;
  }
  const recent = (HITS.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  HITS.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

/** Test-only: exposes the rate limiter's internal map size so eviction can be
 * verified without reaching into module internals. Never used at runtime. */
export function __rateLimiterSizeForTests(): number {
  return HITS.size;
}

function normalizeSection(raw: unknown): Section | null {
  const s = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  return (SECTIONS as readonly string[]).includes(s) ? (s as Section) : null;
}

export async function POST(req: Request): Promise<Response> {
  // Only these three fields are ever read from the body — the form sends
  // exactly this shape (SubmitLinkForm.tsx). `note` and `sourcePage` are
  // deliberately not accepted here: the form never sends them, so parsing
  // them from the request was pure unused attack surface (see finding 1).
  // `sourcePage` is derived from the validated `section` below instead.
  let payload: { url?: string; section?: string; hp?: string; token?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  // Honeypot: bots fill hidden fields. Pretend success, write nothing.
  if (payload.hp) return NextResponse.json({ ok: true }, { status: 200 });

  const section = normalizeSection(payload.section);
  if (!section) {
    return NextResponse.json({ error: 'Please choose a section.' }, { status: 400 });
  }

  const validated = validateUrl(payload.url);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const ip = trustedClientIp(req);
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: 'Thanks — you’ve sent a few already. Please try again in a minute.' },
      { status: 429 },
    );
  }

  // Fail-CLOSED gate, on purpose — the opposite of the three sinks below.
  // Unconfigured (`configured: false`) falls through and behaves exactly as
  // before Turnstile existed. Configured-but-not-ok (missing/invalid/expired
  // token, failed challenge, or a siteverify error/timeout) rejects here,
  // before any sink runs. See verifyTurnstile's doc comment in
  // lib/longlive/submit-link.ts — do not change this to fail open.
  const turnstile = await verifyTurnstile(payload.token, ip);
  if (turnstile.configured && !turnstile.ok) {
    return NextResponse.json(
      { error: 'We couldn’t verify that submission. Please reload the page and try again.' },
      { status: 400 },
    );
  }

  const domain = domainFromUrl(validated.url);

  const record: SubmissionRecord = {
    url: validated.url,
    domain,
    platformGuess: platformGuessFromDomain(domain),
    section,
    submittedAt: new Date().toISOString(),
    clientHash: hashClientId(ip),
    sourcePage: `/${section}`,
  };

  // Each sink is independently optional and non-throwing (see
  // lib/longlive/submit-link.ts) — a missing or failing integration never
  // fails the visitor's submission. Log misses server-side, kind only.
  const outcome = await submitLink(record);
  if (!outcome.githubIssue.attempted) {
    console.warn('submit-link: GitHub issue sink not attempted (unconfigured)');
  } else if (!outcome.githubIssue.ok) {
    console.warn('submit-link: GitHub issue sink failed');
  }
  if (!outcome.sheet.ok) {
    console.warn(`submit-link: sheet sink ${outcome.sheet.attempted ? 'failed' : 'not attempted (unconfigured)'}`);
  }
  if (!outcome.email.ok) {
    console.warn(`submit-link: email sink ${outcome.email.attempted ? 'failed' : 'not attempted (unconfigured)'}`);
  }

  return NextResponse.json(
    { ok: true, number: outcome.githubIssue.number, url: outcome.githubIssue.url },
    { status: 200 },
  );
}

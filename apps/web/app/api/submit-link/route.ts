import { NextResponse } from 'next/server';
import {
  validateUrl,
  domainFromUrl,
  platformGuessFromDomain,
  hashClientId,
  clipOptionalFields,
  submitLink,
  MAX_SECTION_LENGTH,
  type SubmissionRecord,
} from '../../../lib/longlive/submit-link';

// The Community/Merch "submit a link" form. A visitor pastes a URL and picks
// a section (community/merch) — that's the whole input. Nothing submitted
// here ever renders on the site (issue #36's no-go on UGC hosting); it only
// ever reaches Joey via up to three independently-optional sinks (GitHub
// issue always, a Google Sheet + an email when configured). See
// docs/ops/community-merch-submissions.md and lib/longlive/submit-link.ts.
//
// Shape copied from /api/feedback: per-IP burst limit + a honeypot that
// returns 200 as if it worked, so bots learn nothing.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HITS = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (HITS.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  HITS.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

function normalizeSection(raw: unknown): string {
  const s = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  return s.slice(0, MAX_SECTION_LENGTH);
}

export async function POST(req: Request): Promise<Response> {
  let payload: { url?: string; section?: string; note?: string; sourcePage?: string; hp?: string };
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

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: 'Thanks — you’ve sent a few already. Please try again in a minute.' },
      { status: 429 },
    );
  }

  const domain = domainFromUrl(validated.url);
  const { note, sourcePage } = clipOptionalFields(payload);

  const record: SubmissionRecord = {
    url: validated.url,
    domain,
    platformGuess: platformGuessFromDomain(domain),
    section,
    submittedAt: new Date().toISOString(),
    clientHash: hashClientId(ip),
    note: note || undefined,
    sourcePage: sourcePage || undefined,
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

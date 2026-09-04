import { NextResponse } from 'next/server';

import { trustedClientIp } from '../../../lib/longlive/client-ip';

// "Help us verify" — CurrentItemDetail.tsx's verify button files a GitHub
// `intake` issue (.github/ISSUE_TEMPLATE/intake.yml) so a reader who spots
// something wrong with a live current_item row can flag it for a human to
// check (PLAN.md Stage 5). Shape copied from /api/feedback/route.ts (same
// token, same rate limiter, same defang/clip discipline) — the difference
// is the label (`intake`, not `user-feedback`) and the fixed field set: no
// free-text box, the client sends the item's own fields, not a submitter's
// words.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FIELD = 500;

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

const clip = (s: unknown, n: number): string => (typeof s === 'string' ? s.slice(0, n) : '');

// Same defang as /api/feedback/route.ts — everything below lands in a
// public GitHub issue body, so a client-suppliable field must never be able
// to @mention a real person or #-backlink another issue.
const ZWSP = '​';
export function defangGitHub(s: string): string {
  return s.replace(/([@#])(?=[A-Za-z0-9_-])/g, `$1${ZWSP}`);
}

interface IntakeSource {
  name?: unknown;
  url?: unknown;
}

interface IntakePayload {
  headline?: string;
  summary?: string;
  itemId?: string;
  eraId?: string;
  status?: string;
  sources?: IntakeSource[];
}

export function titleFrom(headline: string): string {
  return `[Intake] ${defangGitHub(headline)}`;
}

export function bodyFrom(payload: {
  headline: string;
  summary: string;
  itemId: string;
  eraId: string;
  status: string;
  sources: { name: string; url: string }[];
}): string {
  const lines = [
    '**Reported by:** 🧑 A reader — "Help us verify" on the current era’s live feed.',
    '',
    `- **Item id:** \`${payload.itemId}\``,
    payload.eraId ? `- **Era:** \`${payload.eraId}\`` : null,
    payload.status ? `- **Current status:** \`${payload.status}\`` : null,
    '',
    '**Headline:**',
    `> ${defangGitHub(payload.headline)}`,
    payload.summary ? '' : null,
    payload.summary ? '**Summary:**' : null,
    payload.summary ? `> ${defangGitHub(payload.summary)}` : null,
    payload.sources.length ? '' : null,
    payload.sources.length ? '**Sources:**' : null,
    ...payload.sources.map((s) => `- ${defangGitHub(s.name)}: ${s.url}`),
    '',
    '---',
    '_Reader-flagged via the Current tier — see docs/proposals/2026-08-23-knowledge-engine.md._',
    '<!-- intake:reader-verify -->',
  ];
  return lines.filter((l): l is string => l !== null).join('\n');
}

export async function POST(req: Request): Promise<Response> {
  let payload: IntakePayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const headline = clip(payload.headline, MAX_FIELD).trim();
  const itemId = clip(payload.itemId, 80).trim();
  if (!headline || !itemId) {
    return NextResponse.json({ error: 'Missing item.' }, { status: 400 });
  }

  // Shared trusted-IP resolver (#1973 fix, propagated repo-wide 2026-09-02
  // per security audit follow-up t_07025f1e) — not the spoofable leftmost
  // x-forwarded-for hop.
  const ip = trustedClientIp(req);
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'Please try again in a minute.' }, { status: 429 });
  }

  const token = process.env.GITHUB_FEEDBACK_TOKEN;
  const repo = process.env.FEEDBACK_REPO || 'JW-Incorporated/swift2';
  if (!token) {
    console.warn('intake: no GITHUB_FEEDBACK_TOKEN set; dropped a verify request');
    return NextResponse.json(
      { error: 'Verification isn’t wired up in this environment yet.' },
      { status: 503 },
    );
  }

  const summary = clip(payload.summary, MAX_FIELD).trim();
  const eraId = clip(payload.eraId, 40).trim();
  const status = clip(payload.status, 20).trim();
  const sources = Array.isArray(payload.sources)
    ? payload.sources
        .slice(0, 5)
        .map((s) => ({ name: clip(s?.name, 80), url: clip(s?.url, 300) }))
        .filter((s) => s.url !== '')
    : [];

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        'User-Agent': 'longlive-intake',
      },
      body: JSON.stringify({
        title: titleFrom(headline),
        body: bodyFrom({ headline, summary, itemId, eraId, status, sources }),
        labels: ['intake'],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error('intake: GitHub issue create failed', res.status, detail.slice(0, 300));
      return NextResponse.json({ error: 'Couldn’t file that right now — please try again later.' }, { status: 502 });
    }

    const issue = (await res.json()) as { number?: number; html_url?: string };
    return NextResponse.json({ ok: true, number: issue.number, url: issue.html_url }, { status: 201 });
  } catch (err) {
    console.error('intake: unexpected error', (err as Error).message);
    return NextResponse.json({ error: 'Something went wrong filing that.' }, { status: 500 });
  }
}

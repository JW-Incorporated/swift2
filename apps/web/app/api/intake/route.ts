import { createHmac } from 'node:crypto';

import { NextResponse } from 'next/server';

import { trustedClientIp } from '../../../lib/longlive/client-ip';
import { makeRateLimiter } from '../../../lib/longlive/rate-limit';

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

const limiter = makeRateLimiter({ windowMs: 60_000, max: 5 });

function rateLimited(ip: string): boolean {
  return limiter.isLimited(ip);
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
  key: string;
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
    itemMarker(payload.itemId, payload.key),
  ];
  return lines.filter((l): l is string => l !== null).join('\n');
}

// Best-effort idempotency (#4883): a retry after a server-side success must
// not file a second issue. Layers, cheapest first: per-instance cache of
// recent creates/hits, per-instance in-flight map, then a GitHub search for
// an open intake issue carrying the HMAC marker (see findOpenIssue for the
// trust boundary and residuals). Durable dedupe would need a store.
export function itemHash(itemId: string, key: string): string {
  return createHmac('sha256', key).update(itemId).digest('hex').slice(0, 32);
}

export function itemMarker(itemId: string, key: string): string {
  return `<!-- intake-item:${itemHash(itemId, key)} -->`;
}

const INTAKE_LABEL = 'intake';
const SEARCH_TIMEOUT_MS = 2500;
const RECENT_TTL_MS = 10 * 60_000;
const RECENT_MAX = 500;

interface IssueRef {
  number?: number;
  url?: string;
}

interface Outcome {
  status: number;
  body: Record<string, unknown>;
}

const recent = new Map<string, { at: number; ref: IssueRef }>();
const inflight = new Map<string, Promise<Outcome>>();

function recentGet(hash: string): IssueRef | null {
  const hit = recent.get(hash);
  if (!hit) return null;
  if (Date.now() - hit.at > RECENT_TTL_MS) {
    recent.delete(hash);
    return null;
  }
  return hit.ref;
}

function recentSet(hash: string, ref: IssueRef): void {
  recent.delete(hash);
  recent.set(hash, { at: Date.now(), ref });
  while (recent.size > RECENT_MAX) {
    const oldest = recent.keys().next().value;
    if (oldest === undefined) break;
    recent.delete(oldest);
  }
}

const ghHeaders = (token: string): Record<string, string> => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'longlive-intake',
});

// Fails open: any error, timeout, 403/429 or odd response returns null so
// intake still creates. Trust boundary is the HMAC key: the marker embeds an
// HMAC of the itemId under the server-only token, so a third party cannot
// forge a marker for an item they have not seen filed. The intake label is
// NOT a boundary (.github/ISSUE_TEMPLATE/intake.yml applies it for any
// submitter); it only narrows the search. Residuals: (1) token rotation
// changes every marker, so at most one duplicate per item after rotation;
// (2) once filed, the marker is public, so a copy only matters if the
// original is closed while the copy stays open, and the copy lands in the
// founders' intake triage queue; (3) cross-instance duplicates inside
// GitHub's search-index lag.
async function findOpenIssue(repo: string, token: string, itemId: string): Promise<IssueRef | null> {
  try {
    const marker = itemMarker(itemId, token);
    const needle = `intake-item:${itemHash(itemId, token)}`;
    const q = `repo:${repo} is:issue is:open label:${INTAKE_LABEL} in:body "${needle}"`;
    const res = await fetch(`https://api.github.com/search/issues?q=${encodeURIComponent(q)}&per_page=5`, {
      headers: ghHeaders(token),
      signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      items?: {
        number?: number;
        html_url?: string;
        body?: string | null;
        labels?: ({ name?: string } | string)[];
      }[];
    };
    const hit = data.items?.find(
      (i) =>
        typeof i.body === 'string' &&
        i.body.includes(marker) &&
        (i.labels ?? []).some((l) => (typeof l === 'string' ? l : l.name) === INTAKE_LABEL),
    );
    return hit ? { number: hit.number, url: hit.html_url } : null;
  } catch {
    return null;
  }
}

async function fileIntake(
  repo: string,
  token: string,
  hash: string,
  itemId: string,
  issue: { title: string; body: string },
): Promise<Outcome> {
  const existing = recentGet(hash) ?? (await findOpenIssue(repo, token, itemId));
  if (existing) {
    recentSet(hash, existing);
    return { status: 200, body: { ok: true, number: existing.number, url: existing.url, deduped: true } };
  }
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: 'POST',
      headers: { ...ghHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: issue.title, body: issue.body, labels: [INTAKE_LABEL] }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error('intake: GitHub issue create failed', res.status, detail.slice(0, 300));
      return { status: 502, body: { error: 'Couldn’t file that right now — please try again later.' } };
    }

    const created = (await res.json()) as { number?: number; html_url?: string };
    recentSet(hash, { number: created.number, url: created.html_url });
    return { status: 201, body: { ok: true, number: created.number, url: created.html_url } };
  } catch (err) {
    console.error('intake: unexpected error', (err as Error).message);
    return { status: 500, body: { error: 'Something went wrong filing that.' } };
  }
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

  const hash = itemHash(itemId, token);
  const pending = inflight.get(hash);
  if (pending) {
    const out = await pending;
    if (out.status === 201) {
      return NextResponse.json({ ...out.body, deduped: true }, { status: 200 });
    }
    return NextResponse.json(out.body, { status: out.status });
  }

  const work = fileIntake(repo, token, hash, itemId, {
    title: titleFrom(headline),
    body: bodyFrom({ key: token, headline, summary, itemId, eraId, status, sources }),
  });
  inflight.set(hash, work);
  try {
    const out = await work;
    return NextResponse.json(out.body, { status: out.status });
  } finally {
    inflight.delete(hash);
  }
}

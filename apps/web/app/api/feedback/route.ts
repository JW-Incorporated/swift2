import { NextResponse } from 'next/server';

import { trustedClientIp } from '../../../lib/longlive/client-ip';
import { isHoneypotTripped } from '../../../lib/longlive/rate-limit';
import { isDuplicate, markPending, parseIdempotencyId, settle } from './idempotency';
import { DIAG_ISSUE_NUMBER, DIAG_PREFIX, DIAG_REPO, speedCommit, speedRefund } from './diag';
import { readBodyText } from './body-text';
import { guardReport, quotaResponse, rateLimited } from './report-guards';
import { watchdogClaimResponse } from './watchdog-lifecycle';

// In-app user feedback → a GitHub issue ("ticket"), mirroring the Karen/CIE
// ticket shape but clearly marked user-submitted (label `user-feedback`, a
// `feedback:user` marker, and a "Reported by: User" header) so it can be
// triaged differently from engine tickets.
//
// This is a DYNAMIC handler (a Vercel serverless function), unlike the static
// vault routes. It needs a server-side GitHub token with issues:write —
// `GITHUB_FEEDBACK_TOKEN` ONLY. It deliberately does NOT fall back to a bare
// `GITHUB_TOKEN`: this endpoint is public and unauthenticated, so it must run on
// a narrowly-scoped token (issues:write on the feedback repo, nothing more), not
// whatever broad-permission default token the deploy env happens to expose. Repo
// defaults to `JW-Incorporated/swift2`, overridable via `FEEDBACK_REPO`. Without
// the feedback token it degrades cleanly (503 + friendly message) so local/CI
// builds don't need it.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_MESSAGE = 5000;
const MAX_FIELD = 2000;
type Location = {
  eraId?: string;
  eraName?: string;
  mode?: string;
  view?: string;
  openMomentId?: string | null;
  openTrackKey?: string | null;
  trackGuideEraId?: string | null;
  theoryGuideEraId?: string | null;
  lensId?: string | null;
  url?: string; // legacy clients; reduced to a path server-side
  path?: string;
  pageTitle?: string;
  viewport?: string;
  platform?: string;
  ts?: string;
};


// See lib/longlive/client-ip.ts's trustedClientIp for the #1973 rationale
// (re-exported here so any existing importer of this route's trustedClientIp
// keeps working — the implementation itself now lives in one shared place).
export { trustedClientIp } from '../../../lib/longlive/client-ip';

const clip = (s: unknown, n: number): string =>
  typeof s === 'string' ? s.slice(0, n) : '';

// Public issue tracker: publish the page path only. Query strings and hashes
// can carry personal values, and older clients still send a full URL.
const pathOnly = (s: unknown): string => {
  if (typeof s !== 'string') return '';
  const rest = s.trim().replace(/^(?:[a-z][a-z0-9+.-]*:)?\/\/[^/?#]*/i, '').split('#')[0]!.split('?')[0]!;
  return rest ? (rest.startsWith('/') ? rest : `/${rest}`) : '';
};

// Defang GitHub autolinks in UNTRUSTED user text. This endpoint is public and
// unauthenticated, and everything a submitter sends (the message AND every
// client-supplied location/environment field) lands in a GitHub issue body.
// Without this, a submitter could `@someone` to ping a real person, or write
// `#123` / `owner/repo#123` to spam cross-reference backlinks + notifications
// onto unrelated issues — straight from an anonymous form. A zero-width space
// after the sigil stops GitHub from linkifying it while staying invisible.
// (Blockquoting alone does NOT prevent autolinking — GitHub still linkifies
// mentions/refs inside `> ` quotes; code spans do, which is why the backtick-
// wrapped fields below are already safe and left untouched.)
const ZWSP = '​';
export function defangGitHub(s: string): string {
  return s.replace(/([@#])(?=[A-Za-z0-9_-])/g, `$1${ZWSP}`);
}

/** One-line, sanitized issue title from the first line of the message. */
export function titleFrom(message: string): string {
  const firstLine = message.split('\n').find((l) => l.trim())?.trim() ?? 'User feedback';
  const trimmed = firstLine.length > 72 ? `${firstLine.slice(0, 69)}…` : firstLine;
  // Titles don't autolink, but keep them tidy/consistent with the body.
  return `[Feedback] ${defangGitHub(trimmed)}`;
}

export function bodyFrom(message: string, loc: Location): string {
  // Neutralize markdown/backticks in client-supplied free-text by rendering it
  // as a code span (GitHub renders code literally — no autolink, no markdown).
  const code = (s: string): string => {
    const flat = s.replace(/\s+/g, ' ').replace(/`/g, "'").trim();
    return flat ? `\`${flat}\`` : '';
  };

  // Wrap multi-line free-text in a fenced code block whose fence is longer
  // than any backtick run already inside it, so the fence can't be broken out
  // of. GitHub renders NOTHING inside a code fence as markdown — no
  // autolinks, no `[text](url)` links, no `![alt](url)` images (#1974) — the
  // same no-markdown guarantee the code-spanned single-line fields above
  // already rely on, just for text that needs to stay multi-line.
  const fence = (s: string): string => {
    const longestRun = Math.max(0, ...(s.match(/`+/g) ?? []).map((run) => run.length));
    const bar = '`'.repeat(Math.max(3, longestRun + 1));
    return `${bar}\n${s}\n${bar}`;
  };

  const locLines = [
    loc.eraName || loc.eraId
      ? `- **Era:** ${code(clip(loc.eraName, 80))}${loc.eraId ? ` (${code(clip(loc.eraId, 40))})` : ''}`
      : null,
    loc.mode ? `- **View:** ${code(clip(loc.mode, 40))}${loc.view ? ` — ${code(clip(loc.view, 120))}` : ''}` : null,
    loc.openMomentId ? `- **Open moment:** ${code(clip(loc.openMomentId, 200))}` : null,
    loc.openTrackKey ? `- **Open track:** ${code(clip(loc.openTrackKey, 200))}` : null,
    loc.trackGuideEraId ? `- **Track guide:** ${code(clip(loc.trackGuideEraId, 40))}` : null,
    loc.theoryGuideEraId ? `- **Theory guide:** ${code(clip(loc.theoryGuideEraId, 40))}` : null,
    loc.lensId ? `- **Thread/lens:** ${code(clip(loc.lensId, 40))}` : null,
    loc.path || loc.url ? `- **Path:** ${code(clip(pathOnly(loc.path || loc.url), 300))}` : null,
  ].filter(Boolean);

  return [
    '**Reported by:** 🧑 User — in-app feedback button (NOT Karen/CIE).',
    '',
    '**What they reported:**',
    '',
    // Fenced code block, not a blockquote: `> ` does NOT stop markdown link
    // or image syntax from linkifying/rendering inline (#1974) — a submitter
    // could otherwise plant a phishing link or a tracking pixel in what looks
    // like a trusted internal ticket. Defang first (belt), fence second
    // (suspenders) — mentions/refs/links/images all render as inert text.
    fence(defangGitHub(message)),
    '',
    '**Where (in-app location where feedback was given):**',
    locLines.length ? locLines.join('\n') : '- _(no location captured)_',
    '',
    '**Environment:**',
    `- Page: ${code(clip(loc.pageTitle, 200)) || '—'}`,
    `- Viewport: ${code(clip(loc.viewport, 40)) || '—'}`,
    `- Platform: ${code(clip(loc.platform, 40)) || '—'}`,
    `- Time: ${code(clip(loc.ts, 40)) || new Date().toISOString()}`,
    '',
    '---',
    '_User-submitted via the in-app feedback button. Triage separately from Karen tickets (different fix workflow, TBD)._',
    '<!-- feedback:user -->',
  ].join('\n');
}

export async function POST(req: Request): Promise<Response> {
  let payload: { id?: unknown; message?: string; location?: Location; hp?: string; diag?: unknown; watchdog?: unknown };
  const bodyText = await readBodyText(req);
  if (bodyText === null) {
    return NextResponse.json({ error: 'Request too large.' }, { status: 413 });
  }
  try {
    payload = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  // Honeypot: bots fill hidden fields. Pretend success, drop silently.
  if (isHoneypotTripped(payload.hp)) return NextResponse.json({ ok: true }, { status: 200 });

  const message = clip(payload.message, MAX_MESSAGE).trim();
  if (!message) {
    return NextResponse.json({ error: 'Please enter some feedback.' }, { status: 400 });
  }

  // A resend of an already-filed report (offline outbox) is acknowledged without posting again.
  const idemId = parseIdempotencyId(payload.id);
  if (idemId && isDuplicate(idemId)) {
    return NextResponse.json({ ok: true, duplicate: true }, { status: 200 });
  }

  const ip = trustedClientIp(req);
  // Speed test reports (a run is up to 31 reports in quick succession, and the summary must not be
  // the one dropped) have their own budget in diag.ts (speedAllowed) instead of the generic per-IP
  // limiter. Only a payload that then passes the strict schema AND the run budget reaches GitHub.
  const speedShaped =
    message === DIAG_PREFIX &&
    typeof payload.diag === 'object' &&
    payload.diag !== null &&
    'speed' in payload.diag;
  if (!speedShaped && rateLimited(ip)) {
    return NextResponse.json(
      { error: 'Thanks — you’ve sent a few already. Please try again in a minute.' },
      { status: 429 },
    );
  }

  const guarded = await guardReport(payload, message, ip);
  if ('response' in guarded) return guarded.response;
  const { diag, diagComment, speedReport, watchdogReport, quotaKind } = guarded;

  // Feedback-scoped token ONLY — no fallback to a broad GITHUB_TOKEN on a
  // public, unauthenticated endpoint (see file header).
  const token = process.env.GITHUB_FEEDBACK_TOKEN;
  const repo = process.env.FEEDBACK_REPO || 'JW-Incorporated/swift2';
  if (!token) {
    // No token wired up (e.g. local/preview). Log for visibility; tell the user
    // gracefully rather than 500.
    //
    // NEVER log the message itself. This endpoint is public, unauthenticated
    // and free-text: whatever a visitor types could be a bug report or could be
    // their name, their email, or something they'd never expect to land in a
    // Vercel log they can't see or delete. The misconfiguration is fully
    // diagnosable from the fact + the shape of the drop — length tells us the
    // request was real rather than an empty probe, and the env name tells an
    // operator exactly what to set.
    console.warn(
      `feedback: no GITHUB_FEEDBACK_TOKEN set; dropped a ${message.length}-char submission (content not logged)`,
    );
    return NextResponse.json(
      { error: 'Feedback isn’t wired up in this environment yet.' },
      { status: 503 },
    );
  }

  if (quotaKind) {
    const capped = await quotaResponse(quotaKind, ip);
    if (capped) return capped;
  }

  // Durable claim only once config is known good, so a misconfigured deploy never burns a claim.
  if (watchdogReport) {
    const stop = await watchdogClaimResponse(watchdogReport);
    if (stop) return stop;
  }

  const location = (payload.location ?? {}) as Location;
  // Clip free-form environment fields defensively before they hit the body.
  location.platform = clip(location.platform, MAX_FIELD);
  location.path = pathOnly(location.path || location.url);
  delete location.url;
  delete (location as Record<string, unknown>).userAgent;

  if (idemId) markPending(idemId);
  let filed = false;
  try {
    const res = await fetch(
      diag
        ? `https://api.github.com/repos/${DIAG_REPO}/issues/${DIAG_ISSUE_NUMBER}/comments`
        : `https://api.github.com/repos/${repo}/issues`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
          'User-Agent': 'longlive-feedback',
        },
        body: JSON.stringify(
          diag
            ? { body: diagComment }
            : {
                title: titleFrom(message),
                body: bodyFrom(message, location),
                labels: ['user-feedback', 'feedback'],
              },
        ),
      },
    );

    if (!res.ok) {
      const detail = await res.text();
      console.error('feedback: GitHub issue create failed', res.status, detail.slice(0, 300));
      if (speedReport) speedRefund(speedReport.run);
      return NextResponse.json(
        { error: 'Couldn’t file that right now — please try again later.' },
        { status: 502 },
      );
    }

    filed = true;
    if (speedReport) speedCommit(speedReport);
    const issue = (await res.json()) as { number?: number; html_url?: string };
    return NextResponse.json(
      { ok: true, number: issue.number, url: issue.html_url },
      { status: 201 },
    );
  } catch (err) {
    console.error('feedback: unexpected error', (err as Error).message);
    return NextResponse.json({ error: 'Something went wrong sending feedback.' }, { status: 500 });
  } finally {
    if (idemId) settle(idemId, filed);
  }
}

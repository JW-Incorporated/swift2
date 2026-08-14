import { createHash } from 'node:crypto';

// Validation + the three sinks for the community/merch "submit a link" form.
// Nothing a visitor submits ever renders on the site (issue #36's no-go on
// user-generated content hosting) — it only ever reaches Joey, via up to
// three independently-optional channels. See docs/ops/community-merch-submissions.md.
//
// Each sink is best-effort: a missing or failing integration must NEVER fail
// the visitor's submission. Callers (the route) still get an outcome per sink
// so they can log a miss (kind only, never payload) without surfacing it.

export const MAX_URL_LENGTH = 500;

export const SECTIONS = ['community', 'merch'] as const;
export type Section = (typeof SECTIONS)[number];

/** Shared cross-sink fetch timeout — every outbound sink call (GitHub, the
 * sheet webhook, Resend) races against this so a single hung upstream can
 * never pin the request past it. */
const FETCH_TIMEOUT_MS = 5000;

export type ValidateUrlResult = { ok: true; url: string } | { ok: false; error: string };

/** http(s)-only, length-capped, no fetch of the target (SSRF/DoS avoidance —
 * page titles are filled in by Joey later, never by this server). */
export function validateUrl(raw: unknown): ValidateUrlResult {
  if (typeof raw !== 'string') return { ok: false, error: 'A link is required.' };
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: 'A link is required.' };
  if (trimmed.length > MAX_URL_LENGTH) return { ok: false, error: 'That link is too long.' };

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, error: 'That doesn’t look like a valid link.' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, error: 'Only http/https links are accepted.' };
  }
  if (!parsed.hostname) return { ok: false, error: 'That doesn’t look like a valid link.' };

  return { ok: true, url: parsed.toString() };
}

/** Lowercased hostname with a leading "www." stripped. Assumes `url` already
 * passed `validateUrl`. */
export function domainFromUrl(url: string): string {
  const hostname = new URL(url).hostname.toLowerCase();
  return hostname.startsWith('www.') ? hostname.slice(4) : hostname;
}

export const PLATFORM_GUESSES = [
  'reddit',
  'discord',
  'facebook',
  'instagram',
  'tiktok',
  'x',
  'tumblr',
  'etsy',
  'other',
] as const;

export type PlatformGuess = (typeof PLATFORM_GUESSES)[number];

const PLATFORM_DOMAINS: ReadonlyArray<readonly [string, PlatformGuess]> = [
  ['reddit.com', 'reddit'],
  ['redd.it', 'reddit'],
  ['discord.gg', 'discord'],
  ['discord.com', 'discord'],
  ['facebook.com', 'facebook'],
  ['fb.com', 'facebook'],
  ['instagram.com', 'instagram'],
  ['tiktok.com', 'tiktok'],
  ['x.com', 'x'],
  ['twitter.com', 'x'],
  ['tumblr.com', 'tumblr'],
  ['etsy.com', 'etsy'],
];

/** Domain → platform, from the hostname only. Never fetches the URL. */
export function platformGuessFromDomain(domain: string): PlatformGuess {
  for (const [suffix, guess] of PLATFORM_DOMAINS) {
    if (domain === suffix || domain.endsWith(`.${suffix}`)) return guess;
  }
  return 'other';
}

/** Hashed client identifier for abuse triage — never store a raw IP. Not a
 * security control (no per-request secret), just avoids writing a plain IP
 * into a spreadsheet/issue that outlives the rate limiter. */
export function hashClientId(id: string): string {
  const salt = process.env.SUBMISSIONS_HASH_SALT || 'longlive-submissions';
  return createHash('sha256').update(`${salt}:${id}`).digest('hex').slice(0, 16);
}

export interface SubmissionRecord {
  url: string;
  domain: string;
  platformGuess: PlatformGuess;
  section: Section;
  submittedAt: string;
  clientHash: string;
  /** Derived server-side from the validated `section` — never taken from the
   * request body (the form doesn't send it; accepting it was unused attack
   * surface). */
  sourcePage?: string;
  flags?: string;
}

export interface SinkOutcome {
  attempted: boolean;
  ok: boolean;
}

export interface GitHubIssueOutcome extends SinkOutcome {
  number?: number;
  url?: string;
}

const escHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Escapes a value for safe embedding inside a single-backtick markdown code
 * span: a literal backtick would close the span early and let the rest of
 * the value render as arbitrary markdown in an issue the founder reads, and
 * a raw newline would break a single-line bullet into extra lines. Backticks
 * are swapped for a visually similar but inert character rather than
 * stripped, so the value is still legible. */
export function escGithubCodeSpan(s: string): string {
  return s.replace(/`/g, 'ˋ').replace(/\r\n|\r|\n/g, ' ');
}

function githubIssueBody(record: SubmissionRecord): string {
  const esc = escGithubCodeSpan;
  const lines = [
    '**Submitted by:** Visitor — link submission form (NOT the feedback button).',
    '',
    `- **Section:** \`${esc(record.section)}\``,
    `- **URL:** \`${esc(record.url)}\``,
    `- **Domain:** \`${esc(record.domain)}\``,
    `- **Platform guess:** \`${esc(record.platformGuess)}\``,
    `- **Submitted at:** \`${esc(record.submittedAt)}\``,
    `- **Client hash:** \`${esc(record.clientHash)}\``,
  ];
  if (record.sourcePage) lines.push(`- **From page:** \`${esc(record.sourcePage)}\``);
  lines.push(
    '',
    '---',
    '_Not added to the site. Review and add by hand if it belongs — auto-publish is out of scope (issue #36)._',
    '<!-- link-submission -->',
  );
  return lines.join('\n');
}

/** Always attempted — reuses the same narrowly-scoped token as /api/feedback,
 * no new credentials. This is the durable, day-one record. */
export async function postGitHubIssue(record: SubmissionRecord): Promise<GitHubIssueOutcome> {
  const token = process.env.GITHUB_FEEDBACK_TOKEN;
  const repo = process.env.FEEDBACK_REPO || 'JW-Incorporated/swift2';
  if (!token) {
    console.warn('submit-link: no GITHUB_FEEDBACK_TOKEN set; link submission not filed as an issue');
    return { attempted: false, ok: false };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        'User-Agent': 'longlive-submit-link',
      },
      body: JSON.stringify({
        title: `[Link submission] ${record.section}: ${record.domain}`,
        body: githubIssueBody(record),
        labels: ['link-submission'],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error('submit-link: GitHub issue create failed', res.status, detail.slice(0, 300));
      return { attempted: true, ok: false };
    }

    const issue = (await res.json()) as { number?: number; html_url?: string };
    return { attempted: true, ok: true, number: issue.number, url: issue.html_url };
  } catch (err) {
    console.error('submit-link: GitHub issue create error', (err as Error).message);
    return { attempted: true, ok: false };
  } finally {
    clearTimeout(timer);
  }
}

/** Prefixes a leading `=`, `+`, `-` or `@` with a single quote so spreadsheet
 * software treats the cell as literal text instead of evaluating it as a
 * formula (CSV/formula injection defense — see Google's own guidance on
 * `IMPORTXML`-style exfiltration). Applied to every outgoing cell below, not
 * just the ones currently reachable from user input, so the rule holds
 * regardless of which field a future change makes user-writable. The Apps
 * Script side (`scripts/apps-script/submissions-doPost.gs`) applies the same
 * rule again on receipt — a separate trust boundary that may one day be
 * called by something other than this route.
 *
 * The leading `\s*` matters: Sheets ignores a whitespace-prefixed `=`, but a
 * CSV export opened in Excel does not, so `"\t=1+1"` would come back to life
 * one hop downstream. Cheaper to catch here than to reason about every
 * consumer of the sheet. */
export function neutralizeCell(value: string): string {
  return /^\s*[=+\-@]/.test(value) ? `'${value}` : value;
}

/** Only when SUBMISSIONS_SHEET_WEBHOOK_URL is set. Fire-and-forget with a
 * short timeout — the Apps Script `doPost` appends a row in the exact
 * column order the sheet already has. */
export async function postToSheet(record: SubmissionRecord): Promise<SinkOutcome> {
  const webhookUrl = process.env.SUBMISSIONS_SHEET_WEBHOOK_URL;
  if (!webhookUrl) return { attempted: false, ok: false };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const n = neutralizeCell;
    const res = await fetch(webhookUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.SUBMISSIONS_SHEET_SECRET || '',
        submitted_at: n(record.submittedAt),
        section: n(record.section),
        url: n(record.url),
        domain: n(record.domain),
        platform_guess: n(record.platformGuess),
        page_title: n(''),
        status: n('New'),
        reviewed_by: n(''),
        added_to_site: n('No'),
        live_url: n(''),
        duplicate_of: n(''),
        notes: n(''),
        submitter_note: n(''),
        source_page: n(record.sourcePage || ''),
        client_hash: n(record.clientHash),
        flags: n(record.flags || ''),
      }),
    });

    if (!res.ok) {
      console.error('submit-link: sheet webhook failed', res.status);
      return { attempted: true, ok: false };
    }
    return { attempted: true, ok: true };
  } catch (err) {
    console.error('submit-link: sheet webhook error', (err as Error).message);
    return { attempted: true, ok: false };
  } finally {
    clearTimeout(timer);
  }
}

/** Only when RESEND_API_KEY + SUBMISSIONS_EMAIL_FROM are set. Plain fetch,
 * no SDK — pattern copied from `Watch Website & IG/api/inquiry.js`. */
export async function sendSubmissionEmail(record: SubmissionRecord): Promise<SinkOutcome> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.SUBMISSIONS_EMAIL_FROM;
  if (!apiKey || !from) return { attempted: false, ok: false };

  const safeUrl = escHtml(record.url);
  const safeDomain = escHtml(record.domain);
  const safeSection = escHtml(record.section);

  const html = [
    `<h2 style="font-family:sans-serif;">New link submission — ${safeSection}</h2>`,
    '<table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;">',
    `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;color:#555;">URL</td><td><a href="${safeUrl}">${safeUrl}</a></td></tr>`,
    `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;color:#555;">Domain</td><td>${safeDomain}</td></tr>`,
    `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;color:#555;">Platform guess</td><td>${escHtml(record.platformGuess)}</td></tr>`,
    '</table>',
  ].join('\n');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: ['sffan15@gmail.com'],
        subject: `New link submission — ${record.section}: ${record.domain}`,
        html,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error('submit-link: Resend error', res.status, detail.slice(0, 300));
      return { attempted: true, ok: false };
    }
    return { attempted: true, ok: true };
  } catch (err) {
    console.error('submit-link: email send error', (err as Error).message);
    return { attempted: true, ok: false };
  } finally {
    clearTimeout(timer);
  }
}

export interface SubmitLinkOutcome {
  githubIssue: GitHubIssueOutcome;
  sheet: SinkOutcome;
  email: SinkOutcome;
}

/** Runs all three sinks. Each is independently optional and non-throwing —
 * this function itself never rejects, so a missing/failing integration can
 * never fail the caller's response to the visitor. */
export async function submitLink(record: SubmissionRecord): Promise<SubmitLinkOutcome> {
  const [githubIssue, sheet, email] = await Promise.all([
    postGitHubIssue(record),
    postToSheet(record),
    sendSubmissionEmail(record),
  ]);
  return { githubIssue, sheet, email };
}

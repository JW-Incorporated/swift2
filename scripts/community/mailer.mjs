#!/usr/bin/env node
// community-mailer.yml — daily "Community Tasks" HTML digest email
// (Community Engine plan, docs/proposals/2026-09-06-community-engine-plan.md
// §2.6, Phase 1 card P1-6). Parents: P1-4 (Answerer desk drafts leads) and
// P1-5 (ack route + HMAC token). Zero-LLM: reads `engagement_lead` rows the
// Answerer desk already drafted (`status='drafted'`), renders one HTML email
// ordered replies-to-us-first then by relevance, sends it From Marjorie's
// Gmail (same account/secret as brief-mailer.yml), then marks every emailed
// lead `status='emailed'` (with retries — see `markEmailed`) so tomorrow's
// run never re-sends it.
//
// This script drafts NOTHING and posts NOTHING — the Answerer desk (P1-4)
// already wrote `draft`/`draft_alt`/`target_url`/`relevance`/`link_included`
// on every row this reads. §6.1's "a human always posts" rule is why the
// email's only calls to action are the HMAC "Posted"/"Skip" links
// (`/api/community/ack`, P1-5) — the human still does the pasting by hand.
//
// Email volume (§6.6, §4 workflow table, `routine-invariants.md` row 3):
// bounded to ONE daily send. The plan's "bounded replies-waiting second
// send" (an extra same-day email only when a `reply_to_us` lead is still
// unemailed after the first run) exists as a second `mode` this same script
// supports (`--mode=replies-waiting`), triggered by a second, later
// workflow_dispatch/schedule step — never unconditionally, so the founder
// email ceiling (`docs/agents/marjorie.md` § Cadence) is never silently
// exceeded by this desk.
//
// Recipients mirror brief-mailer.yml (docs/agents/marjorie.md § Delivery,
// Joey 2026-07-11): From Marjorie's own Gmail, To Joey (`sffan15@gmail.com`),
// CC Wyatt (`wjduvall@gmail.com`) — the same founder-facing channel every
// other Marjorie-authored mail already uses, not a new one.
//
//   node scripts/community/mailer.mjs                    # daily send
//   node scripts/community/mailer.mjs --mode=replies-waiting
//   node scripts/community/mailer.mjs --dry-run           # render only, no send/writes
//
// Needs SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY, COMMUNITY_ACK_SECRET (to
// mint ack links — see packages/core/src/community-ack-token.ts),
// MARJORIE_EMAIL (repo variable) / GMAIL_APP_PASSWORD (repo secret) for the
// SMTP send. Any missing piece degrades to a clean no-op log line, same
// posture as scan.mjs / community-ack's route.

import { execFileSync } from 'node:child_process';
import { createHmac } from 'node:crypto';
import { URLSearchParams } from 'node:url';
import { serviceClient } from '../lib/supabase.mjs';
import { runMain } from '../lib/cli.mjs';

export const SITE = 'https://www.longlivets.com';
export const TO = 'sffan15@gmail.com';
export const CC = 'wjduvall@gmail.com';
export const MAX_LEADS_PER_EMAIL = 15; // matches Answerer's own ≤12/day draft cap + headroom

/**
 * Mirrors `packages/core/src/community-ack-token.ts`'s `signAckToken` —
 * duplicated rather than imported because this script runs as plain Node
 * (no TS loader wired for scripts/**, see fb-export-ingest.mjs's direct
 * `.ts` import of a sibling worker module for the one place this repo does
 * that) while community-ack-token.ts is consumed from `apps/web` via the
 * TS-aware Next.js build. Any change to the signing scheme MUST update both
 * — see that file's own header for the exact payload shape
 * (`${leadId}:${action}:${linkIncluded ? '1' : '0'}`, HMAC-SHA256, hex).
 */
export function signAckToken(secret, { leadId, action, linkIncluded }) {
  return createHmac('sha256', secret)
    .update(`${leadId}:${action}:${linkIncluded ? '1' : '0'}`)
    .digest('hex');
}

/** Builds the one-click ack URL for a lead + action (§2.6/§9). */
export function buildAckUrl(secret, { leadId, action, linkIncluded = false }) {
  const token = signAckToken(secret, { leadId, action, linkIncluded });
  const params = new URLSearchParams({ lead: leadId, action, token });
  if (action === 'posted') params.set('link', linkIncluded ? '1' : '0');
  return `${SITE}/api/community/ack?${params.toString()}`;
}

/**
 * Orders leads the way §2.6 specifies: replies-to-us first (time-sensitive),
 * then by descending relevance (nulls last — an Answerer draft with no
 * relevance is a contribution-only draft per §2.5 point 3's <0.45 branch,
 * not a ranking failure).
 */
export function orderLeads(leads) {
  return [...leads].sort((a, b) => {
    const aReply = a.kind === 'reply_to_us' ? 0 : 1;
    const bReply = b.kind === 'reply_to_us' ? 0 : 1;
    if (aReply !== bReply) return aReply - bReply;
    const aRel = typeof a.relevance === 'number' ? a.relevance : -1;
    const bRel = typeof b.relevance === 'number' ? b.relevance : -1;
    return bRel - aRel;
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** The platform + destination line for one lead card. */
export function destinationLine(lead) {
  const platformLabel = lead.platform === 'reddit' ? 'Reddit' : 'Facebook';
  if (lead.platform === 'facebook') {
    return `${platformLabel} · ${escapeHtml(lead.locator || lead.community)}`;
  }
  const where = lead.url
    ? `<a href="${escapeHtml(lead.url)}">r/${escapeHtml(lead.community)}</a>`
    : `r/${escapeHtml(lead.community)}`;
  return `${platformLabel} · ${where}`;
}

/** One lead's HTML card: platform/destination, score, paste-ready draft(s), ack/skip links. */
export function renderLeadCard(lead, { ackSecret }) {
  const relevanceLabel = typeof lead.relevance === 'number' ? lead.relevance.toFixed(2) : 'n/a';
  const kindLabel = lead.kind === 'reply_to_us' ? '💬 reply waiting' : lead.kind === 'hot_thread' ? 'hot thread' : escapeHtml(lead.kind);
  const title = lead.title ? escapeHtml(lead.title) : null;
  const linkIncluded = Boolean(lead.link_included);

  const postedUrl = ackSecret ? buildAckUrl(ackSecret, { leadId: lead.id, action: 'posted', linkIncluded }) : null;
  const skipUrl = ackSecret ? buildAckUrl(ackSecret, { leadId: lead.id, action: 'skip' }) : null;

  const draftBlock = lead.draft
    ? `<div class="draft"><strong>Draft${linkIncluded ? ' (link included)' : ''}:</strong><pre>${escapeHtml(lead.draft)}</pre></div>`
    : '<div class="draft"><em>No draft on file.</em></div>';
  const altBlock = lead.draft_alt
    ? `<div class="draft alt"><strong>Alt (detailed):</strong><pre>${escapeHtml(lead.draft_alt)}</pre></div>`
    : '';
  const linkNote = !linkIncluded && lead.target_url
    ? `<p class="note">Link candidate (not yet cleared to include): <a href="${escapeHtml(lead.target_url)}">${escapeHtml(lead.target_url)}</a></p>`
    : '';

  return `<div class="card">
  <p class="meta">${kindLabel} · ${destinationLine(lead)} · relevance ${relevanceLabel}</p>
  ${title ? `<p class="title">${title}</p>` : ''}
  ${draftBlock}
  ${altBlock}
  ${linkNote}
  <p class="actions">${postedUrl ? `<a class="btn posted" href="${postedUrl}">✅ Posted</a>` : ''} ${skipUrl ? `<a class="btn skip" href="${skipUrl}">Skip</a>` : ''}</p>
</div>`;
}

/** Full email HTML body for a batch of ordered leads. `mode` only changes the heading/intro copy. */
export function renderEmailHtml(leads, { ackSecret, mode = 'daily', date }) {
  const heading = mode === 'replies-waiting'
    ? `Replies waiting — ${date}`
    : `Community Tasks — ${date}`;
  const intro = mode === 'replies-waiting'
    ? 'Someone replied to one of our comments — these are time-sensitive.'
    : `${leads.length} draft${leads.length === 1 ? '' : 's'} ready to paste. Click Posted after you paste one, or Skip to drop it.`;
  const cards = leads.map((lead) => renderLeadCard(lead, { ackSecret })).join('\n');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  body { font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.5; color: #1f2328; margin: 0; padding: 12px; }
  .wrap { max-width: 720px; margin: 0 auto; }
  h1 { font-size: 19px; }
  .intro { color: #57606a; }
  .card { border: 1px solid #d0d7de; border-radius: 8px; padding: 12px 14px; margin: 12px 0; }
  .meta { color: #57606a; font-size: 13px; margin: 0 0 4px; }
  .title { font-weight: 600; margin: 0 0 6px; }
  .draft pre { white-space: pre-wrap; background: #f6f8fa; border-radius: 6px; padding: 8px 10px; font-family: inherit; font-size: 14px; margin: 4px 0; }
  .draft.alt pre { background: #f0f4ff; }
  .note { font-size: 13px; color: #57606a; }
  .actions { margin-top: 8px; }
  .btn { display: inline-block; padding: 6px 14px; border-radius: 6px; text-decoration: none; margin-right: 8px; font-weight: 600; }
  .btn.posted { background: #1a7f37; color: #fff; }
  .btn.skip { background: #eaeef2; color: #1f2328; }
  .footer { color: #57606a; font-size: 13px; margin-top: 16px; border-top: 1px solid #d0d7de; padding-top: 8px; }
</style></head><body><div class="wrap">
<h1>${escapeHtml(heading)}</h1>
<p class="intro">${escapeHtml(intro)}</p>
${cards}
<p class="footer">Sent by community-mailer.yml — deterministic, no AI involved. Drafts were written by the Community Answerer desk; nothing here has been posted anywhere.</p>
</div></body></html>`;
}

/** Plain-text fallback (email clients that strip HTML). */
export function renderEmailText(leads, { mode = 'daily', date }) {
  const heading = mode === 'replies-waiting' ? `Replies waiting — ${date}` : `Community Tasks — ${date}`;
  const lines = [heading, ''];
  for (const lead of leads) {
    lines.push(`--- ${lead.kind} · ${lead.platform}:${lead.community} · relevance ${typeof lead.relevance === 'number' ? lead.relevance.toFixed(2) : 'n/a'} ---`);
    if (lead.title) lines.push(lead.title);
    if (lead.url) lines.push(lead.url);
    lines.push(lead.draft || '(no draft on file)');
    lines.push('');
  }
  lines.push('Open the HTML version of this email to use the one-click Posted/Skip links.');
  return lines.join('\n');
}

/** Fetches drafted, not-yet-emailed leads. `mode='replies-waiting'` narrows to reply_to_us only.
 * Fetches a pool well above `MAX_LEADS_PER_EMAIL` (fixed `FETCH_POOL_LIMIT`,
 * not `limit`) BEFORE re-ordering: a DB-side `.limit(limit)` applied under
 * the `created_at` sort would silently drop a newer, more urgent
 * `reply_to_us` lead once the drafted backlog exceeds one email's worth —
 * undermining the §2.6 "replies-to-us first" ordering this function exists
 * to guarantee. Order-then-slice happens entirely in JS instead. */
export const FETCH_POOL_LIMIT = 200;

export async function fetchLeadsToMail(supabase, { mode = 'daily', limit = MAX_LEADS_PER_EMAIL } = {}) {
  let query = supabase
    .from('engagement_lead')
    .select('id, platform, community, kind, thread_id, url, locator, title, relevance, target_url, draft, draft_alt, link_included, status')
    .eq('status', 'drafted')
    .order('created_at', { ascending: true })
    .limit(FETCH_POOL_LIMIT);
  if (mode === 'replies-waiting') query = query.eq('kind', 'reply_to_us');
  const { data, error } = await query;
  if (error) throw error;
  return orderLeads(data ?? []).slice(0, limit);
}

/**
 * Marks every mailed lead `status='emailed'`, retrying a few times with a
 * short delay before giving up. This runs AFTER the send succeeds, so a
 * transient failure here (not a re-throw of a genuine send error) is the
 * one place a duplicate email can occur: the lead stays `status='drafted'`
 * and gets mailed again tomorrow. Retrying absorbs the common transient
 * case (a Supabase blip); the residual risk after retries are exhausted is
 * an occasional duplicate email, never a duplicate POST/DM/vote — §6.1's
 * "a human always posts" guardrail is unaffected either way, and the ack
 * links this same email carries are idempotent, so a founder re-seeing an
 * already-posted draft is a mild inconvenience, not a correctness bug.
 */
export async function markEmailed(supabase, leadIds, { attempts = 3, delayMs = 500, sleep = (ms) => new Promise((r) => { setTimeout(r, ms); }) } = {}) {
  if (leadIds.length === 0) return;
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const { error } = await supabase
      .from('engagement_lead')
      .update({ status: 'emailed', emailed_at: new Date().toISOString() })
      .in('id', leadIds);
    if (!error) return;
    lastError = error;
    if (attempt < attempts) await sleep(delayMs * attempt);
  }
  throw lastError;
}

/**
 * Sends the rendered email via Gmail SMTP — `scripts/watchdog/send-community-
 * mail.py`, a sibling of `send-mail.py` (brief-mailer.yml/watchdog.yml's
 * proven stdlib-smtplib sender). Not reusing `send-mail.py` itself: that
 * script always renders its body through `gh api markdown` (issue-body
 * markdown -> HTML) and mails Joey only; this desk already has finished
 * HTML (drafts/ack-links need real `<a>`/`<pre>` markup markdown can't
 * express cleanly) and must CC Wyatt (§2.6/`marjorie.md` § Delivery — every
 * founder-facing Marjorie email goes to both). No new Node SMTP dependency
 * for one call site — same reasoning `send-mail.py`'s own header gives for
 * using stdlib `smtplib` over a package.
 */
function sendMail({ subject, html, text, sender, appPassword }) {
  const payload = JSON.stringify({ subject, html, text });
  execFileSync('python3', ['scripts/watchdog/send-community-mail.py'], {
    input: payload,
    encoding: 'utf8',
    env: { ...process.env, MARJORIE_EMAIL: sender, GMAIL_APP_PASSWORD: appPassword },
  });
}

function mailEnabled(env = process.env) {
  return Boolean(env.MARJORIE_EMAIL && env.GMAIL_APP_PASSWORD);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const modeArg = args.find((a) => a.startsWith('--mode='));
  const mode = modeArg ? modeArg.slice('--mode='.length) : 'daily';
  if (mode !== 'daily' && mode !== 'replies-waiting') {
    console.error(`community-mailer: unknown --mode "${mode}" (expected daily or replies-waiting).`);
    return 1;
  }

  const supabase = serviceClient();
  if (!supabase) {
    console.log('community-mailer: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY unset — skipping (degraded, not a crash).');
    return 0;
  }

  const ackSecret = process.env.COMMUNITY_ACK_SECRET;
  if (!ackSecret) {
    console.log('community-mailer: COMMUNITY_ACK_SECRET unset — skipping (ack links cannot be minted safely without it).');
    return 0;
  }

  const leads = await fetchLeadsToMail(supabase, { mode });
  if (leads.length === 0) {
    console.log(`community-mailer: no ${mode === 'replies-waiting' ? 'reply_to_us ' : ''}drafted leads to mail — nothing to send today.`);
    return 0;
  }

  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date());
  const html = renderEmailHtml(leads, { ackSecret, mode, date });
  const text = renderEmailText(leads, { mode, date });
  const subject = mode === 'replies-waiting' ? `Replies waiting — ${date}` : `Community Tasks — ${date}`;

  if (dryRun) {
    console.log(`community-mailer: [dry-run] would mail ${leads.length} lead(s), subject "${subject}".`);
    console.log(html);
    return 0;
  }

  if (!mailEnabled()) {
    console.log('community-mailer: MARJORIE_EMAIL / GMAIL_APP_PASSWORD not set — skipping send (degraded, not a crash).');
    return 0;
  }

  try {
    sendMail({
      subject,
      html,
      text,
      sender: process.env.MARJORIE_EMAIL,
      appPassword: process.env.GMAIL_APP_PASSWORD,
    });
  } catch (err) {
    console.error(`community-mailer: send failed: ${err?.message ?? err}`);
    return 1;
  }

  await markEmailed(supabase, leads.map((l) => l.id));
  console.log(`community-mailer: mailed ${leads.length} lead(s) (mode=${mode}), marked emailed.`);
  return 0;
}

if (
  process.argv[1] &&
  process.argv[1].split('\\').join('/').endsWith('scripts/community/mailer.mjs')
) {
  runMain(main, { name: 'community-mailer' });
}

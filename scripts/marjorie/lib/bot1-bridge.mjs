// Marjorie -> bot1 bridge (bots-v2 C5, docs/plans/bots-v2/PLAN.md). Posts ONE
// free-text prompt to #longlive through a dedicated webhook so Hermes (bot1)
// turns it into a Kanban card, exactly like the owner's own message.
//
// Gates, in order — a refusal is a soft notice (exit 0), never a red run:
//   1. marjorie-config.json `bot1Bridge.enabled` must be literally `true`
//      (committed, default false — flipping it is a reviewed PR);
//   2. the webhook secret must exist in the environment;
//   3. the prompt must validate (length, no mentions, no secret-shaped text);
//   4. at most `maxPromptsPerDay` (3) per UTC day.
//
// Rate-limit state is the tracking issue's own log: every prompt is first
// written there as a comment carrying `<!-- bot1-prompt: DATE id=ID -->`, and
// today's count is the number of such comments by the workflow identity.
// Why that and not a committed ledger: the log is already required, so the
// counter and the audit trail cannot disagree; an Action cannot push to
// branch-protected main; and the log is written BEFORE the send, so a crash
// between the two errs toward under-posting. Forged markers from other
// authors are ignored (public repo) — they can't raise OR lower the count.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { FILER_LOGINS } from './loop-asks.mjs';
import { apiFor, listIssuesByLabels } from './issues-rest.mjs';

export const REPO = 'JW-Incorporated/swift2';
export const ENV_NAME = 'DISCORD_LONGLIVE_INTAKE_WEBHOOK_URL';
export const TRACKING_LABEL = 'bot1-bridge';
export const TRACKING_TITLE = 'Marjorie → bot1 prompt log';
export const MAX_PROMPT_CHARS = 1500;
export const SUPPRESS_EMBEDS = 4;
const MARKER_RE = /<!-- bot1-prompt: (\d{4}-\d{2}-\d{2}) id=([a-f0-9]{8}) -->/g;
const FAILED_RE = /<!-- bot1-prompt-failed: (\d{4}-\d{2}-\d{2}) id=([a-f0-9]{8}) -->/g;
const SECRET_RE = /(ghp_|github_pat_|gho_|sk-[A-Za-z0-9]|xox[bp]-|discord(?:app)?\.com\/api\/webhooks|BEGIN [A-Z ]*PRIVATE KEY)/;
const MENTION_RE = /(@everyone|@here|<@[!&]?\d+>|<#\d+>)/;

export function loadConfig(file) {
  let raw;
  try {
    raw = JSON.parse(readFileSync(file, 'utf8')).bot1Bridge ?? {};
  } catch {
    raw = {};
  }
  const max = Number(raw.maxPromptsPerDay);
  return {
    enabled: raw.enabled === true,
    // Never above 3 whatever the file says; a missing/garbled value is 3.
    maxPromptsPerDay: Number.isInteger(max) && max >= 1 ? Math.min(max, 3) : 3,
    trackingIssue: Number.isInteger(raw.trackingIssue) && raw.trackingIssue > 0 ? raw.trackingIssue : null,
  };
}

export const utcDate = (ms) => new Date(ms).toISOString().slice(0, 10);

export function promptId(text) {
  return createHash('sha1').update(String(text).trim()).digest('hex').slice(0, 8);
}

export function validatePrompt(text) {
  const body = String(text ?? '').trim();
  if (!body) return { ok: false, reason: 'prompt is empty' };
  if (body.length > MAX_PROMPT_CHARS) return { ok: false, reason: `prompt is ${body.length} chars (max ${MAX_PROMPT_CHARS})` };
  if (MENTION_RE.test(body)) return { ok: false, reason: 'prompt contains a Discord mention' };
  if (SECRET_RE.test(body)) return { ok: false, reason: 'prompt contains secret-shaped text' };
  return { ok: true, body };
}

/**
 * Prompt ids logged today (UTC) by a trusted author, minus ones whose send
 * later failed (a failed send costs no budget and may be retried). The LAST
 * marker in a comment is the real one — quoted prompt text can't forge it
 * (logComment also defangs `<!--` in the quote).
 */
export function todaysPrompts(comments, date) {
  const ids = [];
  const failed = new Set();
  for (const c of comments || []) {
    if (!FILER_LOGINS.has(c?.user?.login ?? c?.author?.login)) continue;
    const body = String(c.body ?? '');
    const last = (re) => [...body.matchAll(re)].at(-1);
    const f = last(FAILED_RE);
    if (f) {
      if (f[1] === date) failed.add(f[2]);
      continue;
    }
    const m = last(MARKER_RE);
    if (m && m[1] === date) ids.push(m[2]);
  }
  return ids.filter((id) => !failed.has(id));
}

/** Pure gate. `secretPresent` is a boolean — the URL itself never reaches this. */
export function decide({ config, secretPresent, comments, nowMs, text }) {
  const date = utcDate(nowMs);
  const valid = validatePrompt(text);
  const used = todaysPrompts(comments, date);
  const base = { date, used: used.length, limit: config.maxPromptsPerDay };
  if (!config.enabled) return { ...base, action: 'refuse', reason: 'bridge disabled in marjorie-config.json (bot1Bridge.enabled is false)' };
  if (!secretPresent) return { ...base, action: 'refuse', reason: `${ENV_NAME} is not set` };
  if (!valid.ok) return { ...base, action: 'refuse', reason: valid.reason };
  const id = promptId(valid.body);
  if (used.includes(id)) return { ...base, action: 'refuse', reason: `prompt ${id} already sent today`, id };
  if (used.length >= config.maxPromptsPerDay) return { ...base, action: 'refuse', reason: `daily limit reached (${used.length}/${config.maxPromptsPerDay})`, id };
  return { ...base, action: 'send', id, body: valid.body };
}

export function discordContent(body, source) {
  const ref = source ? ` (ref <${String(source).replace(/[<>\s]/g, '')}>)` : '';
  return `Prompt from Marjorie, the swift2 chief of staff${ref}:\n\n${body}`;
}

export function logComment({ id, date, source, body, status = 'sent', error, failed = false }) {
  const quoted = body.replace(/<!--/g, '&lt;!--').split('\n').map((l) => `> ${l}`).join('\n');
  return [
    `**Marjorie → bot1** — ${status} (${date} UTC)`,
    source ? `Source: ${String(source).replace(/<!--/g, '&lt;!--')}` : null,
    quoted,
    error ? `Error: ${error}` : null,
    `<!-- bot1-prompt${failed ? '-failed' : ''}: ${date} id=${id} -->`,
  ].filter(Boolean).join('\n\n');
}

/** One POST, flags: 4 (no link previews), no mentions. Never echoes the URL. */
export async function sendWebhook(url, content, fetchImpl = fetch) {
  try {
    const res = await fetchImpl(`${url}?wait=true`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content, username: 'Marjorie', allowed_mentions: { parse: [] }, flags: SUPPRESS_EMBEDS }),
    });
    return res.ok ? { ok: true, status: res.status } : { ok: false, status: res.status, error: `Discord returned HTTP ${res.status}` };
  } catch {
    return { ok: false, status: null, error: 'Discord request threw a network error' };
  }
}

async function findTracking({ gh, repo, config }) {
  if (config.trackingIssue) return config.trackingIssue;
  const rows = await listIssuesByLabels(apiFor(gh), { repo, labels: [TRACKING_LABEL], state: 'open', limit: 5 });
  return rows[0]?.number ?? null;
}

async function createTracking({ gh, repo }) {
  await gh(['label', 'create', TRACKING_LABEL, '--color', '5319E7', '--description', 'Log of Marjorie→bot1 prompts (one comment per prompt); machine-counted — do not edit', '--force', '--repo', repo]);
  const body = 'One comment per prompt Marjorie sends to bot1 in #longlive, each ending in a `bot1-prompt` marker. The daily limit (3) is counted from these comments — do not edit or delete them. Bridge: `scripts/marjorie/prompt-bot1.mjs`; skill: `.claude/skills/prompting-bot1/SKILL.md`.';
  const out = await gh(['issue', 'create', '--repo', repo, '--title', TRACKING_TITLE, '--body', body, '--label', TRACKING_LABEL, '--label', 'desk:ops']);
  const n = Number(String(out.stdout ?? '').trim().split('/').pop());
  if (!n) throw new Error('could not read the new tracking issue number');
  return n;
}

async function todaysComments({ gh, repo, issue, date }) {
  const api = apiFor(gh);
  const all = [];
  for (let page = 1; page <= 5; page += 1) {
    const batch = (await api(`/repos/${repo}/issues/${issue}/comments?since=${date}T00:00:00Z&per_page=100&page=${page}`)) || [];
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

/**
 * Orchestrates one send. `dryRun` performs only reads (and creates nothing);
 * it reports the decision the real run would reach, including refusals.
 */
export async function runSend({ text, source, config, env = process.env, nowMs = Date.now(), repo = REPO, gh, dryRun = false, fetchImpl = fetch }) {
  const url = env[ENV_NAME];
  const date = utcDate(nowMs);
  let issue = null;
  let comments = [];
  try {
    issue = await findTracking({ gh, repo, config });
    if (issue) comments = await todaysComments({ gh, repo, issue, date });
  } catch (err) {
    if (!dryRun) return { action: 'refuse', reason: `tracking issue unreadable: ${String(err?.message ?? err).slice(0, 120)}`, date, used: 0, limit: config.maxPromptsPerDay };
  }
  const verdict = decide({ config, secretPresent: Boolean(url), comments, nowMs, text });
  const content = verdict.body ? discordContent(verdict.body, source) : null;
  if (dryRun) return { ...verdict, dryRun: true, flags: SUPPRESS_EMBEDS, trackingIssue: issue, content };
  if (verdict.action !== 'send') return verdict;

  if (!issue) issue = await createTracking({ gh, repo });
  const entry = { id: verdict.id, date, source, body: verdict.body };
  await gh(['issue', 'comment', String(issue), '--repo', repo, '--body', logComment(entry)]);
  const sent = await sendWebhook(url, content, fetchImpl);
  if (!sent.ok) {
    await gh(['issue', 'comment', String(issue), '--repo', repo, '--body', logComment({ ...entry, status: 'FAILED (not counted; may be retried)', error: sent.error, failed: true })]);
    return { ...verdict, action: 'failed', reason: sent.error, trackingIssue: issue };
  }
  return { ...verdict, action: 'sent', trackingIssue: issue, flags: SUPPRESS_EMBEDS };
}

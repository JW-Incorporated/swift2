// S2 (docs/decisions.md 2026-10-01): taste and strategy disputes are ruled on by
// Fable, never by the owner. Tree or Marjorie saves ONE question, a plain job on
// the workflow token files it as a `taste-ruling` issue and starts
// routine-fable-taste-ruling.yml, which writes `Ruling: <decision>`; a second plain
// job posts it, labels the issue and closes it.
//
// Guards, because the repo is public and a routine that can be started can be
// started in a loop:
//   1. trust     — the routine only reads an issue that carries FILED_MARKER AND
//                  was authored by the workflow identity (FILER_LOGINS); anyone
//                  may open an issue with the label, none of those is ever ruled on;
//   2. once      — a DISPATCH_MARKER comment (workflow identity), written BEFORE
//                  the dispatch, means one routine start per issue;
//   3. daily cap — at most DAILY_CAP rulings per UTC day, counted from GitHub's own
//                  run list for the routine (the same durable counter
//                  lib/loop-dispatch.mjs uses); an over-cap question stays open
//                  and Marjorie's weekly review rules on it.
// Questions that touch docs/social/guardrails.md are NOT filed here — those go to
// the owner as a `founder-decision`.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { URLSearchParams } from 'node:url';
import { gh as ghRun } from '../../lib/gh.mjs';
import { FILER_LOGINS, REPO } from './loop-asks.mjs';
import { apiFor, listIssuesByLabels } from './issues-rest.mjs';
import { utcDay } from './loop-dispatch.mjs';

export const TASTE_LABEL = 'taste-ruling';
export const RULED_LABEL = 'taste-ruled';
export const TASTE_LABELS = [
  [TASTE_LABEL, '5319E7', 'A taste/strategy question for Fable to rule on (never the owner) — filed by the workflow only'],
  [RULED_LABEL, '0E8A16', 'Fable has ruled on this taste-ruling question'],
];
export const WORKFLOW = 'routine-fable-taste-ruling.yml';
export const DAILY_CAP = 2;
export const FILED_MARKER = '<!-- taste-ruling-filed -->';
export const DISPATCH_MARKER = '<!-- taste-ruling-dispatched -->';
export const RULING_PREFIX = 'Ruling:';
const MAX_QUESTION = 600;
const MAX_CONTEXT = 4000;
const MAX_RULING = 6000;
const SIDES = { tree: 'Tree', marjorie: 'Marjorie' };
const firstLine = (err) => String(err?.message || err).split('\n')[0].slice(0, 200);
const authorOf = (x) => x?.user?.login ?? x?.author?.login;

/** Writes the one question an agent run may save; never touches GitHub. */
export function saveQuestion({ side, question, context = '', dir = '.scratch/out' }) {
  if (!SIDES[side]) throw new Error('--side must be tree or marjorie');
  const q = String(question ?? '').trim();
  if (!q) throw new Error('--question is required');
  mkdirSync(dir, { recursive: true });
  const taken = readdirSync(dir).filter((n) => n.startsWith('taste-ruling-') && n.endsWith('.json')).length;
  if (taken >= 1) return { saved: false, reason: 'one question already saved this run' };
  const file = path.join(dir, 'taste-ruling-1.json');
  writeFileSync(file, `${JSON.stringify({ side, question: q.slice(0, MAX_QUESTION), context: String(context).trim().slice(0, MAX_CONTEXT) })}\n`);
  return { saved: true, file };
}

export function renderIssue({ side, question, context }, { sourceUrl = '' } = {}) {
  const title = `taste-ruling: ${question.replace(/\s+/g, ' ').slice(0, 80)}`;
  const body = [
    FILED_MARKER,
    `Asked by: ${SIDES[side]}${sourceUrl ? ` (${sourceUrl})` : ''}`,
    '',
    '## Question',
    question,
    '',
    '## Context',
    context || '(none given)',
    '',
    'Fable rules on this (`routine-fable-taste-ruling.yml`). Not a guardrail question — anything touching `docs/social/guardrails.md` goes to the owner as a `founder-decision` instead.',
  ].join('\n');
  return { title, body };
}

export async function ensureTasteLabels({ repo = REPO, gh = ghRun, log = console.log } = {}) {
  for (const [name, color, description] of TASTE_LABELS) {
    try {
      await gh(['label', 'create', name, '--repo', repo, '--color', color, '--description', description, '--force']);
    } catch (err) {
      log(`::warning::taste-ruling: could not ensure label ${name}: ${firstLine(err)}`);
    }
  }
}

const commentsOf = async (number, { repo, gh }) => (await apiFor(gh)(`/repos/${repo}/issues/${number}/comments?per_page=100`)) || [];
const trusted = (comments, test) => (comments || []).filter((c) => FILER_LOGINS.has(authorOf(c)) && test(String(c.body ?? '')));

/** Runs of the routine created since UTC midnight (any actor, including a run still going). */
export async function rulingsToday({ repo = REPO, gh = ghRun, now = Date.now() } = {}) {
  const query = new URLSearchParams({ created: `>=${utcDay(now)}`, per_page: '1' });
  const res = await apiFor(gh)(`/repos/${repo}/actions/workflows/${WORKFLOW}/runs?${query}`);
  return Number(res?.total_count) || 0;
}

/** Starts the Fable routine for one freshly filed question. Never throws. */
export async function dispatchRuling(number, { repo = REPO, gh = ghRun, now = Date.now(), cap = DAILY_CAP, log = console.log } = {}) {
  const skip = (reason) => {
    log(`taste-ruling: #${number} not dispatched (${reason})`);
    return { dispatched: false, reason };
  };
  try {
    if (trusted(await commentsOf(number, { repo, gh }), (b) => b.includes(DISPATCH_MARKER)).length > 0) return skip('already dispatched');
    const used = await rulingsToday({ repo, gh, now });
    if (used >= cap) {
      await gh(['issue', 'comment', String(number), '--repo', repo, '--body', `Not started automatically (daily cap ${used}/${cap}); Marjorie's weekly review rules on it.`]).catch(() => {});
      return skip(`daily cap ${used}/${cap}`);
    }
    await gh(['issue', 'comment', String(number), '--repo', repo, '--body', `Started Fable's taste ruling for this question.\n\n${DISPATCH_MARKER}`]);
    await gh(['workflow', 'run', WORKFLOW, '--repo', repo, '--ref', 'main', '-f', `issue_number=${number}`]);
    log(`taste-ruling: #${number} → ${WORKFLOW} (${used + 1}/${cap} today)`);
    return { dispatched: true, reason: 'ok' };
  } catch (err) {
    log(`::warning::taste-ruling: #${number} dispatch failed: ${firstLine(err)}`);
    return { dispatched: false, reason: 'error' };
  }
}

/** Files the question an agent saved (workflow identity), skipping a duplicate open one; dispatches a NEW filing. */
export async function fileQuestion({ dir, sourceUrl = '', dispatch = false }, { repo = REPO, gh = ghRun, now = Date.now(), log = console.log } = {}) {
  let entry = null;
  try {
    const name = readdirSync(dir).filter((n) => n.startsWith('taste-ruling-') && n.endsWith('.json')).sort()[0];
    if (name) entry = JSON.parse(readFileSync(path.join(dir, name), 'utf8'));
  } catch {
    entry = null;
  }
  if (!entry || !SIDES[entry.side] || typeof entry.question !== 'string' || !entry.question.trim()) {
    log('taste-ruling: no valid question saved — nothing to file.');
    return { filed: false };
  }
  try {
    await ensureTasteLabels({ repo, gh, log });
    const { title, body } = renderIssue(entry, { sourceUrl });
    const open = await listIssuesByLabels(apiFor(gh), { repo, labels: [TASTE_LABEL], state: 'open' });
    const dup = open.find((i) => i.title === title && FILER_LOGINS.has(i.author?.login));
    if (dup) {
      log(`taste-ruling: already open as #${dup.number} — not refiled.`);
      return { filed: false, number: dup.number };
    }
    const created = await gh(['issue', 'create', '--repo', repo, '--title', title, '--body', body, '--label', TASTE_LABEL]);
    const number = Number(String(created.stdout ?? '').trim().match(/\/issues\/(\d+)\s*$/)?.[1]);
    if (!number) throw new Error(`gh issue create printed no issue URL: ${created.stdout}`);
    log(`taste-ruling: filed #${number} (${entry.side})`);
    if (dispatch) await dispatchRuling(number, { repo, gh, now, log });
    return { filed: true, number };
  } catch (err) {
    log(`::warning::taste-ruling: filing failed: ${firstLine(err)}`);
    return { filed: false };
  }
}

/** What the Fable routine may read: one trusted, open, unruled question — or a reason to skip. */
export async function prepareQuestion(number, { repo = REPO, gh = ghRun, now = Date.now() } = {}) {
  const n = Number(number);
  if (!Number.isInteger(n) || n <= 0) return { ok: false, reason: 'no issue number' };
  const issue = await apiFor(gh)(`/repos/${repo}/issues/${n}`);
  if (!issue || issue.pull_request) return { ok: false, reason: 'not an issue' };
  if (String(issue.state).toLowerCase() !== 'open') return { ok: false, reason: 'issue is not open' };
  if (!(issue.labels || []).some((l) => l.name === TASTE_LABEL)) return { ok: false, reason: `no ${TASTE_LABEL} label` };
  if (!FILER_LOGINS.has(authorOf(issue)) || !String(issue.body ?? '').includes(FILED_MARKER)) {
    return { ok: false, reason: 'not filed by the workflow identity (public repo: untrusted)' };
  }
  const comments = await commentsOf(n, { repo, gh });
  if (trusted(comments, (b) => b.trimStart().startsWith(RULING_PREFIX)).length > 0) return { ok: false, reason: 'already ruled' };
  const used = await rulingsToday({ repo, gh, now });
  if (used > DAILY_CAP) return { ok: false, reason: `daily cap ${DAILY_CAP} reached` };
  return { ok: true, question: { number: n, title: issue.title, body: String(issue.body).slice(0, MAX_CONTEXT + MAX_QUESTION + 800), url: issue.html_url } };
}

/** Posts the agent's `Ruling:` file as the workflow identity, labels and closes the issue. Never throws. */
export async function postRuling(number, file, { repo = REPO, gh = ghRun, log = console.log } = {}) {
  let text;
  try {
    text = readFileSync(file, 'utf8').trim();
  } catch {
    log(`::warning::taste-ruling: no ruling file at ${file} — #${number} stays open.`);
    return { posted: false, reason: 'no file' };
  }
  if (!text.startsWith(RULING_PREFIX) || text.length > MAX_RULING) {
    log(`::warning::taste-ruling: ruling for #${number} must start with "${RULING_PREFIX}" and be under ${MAX_RULING} characters — not posted.`);
    return { posted: false, reason: 'malformed' };
  }
  try {
    await ensureTasteLabels({ repo, gh, log });
    await gh(['issue', 'comment', String(number), '--repo', repo, '--body', text]);
    await gh(['issue', 'edit', String(number), '--repo', repo, '--add-label', RULED_LABEL]);
    await gh(['issue', 'close', String(number), '--repo', repo, '--reason', 'completed']);
    return { posted: true };
  } catch (err) {
    log(`::warning::taste-ruling: posting the ruling for #${number} failed: ${firstLine(err)}`);
    return { posted: false, reason: 'error' };
  }
}

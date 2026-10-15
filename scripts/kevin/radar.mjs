// Cheap path for Kevin's Stream 3 comment radar. Code finds unseen human
// comments; Jev only assigns fixed kind/severity labels. Any uncertainty or
// I/O failure leaves the unchanged Claude routine responsible for the run.
import { appendFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { gh as ghRun, ghApi } from '../lib/gh.mjs';
import { choiceQuestion, createJevClient } from '../lib/jev.mjs';

export const RADAR_CONFIDENCE = 0.72;
export const LOOKBACK_MINUTES = 70;
export const MAX_COMMENTS = 100;
export const MAX_FINDINGS = 25;
export const DEFAULT_REPO = 'JW-Incorporated/swift2';

const EXCLUDED_AUTHORS = new Set(['vercel', 'github-actions', 'wjduvall-cmd']);
const KIND = choiceQuestion('kind', 'Classify this GitHub comment by Kevin radar behavior. A review finding must be on an open pull request. A decision answer must directly answer an explicitly open decisions-needed item. Otherwise choose other.', [
  { id: 'review_finding', label: 'Review finding or verdict on an open pull request' },
  { id: 'decision_answer', label: 'Answer to an open decisions-needed plan or triage item' },
  { id: 'other', label: 'Other Stream 3 activity or status update' },
]);
const SEVERITY = choiceQuestion('severity', 'Classify whether the comment requires a developer or owner action. Choose unclear when the text does not establish that safely.', [
  { id: 'actionable', label: 'Action is required' },
  { id: 'informational', label: 'Informational or already complete' },
  { id: 'unclear', label: 'Unclear whether action is required' },
]);

const issueNumber = (url) => Number(String(url || '').match(/\/issues\/(\d+)(?:$|[/?#])/)?.[1]);
const labelsOf = (thread) => (thread.labels || []).map((label) => typeof label === 'string' ? label : label.name);
const clean = (value, cap = 220) => {
  const flat = String(value || '').replace(/[[\]`<>|*_~#]/g, '').replace(/\s+/g, ' ').trim();
  return flat.length > cap ? `${flat.slice(0, cap - 1).trimEnd()}…` : flat;
};
const authorName = (login) => login === 'sffan15-sys' ? 'Joey' : clean(login, 50);
const isPullRequest = (thread) => Boolean(thread.pull_request);

export function parseSeen(body = '') {
  const match = String(body).match(/<!--\s*seen:\s*([^>]*)-->/i);
  return new Set((match?.[1] || '').split(',').map((id) => id.trim()).filter(Boolean));
}

export function selectCandidates(comments, threads, seen, now = new Date()) {
  const oldest = now.getTime() - LOOKBACK_MINUTES * 60_000;
  const unique = new Map();
  for (const comment of comments) {
    const login = String(comment.user?.login || '').replace(/\[bot\]$/i, '');
    const at = Date.parse(comment.created_at);
    if (!Number.isFinite(at)) throw new Error(`comment ${comment.id} has an invalid created_at`);
    if (at < oldest || at > now.getTime()) continue;
    if (comment.user?.type !== 'User' || EXCLUDED_AUTHORS.has(login) || seen.has(String(comment.id))) continue;
    const number = issueNumber(comment.issue_url);
    const thread = threads.get(number);
    if (!number || !thread) throw new Error(`comment ${comment.id} has no readable thread`);
    const labels = labelsOf(thread);
    if (labels.includes('cie') || labels.includes('user-feedback')) continue;
    unique.set(String(comment.id), { ...comment, number, thread, body: String(comment.body || '').slice(0, 400) });
  }
  return [...unique.values()].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
}

export async function classifyFinding(finding, client) {
  const threadType = isPullRequest(finding.thread) ? 'pull request' : 'issue';
  const result = await client.ask({
    caller: 'kevin-radar',
    state: `${threadType} #${finding.number} (${finding.thread.state}): ${finding.thread.title}\nComment by ${finding.user.login}: ${finding.body}`,
    questions: [KIND, SEVERITY],
  });
  const kind = result.answers.kind;
  const severity = result.answers.severity;
  if (kind?.type !== 'choice' || severity?.type !== 'choice') throw new Error('Jev did not return radar choices');
  if (kind.confidence < RADAR_CONFIDENCE || severity.confidence < RADAR_CONFIDENCE || severity.optionId === 'unclear') {
    return { handled: false, reason: 'low-confidence', kind: kind.optionId, severity: severity.optionId };
  }
  if (kind.optionId === 'review_finding' && (!isPullRequest(finding.thread) || finding.thread.state !== 'open')) {
    return { handled: false, reason: 'inconsistent-review-kind' };
  }
  // Updating an arbitrary phased-plan entry is not a safe mechanical edit.
  if (kind.optionId === 'decision_answer') return { handled: false, reason: 'decision-needs-agent' };
  return { handled: true, kind: kind.optionId, severity: severity.optionId };
}

function priorContent(body) {
  return String(body || '')
    .replace(/^Stream 3 comment radar run[^\n]*\n*/i, '')
    .replace(/<!--\s*seen:[^>]*-->/gi, '')
    .replace(/\n*---\nTier-2: Kevin — S3 comment radar[\s\S]*$/i, '')
    .trim();
}

export function renderRadarBody(existingBody, findings, seen, now = new Date()) {
  const ids = [...seen, ...findings.map(({ comment }) => String(comment.id))];
  const marker = `<!-- seen: ${[...new Set(ids)].join(',')} -->`;
  const entries = findings.map(({ comment, classification }) => {
    const type = isPullRequest(comment.thread) ? 'PR' : 'Issue';
    const kind = classification.kind === 'review_finding' ? 'PR review finding' : 'other Stream 3 activity';
    const action = classification.severity === 'actionable'
      ? ' · **needs Wyatt / in-session dev pass**'
      : '';
    return `**${type} #${comment.number}** — ${authorName(comment.user.login)}: ${clean(comment.body)}\n- [Comment](${comment.html_url})\n- Kind: ${kind} · Severity: ${classification.severity}${action}`;
  }).join('\n\n');
  const prior = priorContent(existingBody);
  const time = now.toISOString().replace(/:\d{2}\.\d{3}Z$/, ' UTC');
  const section = `## Stream 3 activity${prior ? ` — ${time}` : ''}\n\n${entries}`;
  return `Stream 3 comment radar run ${time}.\n\n${marker}\n\n${prior ? `${prior}\n\n` : ''}${section}\n\n---\nTier-2: Kevin — S3 comment radar`;
}

async function readInputs(api, repo, now) {
  const since = new Date(now.getTime() - LOOKBACK_MINUTES * 60_000).toISOString();
  const comments = await api(`/repos/${repo}/issues/comments?since=${encodeURIComponent(since)}&per_page=${MAX_COMMENTS}`);
  if (!Array.isArray(comments)) throw new Error('comments response was not an array');
  if (comments.length >= MAX_COMMENTS) throw new Error(`comment window reached the ${MAX_COMMENTS}-item read cap`);
  const radarRows = await api(`/repos/${repo}/issues?state=open&labels=kevin-radar&sort=created&direction=desc&per_page=1`);
  if (!Array.isArray(radarRows)) throw new Error('radar issue response was not an array');
  const numbers = [...new Set(comments.map((comment) => issueNumber(comment.issue_url)).filter(Boolean))];
  const rows = await Promise.all(numbers.map(async (number) => [number, await api(`/repos/${repo}/issues/${number}`)]));
  return { comments, radar: radarRows[0] || null, threads: new Map(rows) };
}

async function publish(body, radar, title, repo, gh) {
  if (radar?.title === title) {
    await gh(['issue', 'edit', String(radar.number), '--repo', repo, '--body', body]);
    return;
  }
  await gh(['label', 'create', 'kevin-radar', '--repo', repo, '--color', '1D76DB', '--description', 'Kevin Stream 3 comment radar', '--force']);
  await gh(['issue', 'create', '--repo', repo, '--title', title, '--label', 'kevin-radar', '--body', body]);
}

export async function handleRadar({ api, gh, client, repo = DEFAULT_REPO, now = new Date(), log = console.log }) {
  const { comments, radar, threads } = await readInputs(api, repo, now);
  const seen = parseSeen(radar?.body);
  const candidates = selectCandidates(comments, threads, seen, now);
  if (!candidates.length) {
    log('Stream 3 radar: no new comments');
    return { handled: true, findings: [] };
  }
  if (candidates.length > MAX_FINDINGS) return { handled: false, reason: 'finding-cap' };
  const findings = [];
  for (const comment of candidates) {
    const classification = await classifyFinding(comment, client);
    if (!classification.handled) return classification;
    findings.push({ comment, classification });
  }
  const date = now.toISOString().slice(0, 10);
  const title = `Kevin Review Radar — ${date}`;
  const body = renderRadarBody(radar?.title === title ? radar.body : '', findings, seen, now);
  await publish(body, radar, title, repo, gh);
  log(`Stream 3 radar: surfaced ${findings.length} new comment${findings.length === 1 ? '' : 's'}`);
  return { handled: true, findings, body };
}

function usageLogger(env, log) {
  return (usage) => {
    const line = `Jev usage: ${usage.caller} · input ${usage.inputTokens} · output ${usage.outputTokens} · estimated $${usage.estCostUsd.toFixed(8)}`;
    if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, `\n- ${line}\n`);
    else log(line);
  };
}

const writeHandled = (env, handled) => {
  if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, `handled=${handled ? 'true' : 'false'}\n`);
};

export async function main({
  env = process.env, api = ghApi, gh = ghRun, clientFactory = createJevClient, now = () => new Date(), log = console.log,
} = {}) {
  if (!env.TYPESAFE_API_KEY) {
    log('Kevin radar: TYPESAFE_API_KEY is absent; using the Claude fallback');
    writeHandled(env, false);
    return 0;
  }
  try {
    const client = clientFactory({ apiKey: env.TYPESAFE_API_KEY, logUsage: usageLogger(env, log) });
    const result = await handleRadar({ api, gh, client, repo: env.GITHUB_REPOSITORY || DEFAULT_REPO, now: now(), log });
    writeHandled(env, result.handled);
    if (!result.handled) log(`Kevin radar: ${result.reason}; using the Claude fallback`);
  } catch (error) {
    writeHandled(env, false);
    log(`Kevin radar: ${error instanceof Error ? error.message : String(error)}; using the Claude fallback`);
  }
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMain(() => main(), { name: 'kevin-radar' });
}

import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { gh as ghRun } from '../lib/gh.mjs';
import { createJevClient, createJevUsageLogger, noulQuestion } from '../lib/jev.mjs';
import { serviceClient } from '../lib/supabase.mjs';
import { deriveHandledState, matchAlertTitle } from '../marjorie/lib/alert-router.mjs';
import { isTrustedBotAuthor } from '../marjorie/lib/chase-auto-defer.mjs';
import { isFounderFacing } from '../marjorie/lib/alert-notify.mjs';
import { evaluateDispatchChase } from '../marjorie/lib/dispatch-chase.mjs';
import { fetchDispatchChaseState } from '../marjorie/lib/dispatch-chase-state.mjs';
import { evaluate as evaluateOpsFixTrust, TRUSTED_BOT } from '../marjorie/ops-fix-trust.mjs';

export const NEEDS_ACTION_THRESHOLD = 0.7;
const DAY_MS = 24 * 60 * 60 * 1000;
const RED_AFTER_MS = 6 * 60 * 60 * 1000;
const STALE_AFTER_MS = 48 * 60 * 60 * 1000;
const WATCHDOG_MUST_RUN_AFTER_MS = 12 * 60 * 60 * 1000;
const FAILED = new Set(['failure', 'timed_out', 'action_required', 'startup_failure']);
const HOLD_LABELS = new Set(['hold', 'cie:escalate', 'founder-decision']);
const CONTENT_PREFIXES = ['content-shift/', 'content/', 'vault/', 'depth/answerer-', 'growth/', 'fix/karen-tickets'];
const QUESTION = noulQuestion('needs_action', 'Does this need an agent action now?');

const parse = (result) => JSON.parse(result?.stdout || '[]');
const labels = (row) => (row.labels || []).map((label) => typeof label === 'string' ? label : label.name).filter(Boolean);
const clipped = (value, size = 500) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, size);
const age = (value, now) => Math.max(0, now - Date.parse(value || 0));

export async function collectOpsSnapshot({ gh = ghRun, repo, now = Date.now(), chaseState = fetchDispatchChaseState } = {}) {
  const target = repo || process.env.GITHUB_REPOSITORY || 'JW-Incorporated/swift2';
  const [alerts, runs, prs, opsFixCandidates, chase] = await Promise.all([
    gh(['issue', 'list', '--repo', target, '--label', 'watchdog-alert', '--state', 'open', '--limit', '100', '--json', 'number,title,body,url,createdAt,updatedAt,comments']),
    gh(['run', 'list', '--repo', target, '--branch', 'main', '--limit', '100', '--json', 'databaseId,workflowName,name,status,conclusion,event,headBranch,createdAt,updatedAt,url']),
    gh(['pr', 'list', '--repo', target, '--state', 'open', '--limit', '200', '--json', 'number,title,url,createdAt,updatedAt,isDraft,headRefName,labels,statusCheckRollup']),
    gh(['issue', 'list', '--repo', target, '--state', 'open', '--limit', '100', '--search', 'label:"desk:ops-fix" -label:"ops-fix:dispatched" -label:"ops-fix:stuck" label:marjorie-filed,routine-failure', '--json', 'number,title,url,updatedAt,labels,author']),
    chaseState(target, { now }),
  ]);
  const opsFixes = [];
  for (const row of parse(opsFixCandidates)) {
    const login = row.author?.login || '';
    let role = '';
    if (login && !TRUSTED_BOT.test(login)) {
      try {
        role = String((await gh(['api', `repos/${target}/collaborators/${login}/permission`, '--jq', '.role_name'])).stdout || '').trim();
      } catch { /* the trust gate fails closed for an unreadable role */ }
    }
    if (evaluateOpsFixTrust({ login, labels: labels(row), role }).ok) opsFixes.push(row);
  }
  const alertRows = await Promise.all(parse(alerts).map(async (row) => {
    if (!row.comments?.length) return row;
    try {
      const raw = JSON.parse(String((await gh(['api', `repos/${target}/issues/${row.number}/comments`, '--paginate', '--slurp'])).stdout || '[]')).flat();
      return { ...row, comments: raw.map((c, i) => ({ body: c.body || '', author: { login: c.user?.login, type: c.user?.type }, viewerDidAuthor: row.comments[i]?.viewerDidAuthor === true })) };
    } catch {
      console.warn(`marjorie-ops precheck: REST comment re-read failed for #${row.number}; falling back (bot markers ignored)`);
      return row;
    }
  }));
  return { alerts: alertRows, runs: parse(runs), prs: parse(prs), opsFixes, chasePlan: evaluateDispatchChase(chase), now };
}

function isContent(row) {
  const names = labels(row);
  return names.some((name) => ['content-shift', 'cie', 'automerge:content'].includes(name)) ||
    CONTENT_PREFIXES.some((prefix) => String(row.headRefName || '').startsWith(prefix));
}

function buildCheck(row) {
  return (row.statusCheckRollup || []).find((check) => (check.name || check.context) === 'build');
}

// Marjorie posts her ledger markers as the claude Bot, not the viewer; trust the chase-auto-defer bot set.
export const trustMarkerAuthors = (comments) => comments.map((c) => ({ ...c, viewerDidAuthor: c.viewerDidAuthor === true || isTrustedBotAuthor(c.author || c.user) }));

export function buildOpsSignals(snapshot) {
  const now = Number(snapshot.now) || Date.now();
  const signals = (snapshot.alerts || []).map((row) => {
    const handler = matchAlertTitle(row.title);
    const ledger = deriveHandledState(trustMarkerAuthors(Array.isArray(row.comments) ? row.comments : []));
    const oldUnhandled = ledger === 'unhandled' && age(row.createdAt, now) > WATCHDOG_MUST_RUN_AFTER_MS;
    const mustRun = oldUnhandled || handler === 'prod-smoke-check-failing' || isFounderFacing(row.title);
    return {
      id: `watchdog-alert:#${row.number}`, kind: 'watchdog-alert', targets: [row.number],
      ...(mustRun ? { mustRun: true } : {}),
      context: `Open watchdog alert #${row.number}; handler ${handler}; ledger state ${ledger}: ${clipped(row.title, 160)}. Open for ${Math.floor(age(row.createdAt, now) / 3_600_000)}h. ${clipped(row.body, 260)}`,
    };
  });

  const latest = new Map();
  for (const run of snapshot.runs || []) {
    const key = run.workflowName || run.name;
    if (!key || latest.has(key) || age(run.createdAt, now) > DAY_MS || (run.headBranch && run.headBranch !== 'main')) continue;
    latest.set(key, run);
  }
  for (const run of latest.values()) if (run.status === 'completed' && FAILED.has(run.conclusion)) {
    const workflow = clipped(run.workflowName || run.name, 140);
    const mustRun = run.headBranch === 'main' && (/^routine-/i.test(workflow) || /(^|[-\s])deploy(?:ment)?($|[-\s])/i.test(workflow));
    signals.push({ id: `red-workflow:${run.databaseId}`, kind: 'red-workflow', targets: [run.databaseId],
      ...(mustRun ? { mustRun: true } : {}),
      context: `Latest ${run.event || 'workflow'} run of ${workflow} on ${run.headBranch || 'an unknown branch'} is ${run.conclusion}: ${run.url || ''}` });
  }

  for (const pr of (snapshot.prs || []).filter((row) => !row.isDraft)) {
    const names = labels(pr);
    if (isContent(pr) && names.some((name) => HOLD_LABELS.has(name))) {
      signals.push({ id: `held-content:#${pr.number}`, kind: 'held-content', targets: [pr.number],
        context: `Content PR #${pr.number} is held by ${names.filter((name) => HOLD_LABELS.has(name)).join(', ')}: ${clipped(pr.title, 180)}. ${pr.url || ''}` });
    }
    const check = buildCheck(pr);
    const failing = check && FAILED.has(String(check.conclusion || '').toLowerCase()) && age(check.completedAt || check.startedAt || pr.updatedAt, now) >= RED_AFTER_MS;
    const missing = !check && age(pr.createdAt, now) >= STALE_AFTER_MS;
    if (failing || missing) signals.push({ id: `stuck-pr:#${pr.number}`, kind: 'stuck-pr', targets: [pr.number],
      context: `Open PR #${pr.number} has ${failing ? `a ${check.conclusion} build older than 6h` : 'no build check after 48h'}: ${clipped(pr.title, 180)}. ${pr.url || ''}` });
  }

  const plan = snapshot.chasePlan || {};
  const chaseTargets = [...(plan.nudges || []).map((row) => row.issue), ...(plan.humanActions || []).map((row) => row.issue), ...(plan.pendingHumanActions || [])];
  if (chaseTargets.length) signals.push({ id: 'chase-work', kind: 'chase-work', targets: chaseTargets,
    mustRun: true,
    context: `Deterministic chase plan has ${(plan.nudges || []).length} nudges, ${(plan.humanActions || []).length} human actions, and ${(plan.pendingHumanActions || []).length} pending chase PRs. Targets: ${chaseTargets.map((n) => `#${n}`).join(', ')}` });
  for (const row of plan.brief?.held || []) signals.push({ id: `held-content:chase-#${row.number}`, kind: 'held-content', targets: [row.number],
    context: `Dispatched issue #${row.number} is held (${row.held?.status || 'deferred'}); the status page already records it. ${clipped(row.issue?.title, 180)}` });
  for (const row of snapshot.opsFixes || []) signals.push({ id: `ops-fix:#${row.number}`, kind: 'ops-fix', targets: [row.number],
    mustRun: true,
    context: `Undispatched ops-fix candidate #${row.number}: ${clipped(row.title, 220)}. ${row.url || ''}` });
  return signals;
}

export async function judgeOpsSignals(signals, client) {
  const judged = [];
  for (const signal of signals) {
    const result = await client.ask({ caller: 'marjorie-ops-precheck', state: signal.context, questions: [QUESTION] });
    const answer = result.answers.needs_action;
    if (answer?.type !== 'noul') throw new Error('Jev did not return a Noul probability');
    judged.push({ ...signal, probability: answer.probability });
  }
  return judged;
}

function summary(decision, summaryFile) {
  const agent = decision.mode === 'skip' ? 'skipped' : decision.mode === 'flagged'
    ? `ran(${decision.flagged.length} flagged)` : `ran(fail-open: ${decision.reason})`;
  const lines = ['### Marjorie ops precheck', '', `- agent: ${agent}`, '', '| signal | decision |', '|---|---:|'];
  for (const signal of decision.signals) lines.push(`| ${signal.id.replaceAll('|', '\\|')} | ${signal.mustRun ? 'must-run' : signal.probability == null ? 'not judged' : signal.probability.toFixed(3)} |`);
  if (!decision.signals.length) lines.push('| none | — |');
  appendFileSync(summaryFile, `${lines.join('\n')}\n`);
}

export async function runPrecheck({ env = process.env, collect = collectOpsSnapshot, clientFactory = createJevClient } = {}) {
  let snapshot;
  try {
    snapshot = await collect({ repo: env.GITHUB_REPOSITORY });
  } catch (error) {
    return { mode: 'fail-open', reason: `data read failed: ${clipped(error?.message || error, 160)}`, signals: [], flagged: [], chasePlan: null };
  }
  const signals = buildOpsSignals(snapshot);
  if (!env.TYPESAFE_API_KEY) return { mode: 'fail-open', reason: 'TYPESAFE_API_KEY missing', signals, flagged: [], chasePlan: snapshot.chasePlan };
  try {
    const client = clientFactory({
      apiKey: env.TYPESAFE_API_KEY,
      usageLogger: createJevUsageLogger(serviceClient(env)),
    });
    const optional = signals.filter((signal) => !signal.mustRun);
    const judgedOptional = await judgeOpsSignals(optional, client);
    const optionalById = new Map(judgedOptional.map((signal) => [signal.id, signal]));
    const judged = signals.map((signal) => signal.mustRun ? signal : optionalById.get(signal.id));
    const flagged = judged.filter((signal) => signal.mustRun || signal.probability >= NEEDS_ACTION_THRESHOLD);
    return { mode: flagged.length ? 'flagged' : 'skip', signals: judged, flagged, chasePlan: snapshot.chasePlan };
  } catch (error) {
    return { mode: 'fail-open', reason: `Jev failed: ${clipped(error?.message || error, 160)}`, signals, flagged: [], chasePlan: snapshot.chasePlan };
  }
}

export async function main(argv = process.argv.slice(2), deps = {}) {
  const env = deps.env || process.env;
  const out = argv[0] || '.scratch/marjorie-ops-precheck.json';
  const decision = await runPrecheck(deps);
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify({ ...decision, chasePlan: undefined }, null, 2)}\n`);
  if (decision.chasePlan) writeFileSync(path.join(path.dirname(out), 'dispatch-chase-plan.json'), `${JSON.stringify(decision.chasePlan)}\n`);
  if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT,
    `handled=${decision.mode === 'skip'}\nflagged=${decision.flagged.length}\nautodefer=${decision.chasePlan?.autoDefers?.length ? 'yes' : 'no'}\n`);
  if (env.GITHUB_STEP_SUMMARY) summary(decision, env.GITHUB_STEP_SUMMARY);
  else console.log(`agent: ${decision.mode === 'skip' ? 'skipped' : decision.mode === 'flagged' ? `ran(${decision.flagged.length} flagged)` : `ran(fail-open: ${decision.reason})`}`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) runMain(() => main(), { name: 'marjorie-ops-precheck' });

import { readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { evaluateDispatchChase, renderHumanAction } from './dispatch-chase.mjs';
import { fetchDispatchChaseState } from './dispatch-chase-state.mjs';

const execFileAsync = promisify(execFile);
const CHASE_96 = /<!--\s*marjorie-chase:\s*96h\s+issue=(\d+)\b[^>]*-->/gi;
const SOURCE_96 = /<!--\s*marjorie-chase:\s*96h\s+issue=(\d+)\s+ha=(\d+)\s+pr=(\d+)\s*-->/i;

async function shell(command, args, options = {}) {
  return execFileAsync(command, args, { encoding: 'utf8', ...options });
}

function text(result) { return String(result?.stdout ?? result ?? ''); }
function numbers(markdown) {
  return [...String(markdown || '').matchAll(/^(?:##|-\s+)\s*#(\d+)\b/gm)].map((match) => Number(match[1]));
}
function pendingTexts(pendingHaPrs = []) {
  return pendingHaPrs.flatMap((entry) => typeof entry === 'string' ? [entry] : [entry.actionsText]);
}

/** Allocate from main's two ledgers plus every open PR head that edits either ledger. */
export function allocatePendingHumanActionNumber({ openActions = '', doneActions = '', pendingHaPrs = [] } = {}) {
  return Math.max(0, ...numbers(openActions), ...numbers(doneActions), ...pendingTexts(pendingHaPrs).flatMap(numbers)) + 1;
}

/** Prove a newly selected number occurs exactly once, exclusively in one pending head. */
export function checkPendingHumanActionNumber({ number, openActions = '', doneActions = '', pendingHaPrs = [] } = {}) {
  const mainCount = numbers(openActions).concat(numbers(doneActions)).filter((value) => value === number).length;
  const pendingCount = pendingTexts(pendingHaPrs).flatMap(numbers).filter((value) => value === number).length;
  return { valid: mainCount === 0 && pendingCount === 1, mainCount, pendingCount };
}

export const allocateHumanActionNumber = allocatePendingHumanActionNumber;
export const checkHumanActionNumber = checkPendingHumanActionNumber;

/** Insert new v2 actions newest-first without disturbing the document intro. */
export function prependHumanActions(markdown, blocks) {
  const first = String(markdown).search(/^##\s+#\d+\b/m);
  const introEnd = first < 0 ? String(markdown).length : first;
  let countFound = false;
  const intro = String(markdown).slice(0, introEnd).replace(/>\s+\*\*(\d+) open\.\*\*/, (_all, count) => {
    countFound = true;
    return `> **${Number(count) + blocks.length} open.**`;
  });
  if (!countFound) throw new Error('dispatch chase: human-actions count missing');
  const rest = first < 0 ? '' : `\n\n${String(markdown).slice(first)}`;
  return `${intro.trimEnd()}\n\n${[...blocks].sort((a, b) => numbers(b)[0] - numbers(a)[0]).join('\n\n')}${rest}`;
}

function branchFor(candidates) {
  return `marjorie/chase-ha-${candidates.map((item) => item.issue).sort((a, b) => a - b).join('-')}`;
}
function sourceMarker(issue, number, pr) {
  return `<!-- marjorie-chase: 96h issue=${issue} ha=${number} pr=${pr} -->`;
}
function sourceAlreadyMarked(issue, comments) {
  return (comments || []).some((comment) => Number(SOURCE_96.exec(String(comment.body || ''))?.[1]) === issue);
}

function numberForIssue(markdown, issue) {
  return String(markdown || '').split(/(?=^##\s+#\d+\b)/m).find((block) =>
    new RegExp(`marjorie-chase:\\s*96h\\s+issue=${issue}\\b`).test(block),
  )?.match(/^##\s+#(\d+)\b/m)?.[1];
}

async function createCombinedPr(repo, branch, blocks, { exec, readFileImpl, writeFileImpl }) {
  let remoteBranch = false;
  try {
    await exec('git', ['ls-remote', '--exit-code', '--heads', 'origin', branch]);
    await exec('git', ['fetch', 'origin', branch]);
    await exec('git', ['checkout', '--detach', `origin/${branch}`]);
    await exec('git', ['checkout', '-b', branch]);
    remoteBranch = true;
  } catch {
    await exec('git', ['checkout', '--detach', 'origin/main']);
    await exec('git', ['checkout', '-b', branch]);
  }
  const existing = await readFileImpl('HUMAN-ACTIONS.md', 'utf8');
  const missing = blocks.filter((block) => !existing.includes(block.match(CHASE_96)?.[0] || block));
  if (missing.length) {
    await writeFileImpl('HUMAN-ACTIONS.md', prependHumanActions(existing, missing));
    await exec('git', ['add', 'HUMAN-ACTIONS.md']);
    await exec('git', ['commit', '-m', `chore(marjorie): file chase decisions ${branch.split('-').at(-1)}`]);
    await exec('git', ['push', '-u', 'origin', branch]);
  } else if (!remoteBranch) {
    throw new Error('dispatch chase: new branch already contains candidate marker');
  }
  const title = `Marjorie: chase decisions ${branch.split('chase-ha-')[1].split('-').map((id) => `#${id}`).join(', ')}`;
  const ids = branch.split('chase-ha-')[1].split('-');
  const body = `Files the bounded 96-hour decision actions for ${ids.map((id) => `#${id}`).join(', ')}.\n\n<!-- marjorie-chase-pr: issues=${ids.join(',')} -->`;
  const url = text(await exec('gh', ['pr', 'create', '--repo', repo, '--base', 'main', '--head', branch, '--title', title, '--body', body])).trim();
  if (!/\/pull\/\d+$/.test(url)) throw new Error('dispatch chase: PR creation was not confirmed');
  return JSON.parse(text(await exec('gh', ['pr', 'view', branch, '--repo', repo, '--json', 'number,url,headRefName'])) || '{}');
}

function chaseEntries(pendingHaPrs) {
  return pendingHaPrs.flatMap((pr) => {
    const branch = /^marjorie\/chase-ha-(\d+(?:-\d+)*)$/.exec(pr.headRef || '');
    const body = /<!-- marjorie-chase-pr: issues=(\d+(?:,\d+)*) -->/.exec(pr.body || '');
    if (!branch || !body || branch[1].replaceAll('-', ',') !== body[1]) return [];
    return body[1].split(',').map((value) => Number(value)).map((issue) =>
      ({ pr, issue, number: Number(numberForIssue(pr.actionsText, issue)) }));
  });
}

async function resumePending(repo, state, pendingHaPrs, exec) {
  const entries = chaseEntries(pendingHaPrs);
  if (entries.some((entry) => !entry.pr.safeChaseHead || !entry.number))
    return { status: 'pending-reservation-conflict' };

  const obsoletePrs = new Set();
  for (const entry of entries) {
    if (state.issues.some((item) => Number(item.number) === entry.issue)) continue;
    let source;
    try {
      source = JSON.parse(text(await exec('gh', ['api', `repos/${repo}/issues/${entry.issue}`])) || '{}');
    } catch {
      return { status: 'pending-source-unreadable' };
    }
    if (source.state !== 'closed') return { status: 'pending-source-missing' };
    obsoletePrs.add(entry.pr.number);
  }
  for (const pr of pendingHaPrs.filter((item) => obsoletePrs.has(item.number)))
    await exec('gh', ['pr', 'close', String(pr.number), '--repo', repo]);

  const activePending = pendingHaPrs.filter((pr) => !obsoletePrs.has(pr.number));
  const activeEntries = entries.filter((entry) => !obsoletePrs.has(entry.pr.number));
  const conflicted = new Set(activeEntries.map((entry) => entry.issue)).size !== activeEntries.length || activeEntries.some((entry) =>
    !checkPendingHumanActionNumber({ number: entry.number, ...state, pendingHaPrs: activePending }).valid);
  if (conflicted) return { status: 'pending-reservation-conflict' };
  for (const entry of activeEntries) {
    const issue = state.issues.find((item) => Number(item.number) === entry.issue);
    if (!sourceAlreadyMarked(entry.issue, issue.comments))
      await exec('gh', ['issue', 'comment', String(entry.issue), '--repo', repo, '--body', `Filed HA #${entry.number} in PR #${entry.pr.number}: ${entry.pr.url}\n${sourceMarker(entry.issue, entry.number, entry.pr.number)}`]);
  }
  for (const pr of new Map(activeEntries.map((entry) => [entry.pr.number, entry.pr])).values())
    await exec('gh', ['pr', 'merge', String(pr.number), '--repo', repo, '--squash', '--auto', '--delete-branch', '--match-head-commit', pr.headSha]);
  return { status: activeEntries.length ? 'resumed' : obsoletePrs.size ? 'closed-obsolete' : 'none' };
}

/** Recollect after alert handlers, then perform the complete bounded chase exactly once. */
export async function applyDispatchChase(repo, {
  exec = shell, fetchState = fetchDispatchChaseState, readFileImpl = readFile,
  writeFileImpl = writeFile,
} = {}) {
  await exec('git', ['fetch', 'origin', 'main']);
  await exec('git', ['checkout', '--detach', 'origin/main']);
  const state = await fetchState(repo);
  const plan = evaluateDispatchChase(state);
  for (const nudge of plan.nudges)
    for (const target of nudge.targets)
      await exec('gh', [target.type, 'comment', String(target.number), '--repo', repo, '--body', nudge.body]);

  const pendingHaPrs = state.pendingHaPrs || [];
  const resumed = await resumePending(repo, state, pendingHaPrs, exec);
  if (resumed.status !== 'none') return { ...resumed, nudges: plan.nudges.length, plan };
  const candidates = plan.humanActions;
  if (!candidates.length) return { status: 'no-human-actions', nudges: plan.nudges.length, plan };
  const branch = branchFor(candidates);
  const start = allocatePendingHumanActionNumber({ ...state, pendingHaPrs });
  const blocks = candidates.map((item, index) => renderHumanAction({ ...item, number: start + index, now: state.now }).body);
  const pr = await createCombinedPr(repo, branch, blocks, { exec, readFileImpl, writeFileImpl });
  // The collector's ledger reads must come from main, not the just-pushed HA branch.
  await exec('git', ['fetch', 'origin', 'main']);
  await exec('git', ['checkout', '--detach', 'origin/main']);
  const createdState = await fetchState(repo);
  const result = await resumePending(repo, createdState, createdState.pendingHaPrs || [], exec);
  return { ...result, nudges: plan.nudges.length, branch, pr, humanActions: candidates };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  applyDispatchChase(process.argv[2] || process.env.GITHUB_REPOSITORY).then((result) => console.log(JSON.stringify({ status: result.status }))).catch(() => {
    console.error('dispatch chase apply: safe failure'); process.exitCode = 1;
  });
}

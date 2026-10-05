// Applies the GitHub half of one founder chase decision. The chat agent still
// opens the separate HA-close PR, keeping every ledger change reviewable.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { resolveChaseAction } from './lib/chase-action.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MAX_BUFFER = 20 * 1024 * 1024;
const gh = (execImpl, args) => execImpl('gh', args, { encoding: 'utf8', maxBuffer: MAX_BUFFER });

function argsOf(argv) {
  const out = { context: '', repo: '' };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--context' || argv[i] === '--repo') out[argv[i].slice(2)] = argv[++i] || '';
  }
  return out;
}

function ownedIssues(execImpl, repo) {
  const raw = gh(execImpl, ['api', `repos/${repo}/issues?state=all&labels=marjorie-filed&per_page=100`, '--paginate', '--slurp']);
  return JSON.parse(raw).flat().filter((issue) => !issue.pull_request);
}

function comments(execImpl, repo, issue) {
  const raw = gh(execImpl, ['api', `repos/${repo}/issues/${issue}/comments`, '--paginate', '--slurp']);
  return JSON.parse(raw).flat();
}

export function main(argv = process.argv.slice(2), { execImpl = execFileSync, root = ROOT } = {}) {
  const args = argsOf(argv);
  const repo = args.repo || process.env.GITHUB_REPOSITORY || '';
  if (!args.context || !repo) {
    console.error('usage: chase-action.mjs --context <chat-context.json> [--repo owner/repo]');
    return 2;
  }
  const input = {
    context: JSON.parse(readFileSync(args.context, 'utf8')),
    issues: ownedIssues(execImpl, repo),
    openMd: readFileSync(path.join(root, 'HUMAN-ACTIONS.md'), 'utf8'),
    doneMd: readFileSync(path.join(root, 'HUMAN-ACTIONS-DONE.md'), 'utf8'),
  };
  let plan = resolveChaseAction(input);
  if (!plan.ok) {
    console.log(`chase-action: no action (${plan.reason})`);
    return 1;
  }
  if (plan.noop) {
    console.log(`chase-action: no-op HA #${plan.ha}${plan.final ? ' (final)' : ''}`);
    return 0;
  }
  plan = resolveChaseAction({ ...input, comments: comments(execImpl, repo, plan.issue) });
  if (!plan.duplicate) gh(execImpl, ['issue', 'comment', String(plan.issue), '--repo', repo, '--body', plan.comment]);
  if (plan.label) gh(execImpl, ['issue', 'edit', String(plan.issue), '--repo', repo, '--add-label', plan.label]);
  if (plan.closeIssue) gh(execImpl, ['issue', 'close', String(plan.issue), '--repo', repo]);
  console.log(`chase-action: ${plan.action} issue #${plan.issue}; close HA #${plan.ha} as ${plan.haOutcome}`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMain(() => main(), { name: 'chase-action' });
}

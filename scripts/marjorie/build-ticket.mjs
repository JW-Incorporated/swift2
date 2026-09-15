// Mechanical half of M8 founder approval. Judgment stays in the chat prompt
// (or the founder reaction reader); this module only validates one resolved
// target and writes the canonical, link-only GitHub comment once per Discord
// message.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { hasApproval, isOpenBuildTicket, renderApproval, resolveChatApproval } from './lib/build-approval.mjs';

const MAX_BUFFER = 20 * 1024 * 1024;

function gh(execImpl, args) {
  return execImpl('gh', args, { encoding: 'utf8', maxBuffer: MAX_BUFFER });
}

export function listBuildTickets(execImpl, repo) {
  const out = gh(execImpl, ['api', `repos/${repo}/issues?state=open&labels=marjorie-filed%2Cdesk%3Abuild&per_page=100`, '--paginate', '--slurp']);
  return JSON.parse(out).flat().filter((issue) => !issue.pull_request).filter(isOpenBuildTicket);
}

export function issueComments(execImpl, repo, issueNumber) {
  const out = gh(execImpl, ['api', `repos/${repo}/issues/${issueNumber}/comments`, '--paginate', '--slurp']);
  return JSON.parse(out).flat().map((comment) => ({ body: comment.body, author: comment.user }));
}

export function approveResolved({ execImpl = execFileSync, repo, issue, messageId, messageUrl }) {
  if (!isOpenBuildTicket(issue)) return { ok: false, reason: 'target is not an open Marjorie build ticket' };
  const comments = issueComments(execImpl, repo, issue.number);
  if (hasApproval(comments, messageId)) return { ok: true, duplicate: true, issueNumber: issue.number };
  const body = renderApproval({ messageId, messageUrl });
  gh(execImpl, ['issue', 'comment', String(issue.number), '--repo', repo, '--body', body]);
  return { ok: true, duplicate: false, issueNumber: issue.number };
}

function argsOf(argv) {
  const out = { command: argv[0] || '', context: '', repo: '' };
  for (let i = 1; i < argv.length; i += 1) {
    if (argv[i] === '--context' || argv[i] === '--repo') out[argv[i].slice(2)] = argv[++i] || '';
  }
  return out;
}

export function main(argv = process.argv.slice(2), { execImpl = execFileSync } = {}) {
  const args = argsOf(argv);
  const repo = args.repo || process.env.GITHUB_REPOSITORY || '';
  if (args.command !== 'approve' || !args.context || !repo) {
    console.error('usage: build-ticket.mjs approve --context <chat-context.json> [--repo owner/repo]');
    return 2;
  }
  const context = JSON.parse(readFileSync(args.context, 'utf8'));
  const resolved = resolveChatApproval(context, listBuildTickets(execImpl, repo), { repo });
  if (!resolved.ok) {
    console.log(`approval: no action (${resolved.reason}${resolved.candidates.length ? `; candidates ${resolved.candidates.map((n) => `#${n}`).join(', ')}` : ''})`);
    return 1;
  }
  const result = approveResolved({ execImpl, repo, ...resolved });
  console.log(`approval: ${result.duplicate ? 'already recorded on' : 'recorded on'} #${result.issueNumber}`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMain(() => main(), { name: 'build-ticket' });
}

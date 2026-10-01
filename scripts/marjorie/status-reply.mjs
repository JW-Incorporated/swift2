// Entry point for the status-page reply job (Bots v2 W4). Reads the
// `issue_comment` event the workflow was fired with and hands it to
// lib/status-reply.mjs, which decides whether it is the owner's command.
// GH_TOKEN is the workflow token (ack comments post as the bot, so an ack is
// never mistaken for an owner command); PR_TOKEN is the PAT that opens the
// closing PR so required checks run on it.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { handleComment } from './lib/status-reply.mjs';
import { DEFAULT_REPO } from './status-page.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export async function main({ env = process.env, root = ROOT, exec = execFileSync } = {}) {
  const event = JSON.parse(readFileSync(env.GITHUB_EVENT_PATH, 'utf8'));
  const repo = env.GITHUB_REPOSITORY || DEFAULT_REPO;
  const run = (cmd, args, opts = {}) => exec(cmd, args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...env, ...opts.env } });
  const reply = async (text) => {
    run('gh', ['issue', 'comment', String(event.issue.number), '--repo', repo, '--body', text]);
  };
  const result = await handleComment({ event, root, run, reply, repo, prToken: env.PR_TOKEN || '' });
  console.log(`status reply: ${result.acted ? `closed #${result.number} via ${result.prUrl}` : `no action (${result.reason})`}`);
  return result.failed ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMain(() => main(), { name: 'status-reply' });
}

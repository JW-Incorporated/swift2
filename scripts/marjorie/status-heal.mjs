// Keeps the rolling human-action close PR (lib/status-closes.mjs) mergeable.
// Runs hourly and on every push to main (marjorie-status.yml, job `heal`): if
// the PR's branch no longer equals "main + every pending close" — main moved
// under it, or it went CONFLICTING — the bot-owned branch is rebuilt from main
// and force-pushed. No PR open is the usual case and does nothing.
// GH_TOKEN is the workflow token; PR_TOKEN is the PAT that pushes and edits the
// PR so required checks run on it.
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { syncCloses } from './lib/status-closes.mjs';
import { DEFAULT_REPO } from './status-page.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export async function main({ env = process.env, root = ROOT, exec = execFileSync, log = console.log } = {}) {
  const repo = env.GITHUB_REPOSITORY || DEFAULT_REPO;
  const run = (cmd, args, opts = {}) => exec(cmd, args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...env, ...opts.env } });
  try {
    const res = await syncCloses({ root, run, repo, prToken: env.PR_TOKEN || '', log });
    if (res.nothing) log('status heal: no pending close PR');
    else log(`status heal: ${res.url || 'close PR'} ${res.changed ? 'rebuilt from main' : 'already current'}`);
    return 0;
  } catch (err) {
    log(`status heal: failed: ${String(err?.message || err).split('\n')[0].slice(0, 200)}`);
    return 1;
  } finally {
    try { run('git', ['checkout', '--force', '--quiet', 'main']); } catch { /* the job ends here anyway */ }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMain(() => main(), { name: 'status-heal' });
}

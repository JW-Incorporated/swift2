// Deterministic trust gate for the ops-fixer: an issue is workable only when
// it carries `marjorie-filed` or `routine-failure` AND its author is a bot
// (github-actions / claude) or a repo member with write+ permission. Used by
// the sweep in routine-marjorie-ops.yml (before dispatch) and as the first job
// of routine-ops-fix.yml (before the agent runs). Fails closed: any lookup
// error means untrusted. Exit 0 trusted, 1 not.
//
//   node scripts/marjorie/ops-fix-trust.mjs <issue> [--repo owner/name]
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runMain } from '../lib/cli.mjs';

export const TRUSTED_BOT = /^(?:app\/)?(?:github-actions|claude)(?:\[bot\])?$/;
export const NEEDED_LABELS = ['marjorie-filed', 'routine-failure'];
export const WRITE_ROLES = new Set(['admin', 'maintain', 'write']);

export function evaluate({ login, labels, role }) {
  if (!labels.some((l) => NEEDED_LABELS.includes(l))) return { ok: false, reason: `needs label ${NEEDED_LABELS.join(' or ')}` };
  if (!login) return { ok: false, reason: 'no author' };
  if (TRUSTED_BOT.test(login)) return { ok: true, reason: `bot author ${login}` };
  if (WRITE_ROLES.has(role)) return { ok: true, reason: `member ${login} (${role})` };
  return { ok: false, reason: `author ${login} is neither a trusted bot nor a repo member with write access` };
}

export function main(argv = process.argv.slice(2), exec = execFileSync, env = process.env) {
  const issue = argv[0];
  const r = argv.indexOf('--repo');
  const repo = r >= 0 ? argv[r + 1] : env.GITHUB_REPOSITORY;
  if (!/^\d+$/.test(issue ?? '') || !repo) throw new Error('usage: ops-fix-trust.mjs <issue> [--repo owner/name]');
  const gh = (args) => exec('gh', args, { encoding: 'utf8' }).trim();
  let verdict;
  try {
    const view = JSON.parse(gh(['issue', 'view', issue, '--repo', repo, '--json', 'author,labels']));
    const login = view.author?.login ?? '';
    const labels = (view.labels ?? []).map((l) => l.name);
    let role = '';
    if (login && !TRUSTED_BOT.test(login)) {
      try {
        role = gh(['api', `repos/${repo}/collaborators/${login}/permission`, '--jq', '.role_name']);
      } catch {
        role = '';
      }
    }
    verdict = evaluate({ login, labels, role });
  } catch (e) {
    verdict = { ok: false, reason: `lookup failed: ${String(e.message).split('\n')[0]}` };
  }
  console.log(`ops-fix-trust: #${issue} ${verdict.ok ? 'trusted' : 'UNTRUSTED'} — ${verdict.reason}`);
  return verdict.ok ? 0 : 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) runMain(() => main(), { name: 'ops-fix-trust' });

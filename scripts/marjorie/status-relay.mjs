// Free-text owner comments on the status page reach Marjorie (Bots v2 W4).
//
// `routine-marjorie-status-reply.yml` is dispatched with only a comment id.
// Its first job runs this script, which re-reads that comment from GitHub and
// writes `.scratch/status-comment.json` for the agent ONLY if it is the
// owner's own comment on a status-page issue — the same gate the reply job
// applies, repeated here because a dispatch input is not evidence. The agent
// never receives text from anyone else.
//
//   node scripts/marjorie/status-relay.mjs context --comment-id <id> --out <json>
//
// Prints `skip=true|false` lines for $GITHUB_OUTPUT.
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { ghApi } from '../lib/gh.mjs';
import { isOwnerComment } from './lib/status-reply.mjs';
import { STATUS_LABEL } from './lib/status-issue.mjs';
import { DEFAULT_REPO } from './status-page.mjs';

const TEXT_CAP = 4000;

export async function buildContext(commentId, { api = ghApi, repo = DEFAULT_REPO } = {}) {
  if (!/^\d{1,20}$/.test(String(commentId || ''))) return { ok: false, reason: 'bad comment id' };
  const comment = await api(`/repos/${repo}/issues/comments/${commentId}`);
  const owner = isOwnerComment({ login: comment?.user?.login, association: comment?.author_association, type: comment?.user?.type });
  if (!owner) return { ok: false, reason: 'not the owner' };
  const number = Number(String(comment.issue_url || '').split('/').pop());
  if (!Number.isInteger(number)) return { ok: false, reason: 'no issue' };
  const issue = await api(`/repos/${repo}/issues/${number}`);
  if (issue.pull_request || !(issue.labels || []).some((l) => (typeof l === 'string' ? l : l?.name) === STATUS_LABEL)) return { ok: false, reason: 'not the status issue' };
  return {
    ok: true,
    context: {
      source: 'github-status-page',
      comment_id: Number(commentId),
      issue_number: number,
      url: comment.html_url,
      author: comment.user.login,
      created_at: comment.created_at,
      text: String(comment.body || '').slice(0, TEXT_CAP),
    },
  };
}

export async function main(argv = process.argv.slice(2), { api = ghApi, env = process.env, log = console.log } = {}) {
  const [command, ...rest] = argv;
  if (command !== 'context') throw new Error('usage: status-relay.mjs context --comment-id <id> --out <json>');
  const flags = {};
  for (let i = 0; i < rest.length; i += 2) flags[String(rest[i]).replace(/^--/, '')] = rest[i + 1];
  const result = await buildContext(flags['comment-id'], { api, repo: env.GITHUB_REPOSITORY || DEFAULT_REPO });
  if (result.ok) {
    mkdirSync(path.dirname(flags.out), { recursive: true });
    writeFileSync(flags.out, JSON.stringify(result.context));
  } else {
    log(`status relay: not relayed (${result.reason})`);
  }
  if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, `skip=${result.ok ? 'false' : 'true'}\n`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMain(() => main(), { name: 'status-relay' });
}

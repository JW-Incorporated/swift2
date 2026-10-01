// Renders the Long Live status page (Bots v2 W4) — deterministic, no LLM.
//
//   node scripts/marjorie/status-page.mjs --dry-run   print the body from live read-only gh data; writes nothing
//   node scripts/marjorie/status-page.mjs --apply     find (or create + pin) the `status-page` issue and rewrite its body
//   node scripts/marjorie/status-page.mjs --apply --notify   ...and, when the page materially changed, post ONE line to Marjorie's Discord (lib/status-ping.mjs)
//
// Run from a checkout of main: HUMAN-ACTIONS.md and social/** are read from disk.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { gh as ghRun, ghApi } from '../lib/gh.mjs';
import { post as discordPost } from './lib/discord.mjs';
import { sendMailFallback } from './post-or-mail.mjs';
import { gatherStatusData } from './lib/status-data.mjs';
import { ensureStatusIssue, updateBody } from './lib/status-issue.mjs';
import { decidePing } from './lib/status-ping.mjs';
import { readPreserved, renderStatusPage, statusSnapshot } from './lib/status-render.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DEFAULT_REPO = 'JW-Incorporated/swift2';

export async function main(argv = process.argv.slice(2), {
  api = ghApi, gh = ghRun, root = ROOT, now = Date.now(), log = console.log, env = process.env, post = discordPost, mail = sendMailFallback,
} = {}) {
  const apply = argv.includes('--apply');
  if (!apply && !argv.includes('--dry-run')) {
    log('usage: status-page.mjs --dry-run | --apply');
    return 2;
  }
  const repo = env.GITHUB_REPOSITORY || DEFAULT_REPO;
  let existing = null;
  if (apply) {
    existing = (await ensureStatusIssue({ api, gh, repo, log })).issue;
  }
  const data = await gatherStatusData({ api, repo, root, now, existingBody: existing?.body || '', readPreserved });
  let body = renderStatusPage(data, { now, repo });
  if (apply && argv.includes('--notify')) body = await notifyChange({ data, body, existing, now, repo, env, post, mail, log });
  if (!apply) {
    log(body);
    return 0;
  }
  await updateBody({ gh, repo, number: existing.number, body });
  log(`status page: rewrote #${existing.number} (${body.length} chars${data.warnings.length ? `, unreadable: ${data.warnings.join(', ')}` : ''})`);
  return 0;
}

/**
 * One Discord line when the page materially changed (lib/status-ping.mjs). The
 * baseline in the body only moves when the line was actually delivered, so a
 * failed post is retried by the next render instead of being lost.
 */
async function notifyChange({ data, body, existing, now, repo, env, post, mail, log }) {
  const decision = decidePing({ prev: data.pingState, cur: statusSnapshot(data, now), now, url: existing.url, notify: true });
  let state = decision.state;
  if (decision.send) {
    const webhook = env.DISCORD_MARJORIE_WEBHOOK_URL || '';
    let delivered = webhook ? (await post(decision.text, { webhook })).ok : false;
    // Only a job that already holds the mail credentials (the morning brief's) falls back to email.
    if (!delivered && env.MARJORIE_EMAIL && env.GMAIL_APP_PASSWORD) delivered = mail('Status updated', decision.text, existing.url, spawnSync) === 'email';
    log(delivered ? `status ping: sent — ${decision.text}` : 'status ping: not delivered (no webhook, or Discord refused); will retry on the next render');
    if (!delivered) state = data.pingState;
  } else {
    log(`status ping: none (${decision.reason || 'quiet'})`);
  }
  return state === data.pingState ? body : renderStatusPage({ ...data, pingState: state }, { now, repo });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMain(() => main(), { name: 'status-page' });
}

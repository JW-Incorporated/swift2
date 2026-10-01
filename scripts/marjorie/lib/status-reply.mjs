// Owner replies on the status page (Bots v2 W4). The repo is PUBLIC, so every
// check here is about who is allowed to move anything: only the owner's own
// comment on the `status-page` issue is ever acted on, a bot's never is, and
// only two shapes are commands — `done #N` and `decide #N <choice>`.
// Closing an item reuses ha-close.mjs's pure `closeHumanAction`, landed the way
// the chat routine lands it: a branch, a PR, auto-merge (main is protected).
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { closeHumanAction, laToday } from '../ha-close.mjs';
import { HUMAN_ACTIONS_DONE_PATH, HUMAN_ACTIONS_PATH } from '../human-actions.mjs';
import { propagateDecision } from './decision-propagate.mjs';
import { parseHaEntries } from './status-ha.mjs';
import { STATUS_LABEL } from './status-issue.mjs';

export const OWNER_LOGIN = 'sffan15-sys';
const OWNER_ASSOCIATIONS = new Set(['OWNER', 'MEMBER', 'COLLABORATOR']);
// A choice that means "stop, don't do it" closes the item as `skip` (the human-actions
// ledger outcome the chase also reads as held), exactly like a `skip` reply on the card.
const SKIP_CHOICE = /^(skip|defer)\b/i;
const CHOICE_CAP = 120;
const RELAY_WORKFLOW = 'routine-marjorie-status-reply.yml';
const COMMAND = /^\s*(done|decide)\s+#(\d+)(?:\s+([\s\S]+))?$/i;

/** True only for the owner's own account, never a bot, with owner/member standing in the repo. */
export function isOwnerComment({ login = '', association = '', type = '' } = {}) {
  return String(login).toLowerCase() === OWNER_LOGIN
    && !/\[bot\]$/i.test(login)
    && type !== 'Bot'
    && OWNER_ASSOCIATIONS.has(String(association).toUpperCase());
}

/** The first non-empty line, if it is exactly `done #N` or `decide #N <choice>`. */
export function parseCommand(body) {
  const first = String(body || '').split(/\r?\n/).find((l) => l.trim());
  const m = first && COMMAND.exec(first.trim().replace(/^`+|`+$/g, ''));
  if (!m) return null;
  return { kind: m[1].toLowerCase(), number: Number(m[2]), text: (m[3] || '').replace(/\s+/g, ' ').trim() };
}

const optionList = (item) => item.options.map((o) => `\`${o.choice}\``).join(', ');

/** Is this command a legal way to close this item? Returns the recorded choice, or a message to post back. */
export function checkCommand(item, cmd) {
  if (cmd.kind === 'done') {
    if (item.tag === 'DECIDE') return { ok: false, message: `#${item.number} is a decision, not a task — reply \`decide #${item.number} <choice>\`${item.options.length ? ` (options: ${optionList(item)})` : ''}.` };
    return { ok: true, choice: '', outcome: 'done' };
  }
  if (item.tag !== 'DECIDE') return { ok: false, message: `#${item.number} isn't a decision — reply \`done #${item.number}\` once it's finished.` };
  if (!cmd.text) return { ok: false, message: `Which way on #${item.number}? Reply \`decide #${item.number} <choice>\`${item.options.length ? ` — options: ${optionList(item)}` : ''}.` };
  const [word, ...more] = cmd.text.split(' ');
  const outcome = SKIP_CHOICE.test(word) ? 'skip' : 'done';
  if (!item.options.length) return { ok: true, choice: cmd.text.slice(0, CHOICE_CAP), outcome };
  const hit = item.options.find((o) => o.choice.toLowerCase() === word.toLowerCase())
    || (word.toLowerCase() === 'skip' ? { choice: 'skip' } : null);
  if (!hit) return { ok: false, message: `\`${word}\` isn't one of the options for #${item.number}: ${optionList(item)}. Reply again with one of those.` };
  return { ok: true, choice: `${hit.choice}${more.length ? ` — ${more.join(' ')}` : ''}`.slice(0, CHOICE_CAP), outcome };
}

const mentionSafe = (s) => String(s).replace(/(^|[^\w`])@(?=\w)/g, '$1@​');

/**
 * `run(cmd, args, { env })` executes git/gh and returns stdout (throws on failure);
 * `reply(text)` posts an ack comment as the workflow's bot identity.
 */
export async function handleComment({ event, root, run, reply, now = new Date(), repo, prToken = '', log = console.log, io = { readFileSync, writeFileSync } }) {
  const { comment, issue } = event;
  if (event.action !== 'created' || !comment || !issue || issue.pull_request) return { acted: false, reason: 'not a new issue comment' };
  if (!(issue.labels || []).some((l) => (typeof l === 'string' ? l : l?.name) === STATUS_LABEL)) return { acted: false, reason: 'not the status issue' };
  const who = { login: comment.user?.login, association: comment.author_association, type: comment.user?.type };
  if (!isOwnerComment(who)) return { acted: false, reason: 'not the owner' };
  const cmd = parseCommand(comment.body);
  if (!cmd) {
    // Free text goes to Marjorie now: a dispatch-only routine (the chat routine's
    // twin) re-verifies the comment is the owner's, then answers on the issue.
    try {
      run('gh', ['workflow', 'run', RELAY_WORKFLOW, '--repo', repo, '--ref', 'main', '-f', `comment_id=${comment.id}`]);
      await reply('👀 Passed to Marjorie — her answer will appear here.');
      return { acted: false, reason: 'relayed to marjorie' };
    } catch (err) {
      log(`status reply: could not dispatch ${RELAY_WORKFLOW}: ${String(err?.message || err).split('\n')[0].slice(0, 200)}`);
      await reply("I couldn't pass that to Marjorie right now; she reads owner comments on this page at the next morning brief.");
      return { acted: false, reason: 'relay failed' };
    }
  }

  const openPath = path.join(root, HUMAN_ACTIONS_PATH);
  const donePath = path.join(root, HUMAN_ACTIONS_DONE_PATH);
  const openMd = io.readFileSync(openPath, 'utf8');
  const item = parseHaEntries(openMd).find((i) => i.number === cmd.number);
  if (!item) {
    await reply(`#${cmd.number} isn't open — it may already be closed.`);
    return { acted: false, reason: 'not open' };
  }
  const verdict = checkCommand(item, cmd);
  if (!verdict.ok) {
    await reply(verdict.message);
    return { acted: false, reason: 'bad command' };
  }

  const prefixes = [`status-page/ha-close-${cmd.number}-`, `marjorie/ha-close-${cmd.number}-`];
  let openBranches;
  try {
    openBranches = JSON.parse(String(run('gh', ['pr', 'list', '--repo', repo, '--state', 'open', '--json', 'headRefName', '--limit', '100'])).trim() || '[]');
  } catch {
    openBranches = [];
  }
  const existing = openBranches.find((p) => prefixes.some((pre) => String(p.headRefName).startsWith(pre)));
  if (existing) {
    await reply(`A closing PR for #${cmd.number} is already open (\`${existing.headRefName}\`) — it lands on its own, so I opened no second one.`);
    return { acted: false, reason: 'closing pr already open' };
  }

  const date = laToday(now);
  const how = cmd.kind === 'decide' ? `owner ${verdict.outcome === 'skip' ? 'skipped' : 'decided'} "${verdict.choice}"` : 'owner said done';
  const note = `status page ${comment.html_url} — ${how}`;
  const closed = closeHumanAction(openMd, io.readFileSync(donePath, 'utf8'), { number: cmd.number, date, note, by: 'status page', outcome: verdict.outcome });
  if (!closed.ok) {
    await reply(`Couldn't close #${cmd.number}: ${closed.reason}.`);
    return { acted: false, reason: closed.reason };
  }
  const branch = `status-page/ha-close-${cmd.number}-${comment.id}`;
  const title = `Close HA #${cmd.number} — owner replied on the status page`;
  const prEnv = prToken ? { GH_TOKEN: prToken } : undefined;
  try {
    run('git', ['checkout', '-b', branch]);
    io.writeFileSync(openPath, closed.open);
    io.writeFileSync(donePath, closed.done);
    run('git', ['add', HUMAN_ACTIONS_PATH, HUMAN_ACTIONS_DONE_PATH]);
    run('git', ['commit', '-m', title, '-m', comment.html_url]);
    run('git', ['push', '-u', 'origin', 'HEAD']);
    const prUrl = String(run('gh', ['pr', 'create', '--repo', repo, '--title', title, '--body', `The owner replied on the status page: ${comment.html_url}\n\nTier-2: Marjorie — status page`], { env: prEnv })).trim().split(/\s+/).pop();
    let merge = 'auto-merges when checks pass';
    try {
      run('gh', ['pr', 'merge', prUrl, '--repo', repo, '--squash', '--auto'], { env: prEnv });
    } catch {
      merge = 'auto-merge was refused — merge it by hand';
    }
    await reply(`✅ ${cmd.kind === 'decide' ? `Decision recorded on #${cmd.number}: \`${mentionSafe(verdict.choice)}\`${verdict.outcome === 'skip' ? ' (closed as skipped)' : ''}` :`#${cmd.number} marked done`}. Closing PR: ${prUrl} (${merge}). This page updates when it lands.`);
    // The item's text names the tickets the answer is about and is about to leave the
    // file: pass the decision on to each of them now (best effort, never throws).
    if (cmd.kind === 'decide') await propagateDecision({ openMd, number: cmd.number, title: item.title, choice: verdict.choice, outcome: verdict.outcome, url: comment.html_url, repo, run, log });
    return { acted: true, number: cmd.number, prUrl };
  } catch (err) {
    log(`status reply: closing #${cmd.number} failed: ${String(err?.message || err).split('\n')[0].slice(0, 200)}`);
    await reply(`⚠️ Couldn't close #${cmd.number} automatically. Reply again, or close it by hand.`);
    return { acted: false, reason: 'close failed', failed: true };
  }
}

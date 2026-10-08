// Owner replies on the status page (Bots v2 W4). The repo is PUBLIC, so every
// check here is about who is allowed to move anything: only the owner's own
// comment on the `status-page` issue is ever acted on, a bot's never is. Four
// shapes are commands, and each closes ANY item, task or decision:
//   done #N [note]   skip #N [why]   close #N [why]   decide #N <answer>
// A `decide` answer that is not one of the item's listed options is recorded
// verbatim, never refused (issue #4665: the real answer was "wrong question").
// Closing reuses ha-close.mjs's pure `closeHumanAction` and lands through the one
// rolling close PR (lib/status-closes.mjs), so two quick replies cannot conflict.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { closeHumanAction, laToday } from '../ha-close.mjs';
import { HUMAN_ACTIONS_DONE_PATH, HUMAN_ACTIONS_PATH } from '../human-actions.mjs';
import { propagateDecision } from './decision-propagate.mjs';
import { NOTE_CAP, recordFor, syncCloses } from './status-closes.mjs';
import { parseHaEntries } from './status-ha.mjs';
import { STATUS_LABEL } from './status-issue.mjs';

export const OWNER_LOGIN = 'sffan15-sys';
const OWNER_ASSOCIATIONS = new Set(['OWNER', 'MEMBER', 'COLLABORATOR']);
// A choice that means "stop, don't do it" closes the item as `skip` (the human-actions
// ledger outcome the chase also reads as held), exactly like a `skip` reply on the card.
const SKIP_CHOICE = /^(skip|defer)\b/i;
const CHOICE_CAP = 300;
const RELAY_WORKFLOW = 'routine-marjorie-status-reply.yml';
const COMMAND = /^\s*(done|decide|skip|close)\s+#(\d+)(?:\s+([\s\S]+))?$/i;

/** True only for the owner's own account, never a bot, with owner/member standing in the repo. */
export function isOwnerComment({ login = '', association = '', type = '' } = {}) {
  return String(login).toLowerCase() === OWNER_LOGIN
    && !/\[bot\]$/i.test(login)
    && type !== 'Bot'
    && OWNER_ASSOCIATIONS.has(String(association).toUpperCase());
}

/** The first non-empty line, if it is exactly `done|skip|close #N [text]` or `decide #N <text>`. */
export function parseCommand(body) {
  const first = String(body || '').split(/\r?\n/).find((l) => l.trim());
  const m = first && COMMAND.exec(first.trim().replace(/^`+|`+$/g, ''));
  if (!m) return null;
  return { kind: m[1].toLowerCase(), number: Number(m[2]), text: (m[3] || '').replace(/\s+/g, ' ').trim() };
}

const optionList = (item) => item.options.map((o) => `\`${o.choice}\``).join(', ');

/**
 * What a command records. Every command is legal on every open item; only a
 * bare `decide #N` is answered with a question. An answer that is not one of the
 * item's options is kept verbatim as the decision.
 */
export function checkCommand(item, cmd) {
  const text = cmd.text.slice(0, CHOICE_CAP);
  if (cmd.kind === 'done') return { ok: true, choice: text, outcome: 'done', verb: 'done' };
  if (cmd.kind === 'skip') return { ok: true, choice: text, outcome: 'skip', verb: 'skipped' };
  if (cmd.kind === 'close') return { ok: true, choice: text, outcome: 'done', verb: 'closed' };
  if (!cmd.text) return { ok: false, message: `Which way on #${item.number}? Reply \`decide #${item.number} <choice>\`${item.options.length ? ` — options: ${optionList(item)}` : ''} — or any words of your own, or \`close #${item.number} <why>\` if it's the wrong question.` };
  const [word, ...more] = cmd.text.split(' ');
  const outcome = SKIP_CHOICE.test(word) ? 'skip' : 'done';
  const hit = item.options.find((o) => o.choice.toLowerCase() === word.toLowerCase())
    || (word.toLowerCase() === 'skip' ? { choice: 'skip' } : null);
  if (!hit) return { ok: true, choice: text, outcome, verb: 'decided' };
  return { ok: true, choice: `${hit.choice}${more.length ? ` — ${more.join(' ')}` : ''}`.slice(0, CHOICE_CAP), outcome, verb: 'decided' };
}

const mentionSafe = (s) => String(s).replace(/(^|[^\w`])@(?=\w)/g, '$1@​');

function ackFor(number, verdict) {
  const said = verdict.choice ? `: \`${mentionSafe(verdict.choice)}\`` : '';
  if (verdict.verb === 'decided') return `Decision recorded on #${number}${said}${verdict.outcome === 'skip' ? ' (closed as skipped)' : ''}`;
  if (verdict.verb === 'done') return `#${number} marked done${said}`;
  return `#${number} ${verdict.verb}${said}`;
}

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

  const date = laToday(now);
  const record = recordFor({ number: cmd.number, outcome: verdict.outcome, verb: verdict.verb, choice: verdict.choice, date, url: comment.html_url });
  const closed = record && closeHumanAction(openMd, io.readFileSync(donePath, 'utf8'), { number: cmd.number, date, note: record.note, by: record.by, outcome: record.o, noteCap: NOTE_CAP });
  if (!closed?.ok) {
    await reply(`Couldn't close #${cmd.number}: ${closed?.reason || 'the reply could not be recorded'}.`);
    return { acted: false, reason: closed?.reason || 'bad record' };
  }
  try {
    const res = await syncCloses({ root, run, repo, prToken, add: record, log, io });
    if (res.duplicate) {
      await reply(`#${cmd.number} is already queued to close (${res.url}) — your first answer stands; it lands on its own, so I queued nothing new.`);
      return { acted: false, reason: 'closing pr already open' };
    }
    if (!res.ok) {
      await reply(`Couldn't close #${cmd.number}: ${res.reason}.`);
      return { acted: false, reason: res.reason };
    }
    await reply(`✅ ${ackFor(cmd.number, verdict)}. Closing PR: ${res.url} (${res.merge}). This page shows it as closing now and drops it once it lands.`);
    // The item's text names the tickets the answer is about and is about to leave the
    // file: pass the answer on to each of them now (best effort, never throws).
    if (cmd.kind !== 'done') await propagateDecision({ openMd, number: cmd.number, title: item.title, choice: verdict.choice || verdict.verb, outcome: verdict.outcome, url: comment.html_url, repo, run, log });
    return { acted: true, number: cmd.number, prUrl: res.url };
  } catch (err) {
    log(`status reply: closing #${cmd.number} failed: ${String(err?.message || err).split('\n')[0].slice(0, 200)}`);
    await reply(`⚠️ Couldn't close #${cmd.number} automatically. Reply again, or close it by hand.`);
    return { acted: false, reason: 'close failed', failed: true };
  }
}

// Social reply/mention notifier — tells the owner, in #longlive-tree, whenever
// someone comments on, replies under, tags, or DMs our Instagram / Facebook
// accounts. Replies and DMs stay human (docs/social/guardrails.md row 6): this
// script only READS and NOTIFIES; it never replies, likes, hides or posts to a
// platform. Not on the posting path — see docs/social/pipeline.md › Reply
// notifier for scopes, the ledger and what is out of scope (X, Facebook DMs).
//
// Env: IG_ACCESS_TOKEN, IG_BUSINESS_ACCOUNT_ID, FB_PAGE_ID (read-only Graph
// calls), DISCORD_SOCIAL_CHANNEL_WEBHOOK_URL, REPLY_LEDGER_PATH (the JSON the
// workflow fetched from the `social-reply-ledger` branch), DRY_RUN=1 (print
// the messages, send nothing, write no ledger).
//
// Each source (IG comments, IG mentions, IG DMs, FB comments) fails on its own
// with a logged warning; a source that was not read cleanly is not marked
// seeded and is retried next run. The DM source reports "disabled: missing
// scope" (logged once a day) until the token carries instagram_manage_messages. A message that fails to send stays unseen and is
// retried next run (at-least-once); the run then exits 1 so it is visible.
import { readFileSync, writeFileSync } from 'node:fs';
import { runMain } from '../lib/cli.mjs';
import {
  BATCH_CAP,
  formatItem,
  moreLine,
  parseLedger,
  planNotifications,
  postDiscord,
  serializeLedger,
} from './lib/reply-notify.mjs';
import { SourceDisabledError, collectInstagramDms } from './lib/reply-dms.mjs';
import {
  collectFacebookComments,
  collectInstagramComments,
  collectInstagramMentions,
  makeGraph,
  scrub,
} from './lib/reply-sources.mjs';

const DAY_MS = 86_400_000;

function readLedgerFile(path) {
  if (!path) throw new Error('REPLY_LEDGER_PATH is not set');
  let text = '';
  try {
    text = readFileSync(path, 'utf8');
  } catch (err) {
    if (err?.code !== 'ENOENT') throw err;
  }
  return parseLedger(text);
}

/**
 * Runs every configured source; returns { items, clean } where `clean` lists
 * the sources that were read without any warning. A disabled source (DMs
 * without their scope) is logged at most once a day via `ledger.disabledLogged`.
 */
export async function collectAll(
  env,
  { fetchImpl = fetch, now = Date.now(), log = console.warn, ledger = null } = {},
) {
  const token = env.IG_ACCESS_TOKEN;
  const graph = makeGraph({ token, fetchImpl });
  const ig = env.IG_BUSINESS_ACCOUNT_ID;
  const jobs = [
    ['ig_comments', ig, (o) => collectInstagramComments(graph, { igUserId: ig, ...o })],
    ['ig_mentions', ig, (o) => collectInstagramMentions(graph, { igUserId: ig, ...o })],
    ['ig_dms', ig, (o) => collectInstagramDms({ igUserId: ig, pageId: env.FB_PAGE_ID, token, fetchImpl, ...o })],
    ['fb_comments', env.FB_PAGE_ID, (o) => collectFacebookComments(graph, { pageId: env.FB_PAGE_ID, ...o })],
  ];
  const items = [];
  const clean = [];
  if (!token) {
    log('reply-notifier: IG_ACCESS_TOKEN is not set — nothing to read');
    return { items, clean };
  }
  for (const [source, configured, run] of jobs) {
    if (!configured) {
      log(`reply-notifier: ${source} skipped — account id not configured`);
      continue;
    }
    let warned = false;
    const onWarn = (message) => {
      warned = true;
      log(`reply-notifier: ${source}: ${scrub(message, token)}`);
    };
    try {
      items.push(...(await run({ now, onWarn })));
      if (!warned) clean.push(source);
    } catch (err) {
      if (err instanceof SourceDisabledError) {
        const last = Date.parse(ledger?.disabledLogged?.[source] ?? '');
        if (Number.isNaN(last) || now - last >= DAY_MS) {
          log(`reply-notifier: ${source} disabled: ${err.disabledReason}`);
          if (ledger) ledger.disabledLogged[source] = new Date(now).toISOString();
        }
      } else {
        log(`reply-notifier: ${source} failed: ${scrub(err?.message ?? err, token)}`);
      }
    }
  }
  return { items, clean };
}

export async function runNotifier(
  env,
  { fetchImpl = fetch, now = Date.now(), log = console.log, warn = console.warn } = {},
) {
  const dryRun = env.DRY_RUN === '1';
  const ledger = readLedgerFile(env.REPLY_LEDGER_PATH);
  const { items, clean } = await collectAll(env, { fetchImpl, now, log: warn, ledger });
  const { toNotify, silent } = planNotifications(items, ledger, now);
  const stamp = new Date(now).toISOString();
  for (const item of silent) ledger.seen[item.id] = stamp;

  const batch = toNotify.slice(0, BATCH_CAP);
  const remaining = toNotify.length - batch.length;
  let failed = false;
  let sent = 0;
  const webhook = env.DISCORD_SOCIAL_CHANNEL_WEBHOOK_URL;
  if (batch.length && !dryRun && !webhook) {
    warn('reply-notifier: DISCORD_SOCIAL_CHANNEL_WEBHOOK_URL is not set — nothing sent');
    failed = true;
  } else {
    for (const item of batch) {
      const message = formatItem(item);
      if (dryRun) {
        log(`[dry-run] ${message}`);
        continue;
      }
      const result = await postDiscord(message, { webhook, fetchImpl });
      if (!result.ok) {
        warn(`reply-notifier: Discord send failed (HTTP ${result.status}) — ${item.id} stays unseen, will retry next run`);
        failed = true;
        break;
      }
      ledger.seen[item.id] = stamp;
      sent += 1;
    }
    if (!failed && !dryRun && remaining > 0) {
      const result = await postDiscord(moreLine(remaining), { webhook, fetchImpl });
      if (!result.ok) warn(`reply-notifier: "+N more" line failed (HTTP ${result.status})`);
    }
  }

  if (!dryRun) {
    for (const source of clean) ledger.seeded[source] ??= stamp;
    if (env.REPLY_LEDGER_PATH) writeFileSync(env.REPLY_LEDGER_PATH, serializeLedger(ledger, now));
  }
  log(
    `reply-notifier: ${items.length} item(s) read, ${sent} sent, ${silent.length} recorded silently, ${remaining} deferred${dryRun ? ' (dry run)' : ''}`,
  );
  return failed ? 1 : 0;
}

if (process.argv[1]?.split(/[\\/]/).pop() === 'reply-notifier.mjs') {
  runMain(() => runNotifier(process.env), { name: 'reply-notifier' });
}

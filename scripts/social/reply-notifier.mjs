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
// Each source (IG comments, FB comments, IG DMs, IG mentions) fails on its own
// with a logged warning; a source that was not read cleanly is not marked
// seeded and is retried next run. The DM source reports "disabled: missing
// scope" (logged once a day) until the token carries instagram_manage_messages.
//
// Rate budget: the IG token is shared with the live poster, so a run makes at
// most MAX_CALLS_PER_RUN Graph calls (~27 typical) every 30 minutes (<= 60 an
// hour); mentions poll once an hour, and a disabled DM source retries hourly.
// Any rate-limit answer (codes 4/17/32/613, HTTP 429) or an exhausted budget
// stops ALL remaining Graph calls for the run with a warning.
//
// Delivery: the ledger file is rewritten after every message, so a crash or
// timeout mid-run cannot resend what already went out. A Discord 4xx about one
// message (not 401/403/404/429) marks that item seen and moves on; any other
// failure leaves it unseen, stops the run, and exits 1 (at-least-once).
import { readFileSync, writeFileSync } from 'node:fs';
import { runMain } from '../lib/cli.mjs';
import {
  BATCH_CAP,
  formatItem,
  isPoisonMessageStatus,
  moreLine,
  parseLedger,
  planNotifications,
  postDiscord,
  serializeLedger,
} from './lib/reply-notify.mjs';
import { SourceDisabledError, collectInstagramDms } from './lib/reply-dms.mjs';
import {
  RateLimitError,
  collectFacebookComments,
  collectInstagramComments,
  collectInstagramMentions,
  makeGraph,
  newBudget,
  scrub,
} from './lib/reply-sources.mjs';

const DAY_MS = 86_400_000;
const HOURLY_MS = 55 * 60_000;

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
 * Runs every configured source; returns { items, clean, budget } where `clean`
 * lists the sources read without any warning. Hourly sources are skipped when
 * `ledger.lastRun` says they ran under 55 minutes ago. A disabled source (DMs
 * without their scope) is logged at most once a day via `ledger.disabledLogged`.
 */
export async function collectAll(
  env,
  { fetchImpl = fetch, now = Date.now(), log = console.warn, ledger = null } = {},
) {
  const token = env.IG_ACCESS_TOKEN;
  const budget = newBudget();
  const graph = makeGraph({ token, fetchImpl, budget });
  const ig = env.IG_BUSINESS_ACCOUNT_ID;
  const page = env.FB_PAGE_ID;
  const dmsDisabled = Boolean(ledger?.disabledLogged?.ig_dms);
  const jobs = [
    { source: 'ig_comments', id: ig, run: (o) => collectInstagramComments(graph, { igUserId: ig, ...o }) },
    { source: 'fb_comments', id: page, run: (o) => collectFacebookComments(graph, { pageId: page, ...o }) },
    {
      source: 'ig_dms',
      id: ig,
      hourly: dmsDisabled,
      run: (o) => collectInstagramDms({ igUserId: ig, pageId: page, token, fetchImpl, budget, ...o }),
    },
    { source: 'ig_mentions', id: ig, hourly: true, run: (o) => collectInstagramMentions(graph, { igUserId: ig, ...o }) },
  ];
  const items = [];
  const clean = [];
  if (!token) {
    log('reply-notifier: IG_ACCESS_TOKEN is not set — nothing to read');
    return { items, clean, budget };
  }
  for (const { source, id, hourly, run } of jobs) {
    if (!id) {
      log(`reply-notifier: ${source} skipped — account id not configured`);
      continue;
    }
    const last = Date.parse(ledger?.lastRun?.[source] ?? '');
    if (hourly && !Number.isNaN(last) && now - last < HOURLY_MS) continue;
    if (ledger) ledger.lastRun[source] = new Date(now).toISOString();
    let warned = false;
    const onWarn = (message) => {
      warned = true;
      log(`reply-notifier: ${source}: ${scrub(message, token)}`);
    };
    try {
      items.push(...(await run({ now, onWarn })));
      if (!warned) clean.push(source);
      if (ledger && source === 'ig_dms') delete ledger.disabledLogged[source];
    } catch (err) {
      if (err instanceof RateLimitError) {
        log(`reply-notifier: Graph rate limit (${scrub(err.message, token)}) — aborting all remaining Graph calls this run`);
        break;
      }
      if (err instanceof SourceDisabledError) {
        const logged = Date.parse(ledger?.disabledLogged?.[source] ?? '');
        if (Number.isNaN(logged) || now - logged >= DAY_MS) {
          log(`reply-notifier: ${source} disabled: ${err.disabledReason}`);
          if (ledger) ledger.disabledLogged[source] = new Date(now).toISOString();
        }
      } else {
        log(`reply-notifier: ${source} failed: ${scrub(err?.message ?? err, token)}`);
      }
    }
  }
  return { items, clean, budget };
}

export async function runNotifier(
  env,
  { fetchImpl = fetch, now = Date.now(), log = console.log, warn = console.warn } = {},
) {
  const dryRun = env.DRY_RUN === '1';
  const ledger = readLedgerFile(env.REPLY_LEDGER_PATH);
  const persist = () => {
    if (!dryRun && env.REPLY_LEDGER_PATH) writeFileSync(env.REPLY_LEDGER_PATH, serializeLedger(ledger, now));
  };
  const { items, clean } = await collectAll(env, { fetchImpl, now, log: warn, ledger });
  const { toNotify, silent } = planNotifications(items, ledger, now);
  const stamp = new Date(now).toISOString();
  for (const item of silent) ledger.seen[item.id] = stamp;
  for (const source of clean) ledger.seeded[source] ??= stamp;
  persist();

  const batch = toNotify.slice(0, BATCH_CAP);
  const remaining = toNotify.length - batch.length;
  let failed = false;
  let sent = 0;
  let skipped = 0;
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
      if (result.ok) {
        sent += 1;
      } else if (isPoisonMessageStatus(result.status)) {
        warn(`reply-notifier: Discord rejected ${item.id} (HTTP ${result.status}) — marking it seen and moving on`);
        skipped += 1;
      } else {
        warn(`reply-notifier: Discord send failed (HTTP ${result.status}) — ${item.id} stays unseen, will retry next run`);
        failed = true;
        break;
      }
      ledger.seen[item.id] = stamp;
      persist();
    }
    if (!failed && !dryRun && remaining > 0) {
      const result = await postDiscord(moreLine(remaining), { webhook, fetchImpl });
      if (!result.ok) warn(`reply-notifier: "+N more" line failed (HTTP ${result.status})`);
    }
  }

  log(
    `reply-notifier: ${items.length} item(s) read, ${sent} sent, ${skipped} rejected by Discord, ${silent.length} recorded silently, ${remaining} deferred${dryRun ? ' (dry run)' : ''}`,
  );
  return failed ? 1 : 0;
}

if (process.argv[1]?.split(/[\\/]/).pop() === 'reply-notifier.mjs') {
  runMain(() => runNotifier(process.env), { name: 'reply-notifier' });
}

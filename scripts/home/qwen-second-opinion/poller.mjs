#!/usr/bin/env node
// Home-PC Qwen second opinion (architect consult #15). Claims pending REPLY leads, asks the
// local Qwen gateway for an alternative reply, stores it, then posts it under the card.
// Store first, post second: a stored-but-unposted draft is posted by the next run, never twice.
import { runMain } from '../../lib/cli.mjs';
import { strictServiceClient } from '../../lib/supabase.mjs';
import { discordBotToken, routedPost } from '../../lib/discord-route.mjs';
import { mailerRouteFor } from '../../community/mailer.mjs';
import { buildMessages } from './prompt.mjs';
import { buildQwenMessage } from './message.mjs';
import { DEFAULT_FALLBACK_MODEL, DEFAULT_MODEL, generate } from './qwen-client.mjs';

export const REPLY_KINDS = ['reply_to_us', 'hot_thread'];
export const PLATFORMS = ['reddit', 'facebook'];
export const BATCH = 10;
export const MAX_ATTEMPTS = 5;
const OWNER_DONE = /^(posted|skipped)/;
const COLUMNS =
  'id, platform, community, kind, title, context, draft, link_included, status, discord_message_id, qwen_draft, qwen_attempts';

function check(res, what) {
  if (res.error) throw new Error(`${what}: ${res.error.message ?? res.error}`);
  return res.data ?? [];
}

async function sweepNonReply(supabase) {
  const table = () => supabase.from('engagement_lead').update({ qwen_status: 'skipped' }).eq('qwen_status', 'pending');
  check(await table().not('kind', 'in', `(${REPLY_KINDS.join(',')})`), 'sweep kind');
  check(await table().not('platform', 'in', `(${PLATFORMS.join(',')})`), 'sweep platform');
}

/** Posts the stored draft as a Discord reply to the card. Returns the new message id or null. */
export async function postSecondOpinion(lead, { env, fetchImpl, log }) {
  const content = buildQwenMessage(lead.qwen_draft);
  if (!content) return null;
  const init = {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      content,
      allowed_mentions: { parse: [] },
      message_reference: { message_id: lead.discord_message_id, fail_if_not_exists: false },
    }),
  };
  let res;
  try {
    res = await routedPost(mailerRouteFor(lead.platform), init, { env, webhook: '', fetchImpl });
  } catch (err) {
    log(`qwen-poller: post failed for ${lead.id}: ${err.message}`);
    return null;
  }
  if (!res.ok) {
    log(`qwen-poller: post HTTP ${res.status} for ${lead.id}; will retry next run`);
    return null;
  }
  const body = await res.json().catch(() => null);
  return body?.id ? String(body.id) : null;
}

async function postStored(supabase, lead, ctx) {
  const id = await postSecondOpinion(lead, ctx);
  if (!id) return false;
  check(
    await supabase.from('engagement_lead').update({ qwen_discord_message_id: id }).eq('id', lead.id),
    'store message id',
  );
  return true;
}

export async function runPoller({ supabase, env = process.env, fetchImpl = fetch, sleep, log = console.log, now = () => new Date() }) {
  const wait = sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  const ctx = { env, fetchImpl, log };
  const hasToken = Boolean(discordBotToken(env));
  const stats = { skipped: 0, done: 0, failed: 0, posted: 0, unreachable: false };
  const T = () => supabase.from('engagement_lead');
  const replyScope = (q) => q.in('kind', REPLY_KINDS).in('platform', PLATFORMS).not('discord_message_id', 'is', null);

  await sweepNonReply(supabase);

  // 1. Done but not yet posted (token was missing, or Discord failed last run).
  const unposted = check(
    await replyScope(T().select(COLUMNS).eq('qwen_status', 'done').is('qwen_discord_message_id', null).not('qwen_draft', 'is', null))
      .order('created_at', { ascending: true })
      .limit(BATCH),
    'select unposted',
  );
  if (unposted.length && !hasToken) log('qwen-poller: post pending: DISCORD_BOT_TOKEN missing');
  else for (const lead of unposted) if (await postStored(supabase, lead, ctx)) stats.posted += 1;

  // 2. Claim and draft.
  const baseUrl = env.QWEN_BASE_URL;
  const apiKey = env.QWEN_API_KEY;
  if (!baseUrl || !apiKey) {
    log('qwen-poller: QWEN_BASE_URL / QWEN_API_KEY not set; nothing drafted');
    return stats;
  }
  const model = env.QWEN_MODEL || DEFAULT_MODEL;
  const fallbackModel = env.QWEN_FALLBACK_MODEL || DEFAULT_FALLBACK_MODEL;

  const candidates = check(
    await replyScope(T().select(COLUMNS).eq('qwen_status', 'pending'))
      .order('created_at', { ascending: true })
      .limit(BATCH),
    'select pending',
  );

  for (const lead of candidates) {
    if (OWNER_DONE.test(lead.status ?? '')) {
      check(await T().update({ qwen_status: 'skipped' }).eq('id', lead.id).eq('qwen_status', 'pending'), 'skip');
      stats.skipped += 1;
      continue;
    }
    const attempts = lead.qwen_attempts ?? 0;
    const claimed = check(
      await T().update({ qwen_attempts: attempts + 1 }).eq('id', lead.id).eq('qwen_status', 'pending').eq('qwen_attempts', attempts).select('id'),
      'claim',
    );
    if (claimed.length !== 1) continue;

    const result = await generate({ baseUrl, apiKey, model, fallbackModel, messages: buildMessages(lead), fetchImpl, sleep: wait });
    if (result.ok) {
      check(
        await T()
          .update({ qwen_status: 'done', qwen_draft: result.text, qwen_at: now().toISOString(), qwen_error: null })
          .eq('id', lead.id),
        'store draft',
      );
      stats.done += 1;
      if (hasToken) {
        if (await postStored(supabase, { ...lead, qwen_draft: result.text }, ctx)) stats.posted += 1;
      } else log('qwen-poller: post pending: DISCORD_BOT_TOKEN missing');
      continue;
    }
    if (result.unreachable) {
      check(await T().update({ qwen_attempts: attempts }).eq('id', lead.id), 'release');
      log('qwen-poller: Qwen unreachable; leaving rows pending');
      stats.unreachable = true;
      break;
    }
    const failed = attempts + 1 >= MAX_ATTEMPTS;
    check(
      await T()
        .update({ qwen_error: String(result.message).slice(0, 200), ...(failed ? { qwen_status: 'failed' } : {}) })
        .eq('id', lead.id),
      'record failure',
    );
    if (failed) stats.failed += 1;
  }
  return stats;
}

async function main() {
  const supabase = strictServiceClient();
  if (!supabase) {
    console.log('qwen-poller: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set; skipping');
    return 0;
  }
  const s = await runPoller({ supabase });
  console.log(`qwen-poller: done=${s.done} posted=${s.posted} skipped=${s.skipped} failed=${s.failed}${s.unreachable ? ' unreachable' : ''}`);
  return 0;
}

if (process.argv[1]?.split(/[\\/]/).pop() === 'poller.mjs') {
  runMain(main, { name: 'qwen-poller' });
}

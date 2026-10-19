#!/usr/bin/env node
// Community reply cards, owner reactions (#5988). Replaces the signed
// Posted/Skip URL links: the founder reacts on the card itself, ❌ = skipped,
// ✅ = posted. Reads the reactions on each delivered lead's card (both lanes),
// keeps ONLY the owner's own Discord user id (the same SOCIAL_APPROVERS list
// the social approval poll trusts; the poll bot token can read reactions but
// cannot react as him), and applies the existing `ackSkipped` / `ackPosted`
// from packages/core (idempotent: a lead already terminal is a no-op, and a
// processed lead leaves the `delivered` set so it is never read again). After a
// lead registers, the bot adds a small confirmation reaction to the card.
//
// Reads/reacts via the Discord bot REST API only; never posts a message. The
// /api/community/ack route stays live for cards posted before this change.
//
//   npx tsx scripts/community/community-reaction-poll.mjs [--dry-run]
//
// Needs SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY and a Discord bot token
// (DISCORD_TREE_BOT_TOKEN or DISCORD_BOT_TOKEN) with Read Message History
// (+ Add Reactions for the confirmation).
import { serviceClient } from '../lib/supabase.mjs';
import { isSchemaPending, runMain } from '../lib/cli.mjs';
import {
  DISCORD_API,
  discordBotToken,
  routeChannelId,
  routeForPlatform,
} from '../lib/discord-route.mjs';
import { postQwenOpinions } from './qwen-post.mjs';
import { SOCIAL_APPROVERS } from '../social/lib/approvers.mjs';
import { ackPosted, ackSkipped } from '../../packages/core/src/community-ack.ts';

export const CHECK_EMOJI = '✅';
export const CROSS_EMOJI = '❌';
/** Bot confirmation reactions: "logged as posted" / "logged as skipped". */
export const POSTED_CONFIRM_EMOJI = '📝';
export const SKIPPED_CONFIRM_EMOJI = '🚫';

const LOOKBACK_DAYS = 14;
const LEAD_LIMIT = 100;
const GAP_MS = 1000;
const MAX_RETRY_WAIT_MS = 5000;
const RATE_LIMIT_RETRIES = 2;

export const OWNER_IDS = SOCIAL_APPROVERS.map((id) => id.replace(/^discord:/, ''));

const sleepDefault = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export async function fetchOpenCards(supabase, now = new Date()) {
  const since = new Date(now.getTime() - LOOKBACK_DAYS * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from('engagement_lead')
    .select('id, platform, link_included, discord_message_id')
    .eq('status', 'delivered')
    .not('discord_message_id', 'is', null)
    .gte('discord_delivered_at', since)
    .order('discord_delivered_at', { ascending: false })
    .limit(LEAD_LIMIT);
  if (error) {
    if (isSchemaPending(error)) return [];
    throw error;
  }
  return data ?? [];
}

/** Channels a lead's card may live in: its platform channel, then tree-main (older cards). */
export function candidateChannels(platform, env = process.env) {
  const ids = [routeForPlatform(platform), 'tree-main'].map((route) =>
    routeChannelId(route, env),
  );
  return [...new Set(ids)];
}

class RateLimited extends Error {}

/** Discord's Retry-After (header seconds, else JSON body `retry_after`), capped. */
async function retryAfterMs(res) {
  let secs = Number(res.headers?.get?.('retry-after'));
  if (!Number.isFinite(secs)) {
    const body = await res.json().catch(() => null);
    secs = Number(body?.retry_after);
  }
  if (!Number.isFinite(secs) || secs < 0) secs = 1;
  return Math.min(secs * 1000, MAX_RETRY_WAIT_MS);
}

/** Reactor user ids for one emoji; `null` when the message is not in this channel. */
async function reactors(fetchImpl, token, channelId, messageId, emoji, sleep = sleepDefault) {
  const url = `${DISCORD_API}/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}?limit=100`;
  let res;
  for (let attempt = 0; ; attempt += 1) {
    res = await fetchImpl(url, { headers: { Authorization: `Bot ${token}` } });
    if (res.status !== 429) break;
    if (attempt >= RATE_LIMIT_RETRIES) throw new RateLimited('Discord rate limited');
    await sleep(await retryAfterMs(res));
  }
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Discord reactions HTTP ${res.status}`);
  const users = await res.json();
  return Array.isArray(users) ? users.map((u) => String(u.id)) : [];
}

async function confirm(fetchImpl, token, channelId, messageId, emoji) {
  const url = `${DISCORD_API}/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/@me`;
  try {
    const res = await fetchImpl(url, { method: 'PUT', headers: { Authorization: `Bot ${token}` } });
    return res.ok || res.status === 204;
  } catch {
    return false;
  }
}

/**
 * One poll pass. Owner ❌ wins over ✅ (a skip never writes the ledger). Only
 * the owner's own reactions count; anyone else's are ignored.
 */
export async function pollReactions({
  supabase,
  token,
  env = process.env,
  fetchImpl = fetch,
  owners = OWNER_IDS,
  acks = { posted: ackPosted, skipped: ackSkipped },
  sleep = sleepDefault,
  now = new Date(),
  dryRun = false,
} = {}) {
  const leads = await fetchOpenCards(supabase, now);
  const summary = { checked: leads.length, posted: 0, skipped: 0, ignored: 0, deferred: 0, errors: [] };
  const isOwner = (ids) => ids.some((id) => owners.includes(id));
  for (let i = 0; i < leads.length; i += 1) {
    const lead = leads[i];
    try {
      let found = null;
      for (const channelId of candidateChannels(lead.platform, env)) {
        await sleep(GAP_MS);
        const crossIds = await reactors(
          fetchImpl,
          token,
          channelId,
          lead.discord_message_id,
          CROSS_EMOJI,
          sleep,
        );
        if (crossIds === null) continue;
        await sleep(GAP_MS);
        const checkIds = await reactors(
          fetchImpl,
          token,
          channelId,
          lead.discord_message_id,
          CHECK_EMOJI,
          sleep,
        );
        found = { channelId, crossed: isOwner(crossIds), checked: isOwner(checkIds ?? []) };
        break;
      }
      if (!found || (!found.crossed && !found.checked)) {
        summary.ignored += 1;
        continue;
      }
      if (dryRun) continue;
      const action = found.crossed ? 'skipped' : 'posted';
      const outcome = found.crossed
        ? await acks.skipped(supabase, lead.id)
        : await acks.posted(supabase, lead.id, Boolean(lead.link_included), 'discord-reaction');
      if (!outcome.ok) {
        summary.errors.push({ leadId: lead.id, message: outcome.message ?? outcome.error });
        continue;
      }
      summary[action] += 1;
      await confirm(
        fetchImpl,
        token,
        found.channelId,
        lead.discord_message_id,
        found.crossed ? SKIPPED_CONFIRM_EMOJI : POSTED_CONFIRM_EMOJI,
      );
    } catch (err) {
      if (err instanceof RateLimited) {
        summary.deferred += leads.length - i;
        break;
      }
      summary.errors.push({ leadId: lead.id, message: String(err?.message ?? err) });
    }
  }
  return summary;
}

/**
 * Partial rate-limit deferrals retry next run and are not failures; real errors are.
 * A total wall (deferred, nothing processed) is an outage and fails.
 */
export function exitCode(s, extraProcessed = 0) {
  if (s.errors.length > 0) return 1;
  const processed = s.posted + s.skipped + s.ignored + extraProcessed;
  return s.deferred > 0 && processed === 0 ? 1 : 0;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const token = discordBotToken(process.env);
  if (!token) {
    console.log('community-reaction-poll: no Discord bot token configured — skipping.');
    return 0;
  }
  const supabase = serviceClient();
  if (!supabase) {
    console.log(
      'community-reaction-poll: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY unset — skipping (degraded, not a crash).',
    );
    return 0;
  }
  const s = await pollReactions({ supabase, token, dryRun });
  const q = dryRun ? { posted: 0, deferred: 0, errors: [] } : await postQwenOpinions({ supabase });
  s.errors.push(...q.errors);
  s.deferred += q.deferred;
  console.log(
    `community-reaction-poll: ${s.checked} card(s) checked, ${s.posted} posted, ${s.skipped} skipped, ${s.ignored} untouched, ${q.posted} Qwen reply(ies) posted, ${s.deferred} deferred (rate limited), ${s.errors.length} error(s)${dryRun ? ' (dry-run)' : ''}.`,
  );
  for (const e of s.errors) console.error(`  lead ${e.leadId}: ${e.message}`);
  return exitCode(s, q.posted);
}

if (process.argv[1]?.split(/[\\/]/).pop() === 'community-reaction-poll.mjs') {
  runMain(main, { name: 'community-reaction-poll' });
}

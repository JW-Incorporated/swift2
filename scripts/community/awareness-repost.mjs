#!/usr/bin/env node
// One-shot re-post of the awareness cards still waiting on the owner's Posted/Skip, into
// their new channels (Reddit -> tree-reddit, Facebook -> tree-facebook; see
// scripts/lib/discord-route.mjs). The cards already sit in the old channel; this puts each one
// where the owner now looks. Same card format as awareness-deliver.mjs: the clean link, the PNG
// only when the lead shipped one, freshly signed Posted/Skip links, then the reply text as its
// own message. No LLM, nothing is posted to Reddit/Facebook.
//
//   npx tsx scripts/community/awareness-repost.mjs --delivered-before=<ISO> [--live] [--since-days=14]
//
// DRY-RUN BY DEFAULT: it only LISTS what it would send. `--live` is refused without
// `--delivered-before`.
//
// "Not yet posted" = status 'delivered' (sent, no Posted/Skip ack yet). No schema change: each
// lead is CLAIMED first (discord_delivered_at set to now, guarded by status='delivered' AND
// discord_delivered_at < cutoff, rows returned), then sent, then its discord_message_id is
// recorded. A rerun with the same cutoff therefore never selects or claims a lead that was already
// claimed, even concurrently. Residuals: a send that fails after the claim is un-claimed (timestamp
// restored) so a rerun retries it; if that restore itself fails, or the message id cannot be
// recorded, the lead is reported as failed (non-zero exit) with its ids for manual repair.
// The cutoff must not be in the future (it would match leads claimed by this very run).
import { serviceClient } from '../lib/supabase.mjs';
import { isSchemaPending, runMain } from '../lib/cli.mjs';
import { discordBotToken, routeChannelId, routeForPlatform } from '../lib/discord-route.mjs';
import { buildAckUrl } from './mailer.mjs';
import { AWARENESS_KIND } from './awareness-filters.mjs';
import { cardUrlForRef, fetchCardPng, loadCatalog } from './awareness-image.mjs';
import { buildAwarenessMessage, buildAwarenessReplyText, imageFilename } from './awareness-message.mjs';
import { postAwarenessMessage, postAwarenessReplyText, resolveAttachment } from './awareness-deliver.mjs';

export const REPOST_PLATFORMS = ['reddit', 'facebook'];
export const DEFAULT_SINCE_DAYS = 14;

export function parseArgs(argv) {
  const out = { live: false, deliveredBefore: '', sinceDays: DEFAULT_SINCE_DAYS };
  for (const a of argv) {
    if (a === '--live') out.live = true;
    else if (a.startsWith('--delivered-before=')) out.deliveredBefore = a.slice('--delivered-before='.length).trim();
    else if (a.startsWith('--since-days=')) out.sinceDays = Number(a.slice('--since-days='.length));
  }
  return out;
}

/** The ISO instant, or null when `value` is not a valid date. */
export function parseCutoff(value) {
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

export async function fetchPending(supabase, { before, sinceDays = DEFAULT_SINCE_DAYS, now = new Date() }) {
  const since = new Date(now.getTime() - sinceDays * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from('engagement_lead')
    .select(
      'id, platform, community, locator, url, title, draft, image_ref, image_comments, why, thread_type, created_at, discord_delivered_at',
    )
    .eq('kind', AWARENESS_KIND)
    .eq('status', 'delivered')
    .in('platform', REPOST_PLATFORMS)
    .not('draft', 'is', null)
    .lt('discord_delivered_at', before)
    .gte('discord_delivered_at', since)
    .order('discord_delivered_at', { ascending: true })
    .limit(500);
  if (error) {
    if (isSchemaPending(error)) return [];
    throw error;
  }
  return data ?? [];
}

/** Claims one lead for this run: true only when exactly one still-pending row was updated. */
export async function claimLead(supabase, leadId, before, now = new Date()) {
  const { data, error } = await supabase
    .from('engagement_lead')
    .update({ discord_delivered_at: now.toISOString() })
    .eq('id', leadId)
    .eq('status', 'delivered')
    .lt('discord_delivered_at', before)
    .select('id');
  if (error) throw error;
  return Array.isArray(data) && data.length === 1;
}

/** Puts the original timestamp back after a failed send so a rerun retries the lead. */
export async function unclaimLead(supabase, leadId, originalDeliveredAt) {
  const { data, error } = await supabase
    .from('engagement_lead')
    .update({ discord_delivered_at: originalDeliveredAt })
    .eq('id', leadId)
    .eq('status', 'delivered')
    .select('id');
  if (error) throw error;
  if (!Array.isArray(data) || data.length !== 1) throw new Error('un-claim updated no row');
}

/** Records the new card's message id; a zero-row update is an error, never a silent success. */
export async function recordMessageId(supabase, leadId, messageId) {
  const { data, error } = await supabase
    .from('engagement_lead')
    .update({ discord_message_id: messageId })
    .eq('id', leadId)
    .eq('status', 'delivered')
    .select('id');
  if (error) throw error;
  if (!Array.isArray(data) || data.length !== 1) throw new Error('recording the new message id updated no row');
}

export async function runRepost({
  supabase,
  catalog,
  before,
  sinceDays = DEFAULT_SINCE_DAYS,
  live = false,
  ackSecret = null,
  webhook = '',
  env = process.env,
  fetchImpl = fetch,
  now = new Date(),
  log = console.log,
} = {}) {
  if (!(Date.parse(before) <= now.getTime())) throw new Error('delivered-before must be a past instant');
  const leads = await fetchPending(supabase, { before, sinceDays, now });
  const plan = leads.map((lead) => ({
    leadId: lead.id,
    platform: lead.platform,
    community: lead.community,
    route: routeForPlatform(lead.platform),
    channelId: routeChannelId(routeForPlatform(lead.platform), env),
    deliveredAt: lead.discord_delivered_at,
    card: resolveAttachment(lead, catalog) ? 'png' : 'text',
  }));
  const counts = {};
  for (const p of plan) counts[p.route] = (counts[p.route] ?? 0) + 1;
  log(`awareness-repost: ${plan.length} pending (delivered before ${before}): ${JSON.stringify(counts)}`);
  for (const p of plan) log(`  ${live ? 'WILL SEND' : 'would send'} lead ${p.leadId} ${p.platform}/${p.community} -> ${p.route} (${p.card})`);
  if (!live) return { pending: plan.length, counts, plan, reposted: [], failed: [], dryRun: true };

  const reposted = [];
  const failed = [];
  const skipped = [];
  for (const lead of leads) {
    const route = routeForPlatform(lead.platform);
    let claimed = false;
    try {
      const imageRef = resolveAttachment(lead, catalog);
      const png = imageRef ? (await fetchCardPng(imageRef, { fetchImpl })).png : null;
      const postedUrl = ackSecret ? buildAckUrl(ackSecret, { leadId: lead.id, action: 'posted', linkIncluded: false }) : null;
      const skipUrl = ackSecret ? buildAckUrl(ackSecret, { leadId: lead.id, action: 'skip' }) : null;
      const content = buildAwarenessMessage(lead, { postedUrl, skipUrl });
      const replyText = buildAwarenessReplyText(lead).text;
      if (!replyText) throw new Error(`lead ${lead.id} has no reply text`);
      if (!(await claimLead(supabase, lead.id, before, now))) {
        skipped.push(lead.id);
        continue;
      }
      claimed = true;
      const messageId = await postAwarenessMessage({
        webhook,
        route,
        env,
        content,
        png,
        filename: imageRef ? imageFilename(imageRef) : undefined,
        fetchImpl,
      });
      claimed = false; // the card exists now; never un-claim past this point
      try {
        await recordMessageId(supabase, lead.id, messageId);
      } catch (err) {
        failed.push({ leadId: lead.id, message: `CARD SENT (message ${messageId}) but not recorded: ${String(err?.message ?? err)}` });
        continue;
      }
      reposted.push({ leadId: lead.id, route, messageId, card: imageRef ? cardUrlForRef(imageRef) : null });
      try {
        await postAwarenessReplyText({ webhook, route, env, text: replyText, fetchImpl });
      } catch (err) {
        failed.push({ leadId: lead.id, message: `reply text: ${String(err?.message ?? err)}` });
      }
    } catch (err) {
      failed.push({ leadId: lead.id, message: String(err?.message ?? err) });
      if (claimed) {
        try {
          await unclaimLead(supabase, lead.id, lead.discord_delivered_at);
        } catch (restoreErr) {
          failed.push({ leadId: lead.id, message: `could not un-claim after the failed send (${String(restoreErr?.message ?? restoreErr)}); it will not be retried until repaired` });
        }
      }
    }
  }
  if (skipped.length) log(`awareness-repost: ${skipped.length} lead(s) already claimed by an earlier run — skipped`);
  return { pending: plan.length, counts, plan, reposted, failed, skipped, dryRun: false };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const before = parseCutoff(args.deliveredBefore) ?? (args.live ? null : new Date().toISOString());
  if (!before) {
    console.error('awareness-repost: --live needs a valid --delivered-before=<ISO instant>; refusing.');
    return 1;
  }
  if (Date.parse(before) > Date.now()) {
    console.error('awareness-repost: --delivered-before is in the future; refusing (it would match cards this run re-posts).');
    return 1;
  }
  if (!Number.isFinite(args.sinceDays) || args.sinceDays <= 0) {
    console.error('awareness-repost: --since-days must be a positive number.');
    return 1;
  }
  const supabase = serviceClient();
  if (!supabase) {
    console.log('awareness-repost: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY unset — nothing to do.');
    return 0;
  }
  if (args.live && !discordBotToken(process.env)) {
    console.error('awareness-repost: no Discord bot token in this job — refusing a live run (it would fall back to the old channel).');
    return 1;
  }
  const result = await runRepost({
    supabase,
    catalog: await loadCatalog(),
    before,
    sinceDays: args.sinceDays,
    live: args.live,
    ackSecret: process.env.COMMUNITY_ACK_SECRET ?? null,
    webhook: '',
  });
  console.log(`awareness-repost: ${result.dryRun ? 'DRY RUN — nothing sent' : `re-posted ${result.reposted.length}, failed ${result.failed.length}`}.`);
  for (const f of result.failed) console.error(`  lead ${f.leadId}: ${f.message}`);
  return result.failed.length > 0 ? 1 : 0;
}

if (process.argv[1]?.split(/[\\/]/).pop() === 'awareness-repost.mjs') {
  runMain(main, { name: 'awareness-repost' });
}

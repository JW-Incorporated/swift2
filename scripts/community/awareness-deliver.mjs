#!/usr/bin/env node
// Awareness image-reply lane — delivery (owner direction 2026-10-01: 10+
// opportunities a day into Discord, in 2-3 batches). Zero-LLM. Reads drafted
// `awareness_reply` leads (the awareness answerer wrote `draft`, `why`,
// and optionally an `image_ref`), picks a batch under the caps
// (awareness-message.mjs `selectBatch`) and posts ONE Discord message per
// lead, then flips that lead to `delivered` the instant Discord confirms it.
// A reply is TEXT-ONLY by default (#4767): the share card is downloaded and
// attached (multipart webhook upload) only for a lead the drafting step set an
// `image_ref` on whose sub allows image comments; otherwise the card message
// is a plain post with nothing attached. The owner posts the reply himself;
// this script never touches Reddit/Facebook.
//
//   npx tsx scripts/community/awareness-deliver.mjs [--dry-run]
//
// Needs SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY, DISCORD_SOCIAL_WEBHOOK (the
// repo secret DISCORD_SOCIAL_CHANNEL_WEBHOOK_URL). COMMUNITY_ACK_SECRET is
// optional (without it the message falls back to the reaction footer).
import { serviceClient } from '../lib/supabase.mjs';
import { isSchemaPending, runMain } from '../lib/cli.mjs';
import { buildAckUrl } from './mailer.mjs';
import { awarenessEnabled, dailyCapFor, loadConfig, utcDayStart } from './awareness-scan.mjs';
import { discordBotToken, routedPost, routeForPlatform } from '../lib/discord-route.mjs';
import { AWARENESS_KIND } from './awareness-filters.mjs';
import { lintReply } from './awareness-draft.mjs';
import { eligibilityRank } from './awareness-eligibility.mjs';
import { cardUrlForRef, fetchCardPng, loadCatalog, validateImageRef } from './awareness-image.mjs';
import {
  buildAwarenessMessage,
  buildAwarenessReplyText,
  buildMultipartPayload,
  buildTextPayload,
  imageFilename,
  selectBatch,
} from './awareness-message.mjs';

export const BATCH_CAP = 5; // eight batches a day, 15 a day in all: above the owner's 10+ target
export const DAILY_CAP = 15;
const MAX_LEAD_AGE_HOURS = 48;

/**
 * The share-card ref to attach to this lead, or `null` for a text-only reply —
 * the default (#4767, owner rejected a branded card in a comment thread).
 * A card rides along only when BOTH hold: the drafting step set an `image_ref`
 * on the row, and the sub is known to allow image comments. Anything else —
 * no ref, a ref that is not in the real catalogue, a `text_only` or still
 * unverified sub — ships as plain text rather than inventing a picture.
 */
export function resolveAttachment(lead, catalog) {
  const ref = typeof lead.image_ref === 'string' ? lead.image_ref.trim() : '';
  if (!ref || lead.image_comments !== 'image') return null;
  const check = validateImageRef(ref, catalog);
  return check.ok ? check.ref : null;
}

export async function fetchDraftedAwareness(supabase, now = new Date()) {
  const since = new Date(now.getTime() - MAX_LEAD_AGE_HOURS * 3_600_000).toISOString();
  const { data, error } = await supabase
    .from('engagement_lead')
    .select(
      'id, platform, community, locator, url, title, draft, image_ref, image_comments, why, thread_type, created_at',
    )
    .eq('kind', AWARENESS_KIND)
    .eq('status', 'drafted')
    .not('draft', 'is', null)
    .not('why', 'is', null)
    .gte('created_at', since)
    .limit(200);
  if (error) {
    if (isSchemaPending(error)) return [];
    throw error;
  }
  // Defence in depth: whatever wrote the row, nothing reaches Discord that fails the reply lint.
  return (data ?? []).filter(
    (lead) => typeof lead.draft === 'string' && lintReply(lead.draft).length === 0,
  );
}

/** `{ perSub: {community: n}, total }` delivered today (UTC). */
export async function fetchDeliveredToday(supabase, now = new Date()) {
  const { data, error } = await supabase
    .from('engagement_lead')
    .select('community')
    .eq('kind', AWARENESS_KIND)
    .gte('discord_delivered_at', utcDayStart(now));
  if (error) {
    if (isSchemaPending(error)) return { perSub: {}, total: 0 };
    throw error;
  }
  const perSub = {};
  for (const row of data ?? []) perSub[row.community] = (perSub[row.community] ?? 0) + 1;
  return { perSub, total: (data ?? []).length };
}

/** `png: null` posts the card as a plain message — a text-only reply attaches nothing. */
export async function postAwarenessMessage({
  webhook,
  content,
  png = null,
  filename,
  route = null,
  env = process.env,
  fetchImpl = fetch,
}) {
  const response = await routedPost(
    route,
    png
      ? { method: 'POST', body: buildMultipartPayload({ content, png, filename }) }
      : {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(buildTextPayload({ content })),
        },
    { env, webhook, fetchImpl },
  );
  if (!response.ok) throw new Error(`Discord delivery failed with HTTP ${response.status}`);
  const payload = await response.json();
  if (!payload?.id) throw new Error('Discord delivery returned no message id');
  return payload.id;
}

/** The reply text alone, right after its card, so it copies cleanly on mobile. */
export async function postAwarenessReplyText({
  webhook,
  text,
  route = null,
  env = process.env,
  fetchImpl = fetch,
}) {
  const response = await routedPost(
    route,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(buildTextPayload({ content: text })),
    },
    { env, webhook, fetchImpl },
  );
  if (!response.ok)
    throw new Error(`Discord reply-text delivery failed with HTTP ${response.status}`);
}

/** `imageRef` is what actually shipped: `null` records a text-only reply. */
export async function markDelivered(supabase, leadId, messageId, imageRef) {
  const { error } = await supabase
    .from('engagement_lead')
    .update({
      status: 'delivered',
      discord_delivered_at: new Date().toISOString(),
      discord_message_id: messageId,
      image_ref: imageRef,
    })
    .eq('id', leadId)
    .eq('status', 'drafted');
  if (error) throw error;
}

export async function runDelivery({
  supabase,
  webhook,
  catalog,
  config = loadConfig(),
  ackSecret = null,
  fetchImpl = fetch,
  env = process.env,
  now = new Date(),
  dryRun = false,
} = {}) {
  const { defaults, subs } = config;
  const tiers = new Map(subs.map((sub) => [sub.name, sub]));
  const capFor = (community) => dailyCapFor(tiers.get(community), defaults);
  const leads = await fetchDraftedAwareness(supabase, now);
  const today = await fetchDeliveredToday(supabase, now);
  const perSubRemaining = { default: capFor(null) };
  for (const lead of leads)
    perSubRemaining[lead.community] = Math.max(
      0,
      capFor(lead.community) - (today.perSub[lead.community] ?? 0),
    );
  const batch = selectBatch(leads, {
    perSubRemaining,
    deliveredToday: today.total,
    batchCap: BATCH_CAP,
    dailyCap: DAILY_CAP,
    rank: eligibilityRank,
    tierOf: (lead) => tiers.get(lead.community)?.tier ?? 1, // a sub found by search is a target too
  });
  if (batch.length === 0)
    return { drafted: leads.length, batch: 0, delivered: [], failed: [], totalToday: today.total };
  if (dryRun)
    return {
      drafted: leads.length,
      batch: batch.length,
      delivered: [],
      failed: [],
      totalToday: today.total,
      dryRun: true,
    };

  const cards = new Map();
  const prepared = [];
  const failed = [];
  for (const lead of batch) {
    try {
      const imageRef = resolveAttachment(lead, catalog);
      if (imageRef && !cards.has(imageRef))
        cards.set(imageRef, await fetchCardPng(imageRef, { fetchImpl }));
      const postedUrl = ackSecret
        ? buildAckUrl(ackSecret, { leadId: lead.id, action: 'posted', linkIncluded: false })
        : null;
      const skipUrl = ackSecret
        ? buildAckUrl(ackSecret, { leadId: lead.id, action: 'skip' })
        : null;
      const content = buildAwarenessMessage(lead, { postedUrl, skipUrl });
      const replyText = buildAwarenessReplyText(lead).text;
      if (!replyText) throw new Error(`Awareness opportunity ${lead.id} has no reply text`);
      prepared.push({
        lead,
        imageRef,
        content,
        replyText,
        png: imageRef ? cards.get(imageRef).png : null,
      });
    } catch (err) {
      failed.push({ leadId: lead.id, message: String(err?.message ?? err) });
    }
  }
  const delivered = [];
  for (const item of prepared) {
    try {
      const route = routeForPlatform(item.lead.platform);
      const messageId = await postAwarenessMessage({
        webhook,
        route,
        env,
        content: item.content,
        png: item.png,
        filename: item.imageRef ? imageFilename(item.imageRef) : undefined,
        fetchImpl,
      });
      // The card is the record (acks and reactions route by it), so a card
      // that posted is delivered even if its reply text then fails; the
      // failure is still reported so the run shows it.
      let replyError = null;
      try {
        await postAwarenessReplyText({ webhook, route, env, text: item.replyText, fetchImpl });
      } catch (err) {
        replyError = String(err?.message ?? err);
      }
      await markDelivered(supabase, item.lead.id, messageId, item.imageRef);
      delivered.push({
        leadId: item.lead.id,
        messageId,
        card: item.imageRef ? cardUrlForRef(item.imageRef) : null,
      });
      if (replyError) failed.push({ leadId: item.lead.id, message: replyError });
    } catch (err) {
      failed.push({ leadId: item.lead.id, message: String(err?.message ?? err) });
    }
  }
  return {
    drafted: leads.length,
    batch: batch.length,
    delivered,
    failed,
    totalToday: today.total + delivered.length,
  };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  if (!awarenessEnabled()) {
    console.log(
      'awareness-deliver: AWARENESS_LANE_ENABLED=false — skipping. Kill switch, not a fault.',
    );
    return 0;
  }
  const supabase = serviceClient();
  if (!supabase) {
    console.log(
      'awareness-deliver: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY unset — skipping (degraded, not a crash).',
    );
    return 0;
  }
  const webhook = process.env.DISCORD_SOCIAL_WEBHOOK;
  if (!webhook && !discordBotToken(process.env) && !dryRun) {
    console.error(
      'awareness-deliver: neither a Discord bot token nor DISCORD_SOCIAL_WEBHOOK is configured. 0 delivered.',
    );
    return 1;
  }
  const result = await runDelivery({
    supabase,
    webhook,
    catalog: await loadCatalog(),
    ackSecret: process.env.COMMUNITY_ACK_SECRET ?? null,
    dryRun,
  });
  console.log(
    `awareness-deliver: ${result.drafted} drafted, batch ${result.batch}, delivered ${result.delivered.length}, failed ${result.failed.length}, ${result.totalToday} today${dryRun ? ' (dry-run)' : ''}.`,
  );
  for (const f of result.failed) console.error(`  lead ${f.leadId}: ${f.message}`);
  return result.failed.length > 0 ? 1 : 0;
}

if (process.argv[1]?.split(/[\\/]/).pop() === 'awareness-deliver.mjs') {
  runMain(main, { name: 'awareness-deliver' });
}

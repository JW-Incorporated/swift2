#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { runMain } from '../lib/cli.mjs';
import { strictServiceClient } from '../lib/supabase.mjs';

export const DEFAULT_OUTPUT = 'docs/ops/dashboard/community.json';
const DAY_MS = 24 * 60 * 60_000;

function ratio(numerator, denominator) {
  return denominator ? Number((numerator / denominator).toFixed(4)) : null;
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function platformReplyRate(ledgers, outcomes, platform, windowStart) {
  const ids = new Set(ledgers.filter((row) => row.platform === platform).map((row) => row.id));
  const rows = outcomes.filter((row) => ids.has(row.post_ledger_id)
    && row.horizon === '7d' && new Date(row.checked_at).getTime() >= windowStart);
  const withReplies = rows.filter((row) => Number(row.replies) > 0).length;
  return { measured: rows.length, withReplies, share: ratio(withReplies, rows.length) };
}

export function computeAcceptance(ledgers, outcomes, now = new Date()) {
  const postedAfter = now.getTime() - 7 * DAY_MS;
  const eligibleBefore = now.getTime() - DAY_MS;
  const week = ledgers.filter((row) => {
    if (row.platform !== 'reddit') return false;
    const postedAt = new Date(row.posted_at).getTime();
    return postedAt >= postedAfter && postedAt <= now.getTime();
  });
  const eligible = week.filter((row) => new Date(row.posted_at).getTime() <= eligibleBefore);
  const scored24h = new Set(outcomes
    .filter((row) => row.horizon === '24h' && Number.isFinite(row.score))
    .map((row) => row.post_ledger_id));
  const complete = eligible.filter((row) => row.comment_url && scored24h.has(row.id)).length;
  const rate = ratio(complete, eligible.length);
  return {
    platform: 'reddit',
    target: 0.9,
    eligiblePosted: eligible.length,
    pendingUnder24h: week.length - eligible.length,
    complete,
    rate,
    passes: rate == null ? null : rate >= 0.9,
  };
}

function postedCountsByPlatform(ledgers, now) {
  const windowStart = now.getTime() - 7 * DAY_MS;
  const eligibleBefore = now.getTime() - DAY_MS;
  const counts = { reddit: { posted: 0, eligible24h: 0 }, facebook: { posted: 0, eligible24h: 0 } };
  for (const row of ledgers) {
    if (!(row.platform in counts)) continue;
    const postedAt = new Date(row.posted_at).getTime();
    if (postedAt < windowStart || postedAt > now.getTime()) continue;
    counts[row.platform].posted += 1;
    if (postedAt <= eligibleBefore) counts[row.platform].eligible24h += 1;
  }
  return counts;
}

export function buildCommunityReport({ ledgers, outcomes, replyLeads, now = new Date() }) {
  const windowStart = now.getTime() - 7 * DAY_MS;
  const weekLedgers = ledgers.filter((row) => new Date(row.posted_at).getTime() >= windowStart);
  const outcomeByLedger = new Map(weekLedgers.map((row) => [row.id, row.platform]));
  const reddit24hScores = outcomes
    .filter((row) => row.horizon === '24h' && outcomeByLedger.get(row.post_ledger_id) === 'reddit')
    .map((row) => row.score).filter(Number.isFinite);
  const inboundByPlatform = { reddit: 0, facebook: 0 };
  for (const lead of replyLeads) {
    if (lead.platform in inboundByPlatform) inboundByPlatform[lead.platform] += 1;
  }
  return {
    version: 1,
    generatedAt: now.toISOString(),
    window: {
      days: 7,
      start: new Date(now.getTime() - 7 * DAY_MS).toISOString(),
      end: now.toISOString(),
    },
    acceptance: computeAcceptance(weekLedgers, outcomes, now),
    postedByPlatform: postedCountsByPlatform(weekLedgers, now),
    score24h: { reddit: { measured: reddit24hScores.length, median: median(reddit24hScores) } },
    replies7d: {
      reddit: platformReplyRate(ledgers, outcomes, 'reddit', windowStart),
      facebook: platformReplyRate(ledgers, outcomes, 'facebook', windowStart),
    },
    inboundReplies: {
      gmailReplyToUs: { ...inboundByPlatform, total: replyLeads.length },
      facebookPage: { measured: null, gap: 'reply notifier has no community ledger linkage' },
    },
  };
}

async function queryRows(supabase, now) {
  const start = new Date(now.getTime() - 7 * DAY_MS).toISOString();
  const historyStart = new Date(now.getTime() - 14 * DAY_MS).toISOString();
  const ledgersResult = await supabase.from('community_post_ledger')
    .select('id,platform,comment_url,posted_at').gte('posted_at', historyStart).lte('posted_at', now.toISOString());
  if (ledgersResult.error) throw new Error(`Community ledger report query failed: ${ledgersResult.error.message}`);
  const ledgers = ledgersResult.data ?? [];
  const outcomesResult = ledgers.length
    ? await supabase.from('community_outcome')
      .select('post_ledger_id,platform,score,replies,horizon,checked_at')
      .in('post_ledger_id', ledgers.map((row) => row.id))
    : { data: [], error: null };
  if (outcomesResult.error) throw new Error(`Community outcome report query failed: ${outcomesResult.error.message}`);
  const repliesResult = await supabase.from('engagement_lead')
    .select('platform,created_at').eq('kind', 'reply_to_us').gte('created_at', start).lte('created_at', now.toISOString());
  if (repliesResult.error) throw new Error(`Community reply report query failed: ${repliesResult.error.message}`);
  return { ledgers, outcomes: outcomesResult.data ?? [], replyLeads: repliesResult.data ?? [] };
}

export async function writeCommunityReport({
  supabase = strictServiceClient(),
  outputPath = process.env.COMMUNITY_OUTCOMES_REPORT || DEFAULT_OUTPUT,
  now = new Date(),
} = {}) {
  if (!supabase) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  const report = buildCommunityReport({ ...(await queryRows(supabase, now)), now });
  const resolved = path.resolve(outputPath);
  await mkdir(path.dirname(resolved), { recursive: true });
  await writeFile(resolved, `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

async function main() {
  const report = await writeCommunityReport();
  console.log(`community-outcomes-report: eligible=${report.acceptance.eligiblePosted} complete=${report.acceptance.complete}`);
  return 0;
}

if (process.argv[1]?.split(/[\\/]/).pop() === 'outcomes-report.mjs') {
  runMain(main, { name: 'community-outcomes-report' });
}

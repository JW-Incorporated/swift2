// One-off helper for the Community Engine 30-day review (P3-2,
// docs/community/30-day-review-plan.md). Runs the review doc's exact SQL
// queries via the shared service-role client and prints the results as one
// JSON blob to stdout. Not wired into any schedule — dispatched once by the
// `community-30day-review-query` workflow, then that workflow/script pair
// should be deleted once the review card has the data (same disposable
// pattern as fb-lead-scrub.yml).
import { serviceClient } from '../lib/supabase.mjs';

async function main() {
  const client = serviceClient();
  if (!client) {
    console.log(JSON.stringify({ error: 'SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not set' }));
    process.exitCode = 1;
    return;
  }

  const out = {};

  // 1. Posted-vs-drafted ratio (engagement_lead, last 30 days)
  {
    const { data, error } = await client
      .from('engagement_lead')
      .select('status, created_at')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString());
    if (error) {
      out.engagement_lead_30d = { error: error.message };
    } else {
      const counts = { posted: 0, skipped: 0, still_pending: 0, redline_skipped: 0, low_relevance_skipped: 0, total: data.length };
      for (const row of data) {
        if (row.status === 'posted') counts.posted++;
        else if (row.status === 'skipped_by_founder') counts.skipped++;
        else if (row.status === 'drafted' || row.status === 'emailed') counts.still_pending++;
        else if (row.status === 'skipped_redline') counts.redline_skipped++;
        else if (row.status === 'skipped_low_relevance') counts.low_relevance_skipped++;
      }
      out.engagement_lead_30d = counts;
    }
  }

  // Cross-check: community_post_ledger row count for the same window
  {
    const { count, error } = await client
      .from('community_post_ledger')
      .select('*', { count: 'exact', head: true })
      .gte('posted_at', new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString());
    out.community_post_ledger_30d_count = error ? { error: error.message } : count;
  }

  // 2. Link-included counts (no real CTR possible — no utm_ wiring)
  {
    const { data, error } = await client
      .from('community_post_ledger')
      .select('link_included, posted_at')
      .gte('posted_at', new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString());
    if (error) {
      out.community_post_ledger_links_30d = { error: error.message };
    } else {
      const linked = data.filter((r) => r.link_included).length;
      out.community_post_ledger_links_30d = { linked_posts: linked, total_posts: data.length };
    }
  }

  // 3. Theory-corpus size
  {
    const { data, error } = await client.from('fan_theory_candidate').select('status, redline_ok');
    if (error) {
      out.fan_theory_candidate = { error: error.message };
    } else {
      const byStatus = {};
      for (const row of data) {
        const key = row.status ?? 'null';
        if (!byStatus[key]) byStatus[key] = { candidates: 0, redline_clean: 0 };
        byStatus[key].candidates++;
        if (row.redline_ok) byStatus[key].redline_clean++;
      }
      out.fan_theory_candidate = byStatus;
    }
  }
  {
    const { data, error } = await client
      .from('live_theory')
      .select('mention_count, communities')
      .eq('origin', 'fan')
      .eq('persistent', true);
    if (error) {
      out.live_theory_fan_persistent = { error: error.message };
    } else {
      const communitySet = new Set();
      let totalMentions = 0;
      for (const row of data) {
        totalMentions += row.mention_count ?? 0;
        for (const c of row.communities ?? []) communitySet.add(c);
      }
      out.live_theory_fan_persistent = {
        promoted_theories: data.length,
        total_mentions: totalMentions,
        distinct_communities: communitySet.size,
      };
    }
  }

  console.log(JSON.stringify(out, null, 2));
}

main().catch((err) => {
  console.log(JSON.stringify({ fatal_error: String(err?.stack || err) }));
  process.exitCode = 1;
});

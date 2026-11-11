const HOUR_MS = 60 * 60_000;

function horizonFor(postedAt, checkedAt) {
  const age = postedAt ? checkedAt.getTime() - new Date(postedAt).getTime() : 0;
  if (!Number.isFinite(age) || age < 6 * HOUR_MS) return '1h';
  if (age < 3 * 24 * HOUR_MS) return '24h';
  return '7d';
}

/** Counts-only rows. Activity text and member identity never enter this shape. */
export function buildFacebookOutcomeRows(entries, { leads, ledgers, checkedAt = new Date() }) {
  const leadByUrl = new Map(leads.map((lead) => [lead.url, lead.id]));
  const ledgerByLead = new Map(
    ledgers.filter((row) => row.lead_id).map((row) => [row.lead_id, row]),
  );
  const ledgerByComment = new Map(
    ledgers.filter((row) => row.comment_url).map((row) => [row.comment_url, row]),
  );
  const rows = [];
  for (const entry of entries) {
    const leadId = leadByUrl.get(entry.postPermalink);
    const ledger = (leadId && ledgerByLead.get(leadId)) || ledgerByComment.get(entry.commentUrl);
    if (!ledger) continue;
    rows.push({
      post_ledger_id: ledger.id,
      platform: 'facebook',
      comment_url: entry.commentUrl,
      comment_id: entry.commentId,
      score: entry.reactionCount,
      replies: entry.replyCount,
      horizon: horizonFor(ledger.posted_at ?? entry.commentedAt, checkedAt),
      checked_at: checkedAt.toISOString(),
    });
  }
  return rows;
}

export async function ingestFacebookActivity(supabase, entries, { checkedAt = new Date() } = {}) {
  const postUrls = [...new Set(entries.map((entry) => entry.postPermalink).filter(Boolean))];
  const commentUrls = [...new Set(entries.map((entry) => entry.commentUrl).filter(Boolean))];
  const leadsResult = postUrls.length
    ? await supabase.from('engagement_lead').select('id,url').eq('platform', 'facebook').in('url', postUrls)
    : { data: [], error: null };
  if (leadsResult.error) throw new Error(`facebook activity lead lookup failed: ${leadsResult.error.message}`);
  const leadIds = (leadsResult.data ?? []).map((lead) => lead.id);
  const ledgers = [];
  if (leadIds.length) {
    const result = await supabase
      .from('community_post_ledger')
      .select('id,lead_id,comment_url,posted_at')
      .in('lead_id', leadIds);
    if (result.error) throw new Error(`facebook activity ledger lookup failed: ${result.error.message}`);
    ledgers.push(...(result.data ?? []));
  }
  if (commentUrls.length) {
    const result = await supabase
      .from('community_post_ledger')
      .select('id,lead_id,comment_url,posted_at')
      .in('comment_url', commentUrls);
    if (result.error) throw new Error(`facebook activity comment lookup failed: ${result.error.message}`);
    ledgers.push(...(result.data ?? []));
  }
  const rows = buildFacebookOutcomeRows(entries, {
    leads: leadsResult.data ?? [],
    ledgers: [...new Map(ledgers.map((row) => [row.id, row])).values()],
    checkedAt,
  });
  if (!rows.length) return { matched: 0, written: 0 };
  const { error } = await supabase
    .from('community_outcome')
    .upsert(rows, { onConflict: 'post_ledger_id,horizon' });
  if (error) throw new Error(`facebook activity outcome write failed: ${error.message}`);
  return { matched: rows.length, written: rows.length };
}

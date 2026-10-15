import { legacyLocatorOf } from './fb-lead-identity.mjs';

function exactLeadQuery(query, lead, locator = lead.locator) {
  return query
    .eq('platform', lead.platform)
    .eq('locator', locator)
    .eq('kind', lead.kind)
    .is('thread_id', null);
}

function guardUrl(query, url) {
  return url ? query.eq('url', url) : query.is('url', null);
}

/** Refresh only the row identified by this lead's complete null-thread key and URL state. */
export async function backfillLeadMetrics(supabase, lead) {
  if (lead.thread_id) return;
  const update = {
    ...(lead.url ? { url: lead.url } : {}),
    reactions: lead.reactions,
    num_comments: lead.num_comments,
  };
  const { error } = await guardUrl(
    exactLeadQuery(supabase.from('engagement_lead').update(update), lead),
    lead.url,
  );
  if (error)
    console.warn(`fb-export-ingest: metrics backfill skipped for one lead: ${error.message}`);
}

async function upgradeLegacyLead(supabase, lead) {
  const legacyLocator = legacyLocatorOf(lead);
  if (!lead.url || legacyLocator === lead.locator) return false;
  const update = {
    url: lead.url,
    locator: lead.locator,
    reactions: lead.reactions,
    num_comments: lead.num_comments,
  };
  const query = guardUrl(
    exactLeadQuery(supabase.from('engagement_lead').update(update), lead, legacyLocator),
    null,
  );
  const { data, error } = await query.select('locator');
  if (error) throw new Error(`engagement_lead legacy upgrade failed: ${error.message}`);
  return Boolean(data?.length);
}

export async function writeEngagementLeads(supabase, leads) {
  let inserted = 0;
  let deduped = 0;
  for (const lead of leads) {
    if (await upgradeLegacyLead(supabase, lead)) {
      deduped += 1;
      continue;
    }
    const { error } = await supabase.from('engagement_lead').insert(lead);
    if (error?.code === '23505') {
      await backfillLeadMetrics(supabase, lead);
      deduped += 1;
      continue;
    }
    if (error) throw new Error(`engagement_lead insert failed: ${error.message}`);
    inserted += 1;
  }
  return { inserted, deduped };
}

import { createTheoryPrefilter, theoryBundleKey } from '../../community/theory-bundles.mjs';
import { getLoggedClaudeCaller } from '../../lib/llm-usage.mjs';

export const HARVEST_QUEUE_LIMIT = 20;

function finiteCount(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
}

function watchItem(row) {
  return Array.isArray(row.watch_item) ? row.watch_item[0] : row.watch_item;
}

function bareCommunity(value, platform) {
  return String(value ?? '').replace(new RegExp(`^${platform}:`, 'i'), '');
}

function redditPermalink(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !/(^|\.)reddit\.com$/i.test(url.hostname)) return undefined;
    return `https://www.reddit.com${url.pathname}`;
  } catch {
    return undefined;
  }
}

function normalizedLead(decision, lead) {
  const item = watchItem(decision);
  const platform = item?.source;
  if (!lead || lead.platform !== platform) return null;
  const community = bareCommunity(lead.community, platform);
  if (!['reddit', 'facebook'].includes(platform) || !community) return null;
  if (platform === 'reddit') {
    const permalink = redditPermalink(lead.url);
    if (!permalink || !/^[A-Za-z0-9_-]+$/.test(lead.thread_id ?? '')) return null;
    return {
      decisionId: decision.id,
      actionRef: decision.action_ref,
      platform,
      sourceRef: item.source_ref,
      postId: lead.thread_id,
      community,
      title: lead.title || 'Reddit duplicate discussion',
      permalink,
      numComments: finiteCount(lead.num_comments),
    };
  }
  const reactions = finiteCount(lead.reactions);
  const comments = finiteCount(lead.num_comments);
  return {
    decisionId: decision.id,
    actionRef: decision.action_ref,
    platform,
    sourceRef: item.source_ref,
    postId: `facebook-${item.source_ref}`,
    community,
    title: lead.title || 'Facebook duplicate discussion',
    summary: typeof lead.context === 'string' ? lead.context : '',
    numComments: reactions + comments,
  };
}

export function runHarvestAction(decision, { live = false } = {}) {
  if (!live) return { acted: false, reason: 'router-not-live' };
  if (decision?.class !== 'duplicate') throw new Error('harvest action requires duplicate class');
  return { acted: true, action: 'harvest_then_discard', queued: true };
}

export async function loadHarvestQueue(db, { limit = HARVEST_QUEUE_LIMIT } = {}) {
  if (!db) throw new Error('duplicate harvest requires a database client');
  const decisionsResult = await db.from('watch_decision')
    .select('id,item_id,action_ref,watch_item!inner(id,source,source_ref)')
    .eq('class', 'duplicate').eq('shadow', true)
    .like('action_ref', '{"routerStatus":"succeeded"%')
    .not('action_ref', 'like', '%"harvestStatus":%')
    .in('watch_item.source', ['reddit', 'facebook'])
    .order('decided_at').limit(limit);
  if (decisionsResult.error) throw decisionsResult.error;
  const decisions = decisionsResult.data ?? [];
  const refs = [...new Set(decisions.map((row) => watchItem(row)?.source_ref).filter(Boolean))];
  if (refs.length === 0) return [];

  const leadsResult = await db.from('engagement_lead')
    .select('id,platform,community,thread_id,url,title,context,reactions,num_comments')
    .in('id', refs);
  if (leadsResult.error) throw leadsResult.error;
  const leads = new Map((leadsResult.data ?? []).map((lead) => [lead.id, lead]));
  const queued = decisions.map((decision) => normalizedLead(
    decision, leads.get(watchItem(decision)?.source_ref),
  )).filter(Boolean);
  if (queued.length === 0) return [];

  const keys = queued.map(theoryBundleKey);
  const minedResult = await db.from('theory_mined_bundle')
    .select('bundle_key').in('bundle_key', keys);
  if (minedResult.error) throw minedResult.error;
  const mined = new Set((minedResult.data ?? []).map((row) => row.bundle_key));
  await acknowledgeHarvest(db,
    queued.filter((entry) => mined.has(theoryBundleKey(entry))), 'already_mined');
  return queued.filter((entry) => !mined.has(theoryBundleKey(entry)));
}

async function acknowledgeHarvest(db, entries, status) {
  let acknowledged = 0;
  for (const entry of entries) {
    let action;
    try { action = JSON.parse(entry.actionRef); } catch { continue; }
    const next = JSON.stringify({ ...action, harvestStatus: status });
    const result = await db.from('watch_decision').update({ action_ref: next })
      .eq('id', entry.decisionId).eq('action_ref', entry.actionRef).select('id');
    if (result.error) throw result.error;
    acknowledged += (result.data ?? []).length;
  }
  return acknowledged;
}

async function acknowledgeCompletedHarvest(db, entries) {
  const keys = entries.map(theoryBundleKey);
  if (keys.length === 0) return 0;
  const result = await db.from('theory_mined_bundle').select('bundle_key').in('bundle_key', keys);
  if (result.error) throw result.error;
  const completed = new Set((result.data ?? []).map((row) => row.bundle_key));
  return acknowledgeHarvest(db,
    entries.filter((entry) => completed.has(theoryBundleKey(entry))), 'succeeded');
}

export function redditHarvestTargets(queue) {
  return queue.filter((entry) => entry.platform === 'reddit').map((entry, index) => ({
    id: entry.postId,
    title: entry.title,
    permalink: entry.permalink,
    subreddit: entry.community,
    createdAt: null,
    rank: index - queue.length,
    theory: false,
    harvestDecisionId: entry.decisionId,
  }));
}

export function buildHarvestArtifact(entries) {
  const groups = new Map();
  for (const entry of entries) {
    const group = `${entry.platform}:${entry.community}`;
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push({
      postId: entry.postId,
      title: entry.title,
      ...(entry.platform === 'reddit' && entry.permalink ? { permalink: entry.permalink } : {}),
      numComments: entry.numComments,
      comments: entry.platform === 'facebook'
        ? (entry.summary ? [{ author: null, body: entry.summary }] : [])
        : (entry.comments ?? []).map((comment) => ({ author: null, body: comment.body ?? null })),
    });
  }
  return { subreddits: [...groups].map(([subreddit, posts]) => ({ subreddit, posts })) };
}

function identifiersFrom(entries) {
  const found = new Set();
  const add = (value) => {
    if (typeof value !== 'string') return;
    const plain = value.replace(/^(?:u\/|@)/i, '').trim();
    if (plain.length >= 2) found.add(plain);
  };
  for (const entry of entries) {
    for (const value of [entry.title, entry.summary]) {
      for (const match of String(value ?? '').matchAll(/(?:\bu\/|@)([A-Za-z0-9][A-Za-z0-9_.-]{1,31})/g)) {
        add(match[1]);
      }
    }
    for (const comment of entry.comments ?? []) {
      add(comment.author);
      for (const match of String(comment.body ?? '').matchAll(/(?:\bu\/|@)([A-Za-z0-9][A-Za-z0-9_.-]{1,31})/g)) {
        add(match[1]);
      }
    }
  }
  return [...found];
}

function scrubIdentifiers(value, identifiers) {
  if (typeof value === 'string') {
    let clean = value;
    for (const identifier of identifiers) {
      const escaped = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      clean = clean.replace(
        new RegExp(`(?<![A-Za-z0-9_])(?:u\\/|@)?${escaped}(?![A-Za-z0-9_])`, 'gi'),
        '',
      );
    }
    return clean.replace(/\s+([,.;:])/g, '$1').replace(/\s{2,}/g, ' ').trim();
  }
  if (Array.isArray(value)) return value.map((item) => scrubIdentifiers(item, identifiers));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value)
      .map(([key, item]) => [key, scrubIdentifiers(item, identifiers)]));
  }
  return value;
}

function normalizedWords(value) {
  return String(value ?? '').toLowerCase().replace(/(?:\bu\/|@)[a-z0-9_.-]+/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean);
}

function redditCommentPhrases(entries) {
  const phrases = [];
  for (const entry of entries.filter((item) => item.platform === 'reddit')) {
    for (const comment of entry.comments ?? []) {
      const words = normalizedWords(comment.body);
      if (words.length < 4) {
        if (words.join(' ').length >= 12) phrases.push(words.join(' '));
        continue;
      }
      for (let index = 0; index <= words.length - 4; index += 1) {
        phrases.push(words.slice(index, index + 4).join(' '));
      }
    }
  }
  return phrases;
}

function dropVerbatimTheories(data, entries) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.theories)) return data;
  const phrases = redditCommentPhrases(entries);
  if (phrases.length === 0) return data;
  return { ...data, theories: data.theories.filter((theory) => {
    const output = Object.values(theory ?? {}).filter((value) => typeof value === 'string')
      .flatMap(normalizedWords).join(' ');
    return !phrases.some((phrase) => output.includes(phrase));
  }) };
}

export function privacySafeClaudeCaller(callClaude, entries) {
  const identifiers = identifiersFrom(entries);
  return async (input) => {
    const response = await callClaude({
      ...input,
      system: `${input.system}\nWrite claims in original aggregate wording. Never include a member name, username, handle, or verbatim comment.`,
    });
    if (response?.status !== 'ok') return response;
    const scrubbed = scrubIdentifiers(response.data, identifiers);
    return { ...response, data: dropVerbatimTheories(scrubbed, entries) };
  };
}

async function loadTheoryStage() {
  return import(new URL('../../../apps/worker/src/extract/run-theory-miner-stage.ts', import.meta.url).href);
}

export async function mineHarvestedDuplicates(db, entries, {
  createPrefilter = createTheoryPrefilter,
  createLoggedClaudeCaller = getLoggedClaudeCaller,
  loadStage = loadTheoryStage,
} = {}) {
  if (entries.length === 0) return { bundlesConsidered: 0, theoriesUpserted: 0, errors: [] };
  const prefilter = createPrefilter(db);
  const { runTheoryMinerStage } = await loadStage();
  const result = await runTheoryMinerStage(db, buildHarvestArtifact(entries), {
    priority: 'P3',
    shouldMine: prefilter.shouldMine,
    claude: privacySafeClaudeCaller(createLoggedClaudeCaller(), entries),
  });
  const acknowledged = await acknowledgeCompletedHarvest(db, entries);
  return { ...result, harvestAcknowledged: acknowledged, jev: prefilter.stats() };
}

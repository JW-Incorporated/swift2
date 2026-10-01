#!/usr/bin/env node
// Awareness image-reply lane — the answerer routine's deterministic hands
// (docs/agents/runner-prompts/awareness-answerer.md). The routine LLM only
// decides the words; this script does every read and write, so the rules that
// must not bend are code, not prompt:
//   list    new awareness leads (<=48h), redline-screened (a hit is marked
//           skipped_redline here and never shown), capped per sub, each with
//           the sub's self-promo note and the image candidates
//   write   validates the image ref against the real catalogue, lints the
//           reply (no link, no site name, no pitch, short), then saves
//           draft/why/image_ref and flips the lead to `drafted`
//   skip    marks a lead skipped_low_relevance (nothing honest to say)
//
//   npx tsx scripts/community/awareness-draft.mjs list [--limit 8]
//   npx tsx scripts/community/awareness-draft.mjs write <lead-id> --draft "<text>" --why "<one line>" [--image-ref <ref>]
//   npx tsx scripts/community/awareness-draft.mjs skip <lead-id>
import { screenTopic, screenTopicOutput } from '@swift2/shared/redline';
import { serviceClient } from '../lib/supabase.mjs';
import { runMain } from '../lib/cli.mjs';
import { AWARENESS_KIND } from './awareness-filters.mjs';
import { loadConfig } from './awareness-scan.mjs';
import { loadCatalog, mentionedEra, suggestMoments, validateImageRef } from './awareness-image.mjs';

export const DEFAULT_LIST_LIMIT = 6;
export const PER_SUB_PER_RUN = 3;
export const MAX_REPLY_CHARS = 300;
export const MIN_REPLY_CHARS = 8;
const MAX_WHY_CHARS = 160;
const MAX_LEAD_AGE_HOURS = 48;

/** Words that turn "a fan sharing a picture" into an ad. The picture does the talking. */
const PITCH_RE =
  /(https?:\/\/|www\.|\b\w+\.(com|net|org|io|app|co)\b|longlive|\bcheck (it|this|that|us|out)\b|\bvisit\b|\b(my|our|this|the) (site|website|app|page|project)\b|\blink\b|\bdm me\b|\bfollow (me|us)\b|\bhashtag|#\w)/i;
const AI_TELL_RE = /\b(great question|as an ai|delve|tapestry)\b|—/i;

/** Returns a list of problems with a drafted reply; empty means it passes. */
export function lintReply(text) {
  const reply = String(text ?? '').trim();
  const problems = [];
  if (reply.length < MIN_REPLY_CHARS) problems.push('reply is empty or too short');
  if (reply.length > MAX_REPLY_CHARS)
    problems.push(`reply is ${reply.length} chars (max ${MAX_REPLY_CHARS})`);
  if (PITCH_RE.test(reply))
    problems.push(
      'reply names the site, a link or a pitch (the picture does that; no link, no site name)',
    );
  if (AI_TELL_RE.test(reply)) problems.push('reply has an AI-tell phrase or an em dash');
  const category = screenTopicOutput([reply]);
  if (category) problems.push(`reply trips the redline screen (${category})`);
  return problems;
}

export function lintWhy(text) {
  const why = String(text ?? '').trim();
  return why.length >= 8 && why.length <= MAX_WHY_CHARS
    ? []
    : [`why must be 8-${MAX_WHY_CHARS} chars, one line`];
}

/** Validates + lints, then returns the row patch or `{ problems }`. Pure given the catalogue. */
export function buildDraftPatch({ draft, why, imageRef, current }, catalog) {
  const problems = [...lintReply(draft), ...lintWhy(why)];
  const ref = imageRef || current;
  const check = validateImageRef(ref, catalog);
  if (!check.ok) problems.push(`image ref "${ref}" is not in the catalogue (${check.reason})`);
  if (problems.length > 0) return { problems };
  return {
    patch: {
      draft: String(draft).trim(),
      why: String(why).trim(),
      image_ref: check.ref,
      link_included: false,
      status: 'drafted',
    },
  };
}

/** Caps a candidate list at `limit`, at most `perSub` per sub, lower tier first then oldest. */
export function pickForDrafting(
  leads,
  tiers,
  { limit = DEFAULT_LIST_LIMIT, perSub = PER_SUB_PER_RUN } = {},
) {
  const ordered = [...leads].sort(
    (a, b) =>
      (tiers.get(a.community)?.tier ?? 3) - (tiers.get(b.community)?.tier ?? 3) ||
      String(a.created_at).localeCompare(String(b.created_at)),
  );
  const used = {};
  const out = [];
  for (const lead of ordered) {
    if (out.length >= limit) break;
    if ((used[lead.community] ?? 0) >= perSub) continue;
    used[lead.community] = (used[lead.community] ?? 0) + 1;
    out.push(lead);
  }
  return out;
}

/** Awareness leads still waiting for a draft (<=48h old); 0 when the table is not migrated yet. */
export async function countNewLeads(supabase, now = new Date()) {
  const since = new Date(now.getTime() - MAX_LEAD_AGE_HOURS * 3_600_000).toISOString();
  const { count, error } = await supabase
    .from('engagement_lead')
    .select('id', { count: 'exact', head: true })
    .eq('kind', AWARENESS_KIND)
    .eq('status', 'new')
    .gte('created_at', since);
  return error ? 0 : (count ?? 0);
}

async function listLeads(supabase, catalog, limit) {
  const since = new Date(Date.now() - MAX_LEAD_AGE_HOURS * 3_600_000).toISOString();
  const { data, error } = await supabase
    .from('engagement_lead')
    .select(
      'id, platform, community, locator, url, title, context, image_ref, image_comments, thread_type, created_at',
    )
    .eq('kind', AWARENESS_KIND)
    .eq('status', 'new')
    .gte('created_at', since)
    .limit(200);
  if (error) throw error;
  const safe = [];
  let redlined = 0;
  for (const lead of data ?? []) {
    if (screenTopic(`${lead.title ?? ''} ${lead.context ?? ''}`)) {
      redlined += 1;
      await supabase
        .from('engagement_lead')
        .update({ status: 'skipped_redline', redline_ok: false })
        .eq('id', lead.id)
        .eq('status', 'new');
    } else safe.push(lead);
  }
  const tiers = new Map(loadConfig().subs.map((sub) => [sub.name, sub]));
  const picked = pickForDrafting(safe, tiers, { limit }).map((lead) => {
    const eraId = mentionedEra(lead.title ?? '');
    return {
      ...lead,
      selfPromoNote: tiers.get(lead.community)?.selfPromoNote ?? null,
      moments: suggestMoments(lead.title ?? '', catalog, { eraId, limit: 4 }),
    };
  });
  return { redlined, waiting: safe.length, leads: picked, eras: catalog.eras.map((era) => era.id) };
}

function flag(args, name) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  const supabase = serviceClient();
  if (command === 'count') {
    // Cheap gate for the routine workflow: no new leads, no Claude run.
    console.log(supabase ? await countNewLeads(supabase) : 0);
    return 0;
  }
  if (!supabase) {
    console.error('awareness-draft: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY unset.');
    return 1;
  }
  const catalog = await loadCatalog();
  if (command === 'list') {
    console.log(
      JSON.stringify(
        await listLeads(supabase, catalog, Number(flag(args, 'limit')) || DEFAULT_LIST_LIMIT),
        null,
        1,
      ),
    );
    return 0;
  }
  const id = args[0];
  if (command === 'skip' && id) {
    const { error } = await supabase
      .from('engagement_lead')
      .update({ status: 'skipped_low_relevance' })
      .eq('id', id)
      .eq('kind', AWARENESS_KIND)
      .eq('status', 'new');
    if (error) throw error;
    console.log(JSON.stringify({ ok: true, id, status: 'skipped_low_relevance' }));
    return 0;
  }
  if (command === 'write' && id) {
    const { data: lead, error } = await supabase
      .from('engagement_lead')
      .select('id, image_ref, status')
      .eq('id', id)
      .eq('kind', AWARENESS_KIND)
      .maybeSingle();
    if (error) throw error;
    if (!lead || lead.status !== 'new') {
      console.error(`awareness-draft: lead ${id} is not a status=new awareness lead.`);
      return 1;
    }
    const result = buildDraftPatch(
      {
        draft: flag(args, 'draft'),
        why: flag(args, 'why'),
        imageRef: flag(args, 'image-ref'),
        current: lead.image_ref,
      },
      catalog,
    );
    if (result.problems) {
      console.error(JSON.stringify({ ok: false, id, problems: result.problems }));
      return 1;
    }
    const { error: updateError } = await supabase
      .from('engagement_lead')
      .update(result.patch)
      .eq('id', id)
      .eq('status', 'new');
    if (updateError) throw updateError;
    console.log(
      JSON.stringify({ ok: true, id, status: 'drafted', image_ref: result.patch.image_ref }),
    );
    return 0;
  }
  console.error(
    'usage: awareness-draft.mjs list [--limit N] | count | write <id> --draft "<text>" --why "<line>" [--image-ref <ref>] | skip <id>',
  );
  return 1;
}

if (process.argv[1]?.split(/[\\/]/).pop() === 'awareness-draft.mjs') {
  runMain(main, { name: 'awareness-draft' });
}

#!/usr/bin/env node
// Awareness image-reply lane — the answerer routine's deterministic hands
// (docs/agents/runner-prompts/awareness-answerer.md). The routine LLM holds NO
// database secret and has no shell: it only reads an export file and writes a
// drafts file. This script does every read and write around it, in plain
// workflow jobs, so the rules that must not bend are code, not prompt:
//   count   how many new awareness leads are waiting (the workflow gate)
//   export  new leads (<=48h), redline-screened (a hit is marked skipped_redline
//           here and never exported), capped per sub, each with the sub's
//           self-promo note and the image candidates, to a JSON file
//   apply   reads the LLM's drafts file as UNTRUSTED input: for each entry it
//           validates an image ref IF one was given (none = a text-only reply,
//           the default since #4767), lints the reply
//           (no link, no site name, no pitch, short), checks the lead really is
//           a status=new awareness lead, then saves draft/why/image_ref and
//           flips it to `drafted` (or skipped_low_relevance for a skip)
//
//   npx tsx scripts/community/awareness-draft.mjs count
//   npx tsx scripts/community/awareness-draft.mjs export --out .scratch/awareness-in.json [--limit 6]
//   npx tsx scripts/community/awareness-draft.mjs apply --file .scratch/out/drafts.json
import { readFileSync, writeFileSync } from 'node:fs';
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
export const MAX_DRAFT_ENTRIES = 20;
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

/**
 * Validates + lints, then returns the row patch or `{ problems }`. Pure given
 * the catalogue.
 *
 * The picture is OPT-IN (owner rejected a card reply 2026-10-01, #4767): an
 * omitted or empty `imageRef` drafts a text-only reply (`image_ref: null`) —
 * it is NOT filled in from the lead's scan-time suggestion, or every reply
 * would ship a card again. A ref that IS given still has to be in the real
 * catalogue.
 */
export function buildDraftPatch({ draft, why, imageRef }, catalog) {
  const problems = [...lintReply(draft), ...lintWhy(why)];
  const ref = typeof imageRef === 'string' ? imageRef.trim() : '';
  const check = ref ? validateImageRef(ref, catalog) : null;
  if (check && !check.ok)
    problems.push(`image ref "${ref}" is not in the catalogue (${check.reason})`);
  if (problems.length > 0) return { problems };
  return {
    patch: {
      draft: String(draft).trim(),
      why: String(why).trim(),
      image_ref: check ? check.ref : null,
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

export async function exportLeads(supabase, catalog, limit, now = new Date()) {
  const since = new Date(now.getTime() - MAX_LEAD_AGE_HOURS * 3_600_000).toISOString();
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
      id: lead.id,
      community: lead.community,
      title: lead.title,
      thread_type: lead.thread_type,
      image_comments: lead.image_comments,
      image_ref: lead.image_ref,
      selfPromoNote: tiers.get(lead.community)?.selfPromoNote ?? null,
      moments: suggestMoments(lead.title ?? '', catalog, { eraId, limit: 4 }),
    };
  });
  return { redlined, waiting: safe.length, leads: picked, eras: catalog.eras.map((era) => era.id) };
}

/** Parses the LLM's drafts file; anything malformed is an empty list, unknown fields are dropped. */
export function parseDrafts(text) {
  let parsed;
  try {
    parsed = JSON.parse(String(text ?? ''));
  } catch {
    return [];
  }
  const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.drafts) ? parsed.drafts : [];
  return list
    .filter((e) => e && typeof e.id === 'string' && (e.action === 'draft' || e.action === 'skip'))
    .slice(0, MAX_DRAFT_ENTRIES)
    .map((e) => ({
      id: e.id,
      action: e.action,
      draft: typeof e.draft === 'string' ? e.draft : '',
      why: typeof e.why === 'string' ? e.why : '',
      image_ref: typeof e.image_ref === 'string' ? e.image_ref : undefined,
    }));
}

/** Applies parsed drafts to leads that are still status=new awareness leads. */
export async function applyDrafts(supabase, entries, catalog) {
  const result = { drafted: 0, skipped: 0, rejected: [] };
  if (entries.length === 0) return result;
  const { data, error } = await supabase
    .from('engagement_lead')
    .select('id')
    .in(
      'id',
      entries.map((e) => e.id),
    )
    .eq('kind', AWARENESS_KIND)
    .eq('status', 'new');
  if (error) throw error;
  const waiting = new Map((data ?? []).map((lead) => [lead.id, lead]));
  for (const entry of entries) {
    const lead = waiting.get(entry.id);
    if (!lead) {
      result.rejected.push({ id: entry.id, problems: ['not a status=new awareness lead'] });
      continue;
    }
    if (entry.action === 'skip') {
      const { error: skipError } = await supabase
        .from('engagement_lead')
        .update({ status: 'skipped_low_relevance' })
        .eq('id', entry.id)
        .eq('status', 'new');
      if (skipError) throw skipError;
      result.skipped += 1;
      continue;
    }
    const built = buildDraftPatch(
      { draft: entry.draft, why: entry.why, imageRef: entry.image_ref },
      catalog,
    );
    if (built.problems) {
      result.rejected.push({ id: entry.id, problems: built.problems });
      continue;
    }
    const { error: updateError } = await supabase
      .from('engagement_lead')
      .update(built.patch)
      .eq('id', entry.id)
      .eq('status', 'new');
    if (updateError) throw updateError;
    result.drafted += 1;
  }
  return result;
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
  if (command === 'export' && flag(args, 'out')) {
    const limit = Number(flag(args, 'limit')) || DEFAULT_LIST_LIMIT;
    const out = await exportLeads(supabase, catalog, limit);
    writeFileSync(flag(args, 'out'), `${JSON.stringify(out, null, 1)}\n`);
    console.log(`awareness-draft: exported ${out.leads.length} lead(s), ${out.redlined} redlined.`);
    return 0;
  }
  if (command === 'apply' && flag(args, 'file')) {
    let text;
    try {
      text = readFileSync(flag(args, 'file'), 'utf8');
    } catch {
      console.log('awareness-draft: no drafts file, nothing to apply.');
      return 0;
    }
    const result = await applyDrafts(supabase, parseDrafts(text), catalog);
    console.log(
      `awareness-draft: drafted ${result.drafted}, skipped ${result.skipped}, rejected ${result.rejected.length}.`,
    );
    for (const r of result.rejected) console.log(`  ${r.id}: ${r.problems.join('; ')}`);
    return 0;
  }
  console.error(
    'usage: awareness-draft.mjs count | export --out <file> [--limit N] | apply --file <file>',
  );
  return 1;
}

if (process.argv[1]?.split(/[\\/]/).pop() === 'awareness-draft.mjs') {
  runMain(main, { name: 'awareness-draft' });
}

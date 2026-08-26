// Helpers shared by the LongLive build-time sync generators
// (scripts/sync-longlive-content.mjs and scripts/sync-longlive-tracks.mjs).
// Pure functions only, except loadWebEnvLocal (reads apps/web/.env.local).

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const WEB_ENV_FILE = path.join(ROOT, 'apps', 'web', '.env.local');

/** Repo root, so each generator resolves seed/output paths from one place. */
export { ROOT };

/**
 * The sync scripts run as plain `node` prebuild steps, before Next's own
 * env-file loading kicks in, so apps/web/.env.local (where the documented
 * local Supabase creds live — see docs/dev-quickstart.md) wouldn't otherwise
 * be seen. Load it here, without overriding real env vars a deploy platform
 * (Vercel) already injected.
 */
export async function loadWebEnvLocal() {
  let raw;
  try {
    raw = await readFile(WEB_ENV_FILE, 'utf-8');
  } catch {
    return; // no .env.local — fine, e.g. on Vercel where env is injected directly
  }
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

/**
 * Which source the sync generators read. The repo's seed files are the source
 * of truth — they are what content PRs review and merge, and the DB is only
 * ever populated from them — so the default build reads seeds and needs no
 * credentials. The live Supabase read is opt-in via LONGLIVE_SYNC_SOURCE=db
 * for the day the DB carries content the repo doesn't (none today). See
 * docs/decisions.md 2026-07-17 (supersedes the 2026-07-08 DB-first entry).
 */
export function preferDbSource() {
  return process.env.LONGLIVE_SYNC_SOURCE === 'db';
}

/** Public Supabase creds from the environment, or null when not configured. */
export function supabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return { supabaseUrl, supabaseKey };
}

/**
 * Seed/DB era slugs that differ from the LongLive EraId. All other slugs match
 * their EraId 1:1.
 */
export const SLUG_TO_ERA_ID = {
  'the-life-of-a-showgirl': 'tloas',
  'tortured-poets': 'ttpd',
};

/**
 * Title → stable kebab slug. The single definition the whole pipeline shares:
 * the content sync uses it to build each moment's `vault-<eraId>-<slug>` id,
 * validate-content recomputes the same ids to check `moment:` relatedIds
 * resolve, and the content-engine cross-link checker uses it to tell an
 * already-linked pair from a new opportunity. Lives here (pure, dependency-free
 * node) so those callers can import it without pulling the sync script's
 * @supabase/supabase-js dependency.
 */
export function slugify(title) {
  return title
    .toLowerCase()
    .replace(/['’"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** TypeScript string literal for generated code. */
export function esc(s) {
  return JSON.stringify(s);
}

/** Bare hostname (no www.) as a readable fallback source name. */
export function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/**
 * The `reliability_score` rubric (2026-07-08 audit §5, mirrored in
 * packages/shared/src/vault-types.ts): 5 official/primary · 4 reputable press ·
 * 3 trade databases / verified interviews · 2 wikis + moderated fan forums ·
 * 1 unverified social. Anything outside 1..5 is not a score and is dropped
 * rather than guessed at.
 */
const isReliabilityScore = (v) => Number.isInteger(v) && v >= 1 && v <= 5;

/**
 * Normalize citations from either the legacy `{outlet,url}` shape or the §5
 * `{source_title,publisher,source_url,…}` shape into the vault's citation
 * shape, plus the item's top-level source_url. De-duped by url; drops entries
 * without a url.
 *
 * `reliability` and `type` carry the editor's §5 judgment through to the built
 * vault. Until 2026-08-11 this function flattened every citation to `{name,
 * url}`, so ~1.1k hand-scored moment citations (and every typed record's) were
 * authored, validated, and then thrown away at build time — the app could not
 * tell a label newsroom from a fan wiki. Both fields are OPTIONAL and omitted
 * when the seed never recorded one: absent must stay distinguishable from
 * "scored low", so nothing may default them. The top-level `sourceUrl`
 * fallback below is deliberately unscored for the same reason — a bare url
 * carries no provenance judgment.
 */
export function sourcesFrom(rawSources, sourceUrl) {
  const out = [];
  const seen = new Set();
  const push = (name, url, reliability, type) => {
    if (!url || typeof url !== 'string' || seen.has(url)) return;
    seen.add(url);
    const entry = { name: (name && String(name).trim()) || hostOf(url), url };
    if (isReliabilityScore(reliability)) entry.reliability = reliability;
    if (typeof type === 'string' && type.trim()) entry.type = type.trim();
    out.push(entry);
  };
  for (const s of Array.isArray(rawSources) ? rawSources : []) {
    if (!s || typeof s !== 'object') continue;
    push(
      s.name ?? s.source_title ?? s.publisher ?? s.outlet,
      s.url ?? s.source_url ?? s.sourceUrl,
      s.reliability_score,
      s.source_type,
    );
  }
  push(sourceUrl ? hostOf(sourceUrl) : null, sourceUrl);
  return out;
}

/**
 * ONE definition of how a citation is written into a *.generated.ts vault.
 * Five call sites (content, theories, videos, and two in tracks) used to hold
 * their own copy of `{ name: …, url: … }`, which is exactly how a field gets
 * added to `sourcesFrom` and then silently dropped by four of the five
 * emitters — the failure this repo has shipped three times (see the socialPost
 * note in sync-longlive-content.mjs). Add a citation field HERE and every
 * vault gets it.
 */
export function sourceLiteral(s) {
  const parts = [`name: ${esc(s.name)}`, `url: ${esc(s.url)}`];
  if (isReliabilityScore(s.reliability)) parts.push(`reliability: ${s.reliability}`);
  if (s.type) parts.push(`type: ${esc(s.type)}`);
  return `{ ${parts.join(', ')} }`;
}

/** The TypeScript type literal that `sourceLiteral` output satisfies. */
export const SOURCE_TYPE_LITERAL =
  '{ name: string; url: string; reliability?: 1 | 2 | 3 | 4 | 5; type?: string }';

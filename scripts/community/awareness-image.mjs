#!/usr/bin/env node
// Awareness lane — which site visual goes with a thread. A visual is a
// share-card (apps/web/app/api/share-card/route.tsx): `moment:<id>` renders
// `?item=<id>`, `era:<id>` renders `?era=<id>`; both portrait. The route
// degrades an unknown id to a default brand card instead of failing, so this
// module validates every ref against the real catalogue BEFORE a lead keeps it.
//
// Catalogue sources (offline, no DB): era ids/names from
// packages/experience/src/eras.ts, moment ids/titles from the generated vault
// (`node scripts/sync-longlive-content.mjs` writes
// apps/web/lib/longlive/content-vault.generated.ts, gitignored). If the
// vault file is missing the catalogue has eras only, so picks fall back to
// era cards — still valid, just less specific.
//
//   npx tsx scripts/community/awareness-image.mjs candidates "<thread title>"
//   npx tsx scripts/community/awareness-image.mjs validate moment:<id>
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { buildCardUrl } from '../social/fetch-share-card.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const VAULT_FILE = path.join(ROOT, 'apps', 'web', 'lib', 'longlive', 'content-vault.generated.ts');
const ERAS_FILE = path.join(ROOT, 'packages', 'experience', 'src', 'eras.ts');
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
export const MAX_CARD_BYTES = 8_000_000;

/** What fans call each era, lower-case. Matched on word boundaries. */
export const ERA_ALIASES = {
  debut: ['debut era', 'debut album', 'self titled'],
  fearless: ['fearless'],
  'speak-now': ['speak now'],
  red: ['red'],
  1989: ['1989'],
  reputation: ['reputation', 'rep era'],
  lover: ['lover'],
  folklore: ['folklore'],
  evermore: ['evermore'],
  midnights: ['midnights'],
  ttpd: ['ttpd', 'tortured poets', 'tortured poets department'],
  tloas: ['showgirl', 'tloas', 'life of a showgirl'],
};
const FALLBACK_ERA = 'tloas';
const STOP = new Set(
  'the a an and or of in on at to for with from by is was are were be been it its this that these those taylor swift swifts taylors what when how why who which did do does about after before into over under album song songs era eras'.split(
    ' ',
  ),
);

function tokens(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

/** Loads `{ eras: [{id, name}], moments: [{id, eraId, title}] }`; moments are [] when the vault was not generated. */
export async function loadCatalog({ vaultFile = VAULT_FILE, erasFile = ERAS_FILE } = {}) {
  const { ERAS } = await import(pathToFileURL(erasFile).href);
  const eras = ERAS.map((era) => ({ id: era.id, name: era.name }));
  const moments = [];
  if (existsSync(vaultFile)) {
    const { VAULT_RAW } = await import(pathToFileURL(vaultFile).href);
    for (const [eraId, items] of Object.entries(VAULT_RAW ?? {})) {
      for (const item of items ?? []) moments.push({ id: item.id, eraId, title: item.title ?? '' });
    }
  }
  return { eras, moments };
}

export function parseImageRef(ref) {
  const match = /^(moment|era):([A-Za-z0-9._-]{1,160})$/.exec(String(ref ?? '').trim());
  return match ? { kind: match[1], id: match[2] } : null;
}

/** `{ ok: true, ref }` only when the id exists in the catalogue. */
export function validateImageRef(ref, catalog) {
  const parsed = parseImageRef(ref);
  if (!parsed) return { ok: false, reason: 'bad-format' };
  const exists =
    parsed.kind === 'era'
      ? catalog.eras.some((era) => era.id === parsed.id)
      : catalog.moments.some((moment) => moment.id === parsed.id);
  return exists
    ? { ok: true, ref: `${parsed.kind}:${parsed.id}` }
    : { ok: false, reason: 'unknown-id' };
}

/** The deterministic share-card URL for a validated ref (portrait). */
export function cardUrlForRef(ref) {
  const parsed = parseImageRef(ref);
  if (!parsed) throw new Error(`bad image ref: ${ref}`);
  const key = parsed.kind === 'moment' ? 'item' : 'era';
  return buildCardUrl({ query: `${key}=${encodeURIComponent(parsed.id)}&size=portrait` });
}

export function mentionedEra(title) {
  const text = ` ${String(title ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')} `;
  for (const [id, aliases] of Object.entries(ERA_ALIASES)) {
    if (aliases.some((alias) => text.includes(` ${alias} `))) return id;
  }
  return null;
}

/** Best moments for a title: needs >= 2 shared significant words. Highest overlap first. */
export function suggestMoments(title, catalog, { eraId = null, limit = 5 } = {}) {
  const want = new Set(tokens(title));
  if (want.size === 0) return [];
  return catalog.moments
    .filter((moment) => !eraId || moment.eraId === eraId)
    .map((moment) => {
      const have = new Set(tokens(moment.title));
      const shared = [...want].filter((t) => have.has(t)).length;
      return { moment, shared, score: shared / Math.sqrt(have.size || 1) };
    })
    .filter((m) => m.shared >= 2)
    .sort((a, b) => b.score - a.score || a.moment.id.localeCompare(b.moment.id))
    .slice(0, limit)
    .map((m) => ({ ref: `moment:${m.moment.id}`, title: m.moment.title, eraId: m.moment.eraId }));
}

/**
 * Deterministic pick: a specific moment when the title overlaps one, else the
 * era the title names, else the newest era's card. Always returns a ref that
 * passes `validateImageRef`, so an LLM override can be rejected back to this.
 */
export function pickImageRef(title, catalog) {
  const eraId = mentionedEra(title);
  const [moment] = suggestMoments(title, catalog, { eraId });
  if (moment) return { ref: moment.ref, basis: 'moment' };
  if (eraId && validateImageRef(`era:${eraId}`, catalog).ok)
    return { ref: `era:${eraId}`, basis: 'era' };
  const fallback = catalog.eras.some((era) => era.id === FALLBACK_ERA)
    ? FALLBACK_ERA
    : catalog.eras.at(-1)?.id;
  return { ref: `era:${fallback}`, basis: 'fallback' };
}

/** Downloads the card PNG into memory; throws unless it is a real, bounded PNG. */
export async function fetchCardPng(ref, { fetchImpl = fetch } = {}) {
  const url = cardUrlForRef(ref);
  const response = await fetchImpl(url, { redirect: 'follow' });
  if (!response.ok) throw new Error(`share-card fetch failed: HTTP ${response.status} for ${url}`);
  const png = Buffer.from(await response.arrayBuffer());
  if (png.length < PNG_SIGNATURE.length || !png.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error(`${url} did not return a PNG`);
  }
  if (png.length > MAX_CARD_BYTES)
    throw new Error(`card is ${png.length} bytes (> ${MAX_CARD_BYTES})`);
  return { png, url };
}

async function main() {
  const [command, arg] = process.argv.slice(2);
  const catalog = await loadCatalog();
  if (command === 'candidates' && arg) {
    const eraId = mentionedEra(arg);
    console.log(
      JSON.stringify({
        pick: pickImageRef(arg, catalog),
        eraMentioned: eraId,
        moments: suggestMoments(arg, catalog, { eraId, limit: 5 }),
        eras: catalog.eras.map((era) => era.id),
      }),
    );
    return 0;
  }
  if (command === 'validate' && arg) {
    const result = validateImageRef(arg, catalog);
    console.log(JSON.stringify(result));
    return result.ok ? 0 : 1;
  }
  console.error('usage: awareness-image.mjs candidates "<title>" | validate <moment:id|era:id>');
  return 1;
}

if (process.argv[1]?.split(/[\\/]/).pop() === 'awareness-image.mjs') {
  runMain(main, { name: 'awareness-image' });
}

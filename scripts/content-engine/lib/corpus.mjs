// Corpus loader — reads supabase/seed/** (the source of truth) and normalizes
// every content type into one reviewable `Item` shape. Read-only. Pure Node
// dynamic-import of plain data modules; no deps, no DB, no secrets.
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
// Zero-dependency vocabulary shared with the sync generators (R8, Fable 5.1
// architecture review) — kept dependency-free like this file itself (see
// header above), so this loader can validate against the real enum without
// pulling in @supabase/supabase-js transitively.
import { RUMOR_STATUSES } from '../../lib/content-vocab.mjs';

const here = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(here, '..', '..', '..');
const SEED = join(ROOT, 'supabase', 'seed');

/**
 * @typedef {Object} Item
 * @property {string} type   moment|track|song-mood|theory|video|tour|release
 * @property {string} file   repo-relative seed file
 * @property {string} era
 * @property {string} key    natural key or slug (stable identity)
 * @property {string} title
 * @property {Record<string,string>} texts  reviewable prose, by field name
 * @property {{url:string, outlet?:string}[]} sources
 * @property {{url:string, credit?:string, caption?:string, kind?:string, focalPoint?:string}[]} images
 * @property {string} [category]
 * @property {string} [confidence]
 * @property {string} [outcome]
 * @property {Object} raw
 */

async function loadDir(dir, listKey) {
  let files;
  try {
    files = readdirSync(dir).filter((f) => f.endsWith('.mjs') && !f.startsWith('_')).sort();
  } catch {
    return [];
  }
  const out = [];
  for (const file of files) {
    const mod = (await import(pathToFileURL(join(dir, file)).href)).default;
    for (const row of mod?.[listKey] ?? []) out.push({ file: `supabase/seed/${dirName(dir)}/${file}`, fileEra: mod.eraSlug, row });
  }
  return out;
}
const dirName = (d) => d.split(/[\\/]/).pop();

const str = (v) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
const sourcesOf = (arr, extraUrl) => {
  const out = [];
  if (str(extraUrl)) out.push({ url: extraUrl });
  for (const s of Array.isArray(arr) ? arr : []) {
    const url = s?.source_url ?? s?.url;
    if (str(url)) out.push({ url, outlet: s?.publisher ?? s?.outlet ?? s?.source_title });
  }
  // de-dupe by url
  const seen = new Set();
  return out.filter((s) => (seen.has(s.url) ? false : (seen.add(s.url), true)));
};
const cleanText = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => str(v)));

export async function loadCorpus() {
  const items = [];

  // ── moments (content/<era>.mjs) ──
  for (const { file, fileEra, row: it } of await loadDir(join(SEED, 'content'), 'items')) {
    const era = it.eraSlug ?? fileEra;
    const images = [];
    if (str(it.thumbnailUrl)) images.push({ url: it.thumbnailUrl, kind: 'primary' });
    for (const p of it.moment?.photos ?? []) if (str(p?.url)) images.push({ url: p.url, credit: p.credit, caption: p.caption, kind: p.kind ?? 'primary', focalPoint: p.focalPoint });
    // Rumor prose (rumor tier, 2026-07-19) is reviewable text like any other
    // — folding claim/note into `texts` puts it in front of every prose
    // checker (redlines, claim-risk) and the agent factual pass, which all
    // iterate texts. Reported-claim wording is exactly the highest-risk
    // prose in the corpus; it must not bypass the safety net.
    const rumorTexts = {};
    (it.moment?.rumors ?? it.rumors ?? []).forEach((r, i) => {
      // Skip rumors with an unrecognized/malformed status — validate-content.mjs
      // (rumorsFrom()) drops these the same way, so the corpus loader's texts
      // stay aligned with what actually ships.
      if (r?.status !== undefined && !RUMOR_STATUSES.has(r.status)) return;
      if (str(r?.claim)) rumorTexts[`rumors[${i}].claim`] = r.claim;
      if (str(r?.note)) rumorTexts[`rumors[${i}].note`] = r.note;
    });
    const captionTexts = {};
    (it.moment?.photos ?? []).forEach((ph, i) => {
      if (str(ph?.caption)) captionTexts[`photos[${i}].caption`] = ph.caption;
      if (str(ph?.credit)) captionTexts[`photos[${i}].credit`] = ph.credit;
    });
    items.push({
      type: 'moment',
      file, era,
      key: it.slug ?? `${era}|${it.year}|${it.month}|${it.title}`,
      title: it.title ?? '(untitled)',
      category: it.category,
      // Photo captions and credits are READER-FACING PROSE and must be screened
      // like any other text. They were omitted here, and the cost was real: a
      // caption reading "A security guard stands watch at Swift's Watch Hill
      // 'Holiday House' estate" — a Never-OK #2 security-arrangements violation
      // — sat live on the site and passed every nightly Karen scan, because no
      // checker could see it. A redline does not care which field it is in.
      texts: cleanText({
        title: it.title,
        snippet: it.snippet,
        context: it.moment?.context,
        ...captionTexts,
        ...rumorTexts,
      }),
      sources: sourcesOf(it.moment?.sources, it.sourceUrl),
      images,
      raw: it,
    });
  }

  // ── track notes (tracks/<era>.mjs) ──
  for (const { file, fileEra, row: t } of await loadDir(join(SEED, 'tracks'), 'tracks')) {
    const era = t.eraSlug ?? fileEra;
    items.push({
      type: 'track', file, era,
      key: t.slug ?? `${era}|${t.trackTitle}`,
      title: t.trackTitle ?? '(untitled track)',
      texts: cleanText({ note: t.note }),
      sources: sourcesOf(t.sources),
      images: [],
      raw: t,
    });
  }

  // ── song moods (song-moods/<era>.mjs) ──
  for (const { file, fileEra, row: s } of await loadDir(join(SEED, 'song-moods'), 'songs')) {
    const era = s.eraSlug ?? fileEra;
    const useCase = Array.isArray(s.useCase) ? s.useCase.join('\n') : undefined;
    items.push({
      type: 'song-mood', file, era,
      key: s.slug ?? `${era}|song-mood`,
      title: s.slug ?? '(untitled song mood)',
      texts: cleanText({ oneLiner: s.oneLiner, useCase }),
      sources: [],
      images: [],
      raw: s,
    });
  }

  // ── theories (theories/<era>.mjs) ──
  for (const { file, fileEra, row: th } of await loadDir(join(SEED, 'theories'), 'theories')) {
    const era = th.eraSlug ?? fileEra;
    items.push({
      type: 'theory', file, era,
      key: th.slug ?? `${era}|${th.title}`,
      title: th.title ?? '(untitled theory)',
      confidence: th.confidence, outcome: th.outcome,
      texts: cleanText({ title: th.title, claim: th.claim, evidence: th.evidence }),
      sources: sourcesOf(th.sources),
      images: [],
      raw: th,
    });
  }

  // ── videos (videos/<era>.mjs) ──
  for (const { file, fileEra, row: v } of await loadDir(join(SEED, 'videos'), 'videos')) {
    const era = v.eraSlug ?? fileEra;
    const eggs = Array.isArray(v.easterEggs) ? v.easterEggs.join('\n') : undefined;
    items.push({
      type: 'video', file, era,
      key: v.slug ?? `${era}|${v.title}`,
      title: v.title ?? '(untitled video)',
      texts: cleanText({ title: v.title, summary: v.summary, symbolism: v.symbolism, easterEggs: eggs }),
      sources: sourcesOf(v.sources),
      images: [],
      raw: v,
    });
  }

  // ── tours (tours/tours.mjs) ──
  for (const { file, fileEra, row: t } of await loadDir(join(SEED, 'tours'), 'tours')) {
    const era = t.eraSlug ?? fileEra;
    const showTexts = {};
    (t.shows ?? []).forEach((s, i) => {
      if (str(s?.outfitNote)) showTexts[`shows[${i}].outfitNote`] = s.outfitNote;
      if (str(s?.setlistChange)) showTexts[`shows[${i}].setlistChange`] = s.setlistChange;
    });
    items.push({
      type: 'tour', file, era,
      key: t.slug ?? `${era}|${t.title}`,
      title: t.title ?? '(untitled tour)',
      texts: cleanText({ title: t.title, note: t.note, surpriseSongsNote: t.surpriseSongsNote, ...showTexts }),
      sources: sourcesOf(t.sources),
      images: [],
      raw: t,
    });
  }

  // ── releases (releases/releases.mjs) ──
  for (const { file, fileEra, row: r } of await loadDir(join(SEED, 'releases'), 'releases')) {
    const era = r.eraSlug ?? fileEra;
    items.push({
      type: 'release', file, era,
      key: r.slug ?? `${era}|${r.title}`,
      title: r.title ?? '(untitled release)',
      texts: cleanText({ title: r.title, note: r.note }),
      sources: sourcesOf(r.sources),
      images: [],
      raw: r,
    });
  }

  return items;
}

/** All distinct image refs across the corpus (deduped by url), with back-refs. */
export function imageIndex(items) {
  const byUrl = new Map();
  for (const it of items) {
    for (const img of it.images) {
      if (!byUrl.has(img.url)) byUrl.set(img.url, { ...img, usedBy: [] });
      byUrl.get(img.url).usedBy.push({ type: it.type, key: it.key, file: it.file, caption: img.caption });
    }
  }
  return [...byUrl.values()];
}

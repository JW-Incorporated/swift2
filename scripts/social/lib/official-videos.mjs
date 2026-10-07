// Official-video selection + processed-video ledger for source-video-frames.mjs.
//
// Founder decision 2026-10-07 06:23 ("frames yes", docs/decisions.md): stills
// from Taylor's OWN official-channel videos may enter the social photo library.
// "Official" is decided here, from the vault seed's own provenance fields —
// never from a guess: a record counts only when its YouTube media attribution
// names Taylor Swift's own channel (the seed's `attribution` is oEmbed's real
// author_name, see supabase/seed/videos/_appearance-helpers.mjs). Interviews on
// other people's channels (Ellen, Kimmel, GRAMMYs, ZAYN, ...) are excluded, as
// are lyric videos and trailers (burned-in text) and appearances (talking heads).
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const OFFICIAL_CHANNEL_RE = /^Taylor Swift\s+—\s+official YouTube channel/i;
export const ALLOWED_KINDS = new Set(['music_video', 'short_film', 'performance', 'documentary']);
const EXCLUDED_ATTRIBUTION_RE = /trailer/i;
const YT_ID_RE = /[?&]v=([\w-]{11})(?:[&#]|$)/;

export function youtubeIdFromUrl(url) {
  return YT_ID_RE.exec(String(url ?? ''))?.[1] ?? null;
}

/** Flattens seed modules ({eraSlug, videos[]}) to official-channel records, de-duped by YouTube id. */
export function selectOfficialVideos(modules) {
  const seen = new Set();
  const out = [];
  for (const mod of modules) {
    for (const video of mod?.videos ?? []) {
      if (!ALLOWED_KINDS.has(video.kind)) continue;
      for (const media of video.media ?? []) {
        if (media?.provider !== 'youtube') continue;
        const attribution = String(media.attribution ?? '');
        if (!OFFICIAL_CHANNEL_RE.test(attribution) || EXCLUDED_ATTRIBUTION_RE.test(attribution)) continue;
        const id = youtubeIdFromUrl(media.post_url);
        if (!id || seen.has(id)) continue;
        seen.add(id);
        out.push({ id, era: mod.eraSlug, slug: video.slug, title: video.title, kind: video.kind });
      }
    }
  }
  return out;
}

/** Imports every non-underscore seed file under `seedDir` (inert constant modules). */
export async function loadSeedModules(seedDir) {
  const files = (await readdir(seedDir)).filter((f) => f.endsWith('.mjs') && !f.startsWith('_')).sort();
  const modules = [];
  for (const file of files) {
    modules.push((await import(pathToFileURL(path.resolve(seedDir, file)).href)).default);
  }
  return modules;
}

/** Ledger = { version, processed: { [videoId]: { at, frames } } }. Missing file = empty. */
export async function readLedger(ledgerPath) {
  try {
    const parsed = JSON.parse(await readFile(ledgerPath, 'utf8'));
    return { version: 1, processed: parsed?.processed ?? {} };
  } catch (err) {
    if (err?.code === 'ENOENT') return { version: 1, processed: {} };
    throw err;
  }
}

export async function writeLedger(ledgerPath, ledger) {
  await mkdir(path.dirname(ledgerPath), { recursive: true });
  await writeFile(ledgerPath, JSON.stringify(ledger, null, 2) + '\n');
}

/** Videos not yet in the ledger, in stable seed order, bounded by `limit`. */
export function pendingVideos(videos, ledger, limit) {
  return videos.filter((v) => !ledger.processed[v.id]).slice(0, limit);
}

#!/usr/bin/env node
// Official-video stills for the social photo library (founder decision
// 2026-10-07 06:23, "frames yes" — docs/decisions.md). Emits a candidates JSON
// in exactly the shape source-wikimedia-photos.mjs does, so the existing merge
// step + `import-photo-library.mjs --fetch --write` land them; this script
// never writes the library and never touches post-queue.mjs / delete-media.mjs.
//
// Sources: ONLY Taylor's own official-channel videos from the vault seed
// (lib/official-videos.mjs). Rules kept: no AI images, no watermarks (frames
// that fail the quality gates are dropped, never cropped), no fan edits,
// takedown on request, `source` (-> mediaSource) always the watch URL.
//
// Mode A (preferred): yt-dlp <=1080p -> ffmpeg scene frames -> quality gates ->
//   perceptual dedupe. Often refused on datacenter IPs (bot-check); on the first
//   refusal Mode A is abandoned for the run and everything falls back to B.
// Mode B (always works, no video download): YouTube's static stills
//   i.ytimg.com/vi/<id>/maxres{1,2,3}.jpg (auto frames at 25/50/75%), kept only
//   when >=1280px wide AND they pass the same quality gates. maxresdefault.jpg is
//   the uploader's THUMBNAIL (designed art, often with titles) — opt-in only.
//
// Non-fatal by design: any failure writes whatever was found (or []) and exits 0.
//
// Usage:
//   node scripts/social/source-video-frames.mjs --output out.json [--videos 8] [--mode auto|a|b]
//     [--budget-minutes 20] [--max-frames 25] [--max-candidates 60: stop starting new videos past this] [--ledger social/video-frames-ledger.json]
//     [--scratch .artifacts/video-scratch (tests only — the importer jail is fixed at .artifacts/video-scratch/frames)] [--include-thumbnail]
//     [--cookies-from-browser <browser>]  opt-in, off by default: pass only when YouTube bot-checks the connection
//       (e.g. `npm run photos:frames:local -- --cookies-from-browser firefox`). On Windows, Chrome's cookie DPAPI
//       decrypt fails on every video, so prefer firefox/edge there.
//   Prints per video: frames extracted / dropped (logo, title card, black/blur, dupe, other) / kept, plus a run total.
//   node scripts/social/source-video-frames.mjs --probe     # Mode B yield on ALL official ids, no writes
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { detectPersistentLogo } from './lib/frame-logo.mjs';
import { analyzeFrame, dedupeByHash, rejectReason } from './lib/frame-quality.mjs';
import { loadSeedModules, pendingVideos, readLedger, selectOfficialVideos, writeLedger } from './lib/official-videos.mjs';
import { ModeAUnavailable, sourceVideoFrames } from './lib/video-frames-modea.mjs';

export const CREDIT = 'Taylor Swift (official video)';
export const STILL_KEYS = ['maxres1', 'maxres2', 'maxres3'];
const SEED_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'supabase', 'seed', 'videos');
const KIND_LABEL = { music_video: 'music video', short_film: 'short film', performance: 'performance video', documentary: 'behind-the-scenes video' };

export const watchUrl = (id, seconds) => `https://www.youtube.com/watch?v=${id}${seconds == null ? '' : `&t=${Math.floor(seconds)}s`}`;
export const stillUrls = (id, { includeThumbnail = false } = {}) =>
  [...STILL_KEYS, ...(includeThumbnail ? ['maxresdefault'] : [])].map((key) => ({ key, url: `https://i.ytimg.com/vi/${id}/${key}.jpg` }));

function altText(video, scene) {
  const label = KIND_LABEL[video.kind] ?? 'video';
  return `Still from Taylor Swift's official "${video.title}" ${label}${scene ? ` (${scene})` : ''}.`.slice(0, 200);
}

const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export function buildCandidate(video, { key, sourceUrl, seconds }) {
  const id = `official-video-${video.id}-${key}`;
  return {
    id,
    mediaPath: `/social/library/photos/${id}.jpg`,
    credit: CREDIT,
    source: watchUrl(video.id, seconds),
    sourceUrl,
    alt: altText(video, seconds == null ? null : `scene at ${clock(seconds)}`),
    tags: ['official-video', video.era],
  };
}

/** Mode B for one video: download each static still, keep >=1280px frames that pass the gates. */
export async function sourceStills(video, { fetchImpl = fetch, includeThumbnail = false } = {}) {
  const kept = [];
  const dropped = {};
  const note = (reason) => (dropped[reason] = (dropped[reason] ?? 0) + 1);
  for (const { key, url } of stillUrls(video.id, { includeThumbnail })) {
    const res = await fetchImpl(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LongLiveSocialLibraryImporter/1.0)' }, signal: globalThis.AbortSignal.timeout(30_000) });
    if (!res.ok || !String(res.headers.get('content-type') ?? '').startsWith('image/')) {
      note(`absent (${res.status})`);
      continue;
    }
    let analysis;
    let bytes;
    try {
      bytes = Buffer.from(await res.arrayBuffer());
      analysis = await analyzeFrame(bytes);
    } catch {
      note('undecodable');
      continue;
    }
    const reason = rejectReason(analysis);
    if (reason) note(reason.replace(/ \(.*/, ''));
    else kept.push({ key, url, hash: analysis.hash, bytes });
  }
  const unique = dedupeByHash(kept);
  if (kept.length > unique.length) dropped.duplicate = kept.length - unique.length;
  const logo = await detectPersistentLogo(unique.map((f) => f.bytes));
  if (logo) return { frames: [], dropped: { ...dropped, [`persistent ${logo.corner} logo`]: unique.length } };
  return { frames: unique.map((f) => buildCandidate(video, { key: f.key, sourceUrl: f.url })), dropped };
}

export const DROP_BUCKETS = ['logo', 'title card', 'black/blur', 'dupe', 'other'];

function bucketOf(reason) {
  if (/logo/.test(reason)) return 'logo';
  if (/title|end card/.test(reason)) return 'title card';
  if (/near-black|near-white|flat|blurry|letterboxed/.test(reason)) return 'black/blur';
  if (/duplicate/.test(reason)) return 'dupe';
  return 'other';
}

/** Per-video accounting: frames extracted, dropped by reason bucket, kept. */
export function summarizeVideo(usedMode, out, keptCount) {
  const dropped = Object.fromEntries(DROP_BUCKETS.map((b) => [b, 0]));
  for (const [reason, n] of Object.entries(out.dropped ?? {})) dropped[bucketOf(reason)] += n;
  if (usedMode === 'a') {
    dropped.dupe += out.duplicates ?? 0;
    const accounted = Object.values(dropped).reduce((s, n) => s + n, 0);
    if (out.logo) dropped.logo += Math.max(0, (out.rawCount ?? 0) - accounted);
    return { extracted: out.rawCount ?? keptCount, dropped, kept: keptCount };
  }
  const extracted = keptCount + Object.values(dropped).reduce((s, n) => s + n, 0);
  return { extracted, dropped, kept: keptCount };
}

export function formatStats(label, s) {
  const parts = DROP_BUCKETS.map((b) => `${b} ${s.dropped[b]}`).join(', ');
  return `${label}: extracted ${s.extracted}, dropped [${parts}], kept ${s.kept}`;
}

/** Orchestrates one run. `deps` are injectable for tests; failures never throw out of a video. */
export async function runSourcing(videos, ledger, opts = {}) {
  const { mode = 'auto', limit = 8, maxFrames = 25, maxCandidates = Infinity, budgetMs = 20 * 60_000, scratch, cookiesFromBrowser, includeThumbnail = false } = opts;
  const { modeA = sourceVideoFrames, modeB = sourceStills, now = Date.now, warn = console.warn, log = console.log, onVideo = async () => {} } = opts;
  const started = now();
  const candidates = [];
  const total = { extracted: 0, dropped: Object.fromEntries(DROP_BUCKETS.map((b) => [b, 0])), kept: 0 };
  const report = { videos: 0, modeA: 0, modeB: 0, blocked: false, errors: 0 };
  let aBlocked = false;
  for (const video of pendingVideos(videos, ledger, limit)) {
    if (candidates.length >= maxCandidates) break;
    let frames = null;
    let usedMode = null;
    let stats = null;
    if (mode !== 'b' && !aBlocked && now() - started < budgetMs) {
      try {
        const out = await modeA(video.id, scratch, { maxFrames, cookiesFromBrowser });
        if (out.logo) warn(`source-video-frames: ${video.id} dropped whole — persistent ${out.logo.corner} logo in ${Math.round(out.logo.ratio * 100)}% of frames.`);
        frames = out.kept.map((f) => buildCandidate(video, { key: `t${Math.floor(f.time)}`, sourceUrl: pathToFileURL(f.file).href, seconds: f.time }));
        usedMode = 'a';
        stats = summarizeVideo('a', out, frames.length);
      } catch (err) {
        if (err instanceof ModeAUnavailable) {
          aBlocked = report.blocked = true;
          warn(`source-video-frames: Mode A unavailable (${err.message}) — falling back to stills for the rest of this run.`);
        } else {
          report.errors += 1;
          warn(`source-video-frames: Mode A failed for ${video.id}: ${err.message}`);
        }
      }
    }
    if (frames === null && mode !== 'a') {
      try {
        const still = await modeB(video, { includeThumbnail });
        frames = still.frames;
        const logoKey = Object.keys(still.dropped ?? {}).find((k) => k.startsWith('persistent '));
        if (logoKey) warn(`source-video-frames: ${video.id} dropped whole — ${logoKey} across its stills.`);
        usedMode = 'b';
        stats = summarizeVideo('b', still, frames.length);
      } catch (err) {
        report.errors += 1;
        warn(`source-video-frames: stills failed for ${video.id}: ${err.message} — left unprocessed for the next run.`);
      }
    }
    if (frames === null) continue;
    candidates.push(...frames);
    log(formatStats(`  ${video.id} (mode ${usedMode.toUpperCase()})`, stats));
    total.extracted += stats.extracted;
    total.kept += stats.kept;
    for (const b of DROP_BUCKETS) total.dropped[b] += stats.dropped[b];
    report.videos += 1;
    report[usedMode === 'a' ? 'modeA' : 'modeB'] += 1;
    ledger.processed[video.id] = { at: new Date(now()).toISOString(), mode: usedMode, frames: frames.length };
    await onVideo(candidates, ledger);
  }
  if (report.videos > 0) log(formatStats('  run total', total));
  return { candidates, report, total };
}

function parseArgs(argv) {
  const args = { videos: 8, mode: 'auto', budgetMinutes: 20, maxFrames: 25, ledger: 'social/video-frames-ledger.json', scratch: '.artifacts/video-scratch' };
  const take = { '--output': 'output', '--mode': 'mode', '--ledger': 'ledger', '--scratch': 'scratch', '--cookies-from-browser': 'cookiesFromBrowser' };
  const num = { '--videos': 'videos', '--budget-minutes': 'budgetMinutes', '--max-frames': 'maxFrames', '--max-candidates': 'maxCandidates' };
  for (let i = 0; i < argv.length; i += 1) {
    if (take[argv[i]]) args[take[argv[i]]] = argv[++i];
    else if (num[argv[i]]) args[num[argv[i]]] = Number(argv[++i]);
    else if (argv[i] === '--probe') args.probe = true;
    else if (argv[i] === '--include-thumbnail') args.includeThumbnail = true;
  }
  return args;
}

async function probe(videos, includeThumbnail) {
  let frames = 0;
  let withFrames = 0;
  const dropped = {};
  for (const video of videos) {
    const out = await sourceStills(video, { includeThumbnail });
    frames += out.frames.length;
    if (out.frames.length) withFrames += 1;
    for (const [k, v] of Object.entries(out.dropped)) dropped[k] = (dropped[k] ?? 0) + v;
  }
  console.log(JSON.stringify({ officialVideos: videos.length, videosWithHdFrames: withFrames, hdFrames: frames, dropped }, null, 2));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const videos = selectOfficialVideos(await loadSeedModules(SEED_DIR));
  if (args.probe) {
    await probe(videos, args.includeThumbnail);
    return 0;
  }
  if (!args.output) throw new Error('Usage: node scripts/social/source-video-frames.mjs --output <candidates.json> [--videos 8] [--mode auto|a|b]');
  let candidates = [];
  try {
    const ledger = await readLedger(args.ledger);
    // Persist after EVERY video so a step timeout loses at most the video in flight.
    const persist = async (soFar) => {
      candidates = soFar; // survives a later failure: the final write below uses it
      await writeLedger(args.ledger, ledger);
      await mkdir(path.dirname(path.resolve(args.output)), { recursive: true });
      await writeFile(path.resolve(args.output), JSON.stringify(soFar, null, 2) + '\n');
    };
    const out = await runSourcing(videos, ledger, { ...args, limit: args.videos, budgetMs: args.budgetMinutes * 60_000, onVideo: persist });
    candidates = out.candidates;
    await writeLedger(args.ledger, ledger);
    console.log(`source-video-frames: ${videos.length} official video(s); this run ${JSON.stringify(out.report)}; ${candidates.length} candidate(s).`);
  } catch (err) {
    console.warn(`source-video-frames: non-fatal failure — ${err instanceof Error ? err.message : err}`);
  }
  await mkdir(path.dirname(path.resolve(args.output)), { recursive: true });
  await writeFile(path.resolve(args.output), JSON.stringify(candidates, null, 2) + '\n');
  return 0;
}

if (process.argv[1] && process.argv[1].split('\\').join('/').endsWith('scripts/social/source-video-frames.mjs')) {
  runMain(main, { name: 'source-video-frames' });
}

#!/usr/bin/env node
/**
 * Media-mix report (video-first slice 0, docs/plans/2026-10-31-video-first.md)
 * — prints what share of each era's feed is video. Informational only: it
 * always exits 0, it is NOT a CI gate.
 *
 * WHY THIS EXISTS (Workflow rule 8): the video-first plan needs a repeatable
 * number before the feed changes — what share of each era's feed is video.
 * Hand-counting entries from the generated files is error-prone and the
 * feed composition (which moments carry an inline video, which video
 * records are playable) is derived logic in the enrichment layer. This
 * script imports the REAL pipeline so the number tracks what the site
 * actually renders.
 *
 * USAGE:
 *   npm run check:media-mix          (from the repo root)
 *   npm run check:media-mix -- --json
 *   npm run check:media-mix -- --live
 *
 * Output columns:
 *   era | moments | moments w/ video | video records | live items | live w/ video | video share %
 * where video share = (moments w/ video + video records + live w/ video) /
 *                     (moments + video records + live items)
 *
 * One row per era + an ALL row. With --json the same data is printed as
 * JSON instead. Live data is only fetched when --live is passed (today the
 * live count is always 0 — no live items embed a video yet).
 */

import { runMain } from './lib/cli.mjs';

/**
 * Compute the media-mix row for one era.
 *
 * @param {Array<{ id: string, video?: { youtubeId?: string, watchUrl?: string } | null }>} moments
 * @param {Array<{ slug: string, youtubeId?: string | null, watchUrl?: string | null }>} videoRecords
 * @param {Array<{ id: string, embed?: unknown }>} liveItems
 * @param {number} [liveVideoCount] — how many live items have a video (pre-computed)
 * @returns {object} row with counts + total + videoShare
 */
export function mediaMixRow(moments, videoRecords = [], liveItems = [], liveVideoCount = 0) {
  const momentsWithVideo = moments.filter(
    (m) => m.video && (m.video.youtubeId || m.video.watchUrl),
  ).length;
  const total = moments.length + videoRecords.length + liveItems.length;
  const videos = momentsWithVideo + videoRecords.length + liveVideoCount;
  const videoShare = total > 0 ? videos / total : 0;
  return {
    moments: moments.length,
    momentsWithVideo,
    videos: videoRecords.length,
    live: liveItems.length,
    liveVideo: liveVideoCount,
    total,
    videoShare,
  };
}

function pct(share) {
  return share > 0 ? `${(share * 100).toFixed(1)}%` : '0.0%';
}

function buildRow(label, row, pad) {
  const cell = (n) => String(n).padStart(pad);
  return (
    `| ${label.padEnd(20)} | ` +
    `${cell(row.moments)} | ` +
    `${cell(row.momentsWithVideo)} | ` +
    `${cell(row.videos)} | ` +
    `${cell(row.live)} | ` +
    `${cell(row.liveVideo)} | ` +
    `${cell(row.total)} | ` +
    `${pct(row.videoShare).padStart(6)} |`
  );
}

async function main() {
  const args = process.argv.slice(2);
  const useJson = args.includes('--json');
  const useLive = args.includes('--live');

  // Import the real pipeline modules (tsx handles the TS).
  const { CONTENT } = await import('../apps/web/lib/longlive/content.ts');
  const { VIDEOS_RAW } = await import('../apps/web/lib/longlive/videos.generated.ts');
  const { ERAS, CURRENT_ERA_ID } = await import('@swift2/experience');

  // Live data: only fetched when --live is passed. Degrades gracefully.
  let liveItems = [];
  let liveNote = '';
  if (useLive) {
    try {
      const { loadCurrentItems } = await import('../apps/web/lib/current.ts');
      liveItems = await loadCurrentItems(CURRENT_ERA_ID);
    } catch {
      liveNote = '\n(live data unavailable — no Supabase env or connection failed; live columns are 0)';
    }
  }

  const liveVideoCount = liveItems.filter((item) => item.embed != null).length;

  // Build per-era rows + the ALL aggregate.
  const rows = [];
  for (const era of ERAS) {
    const eraMoments = CONTENT.filter((c) => c.eraId === era.id);
    const eraVideos = VIDEOS_RAW[era.id] ?? [];
    const eraLive = era.id === CURRENT_ERA_ID ? liveItems : [];
    const eraLiveVid = era.id === CURRENT_ERA_ID ? liveVideoCount : 0;
    const row = mediaMixRow(eraMoments, eraVideos, eraLive, eraLiveVid);
    rows.push({ label: era.name, row });
  }

  const totalEntries = rows.reduce((n, r) => n + r.row.total, 0);
  const totalVideos = rows.reduce(
    (n, r) => n + r.row.momentsWithVideo + r.row.videos + r.row.liveVideo,
    0,
  );
  const allRow = {
    moments: rows.reduce((n, r) => n + r.row.moments, 0),
    momentsWithVideo: rows.reduce((n, r) => n + r.row.momentsWithVideo, 0),
    videos: rows.reduce((n, r) => n + r.row.videos, 0),
    live: rows.reduce((n, r) => n + r.row.live, 0),
    liveVideo: rows.reduce((n, r) => n + r.row.liveVideo, 0),
    total: totalEntries,
    videoShare: totalEntries > 0 ? totalVideos / totalEntries : 0,
  };

  if (useJson) {
    const payload = {
      eras: rows.map((r) => ({ era: r.label, ...r.row })),
      all: { era: 'ALL', ...allRow },
    };
    if (liveNote) console.error(liveNote);
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const header =
    '| Era'.padEnd(20) +
    ' | ' +
    String('Moments').padStart(8) +
    ' | ' +
    String('Mom+Vid').padStart(8) +
    ' | ' +
    String('Videos').padStart(8) +
    ' | ' +
    String('Live').padStart(8) +
    ' | ' +
    String('LiveVid').padStart(8) +
    ' | ' +
    String('Total').padStart(8) +
    ' | ' +
    String('Video %').padStart(6) +
    ' |';
  const sep =
    '|' +
    '-'.repeat(22) +
    '|' +
    '-'.repeat(10) +
    '|' +
    '-'.repeat(10) +
    '|' +
    '-'.repeat(10) +
    '|' +
    '-'.repeat(10) +
    '|' +
    '-'.repeat(10) +
    '|' +
    '-'.repeat(10) +
    '|' +
    '-'.repeat(8) +
    '|';

  console.log(header);
  console.log(sep);
  for (const { label, row } of rows) {
    console.log(buildRow(label, row, 8));
  }
  console.log(sep);
  console.log(buildRow('ALL', allRow, 8));
  if (liveNote) console.log(liveNote);
}

if (
  process.argv[1] &&
  process.argv[1].split('\\').join('/').endsWith('scripts/check-media-mix.mjs')
) {
  runMain(main, { name: 'check-media-mix' });
}

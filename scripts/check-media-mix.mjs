#!/usr/bin/env node
/**
 * Media-mix report (video-first slice 0, docs/plans/2026-10-31-video-first.md)
 * — prints what share of each era's feed is video. It also checks the 15%
 * per-era video floor (tloas exempt). The floor is ADVISORY: a breach prints
 * a ::warning:: and still exits 0 unless --enforce is passed. CI runs it
 * advisory because main is already below the floor on some eras.
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
 * JSON instead. Live data is only fetched when --live is passed (live items count as video when media_kind is 'video').
 */

import { runMain } from './lib/cli.mjs';

/**
 * Compute the media-mix row for one era.
 *
 * @param {Array<{ id: string, video?: { youtubeId?: string, watchUrl?: string } | null }>} moments
 * @param {Array<{ slug: string, youtubeId?: string | null, watchUrl?: string | null }>} videoRecords
 * @param {Array<{ id: string, mediaKind?: string }>} liveItems
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

/** A live item counts as video when its media_kind says so (the embed alone is not trusted). */
export function isLiveVideo(item) {
  return item.mediaKind === 'video';
}

export const VIDEO_SHARE_FLOOR = 0.15;
export const FLOOR_EXEMPT_ERAS = ['tloas'];

/**
 * Eras whose video share is below the floor (docs/decisions.md 2026-11-03,
 * point 4). Exempt eras and eras with no entries never violate.
 *
 * @param {Array<{ id: string, label: string, row: { total: number, videoShare: number } }>} rows
 * @returns {Array<{ id: string, label: string, videoShare: number }>}
 */
export function floorViolations(rows, floor = VIDEO_SHARE_FLOOR, exempt = FLOOR_EXEMPT_ERAS) {
  return rows
    .filter(({ id, row }) => !exempt.includes(id) && row.total > 0 && row.videoShare < floor)
    .map(({ id, label, row }) => ({ id, label, videoShare: row.videoShare }));
}

/** Prints the floor verdict to stderr; returns the exit code (1 only when enforced). */
function reportFloor(violations, enforce) {
  if (violations.length === 0) return 0;
  const names = violations.map((v) => `${v.label} ${pct(v.videoShare)}`).join(', ');
  const level = enforce ? 'error' : 'warning';
  console.error(
    `::${level}::media-mix: below the ${VIDEO_SHARE_FLOOR * 100}% video floor: ${names}` +
      (enforce ? '' : ' (advisory — pass --enforce to fail)'),
  );
  return enforce ? 1 : 0;
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
    // The public route the site itself reads — no Supabase env needed.
    const url = `https://www.longlivets.com/vault/live/${CURRENT_ERA_ID}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      liveItems = (await res.json()).items ?? [];
    } catch (error) {
      liveNote = `\n(live data unavailable — ${url}: ${error.message}; live columns are 0)`;
    }
  }

  const liveVideoCount = liveItems.filter(isLiveVideo).length;

  // Build per-era rows + the ALL aggregate.
  const rows = [];
  for (const era of ERAS) {
    const eraMoments = CONTENT.filter((c) => c.eraId === era.id);
    const eraVideos = VIDEOS_RAW[era.id] ?? [];
    const eraLive = era.id === CURRENT_ERA_ID ? liveItems : [];
    const eraLiveVid = era.id === CURRENT_ERA_ID ? liveVideoCount : 0;
    const row = mediaMixRow(eraMoments, eraVideos, eraLive, eraLiveVid);
    rows.push({ id: era.id, label: era.name, row });
  }
  const exitCode = () => reportFloor(floorViolations(rows), args.includes('--enforce'));

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
    return exitCode();
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
  return exitCode();
}

if (
  process.argv[1] &&
  process.argv[1].split('\\').join('/').endsWith('scripts/check-media-mix.mjs')
) {
  runMain(main, { name: 'check-media-mix' });
}

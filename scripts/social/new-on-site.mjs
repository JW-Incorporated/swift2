#!/usr/bin/env node
// New-on-site feed for social (automation overhaul P1-22). Zero LLM. Writes
// social/inbox/new-on-site-<date>.json: the moments that reached the site in
// the last 7 days AND carry media, with significance and a deep link, so
// Tree's weekly plan and daily draft use fresh site content first.
//
// "Merged in the last 7 days" = present in supabase/seed/content/<era>.mjs now
// and absent from the same file at the last commit before the window opened
// (an item that only gained media in the window counts too). Git history is
// the only reliable source: items carry no added-date field, and a file-level
// last-commit stamp (tidewatch's mapMoment) marks a whole era "changed" on any
// edit. Item-level diffing against a baseline commit is exact and needs no
// schema change. Needs full history (fetch-depth: 0).
//
//   node scripts/social/new-on-site.mjs [--date YYYY-MM-DD] [--out-dir social/inbox] [--dry-run]
//
// Output depends only on --date and the repo state, so a same-day rerun is
// identical, and a day whose moment list matches the latest existing file
// writes nothing (no automerge churn). Files older than 14 days are pruned.
//
// `media` is a top-level list of the moments' primary media refs: validate-content
// treats every social/inbox/*.json as an intent that must carry media, and this
// feed is a genuine summary of the media it points at.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isMain } from '../lib/is-main.mjs';
import { runMain } from '../lib/cli.mjs';
import { SLUG_TO_ERA_ID } from '../lib/longlive-sync-shared.mjs';
import { momentIds } from '../lib/moment-ids.mjs';
import { momentMediaErrors } from '../lib/moment-media-gate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const WINDOW_DAYS = 7;
export const KEEP_DAYS = 14;
export const SITE = 'https://longlivets.com';
const DAY_MS = 86_400_000;
const CONTENT_DIR = 'supabase/seed/content';
const FILE_RE = /^new-on-site-(\d{4}-\d{2}-\d{2})\.json$/;
const RANK = { defining: 0, notable: 1 };

/** First renderable media ref of a moment (thumbnail, photo, YouTube, Instagram), or null. */
export function primaryMedia(item) {
  if (momentMediaErrors(item).length) return null;
  const video = item.video ?? item.moment?.video;
  const social = item.socialPost ?? item.moment?.socialPost;
  const photo = (item.moment?.photos ?? []).find((p) => typeof p?.url === 'string' && p.url.startsWith('https://'));
  if (item.thumbnailUrl) return { kind: 'thumbnail', ref: item.thumbnailUrl };
  if (photo) return { kind: 'photo', ref: photo.url };
  if (video) return { kind: 'video', ref: `https://www.youtube.com/watch?v=${video.youtubeId}` };
  return { kind: 'instagram', ref: `https://www.instagram.com/p/${social.shortcode}/` };
}

/**
 * Pure diff. `eras`: [{ eraSlug, current: items[], baseline: items[] }]. A moment is new when its id
 * is absent from the baseline, or was there without media; it is listed only if it has media now.
 */
export function newMoments(eras) {
  const out = [];
  for (const { eraSlug, current, baseline } of eras) {
    const baseIds = momentIds(eraSlug, baseline);
    const before = new Map((baseline ?? []).map((item, i) => [baseIds[i], item]));
    const ids = momentIds(eraSlug, current);
    for (const [i, item] of (current ?? []).entries()) {
      const id = ids[i];
      const media = primaryMedia(item);
      if (!media) continue;
      if (before.has(id) && primaryMedia(before.get(id))) continue;
      out.push({
        id,
        eraId: SLUG_TO_ERA_ID[eraSlug] ?? eraSlug,
        title: item.title,
        year: item.year ?? null,
        month: item.month ?? null,
        day: item.day ?? null,
        category: item.category ?? null,
        significance: item.significance ?? 'routine',
        deepLink: `${SITE}/?item=${id}`,
        mediaKind: media.kind,
        media: media.ref,
      });
    }
  }
  return out.sort((a, b) => (RANK[a.significance] ?? 2) - (RANK[b.significance] ?? 2) || a.eraId.localeCompare(b.eraId) || a.id.localeCompare(b.id));
}

export function buildFeed(date, moments) {
  const since = new Date(Date.parse(`${date}T00:00:00Z`) - WINDOW_DAYS * DAY_MS).toISOString();
  return { v: 1, kind: 'new-on-site', date, windowDays: WINDOW_DAYS, since, count: moments.length, media: [...new Set(moments.map((m) => m.media))].sort(), moments };
}

/** Latest existing feed file name, or null. */
export const latestFeedFile = (names) => names.filter((n) => FILE_RE.test(n)).sort().at(-1) ?? null;

/** Files to prune: feed files dated more than KEEP_DAYS before `date`. */
export function staleFeedFiles(names, date) {
  const cutoff = new Date(Date.parse(`${date}T00:00:00Z`) - KEEP_DAYS * DAY_MS).toISOString().slice(0, 10);
  return names.filter((n) => FILE_RE.test(n) && FILE_RE.exec(n)[1] < cutoff);
}

const git = (root, args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
const importSource = async (source) => (await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)).default;

/** True only when `git show` failed because the path did not exist at that commit (a new era file). */
export const isMissingPath = (err) => /exists on disk, but not in|does not exist in/.test(`${err?.stderr ?? ''}${err?.message ?? ''}`);

/** I/O half: per-era current items from disk and baseline items from the last commit before `since`. */
export async function loadEras(root, since) {
  const base = git(root, ['rev-list', '-1', `--before=${since}`, 'HEAD']).trim();
  if (!base) throw new Error(`git history does not reach ${since}; check out with fetch-depth: 0`);
  const files = readdirSync(path.join(root, CONTENT_DIR)).filter((f) => f.endsWith('.mjs') && !f.startsWith('_')).sort();
  const eras = [];
  for (const file of files) {
    const current = (await import(pathToFileURL(path.join(root, CONTENT_DIR, file)).href)).default;
    let baseline;
    try {
      baseline = (await importSource(git(root, ['show', `${base}:${CONTENT_DIR}/${file}`]))).items ?? [];
    } catch (err) {
      if (!isMissingPath(err)) throw err;
      baseline = [];
    }
    eras.push({ eraSlug: current.eraSlug, current: current.items ?? [], baseline });
  }
  return eras;
}

/** Writes (or skips) the feed; returns { written, file, count, pruned }. */
export async function run({ root = ROOT, date, outDir = path.join(root, 'social', 'inbox'), dryRun = false } = {}) {
  const feed0 = buildFeed(date, []);
  const feed = buildFeed(date, newMoments(await loadEras(root, feed0.since)));
  const names = existsSync(outDir) ? readdirSync(outDir) : [];
  const latest = latestFeedFile(names);
  const file = `new-on-site-${date}.json`;
  const previous = latest ? JSON.parse(readFileSync(path.join(outDir, latest), 'utf8')) : null;
  const same = previous ? JSON.stringify(previous.moments) === JSON.stringify(feed.moments) : feed.count === 0;
  const pruned = staleFeedFiles(names, date).filter((n) => n !== latest || !same);
  if (!dryRun) {
    if (!same) {
      mkdirSync(outDir, { recursive: true });
      writeFileSync(path.join(outDir, file), `${JSON.stringify(feed, null, 2)}\n`, 'utf8');
    }
    for (const n of pruned) unlinkSync(path.join(outDir, n));
  }
  return { written: !same, file, count: feed.count, pruned, dryRun };
}

/** The one-line CLI report; a dry run says "would write" / "would prune" since it touches nothing. */
export function summaryLine(date, { count, written, file, pruned, dryRun = false }) {
  const verb = dryRun ? 'would write' : 'wrote';
  const prune = dryRun ? 'would prune' : 'pruned';
  return `new-on-site ${date}: ${count} moment(s) with media in the last ${WINDOW_DAYS} days; ${written ? `${verb} ${file}` : 'no change, nothing written'}${pruned.length ? `; ${prune} ${pruned.length}` : ''}`;
}

async function main() {
  const argv = process.argv.slice(2);
  const value = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : undefined);
  const date = value('--date') ?? new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`--date must be YYYY-MM-DD, got ${date}`);
  const outDir = value('--out-dir') ? path.resolve(value('--out-dir')) : undefined;
  const result = await run({ date, outDir, dryRun: argv.includes('--dry-run') });
  console.log(summaryLine(date, result));
  return 0;
}

if (isMain(import.meta.url, process.argv[1])) runMain(main, { name: 'new-on-site' });

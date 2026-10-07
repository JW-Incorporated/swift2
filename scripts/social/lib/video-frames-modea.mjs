// Mode A of source-video-frames.mjs: yt-dlp (<=1080p, video only) + ffmpeg
// scene-change extraction. Every external process goes through an injectable
// `exec(cmd, args) -> {code, stdout, stderr}` so tests never touch a network or
// a real binary. Throws ModeAUnavailable when YouTube refuses the download
// (bot-check / 403 / 429 — the usual story for datacenter IPs): the caller then
// stops trying Mode A for the run and falls back to the static stills (Mode B).
import { spawn } from 'node:child_process';
import { mkdir, readdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { detectPersistentLogo } from './frame-logo.mjs';
import { analyzeFrame, dedupeByHash, rejectReason } from './frame-quality.mjs';

export const SCENE_THRESHOLD = 0.35;
export const MIN_GAP_SECONDS = 1;
export const EDGE_TRIM = 0.03; // skip first/last 3% of duration (title cards, end screens)
export const MAX_RAW_FRAMES = 90;
export const YTDLP_FORMAT = 'bv*[height<=1080][ext=mp4]/bv*[height<=1080]/b[height<=1080]';
const BLOCK_RE = /sign in to confirm|not a bot|http error 40[13]|http error 429|private video|video unavailable|requires login/i;

// Hard per-process kill timers: a hung download/encode must cost one video, never the step.
export const YTDLP_TIMEOUT_MS = 5 * 60_000;
export const FFMPEG_TIMEOUT_MS = 3 * 60_000;
export const DEFAULT_TIMEOUT_MS = 60_000;
export const TIMEOUT_CODE = 124;

export class ModeAUnavailable extends Error {}

export function execFile(cmd, args, { timeoutMs = DEFAULT_TIMEOUT_MS, spawnImpl = spawn, setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
  return new Promise((resolve) => {
    const child = spawnImpl(cmd, args, { windowsHide: true });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimer(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('error', (err) => {
      clearTimer(timer);
      resolve({ code: 127, stdout, stderr: String(err.message) });
    });
    child.on('close', (code) => {
      clearTimer(timer);
      if (timedOut) resolve({ code: TIMEOUT_CODE, stdout, stderr: `${stderr}\nkilled: ${cmd} exceeded ${Math.round(timeoutMs / 1000)}s` });
      else resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

export function ytdlpArgs(id, outTemplate, { cookiesFromBrowser } = {}) {
  const args = ['-f', YTDLP_FORMAT, '--no-playlist', '--no-progress', '--socket-timeout', '30', '--max-filesize', '400M', '-o', outTemplate];
  if (cookiesFromBrowser) args.push('--cookies-from-browser', cookiesFromBrowser);
  args.push(`https://www.youtube.com/watch?v=${id}`);
  return args;
}

export function sceneFilter(threshold = SCENE_THRESHOLD, gap = MIN_GAP_SECONDS) {
  return `select='gt(scene,${threshold})*(isnan(prev_selected_t)+gte(t-prev_selected_t,${gap}))',showinfo`;
}

/** Presentation timestamps (seconds) printed by ffmpeg's showinfo, in output order. */
export function parseShowinfoTimes(stderr) {
  return [...String(stderr).matchAll(/pts_time:([\d.]+)/g)].map((m) => Number(m[1]));
}

/** Evenly spaced subset of at most `n` items, order preserved. */
export function spread(items, n) {
  if (items.length <= n) return items;
  return Array.from({ length: n }, (_, i) => items[Math.floor((i * items.length) / n)]);
}

export async function downloadVideo(id, dir, { exec = execFile, cookiesFromBrowser } = {}) {
  await mkdir(dir, { recursive: true });
  const res = await exec('yt-dlp', ytdlpArgs(id, path.join(dir, `${id}.%(ext)s`), { cookiesFromBrowser }), { timeoutMs: YTDLP_TIMEOUT_MS });
  if (res.code !== 0) {
    const detail = String(res.stderr).trim().split('\n').slice(-1)[0];
    if (BLOCK_RE.test(res.stderr)) throw new ModeAUnavailable(`yt-dlp blocked: ${detail}`);
    throw new Error(`yt-dlp failed (${res.code}): ${detail}`);
  }
  const file = (await readdir(dir)).find((f) => f.startsWith(`${id}.`) && !f.endsWith('.part') && !f.endsWith('.jpg'));
  if (!file) throw new Error('yt-dlp reported success but produced no video file');
  return path.join(dir, file);
}

export async function probeDuration(file, { exec = execFile } = {}) {
  const res = await exec('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file]);
  const seconds = Number(String(res.stdout).trim());
  if (res.code !== 0 || !Number.isFinite(seconds) || seconds <= 0) throw new Error('ffprobe could not read the video duration');
  return seconds;
}

/** Scene-change frames inside the trimmed window; returns [{file, time}] (raw, unfiltered). */
export async function extractSceneFrames(videoFile, outDir, duration, { exec = execFile } = {}) {
  await mkdir(outDir, { recursive: true });
  const start = duration * EDGE_TRIM;
  const end = duration * (1 - EDGE_TRIM);
  const res = await exec('ffmpeg', [
    '-hide_banner', '-nostats', '-y',
    '-ss', start.toFixed(2), '-to', end.toFixed(2), '-i', videoFile,
    '-vf', sceneFilter(), '-fps_mode', 'vfr', '-frames:v', String(MAX_RAW_FRAMES), '-pix_fmt', 'yuvj420p', '-q:v', '2',
    path.join(outDir, 'f_%04d.jpg'),
  ], { timeoutMs: FFMPEG_TIMEOUT_MS });
  if (res.code !== 0) throw new Error(`ffmpeg failed (${res.code}): ${String(res.stderr).trim().split('\n').slice(-1)[0]}`);
  const times = parseShowinfoTimes(res.stderr);
  const files = (await readdir(outDir)).filter((f) => /^f_\d+\.jpg$/.test(f)).sort();
  return files.map((f, i) => ({ file: path.join(outDir, f), time: start + (times[i] ?? 0) }));
}

/** Quality-gates + dedupes raw frames, caps at `maxFrames` (evenly spread), deletes every dropped file. */
export async function filterFrames(raw, { maxFrames = 25 } = {}) {
  const analysed = [];
  const dropped = {};
  for (const frame of raw) {
    const a = await analyzeFrame(await readFile(frame.file));
    const reason = rejectReason(a);
    if (reason) {
      dropped[reason] = (dropped[reason] ?? 0) + 1;
      await rm(frame.file, { force: true });
    } else analysed.push({ ...frame, hash: a.hash });
  }
  const unique = dedupeByHash(analysed);
  for (const gone of analysed.filter((f) => !unique.includes(f))) await rm(gone.file, { force: true });
  const logo = await detectPersistentLogo(await Promise.all(unique.map((f) => readFile(f.file))));
  if (logo) {
    for (const f of unique) await rm(f.file, { force: true });
    return { kept: [], dropped, duplicates: analysed.length - unique.length, logo };
  }
  const kept = spread(unique, maxFrames);
  for (const gone of unique.filter((f) => !kept.includes(f))) await rm(gone.file, { force: true });
  return { kept, dropped, duplicates: analysed.length - unique.length };
}

/** Full Mode A for one video. The downloaded video is deleted as soon as frames are out. */
export async function sourceVideoFrames(id, scratchDir, { exec = execFile, maxFrames = 25, cookiesFromBrowser } = {}) {
  const videoDir = path.join(scratchDir, 'video');
  const frameDir = path.join(scratchDir, 'frames', id);
  const videoFile = await downloadVideo(id, videoDir, { exec, cookiesFromBrowser });
  try {
    const duration = await probeDuration(videoFile, { exec });
    const raw = await extractSceneFrames(videoFile, frameDir, duration, { exec });
    return { ...(await filterFrames(raw, { maxFrames })), rawCount: raw.length };
  } finally {
    await rm(videoFile, { force: true });
  }
}

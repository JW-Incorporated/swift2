#!/usr/bin/env node
// One UI WP0.5b: the AppReader DOM bundle must carry NO baked content.
// Run on a native export that kept sourcemaps:
//   cd apps/mobile && npx expo export --platform ios --source-maps --output-dir <dir>
//   node scripts/parity/check-dom-bundle.mjs <dir>
// Asserts (1) a DOM bundle containing AppReader exists, (2) its sourcemap
// `sources` has no baked content module: no apps/web/lib/**/*.generated.ts,
// nothing under lib/longlive/generated/, nor the web-only dev loader, (3) no DOM
// script contains any of the 4 required sentinels (era moment title, track
// title, theory title, merch item) taken from the published bundle
// (apps/web/public/content, built by sync:content), and (4) every .js chunk
// has a sourcemap (matched by debugId). Map sources are canonicalized to
// repo-relative forward-slash paths before the forbidden-pattern match.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FORBIDDEN = [
  /apps\/web\/lib\/.*\.generated\.[cm]?[jt]sx?$/i,
  /lib\/longlive\/generated\//i,
  /dom\/spike\/dev-loader/i,
  /index\.web\./i,
];
const KINDS = ['moment', 'track', 'theory', 'merch'];
const SYNC_HINT = 'run `npm run sync:content` first';

function decodeSource(s) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export function findForbiddenSources(sources) {
  return sources.map((s) => decodeSource(s).replace(/\\/g, '/')).filter((s) => FORBIDDEN.some((re) => re.test(s)));
}

/** Map source -> repo-relative forward-slash path (resolved against the map file and sourceRoot). */
export function canonicalizeSource(source, mapFile, sourceRoot, root) {
  const abs = path.resolve(path.dirname(mapFile), sourceRoot ?? '', source);
  let rel = path.relative(root, abs);
  // Metro emits server-root-relative sources ("/apps/mobile/..."): re-anchor those at the repo root.
  if ((rel.startsWith('..') || path.isAbsolute(rel)) && /^[\\/]/.test(source)) rel = path.relative(root, path.resolve(root, '.' + source));
  return rel.replace(/\\/g, '/');
}

/** First string that is plain ASCII with no quotes or backslashes (a minifier cannot re-escape it). */
export function pickSentinel(titles, min = 30) {
  const re = new RegExp(`^[A-Za-z0-9 ,-]{${min},}$`);
  return titles.find((x) => typeof x === 'string' && re.test(x)) ?? null;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function sentinelsFromPublishedBundle(root) {
  const content = path.join(root, 'apps/web/public/content');
  if (!fs.existsSync(path.join(content, 'current.json'))) throw new Error(`${content}/current.json is missing; ${SYNC_HINT}`);
  const dir = path.join(content, readJson(path.join(content, 'current.json')).bundleVersion);
  const erasDir = path.join(dir, 'eras');
  const moments = fs.readdirSync(erasDir).flatMap((f) => (readJson(path.join(erasDir, f)).items ?? []).map((i) => i?.title));
  const tracks = readJson(path.join(dir, 'tracks.json')).flatMap((e) => (e.tracks ?? []).map((t) => t?.title));
  const theories = readJson(path.join(dir, 'theories.json')).flatMap((e) => (e.theories ?? []).map((t) => t?.title));
  const merch = Object.values(readJson(path.join(dir, 'merch.json'))).flatMap((l) => (Array.isArray(l) ? l.map((m) => m?.item) : []));
  const picks = {
    moment: pickSentinel(moments, 30),
    track: pickSentinel(tracks, 12),
    theory: pickSentinel(theories, 25),
    merch: pickSentinel(merch, 15),
  };
  const missing = KINDS.filter((k) => !picks[k]);
  if (missing.length) throw new Error(`no usable sentinel for: ${missing.join(', ')}; ${SYNC_HINT}`);
  return KINDS.map((kind) => ({ kind, text: picks[kind] }));
}

/** Chunks (by .js filename) allowed to have no sourcemap. Empty: every Expo DOM chunk is mapped. */
export const UNMAPPED_ALLOWLIST = new Set();

export function checkDomBundle(exportDir, sentinels, root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')) {
  const problems = [];
  const dir = path.join(exportDir, 'www.bundle');
  if (!fs.existsSync(dir)) return { problems: [`no www.bundle in ${exportDir} (native export with DOM components, --source-maps)`], files: 0 };
  const files = fs.readdirSync(dir);
  let readerSpikeMaps = 0;
  const mapsById = new Map();
  for (const f of files.filter((n) => n.endsWith('.map'))) {
    const mapFile = path.join(dir, f);
    const map = JSON.parse(fs.readFileSync(mapFile, 'utf8'));
    if (map.debugId) mapsById.set(map.debugId, f);
    const sources = (map.sources ?? []).map((s) => canonicalizeSource(s, mapFile, map.sourceRoot, root));
    if (sources.some((s) => /dom\/AppReader\.tsx$/.test(s))) readerSpikeMaps += 1;
    for (const bad of findForbiddenSources(sources)) problems.push(`${f}: forbidden source ${bad}`);
  }
  if (readerSpikeMaps === 0) problems.push('no DOM sourcemap lists dom/AppReader.tsx (wrong export, or no --source-maps)');
  for (const f of files.filter((n) => n.endsWith('.js'))) {
    const text = fs.readFileSync(path.join(dir, f), 'utf8');
    const id = /^\/\/# debugId=(\S+)\s*$/m.exec(text)?.[1];
    if (!(id && mapsById.has(id)) && !UNMAPPED_ALLOWLIST.has(f)) problems.push(`${f}: chunk has no sourcemap (debugId ${id ?? 'absent'})`);
    for (const { kind, text: needle } of sentinels) {
      if (text.includes(needle)) problems.push(`${f}: contains ${kind} sentinel "${needle}"`);
    }
  }
  return { problems, files: files.length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const exportDir = process.argv[2];
  if (!exportDir) {
    console.error('usage: node scripts/parity/check-dom-bundle.mjs <expo export dir>');
    process.exit(2);
  }
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  let sentinels;
  try {
    sentinels = sentinelsFromPublishedBundle(root);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
  const { problems, files } = checkDomBundle(path.resolve(exportDir), sentinels, root);
  if (problems.length) {
    console.error(problems.join('\n'));
    process.exit(1);
  }
  console.log(`DOM bundle clean: ${files} files, no baked-content sources, ${sentinels.length} sentinels absent (${sentinels.map((x) => x.kind).join(', ')})`);
}

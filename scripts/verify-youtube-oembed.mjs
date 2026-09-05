#!/usr/bin/env node
// Audio-curator verification helper (see docs/audio-curator + the audio-curator
// routine). Given YouTube ids, fetches each one's public oEmbed record and
// decides whether it is an OFFICIAL Taylor Swift upload safe to embed as a
// song's playable audio.
//
//   node scripts/verify-youtube-oembed.mjs <id> [<id> ...]
//   node scripts/verify-youtube-oembed.mjs slug=<id> slug2=<id2> ...
//   echo "slug <id>\nslug2 <id2>" | node scripts/verify-youtube-oembed.mjs -
//
// A PASS requires BOTH:
//   1. oEmbed `author_name` is one of the official channels below. Title text
//      is NOT evidence — a fan re-upload can title itself "Official Music
//      Video" while oEmbed reports the re-uploader's channel (this is exactly
//      how a champagne-problems fan re-upload slipped past a title-only check).
//   2. oEmbed returns at all — an unavailable/dead/private video returns no
//      oEmbed JSON, which is a hard REJECT.
//
// Deterministic, no secrets, no repo state. Exit code is non-zero if ANY id
// fails, so a run can gate on it. This is the mechanical half of the job; the
// human-judgment half (which id to try, studio vs live preference) stays in
// the routine.

import { runMain } from './lib/cli.mjs';

const OFFICIAL_AUTHORS = new Set(['Taylor Swift', 'Taylor Swift - Topic', 'TaylorSwiftVEVO']);
const ID_RE = /^[A-Za-z0-9_-]{11}$/;

/** Parse `slug=id`, `slug id`, or a bare `id` into { label, id }. */
function parseArg(raw) {
  const s = raw.trim();
  if (!s) return null;
  const m = s.match(/^(.+?)[=\s]+([A-Za-z0-9_-]{11})$/);
  if (m) return { label: m[1].trim(), id: m[2] };
  return { label: s, id: s };
}

async function readStdin() {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString('utf-8');
}

/**
 * Verify one id against the official-channel rule. Pure but for the network
 * fetch, so the verdict logic is easy to reason about.
 */
export async function verifyId(id, fetchImpl = fetch) {
  if (!ID_RE.test(id)) return { id, ok: false, reason: `not an 11-char id: "${id}"` };
  const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(
    `https://www.youtube.com/watch?v=${id}`,
  )}&format=json`;
  let res;
  try {
    res = await fetchImpl(url);
  } catch (e) {
    return { id, ok: false, reason: `fetch failed: ${e.message}` };
  }
  if (!res.ok) {
    // oEmbed returns 401/404 for unavailable/private/dead videos — hard reject.
    return { id, ok: false, reason: `oEmbed HTTP ${res.status} (unavailable/dead — hard reject)` };
  }
  let data;
  try {
    data = await res.json();
  } catch (e) {
    return { id, ok: false, reason: `oEmbed body not JSON: ${e.message}` };
  }
  const author = data.author_name ?? '(none)';
  const title = data.title ?? '(none)';
  if (!OFFICIAL_AUTHORS.has(author)) {
    return { id, ok: false, author, title, reason: `author_name "${author}" is NOT an official channel` };
  }
  return { id, ok: true, author, title };
}

async function main() {
  let argv = process.argv.slice(2);
  if (argv.length === 1 && argv[0] === '-') {
    argv = (await readStdin()).split('\n');
  }
  const entries = argv.map(parseArg).filter(Boolean);
  if (!entries.length) {
    console.error('usage: node scripts/verify-youtube-oembed.mjs <id|slug=id> [...]');
    return 2;
  }

  let failures = 0;
  for (const { label, id } of entries) {
    const r = await verifyId(id);
    const tag = r.ok ? 'PASS' : 'REJECT';
    const detail = r.ok
      ? `author="${r.author}" title="${r.title}"`
      : r.reason + (r.author ? ` (author="${r.author}", title="${r.title}")` : '');
    const name = label === id ? id : `${label} [${id}]`;
    console.log(`${tag}  ${name}  ${detail}`);
    if (!r.ok) failures += 1;
  }
  console.log(`\n${entries.length - failures}/${entries.length} passed, ${failures} rejected`);
  if (failures) return 1;
}

const invokedDirectly = process.argv[1] && process.argv[1].endsWith('verify-youtube-oembed.mjs');
if (invokedDirectly) {
  runMain(main, { name: 'verify-youtube-oembed' });
}

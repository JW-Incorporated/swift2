// Stateless dedupe for appearance discovery — pure decision logic, no I/O.
//
// THE DESIGN CONSTRAINT (from two real incidents, same week):
//
//   - #2008: the CIE's `cie-fp` dedupe leaned on GitHub's global /search
//     namespace, which repo-scoped runners are forbidden (403) — the lookup
//     failed, the code treated the failure as "not filed", and #2017–#2027
//     landed in duplicate. So: dedupe reads come ONLY from the repo-scoped
//     issue list (which scripts/lib/gh.mjs guarantees), and an unreadable or
//     possibly-incomplete ledger REFUSES to file rather than filing blind.
//     Fail closed: a missed day self-heals tomorrow; a duplicate does not.
//   - #2031: the social poster persisted "already posted" state via PRs that
//     needed to auto-merge, and when the merge gate stranded them the state
//     silently rolled back — three duplicate IG posts. So: NO state files, no
//     state PRs, no committed ledger. The filed issues themselves (open AND
//     closed, via the fingerprint marker below) plus the seed content ARE the
//     state, re-read from GitHub on every run.
//
// The fingerprint is the YouTube video id — stable, canonical, and present in
// every watch URL, so even a hand-filed intake issue that merely links the
// video dedupes against it.

import { VIDEO_ID_RE } from './feed.mjs';

/** Machine-readable marker embedded in every issue this tool files. */
export function fingerprintMarker(videoId) {
  return `<!-- yt-appearance:${videoId} -->`;
}

const MARKER_RE = /yt-appearance:([A-Za-z0-9_-]{11})/g;
// Any YouTube watch/short/embed URL in an issue body counts as "known", so a
// human-filed intake issue about the same video blocks a machine duplicate.
const WATCH_RE = /(?:youtube\.com\/(?:watch\?[^\s)"'<>]*?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/g;

/** Every video id referenced by a set of issue bodies (markers + watch URLs). */
export function knownIdsFromIssueBodies(bodies) {
  const ids = new Set();
  for (const body of bodies) {
    const text = String(body ?? '');
    for (const m of text.matchAll(MARKER_RE)) ids.add(m[1]);
    for (const m of text.matchAll(WATCH_RE)) ids.add(m[1]);
  }
  return ids;
}

/**
 * Decide what to file.
 *
 * `ledger` is `{ ids, complete }` from the intake-issue scan. `complete:false`
 * means the listing may be truncated (returned rows hit the requested limit) —
 * in that case we cannot prove ANY candidate is unfiled, so the decision is a
 * refusal (`refuse` carries the reason) and nothing files. See header.
 *
 * `seedText` is the concatenated seed corpus: a video already cited anywhere
 * in `supabase/seed/**` is site content, not news.
 */
export function planFilings(candidates, { ledger, seedText = '', max = 10 }) {
  if (!ledger || !ledger.ids) {
    return { toFile: [], skipped: [], refuse: 'intake-issue ledger unavailable — refusing to file (fail closed, see #2008)' };
  }
  if (!ledger.complete) {
    return { toFile: [], skipped: [], refuse: 'intake-issue listing possibly truncated — cannot prove any candidate is new; refusing to file (fail closed)' };
  }
  const toFile = [];
  const skipped = [];
  // Ids accepted EARLIER IN THIS RUN. The ledger only knows what previous runs
  // filed, so without this a video appearing twice in one sweep files twice —
  // a feed can repeat an <entry>, and the same video can reach us from two
  // watched channels. Dedupe that only looks backwards is not dedupe.
  const acceptedThisRun = new Set();
  for (const c of candidates) {
    if (!VIDEO_ID_RE.test(c.videoId)) { skipped.push({ ...c, reason: 'malformed-id' }); continue; }
    if (acceptedThisRun.has(c.videoId)) { skipped.push({ ...c, reason: 'duplicate-in-run' }); continue; }
    if (ledger.ids.has(c.videoId)) { skipped.push({ ...c, reason: 'already-filed' }); continue; }
    if (seedText.includes(c.videoId)) { skipped.push({ ...c, reason: 'already-in-seed' }); continue; }
    if (toFile.length >= max) { skipped.push({ ...c, reason: 'over-per-run-cap' }); continue; }
    toFile.push(c);
    acceptedThisRun.add(c.videoId);
  }
  return { toFile, skipped, refuse: null };
}

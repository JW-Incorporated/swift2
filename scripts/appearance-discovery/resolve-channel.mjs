#!/usr/bin/env node
// Resolve a YouTube handle/URL to its stable `UC…` channel id, then verify the
// id's RSS feed actually serves XML — the two steps channels.mjs requires
// before an entry may be committed. Committed per CLAUDE.md rule 8: this is
// re-run every time a founder wants a channel added.
//
//   node scripts/appearance-discovery/resolve-channel.mjs @TaylorSwift
//   node scripts/appearance-discovery/resolve-channel.mjs https://www.youtube.com/@GMA
//   node scripts/appearance-discovery/resolve-channel.mjs UCqECaJ8Gagnn7YCbPEzWH6g   # verify-only
//   node scripts/appearance-discovery/resolve-channel.mjs --all   # re-verify every committed channel
//
// `--all` is the audit: it fetches every channel in channels.mjs and prints the
// feed's own <title> next to the name we claim, so a wrong id is visible rather
// than inferred. Exits non-zero if any feed fails to serve XML.
import { httpsRequest } from '../lib/gh.mjs';
import { CHANNELS, feedUrl } from './channels.mjs';
import { parseFeed, looksLikeFeed } from './lib/feed.mjs';

const input = process.argv[2];
if (!input) {
  console.error('usage: resolve-channel.mjs <@handle | channel URL | UC… id | --all>');
  process.exit(2);
}

if (input === '--all') {
  let bad = 0;
  for (const c of CHANNELS) {
    try {
      const r = await httpsRequest(feedUrl(c.channelId));
      if (r.status !== 200 || !looksLikeFeed(r.text)) throw new Error(`HTTP ${r.status}, not a feed`);
      const { channelTitle, entries } = parseFeed(r.text);
      const ok = channelTitle.toLowerCase().replace(/\s+/g, ' ').trim();
      console.log(`${ok ? 'OK  ' : 'WARN'} ${c.channelId}  claimed="${c.name}"  feed="${channelTitle}"  entries=${entries.length}`);
    } catch (e) {
      bad++;
      console.error(`FAIL ${c.channelId}  claimed="${c.name}"  ${e.message}`);
    }
  }
  console.log(`--all: ${CHANNELS.length - bad}/${CHANNELS.length} feeds verified`);
  process.exit(bad ? 1 : 0);
}

async function resolveId(raw) {
  if (/^UC[A-Za-z0-9_-]{22}$/.test(raw)) return raw;
  const url = raw.startsWith('http') ? raw : `https://www.youtube.com/${raw.replace(/^\/+/, '')}`;
  const res = await httpsRequest(url, { headers: { 'user-agent': 'Mozilla/5.0 (swift2 resolve-channel)' } });
  if (res.status !== 200) throw new Error(`${url} → HTTP ${res.status}`);
  // Prefer the markers that name THIS page's channel: externalId, the
  // canonical/og:url `/channel/UC…`, and the RSS autodiscovery link. The first
  // bare "channelId" occurrence is NOT safe — on some channel pages it names a
  // linked/related channel (observed on @grammys, where it pointed at
  // "Recording Academy Membership" instead of the GRAMMYs channel).
  const m = res.text.match(/"externalId":"(UC[A-Za-z0-9_-]{22})"/) ||
    res.text.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[A-Za-z0-9_-]{22})"/) ||
    res.text.match(/property="og:url" content="https:\/\/www\.youtube\.com\/channel\/(UC[A-Za-z0-9_-]{22})"/) ||
    res.text.match(/feeds\/videos\.xml\?channel_id=(UC[A-Za-z0-9_-]{22})/);
  if (!m) throw new Error(`no channelId found in ${url}`);
  return m[1];
}

const id = await resolveId(input);
const res = await httpsRequest(feedUrl(id));
if (res.status !== 200 || !looksLikeFeed(res.text)) {
  console.error(`channelId ${id}: feed NOT verified (HTTP ${res.status})`);
  process.exit(1);
}
const { channelTitle, entries } = parseFeed(res.text);
console.log(`channelId: ${id}`);
console.log(`feed title: ${channelTitle}`);
console.log(`entries: ${entries.length} (latest: ${entries[0]?.published ?? 'n/a'} — ${entries[0]?.title ?? 'n/a'})`);

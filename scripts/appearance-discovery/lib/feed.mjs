// YouTube channel-RSS parsing — pure functions, no I/O, no XML dependency.
//
// The feeds at https://www.youtube.com/feeds/videos.xml?channel_id=<id> are
// small, machine-generated Atom documents with a fixed shape (one <entry> per
// upload, ~15 most recent). We extract exactly four fields per entry with
// anchored regexes rather than pulling in an XML parser: the format is stable,
// the failure mode is loud (a shape change yields zero entries, which the
// caller reports as a channel failure), and this repo's cost discipline says
// no new dependency for a fixed-shape document.

const ENTITIES = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&#39;': "'",
};

/** Decode the named + numeric XML entities YouTube feeds actually emit. */
export function decodeEntities(s) {
  return String(s)
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&(amp|lt|gt|quot|apos|#39);/g, (m) => ENTITIES[m]);
}

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? decodeEntities(m[1].trim()) : '';
}

/** A YouTube video id: exactly 11 URL-safe base64 chars. */
export const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

/**
 * Parse a YouTube channel RSS feed into `{ channelTitle, entries }`.
 * Each entry: `{ videoId, title, description, published, url }`.
 * Entries missing a well-formed video id or a title are dropped — a
 * half-parsed entry filed as an issue is worse than a skipped one.
 */
export function parseFeed(xml) {
  const text = String(xml ?? '');
  const head = text.split(/<entry[\s>]/)[0];
  const channelTitle = tag(head, 'title');
  const entries = [];
  for (const m of text.matchAll(/<entry[\s>][\s\S]*?<\/entry>/g)) {
    const block = m[0];
    const videoId = tag(block, 'yt:videoId');
    const title = tag(block, 'title');
    if (!VIDEO_ID_RE.test(videoId) || !title) continue;
    entries.push({
      videoId,
      title,
      description: tag(block, 'media:description'),
      published: tag(block, 'published'),
      url: `https://www.youtube.com/watch?v=${videoId}`,
    });
  }
  return { channelTitle, entries };
}

/** True when the feed response looks like a channel feed at all. */
export function looksLikeFeed(xml) {
  return /<feed[\s>]/.test(String(xml ?? '').slice(0, 2000));
}

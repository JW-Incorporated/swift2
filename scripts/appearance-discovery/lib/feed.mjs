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

// A code point above this is not representable; fromCodePoint throws RangeError
// on it, which would take out the whole channel for one malformed entity.
const MAX_CODE_POINT = 0x10ffff;

function codePoint(n) {
  return Number.isInteger(n) && n >= 0 && n <= MAX_CODE_POINT ? String.fromCodePoint(n) : '';
}

/** Decode the named + numeric XML entities YouTube feeds actually emit. */
export function decodeEntities(s) {
  return String(s)
    .replace(/&#(\d+);/g, (_, n) => codePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => codePoint(parseInt(n, 16)))
    .replace(/&(amp|lt|gt|quot|apos|#39);/g, (m) => ENTITIES[m]);
}

// GitHub rejects issue titles past 256 chars, and a runaway title is a bad
// issue either way. Trim the source field, not just the rendered title.
const MAX_FIELD = 300;

/**
 * CDATA is stripped before any tag is read. Inside a CDATA section `<` is
 * literal, so a description containing `<yt:videoId>OTHER______</yt:videoId>`
 * would otherwise be matched by the scan below and could override the real
 * video id — producing an issue whose link and dedupe fingerprint point at a
 * different video. YouTube escapes rather than using CDATA today; this makes
 * that a fact we enforce instead of one we depend on.
 */
function stripCdata(s) {
  return String(s).replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '');
}

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  if (!m) return '';
  // Strip control characters: they render as garbage in an issue title and can
  // break the terminal output of a dry run.
  return decodeEntities(m[1].trim())
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_FIELD);
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
  const text = stripCdata(String(xml ?? ''));
  const head = text.split(/<entry[\s>]/)[0];
  const channelTitle = tag(head, 'title');
  const entries = [];
  // A video id may appear once per feed. A repeated <entry> (feed glitch, or a
  // mirrored block) must not become two issues for one video.
  const seen = new Set();
  for (const m of text.matchAll(/<entry[\s>][\s\S]*?<\/entry>/g)) {
    const block = m[0];
    const videoId = tag(block, 'yt:videoId');
    const title = tag(block, 'title');
    if (!VIDEO_ID_RE.test(videoId) || !title) continue;
    if (seen.has(videoId)) continue;
    seen.add(videoId);
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

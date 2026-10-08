import { describe, expect, it } from 'vitest';
import { decodeEntities, looksLikeFeed, parseFeed, VIDEO_ID_RE } from './feed.mjs';

// A trimmed but structurally faithful YouTube channel feed: real namespaces,
// entity-encoded title, media:description, and one malformed entry that must
// be dropped rather than half-filed.
const FEED = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/" xmlns="http://www.w3.org/2005/Atom">
 <link rel="self" href="http://www.youtube.com/feeds/videos.xml?channel_id=UCqECaJ8Gagnn7YCbPEzWH6g"/>
 <id>yt:channel:qECaJ8Gagnn7YCbPEzWH6g</id>
 <title>Taylor Swift</title>
 <entry>
  <id>yt:video:dQw4w9WgXcQ</id>
  <yt:videoId>dQw4w9WgXcQ</yt:videoId>
  <yt:channelId>UCqECaJ8Gagnn7YCbPEzWH6g</yt:channelId>
  <title>Taylor Swift &amp; Travis — &quot;The Interview&quot; (Part 1 &#39;extended&#39;)</title>
  <link rel="alternate" href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"/>
  <author><name>Taylor Swift</name></author>
  <published>2026-08-10T16:00:00+00:00</published>
  <media:group>
   <media:title>ignored — the entry title wins</media:title>
   <media:description>Taylor Swift sits down for a career-spanning talk.
Multi-line description.</media:description>
  </media:group>
 </entry>
 <entry>
  <id>yt:video:bad</id>
  <yt:videoId>too-short</yt:videoId>
  <title>Malformed entry</title>
  <published>2026-08-11T00:00:00+00:00</published>
 </entry>
 <entry>
  <yt:videoId>Abc_-123XyZ</yt:videoId>
  <title>No description entry</title>
  <published>2026-08-11T09:30:00+00:00</published>
 </entry>
</feed>`;

describe('parseFeed', () => {
  it('extracts channel title and well-formed entries, decoding entities', () => {
    const { channelTitle, entries } = parseFeed(FEED);
    expect(channelTitle).toBe('Taylor Swift');
    expect(entries).toHaveLength(2);
    const [first, second] = entries;
    expect(first.videoId).toBe('dQw4w9WgXcQ');
    expect(first.title).toBe(`Taylor Swift & Travis — "The Interview" (Part 1 'extended')`);
    expect(first.description).toContain('career-spanning talk');
    expect(first.description).toContain('Multi-line description.');
    expect(first.published).toBe('2026-08-10T16:00:00+00:00');
    expect(first.url).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(second.videoId).toBe('Abc_-123XyZ');
    expect(second.description).toBe('');
  });

  it('drops entries whose video id is malformed instead of half-parsing them', () => {
    const ids = parseFeed(FEED).entries.map((e) => e.videoId);
    expect(ids).not.toContain('too-short');
    ids.forEach((id) => expect(id).toMatch(VIDEO_ID_RE));
  });

  it('returns zero entries for non-feed input (the loud failure mode)', () => {
    expect(parseFeed('<html><body>consent wall</body></html>').entries).toHaveLength(0);
    expect(parseFeed('').entries).toHaveLength(0);
    expect(parseFeed(undefined).entries).toHaveLength(0);
  });
});

describe('looksLikeFeed', () => {
  it('accepts an Atom feed and rejects an HTML error page', () => {
    expect(looksLikeFeed(FEED)).toBe(true);
    expect(looksLikeFeed('<html><head><title>404</title></head></html>')).toBe(false);
    expect(looksLikeFeed(null)).toBe(false);
  });
});

describe('decodeEntities', () => {
  it('handles the named and numeric entities YouTube emits', () => {
    expect(decodeEntities('A &amp; B &lt;3 &quot;x&quot; &#39;y&#39; &#8212; &#x1F389;')).toBe(`A & B <3 "x" 'y' — 🎉`);
  });

  // Codex review, 2026-08-12: fromCodePoint throws RangeError above 0x10FFFF,
  // which would abort the whole channel over one malformed entity.
  it('drops out-of-range numeric entities instead of throwing', () => {
    expect(() => decodeEntities('boom &#999999999999; end')).not.toThrow();
    expect(decodeEntities('boom &#999999999999; end')).toBe('boom  end');
    expect(() => decodeEntities('hex &#xFFFFFFFF; end')).not.toThrow();
  });
});

// All three from the Codex adversarial review, 2026-08-12.
describe('parseFeed — hostile and malformed input', () => {
  it('ignores tags hidden inside CDATA, which could otherwise forge a video id', () => {
    const forged = `<feed><entry>
      <yt:videoId>REALREALREA</yt:videoId>
      <title>Real title</title>
      <media:description><![CDATA[<yt:videoId>FORGEDFORGE</yt:videoId>]]></media:description>
      <published>2026-08-10T00:00:00+00:00</published>
    </entry></feed>`;
    const { entries } = parseFeed(forged);
    expect(entries).toHaveLength(1);
    // The real id must win — it is both the link and the dedupe fingerprint.
    expect(entries[0].videoId).toBe('REALREALREA');
    expect(entries[0].url).toContain('REALREALREA');
  });

  it('collapses a repeated <entry> to one, so a feed glitch cannot double-file', () => {
    const one = `<entry><yt:videoId>AAAAAAAAAAA</yt:videoId><title>T</title>
      <published>2026-08-10T00:00:00+00:00</published></entry>`;
    const { entries } = parseFeed(`<feed>${one}${one}</feed>`);
    expect(entries).toHaveLength(1);
  });

  it('strips control characters and caps absurdly long titles', () => {
    const nasty = `<feed><entry><yt:videoId>AAAAAAAAAAA</yt:videoId>` +
      `<title>bad\u0007title\u0000here ${'x'.repeat(500)}</title>` +
      `<published>2026-08-10T00:00:00+00:00</published></entry></feed>`;
    const { entries } = parseFeed(nasty);
    // eslint-disable-next-line no-control-regex -- the point is asserting they are gone
    expect(entries[0].title).not.toMatch(/[\u0000-\u001f]/);
    expect(entries[0].title.length).toBeLessThanOrEqual(300);
  });
});

import { describe, expect, it, vi } from 'vitest';
import { parseFeed, readPublisher, USER_AGENT } from './rss';
import { YOUTUBE_FEED_BASE_DELAY_MS, YOUTUBE_FEED_MAX_ATTEMPTS } from './retry';

const YT_URL = 'https://www.youtube.com/feeds/videos.xml?channel_id=UCqECaJ8Gagnn7YCbPEzWH6g';

describe('parseFeed retry policy', () => {
  it('ingests a YouTube feed that fails 3 times then succeeds', async () => {
    const sleep = vi.fn<(ms: number) => Promise<void>>(async () => {});
    const parse = vi.fn()
      .mockRejectedValueOnce(new Error('Status code 404'))
      .mockRejectedValueOnce(new Error('Status code 404'))
      .mockRejectedValueOnce(new Error('Status code 404'))
      .mockResolvedValueOnce({ items: [{ title: 'ok' }] });
    await expect(parseFeed(YT_URL, parse, sleep)).resolves.toEqual({ items: [{ title: 'ok' }] });
    expect(parse).toHaveBeenCalledTimes(4);
    expect(sleep.mock.calls.map((c) => c[0])).toEqual([
      YOUTUBE_FEED_BASE_DELAY_MS,
      YOUTUBE_FEED_BASE_DELAY_MS * 2,
      YOUTUBE_FEED_BASE_DELAY_MS * 4,
    ]);
  });

  it('gives up after the YouTube attempt budget with the original error', async () => {
    const sleep = vi.fn(async () => {});
    const parse = vi.fn().mockRejectedValue(new Error('Status code 404'));
    await expect(parseFeed(YT_URL, parse, sleep)).rejects.toThrow('Status code 404');
    expect(parse).toHaveBeenCalledTimes(YOUTUBE_FEED_MAX_ATTEMPTS);
  });

  it('does not give a non-YouTube feed the YouTube attempt budget', async () => {
    const sleep = vi.fn(async () => {});
    const parse = vi.fn().mockRejectedValue(new Error('Status code 404'));
    await expect(parseFeed('https://example.com/feed.xml', parse, sleep)).rejects.toThrow('Status code 404');
    expect(parse).toHaveBeenCalledTimes(3);
  });

  it('exports a USER_AGENT that identifies the app', () => {
    expect(USER_AGENT).toMatch(/Swift2KnowledgeEngine/);
    expect(USER_AGENT).toMatch(/longlivets\.com/);
  });
});

// Google News RSS sets <source url="…">Outlet</source> on every item. We were
// discarding it and attributing every story to the feed instead, which capped
// each story at one news_story_source row (they dedupe on outlet_name) and
// pinned source_count at 1 table-wide — making `corroborated` unreachable.
describe('readPublisher', () => {
  it('reads name and url from the attributed element shape', () => {
    expect(readPublisher({ _: 'Forbes', $: { url: 'https://www.forbes.com' } })).toEqual({
      publisher: 'Forbes',
      publisherUrl: 'https://www.forbes.com',
    });
  });

  it('reads a bare string element (no attributes)', () => {
    expect(readPublisher('Billboard')).toEqual({ publisher: 'Billboard' });
  });

  it('accepts a flattened url property', () => {
    expect(readPublisher({ _: 'Variety', url: 'https://variety.com' })).toEqual({
      publisher: 'Variety',
      publisherUrl: 'https://variety.com',
    });
  });

  it('trims whitespace the feed leaves in', () => {
    expect(readPublisher('  Parade  ')).toEqual({ publisher: 'Parade' });
  });

  it('returns empty for missing or blank input rather than throwing', () => {
    // Publisher is optional metadata — a feed that omits or malforms it must
    // still yield a usable item, falling back to the news_source name.
    expect(readPublisher(undefined)).toEqual({});
    expect(readPublisher(null)).toEqual({});
    expect(readPublisher('')).toEqual({});
    expect(readPublisher('   ')).toEqual({});
    expect(readPublisher(42)).toEqual({});
  });

  it('omits url when only a name is present', () => {
    expect(readPublisher({ _: 'The Guardian' })).toEqual({ publisher: 'The Guardian' });
  });

  // The distinct-outlet property that makes corroboration work: two items from
  // the SAME aggregator feed must resolve to different outlet names.
  it('distinguishes two publishers arriving through one aggregator feed', () => {
    const a = readPublisher({ _: 'Forbes', $: { url: 'https://www.forbes.com' } });
    const b = readPublisher({ _: 'Billboard', $: { url: 'https://www.billboard.com' } });
    expect(a.publisher).not.toBe(b.publisher);
  });
});

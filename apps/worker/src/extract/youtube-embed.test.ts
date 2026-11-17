import { describe, expect, it, vi } from 'vitest';
import { CHANNELS } from '@swift2/shared/youtube-channels';
import { allowlistedChannelFor, resolveYouTubeEmbed, verifyYouTubeVideo } from './youtube-embed';
import type { ClusterSource } from './write-knowledge';

const TAYLOR = CHANNELS.find((channel) => channel.allUploads)!;
const GRAMMYS = CHANNELS.find((channel) => channel.handle === '@grammys')!;
const NOW = new Date('2026-11-08T12:00:00.000Z');

function oembed(body: unknown, status = 200) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;
}

const src = (url: string, tier: ClusterSource['tier'] = 'official'): ClusterSource => ({ outletName: 'YouTube', url, tier });

describe('allowlistedChannelFor', () => {
  it('maps a handle URL, case-insensitively, and a /channel/ URL', () => {
    expect(allowlistedChannelFor('https://www.youtube.com/@TaylorSwift')).toBe(TAYLOR);
    expect(allowlistedChannelFor('https://www.youtube.com/@GRAMMYS')).toBe(GRAMMYS);
    expect(allowlistedChannelFor(`https://www.youtube.com/channel/${TAYLOR.channelId}`)).toBe(TAYLOR);
  });

  it('rejects unknown channels, lookalike hosts and non-strings', () => {
    expect(allowlistedChannelFor('https://www.youtube.com/@SomeFanCam')).toBeUndefined();
    expect(allowlistedChannelFor('https://evil.example/@TaylorSwift')).toBeUndefined();
    expect(allowlistedChannelFor('https://www.youtube.com/channel/UCxxxxxxxxxxxxxxxxxxxxxx')).toBeUndefined();
    expect(allowlistedChannelFor(undefined)).toBeUndefined();
  });
});

describe('verifyYouTubeVideo', () => {
  it('verifies a 200 oEmbed from an allowlisted channel and queries the keyless endpoint', async () => {
    const fetchImpl = oembed({ title: 'Taylor Swift - Clip', author_url: 'https://www.youtube.com/@TaylorSwift' });
    await expect(verifyYouTubeVideo('dQw4w9WgXcQ', fetchImpl)).resolves.toEqual({ title: 'Taylor Swift - Clip', channel: TAYLOR });
    const url = String((fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]);
    expect(url).toContain('https://www.youtube.com/oembed?url=');
    expect(url).toContain('format=json');
  });

  it.each([401, 404])('returns no embed for HTTP %i', async (status) => {
    await expect(verifyYouTubeVideo('dQw4w9WgXcQ', oembed({ title: 'x' }, status))).resolves.toBeUndefined();
  });

  it('returns no embed when fetch throws or the body is not JSON', async () => {
    const boom = vi.fn(async () => { throw new Error('network down'); }) as unknown as typeof fetch;
    await expect(verifyYouTubeVideo('dQw4w9WgXcQ', boom)).resolves.toBeUndefined();
    const html = vi.fn(async () => new Response('<html>', { status: 200 })) as unknown as typeof fetch;
    await expect(verifyYouTubeVideo('dQw4w9WgXcQ', html)).resolves.toBeUndefined();
  });

  it('rejects a playable video from a non-allowlisted channel', async () => {
    const fetchImpl = oembed({ title: 'Taylor Swift fan cam', author_url: 'https://www.youtube.com/@SomeFanCam' });
    await expect(verifyYouTubeVideo('dQw4w9WgXcQ', fetchImpl)).resolves.toBeUndefined();
  });

  it('requires a Taylor-titled clip on a multi-topic channel, not on her own', async () => {
    const off = oembed({ title: 'Rod Stewart tour news', author_url: 'https://www.youtube.com/@grammys' });
    await expect(verifyYouTubeVideo('dQw4w9WgXcQ', off)).resolves.toBeUndefined();
    const on = oembed({ title: 'Taylor Swift wins Album of the Year', author_url: 'https://www.youtube.com/@grammys' });
    await expect(verifyYouTubeVideo('dQw4w9WgXcQ', on)).resolves.toMatchObject({ channel: GRAMMYS });
    const own = oembed({ title: 'The Fate of Ophelia', author_url: 'https://www.youtube.com/@TaylorSwift' });
    await expect(verifyYouTubeVideo('dQw4w9WgXcQ', own)).resolves.toMatchObject({ channel: TAYLOR });
  });
});

describe('resolveYouTubeEmbed', () => {
  const good = { title: 'The Fate of Ophelia', author_url: 'https://www.youtube.com/@TaylorSwift' };

  it('builds the embed with title, channelId and verifiedAt from a watch link', async () => {
    const embed = await resolveYouTubeEmbed(
      [src('https://example.com/story', 'established'), src('https://www.youtube.com/watch?v=dQw4w9WgXcQ')],
      oembed(good),
      () => NOW,
    );
    expect(embed).toEqual({
      provider: 'youtube',
      videoId: 'dQw4w9WgXcQ',
      title: 'The Fate of Ophelia',
      channelId: TAYLOR.channelId,
      verifiedAt: '2026-11-08T12:00:00.000Z',
    });
  });

  it('accepts youtu.be and shorts links', async () => {
    expect((await resolveYouTubeEmbed([src('https://youtu.be/dQw4w9WgXcQ')], oembed(good)))?.videoId).toBe('dQw4w9WgXcQ');
    expect((await resolveYouTubeEmbed([src('https://www.youtube.com/shorts/dQw4w9WgXcQ')], oembed(good)))?.videoId).toBe('dQw4w9WgXcQ');
  });

  it('returns undefined without fetching when no source is a YouTube video', async () => {
    const fetchImpl = oembed(good);
    await expect(resolveYouTubeEmbed([src('https://www.youtube.com/@TaylorSwift'), src('https://people.com/a')], fetchImpl)).resolves.toBeUndefined();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('falls through to the next candidate when the first does not verify, and checks each id once', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response('{}', { status: 404 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(good), { status: 200 })) as unknown as typeof fetch;
    const embed = await resolveYouTubeEmbed(
      [
        src('https://www.youtube.com/watch?v=aaaaaaaaaaa'),
        src('https://youtu.be/aaaaaaaaaaa', 'fan'),
        src('https://www.youtube.com/watch?v=bbbbbbbbbbb', 'established'),
      ],
      fetchImpl,
    );
    expect(embed?.videoId).toBe('bbbbbbbbbbb');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});

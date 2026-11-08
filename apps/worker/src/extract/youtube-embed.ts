// Video-first slice 4 (docs/plans/2026-10-31-video-first.md): turns a story's
// YouTube source into a verified `current_item.embed`. Keyless: YouTube oEmbed
// answers 200 + JSON for an embeddable public video and 401/404 otherwise, and
// its author_url names the channel, which must be on the committed allowlist
// (packages/shared/src/youtube-channels.mjs). Every failure resolves to
// "no embed" — a story is never blocked on this.
import { extractYouTubeId, type CurrentItemEmbed } from '@swift2/shared';
import { CHANNELS, type YouTubeChannel } from '@swift2/shared/youtube-channels';
import type { ClusterSource } from './write-knowledge';

const OEMBED_URL = 'https://www.youtube.com/oembed';
const OEMBED_TIMEOUT_MS = 5_000;
const MAX_CANDIDATES = 3;
const TIER_ORDER = ['official', 'established', 'fan', 'unverified'] as const;
const TAYLOR_TITLE = /taylor\s+swift|\bSwift\b/;

export interface OEmbedResult {
  title?: string;
  channel: YouTubeChannel;
}

/** Maps an oEmbed author_url (`/channel/UC…` or `/@handle`) to an allowlisted channel. */
export function allowlistedChannelFor(authorUrl: unknown): YouTubeChannel | undefined {
  if (typeof authorUrl !== 'string') return undefined;
  let pathname: string;
  try {
    const url = new URL(authorUrl);
    if (!/(^|\.)youtube\.com$/i.test(url.hostname)) return undefined;
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return undefined;
  }
  const byId = /^\/channel\/(UC[\w-]{22})\/?$/.exec(pathname)?.[1];
  if (byId) return CHANNELS.find((channel) => channel.channelId === byId);
  const handle = /^\/(@[^/]+)\/?$/.exec(pathname)?.[1]?.toLowerCase();
  return handle ? CHANNELS.find((channel) => channel.handle.toLowerCase() === handle) : undefined;
}

/** oEmbed proof that the video plays and belongs to an allowlisted channel; undefined on any failure. */
export async function verifyYouTubeVideo(
  videoId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<OEmbedResult | undefined> {
  try {
    const target = `${OEMBED_URL}?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`;
    const response = await fetchImpl(target, { signal: AbortSignal.timeout(OEMBED_TIMEOUT_MS) });
    if (response.status !== 200) return undefined;
    const body = (await response.json()) as { title?: unknown; author_url?: unknown };
    const channel = allowlistedChannelFor(body.author_url);
    if (!channel) return undefined;
    const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : undefined;
    // Talk-show and awards channels cover many people; only Taylor-titled clips qualify.
    if (!channel.allUploads && !(title && TAYLOR_TITLE.test(title))) return undefined;
    return { ...(title ? { title } : {}), channel };
  } catch {
    return undefined;
  }
}

/** The first story source that is a YouTube video verified on an allowlisted channel, as an embed. */
export async function resolveYouTubeEmbed(
  sources: readonly ClusterSource[],
  fetchImpl: typeof fetch = fetch,
  now: () => Date = () => new Date(),
): Promise<CurrentItemEmbed | undefined> {
  const seen = new Set<string>();
  const candidates = [...sources]
    .sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier))
    .flatMap((source) => {
      const id = extractYouTubeId(source.url);
      if (!id || seen.has(id)) return [];
      seen.add(id);
      return [id];
    })
    .slice(0, MAX_CANDIDATES);
  for (const videoId of candidates) {
    const verified = await verifyYouTubeVideo(videoId, fetchImpl);
    if (verified) {
      return {
        provider: 'youtube',
        videoId,
        ...(verified.title ? { title: verified.title } : {}),
        channelId: verified.channel.channelId,
        verifiedAt: now().toISOString(),
      };
    }
  }
  return undefined;
}

import type { CurrentItem } from '@swift2/shared';
import type { MomentVideo } from '@swift2/experience';

const MAX_TITLE = 100;
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * The playable video a live item carries, or null (render exactly as before).
 * The oEmbed title is untrusted text: it only ever reaches the DOM as a React
 * text/attribute value, and is clipped to ~100 chars. The id is shape-checked
 * because it is interpolated into the player URL.
 */
export function currentItemVideo(item: CurrentItem): MomentVideo | null {
  const embed = item.embed;
  if (item.mediaKind !== 'video' || !embed || embed.provider !== 'youtube') return null;
  if (!YOUTUBE_ID.test(embed.videoId)) return null;
  const raw = (embed.title ?? '').replace(/\s+/g, ' ').trim() || item.headline;
  const title = raw.length > MAX_TITLE ? `${raw.slice(0, MAX_TITLE - 1).trimEnd()}…` : raw;
  return { youtubeId: embed.videoId, title };
}

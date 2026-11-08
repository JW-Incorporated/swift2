import type { CurrentItem } from '@swift2/shared';
import { isPlayableVideoItem, type MomentVideo } from '@swift2/experience';

const MAX_TITLE = 100;

/**
 * The playable video a live item carries, or null (render exactly as before).
 * The oEmbed title is untrusted text: it only ever reaches the DOM as a React
 * text/attribute value, and is clipped to ~100 chars. Playability (incl. the id shape,
 * since it is interpolated into the player URL) is isPlayableVideoItem.
 */
export function currentItemVideo(item: CurrentItem): MomentVideo | null {
  const embed = item.embed;
  if (!embed || !isPlayableVideoItem(item)) return null;
  const raw = (embed.title ?? '').replace(/\s+/g, ' ').trim() || item.headline;
  const title = raw.length > MAX_TITLE ? `${raw.slice(0, MAX_TITLE - 1).trimEnd()}…` : raw;
  return { youtubeId: embed.videoId, title };
}

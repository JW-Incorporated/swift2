export interface YouTubeChannel {
  channelId: string;
  name: string;
  handle: string;
  allUploads?: boolean;
  why: string;
}

export const CHANNELS: readonly YouTubeChannel[];

export function feedUrl(channelId: string): string;

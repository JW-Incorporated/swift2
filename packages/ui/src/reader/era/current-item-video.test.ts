import { describe, expect, it } from 'vitest';
import type { CurrentItem } from '@swift2/shared';
import { currentItemVideo } from './current-item-video';

const item = (embed: unknown): CurrentItem =>
  ({ headline: 'Headline', mediaKind: 'video', embed }) as unknown as CurrentItem;

describe('currentItemVideo', () => {
  it('returns the video for a valid youtube embed', () => {
    expect(currentItemVideo(item({ provider: 'youtube', videoId: 'dQw4w9WgXcQ', title: 'T' }))).toEqual({
      youtubeId: 'dQw4w9WgXcQ',
      title: 'T',
    });
  });

  it('rejects a hostile id', () => {
    expect(currentItemVideo(item({ provider: 'youtube', videoId: 'x" onload=' }))).toBeNull();
  });

  it('rejects a 10-char id', () => {
    expect(currentItemVideo(item({ provider: 'youtube', videoId: 'dQw4w9WgXc' }))).toBeNull();
  });

  it('rejects a non-youtube provider', () => {
    expect(currentItemVideo(item({ provider: 'vimeo', videoId: 'dQw4w9WgXcQ' }))).toBeNull();
  });

  it('is null unless mediaKind is video', () => {
    expect(currentItemVideo({ ...item({ provider: 'youtube', videoId: 'dQw4w9WgXcQ' }), mediaKind: 'image' })).toBeNull();
  });
});

// check-media-mix unit test — tiny fixture: 2 moments (1 with video),
// 1 video record, 3 live items (0 embed) gives a share of 2/6 = 33.3%.

import { describe, it, expect } from 'vitest';
import { mediaMixRow } from './check-media-mix.mjs';

describe('mediaMixRow', () => {
  it('computes video share = (moments w/ video + video records + live w/ video) / total', () => {
    const moments = [
      { id: 'm1', video: { youtubeId: 'abc' } },
      { id: 'm2', video: undefined },
    ];
    const videoRecords = [{ slug: 'v1', youtubeId: 'xyz' }];
    const liveItems = [{ id: 'l1' }, { id: 'l2' }, { id: 'l3' }];

    const row = mediaMixRow(moments, videoRecords, liveItems, 0);

    expect(row).toEqual({
      moments: 2,
      momentsWithVideo: 1,
      videos: 1,
      live: 3,
      liveVideo: 0,
      total: 6,
      videoShare: expect.closeTo(1 / 3, 5),
    });
  });

  it('counts a moment as having video when watchUrl is set even without youtubeId', () => {
    const moments = [{ id: 'm1', video: { watchUrl: 'https://netflix.com/title' } }];
    const row = mediaMixRow(moments, []);
    expect(row.momentsWithVideo).toBe(1);
  });

  it('returns zero share for an era with no content', () => {
    const row = mediaMixRow([], []);
    expect(row.total).toBe(0);
    expect(row.videoShare).toBe(0);
  });

  it('includes live items in the denominator and live video in the numerator', () => {
    const moments = [{ id: 'm1', video: { youtubeId: 'a' } }];
    const row = mediaMixRow(moments, [], [{ id: 'l1' }], 1);
    expect(row.total).toBe(2);
    expect(row.videoShare).toBe(1);
  });
});

import { describe, expect, it } from 'vitest';
// @ts-expect-error untyped .mjs
import { formatStats, summarizeVideo } from '../source-video-frames.mjs';

describe('summarizeVideo', () => {
  it('buckets Mode A drops and counts duplicates', () => {
    const s = summarizeVideo('a', { rawCount: 10, dropped: { 'near-black': 2, blurry: 1, 'title/end card (text)': 1 }, duplicates: 2, kept: [] }, 4);
    expect(s).toEqual({ extracted: 10, dropped: { logo: 0, 'title card': 1, 'black/blur': 3, dupe: 2, other: 0 }, kept: 4 });
  });

  it('attributes the remainder to the logo when Mode A drops a video whole', () => {
    const s = summarizeVideo('a', { rawCount: 8, dropped: { blurry: 1 }, duplicates: 1, logo: { corner: 'top-left' }, kept: [] }, 0);
    expect(s.dropped.logo).toBe(6);
    expect(s.kept).toBe(0);
  });

  it('sums Mode B drops into extracted', () => {
    const s = summarizeVideo('b', { frames: [], dropped: { 'absent (404)': 1, duplicate: 1 } }, 1);
    expect(s.extracted).toBe(3);
    expect(formatStats('x', s)).toContain('dupe 1');
  });
});

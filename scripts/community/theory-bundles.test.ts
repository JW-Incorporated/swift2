import { describe, expect, it, vi } from 'vitest';
import {
  createTheoryPrefilter,
  theoryBundleKey,
  theoryBundleText,
} from './theory-bundles.mjs';

const readerPost = {
  postId: 'abc123',
  title: 'A music-video clock theory',
  numComments: 45,
  comments: [
    { author: null, body: 'Top-level thought', depth: 0 },
    { author: null, body: 'First reply', depth: 1 },
  ],
};

describe('theory home-reader bundles', () => {
  it('keys a thread by ten-comment bucket and includes the whole captured tree', () => {
    expect(theoryBundleKey(readerPost)).toBe('bundle:abc123:4');
    expect(theoryBundleKey({ ...readerPost, numComments: 49 })).toBe('bundle:abc123:4');
    expect(theoryBundleKey({ ...readerPost, numComments: 50 })).toBe('bundle:abc123:5');
    expect(theoryBundleText(readerPost)).toContain('Top-level thought\nFirst reply');
  });

  it('uses q_theory and stops at the per-run Jev cap', async () => {
    const ask = vi.fn().mockResolvedValue({
      answers: { q_theory: { type: 'noul', probability: 0.8 } },
    });
    const filter = createTheoryPrefilter({ from: vi.fn() }, {
      cap: 1,
      createClient: () => ({ ask }),
    });
    await expect(filter.shouldMine(readerPost)).resolves.toBe(true);
    await expect(filter.shouldMine(readerPost)).resolves.toBeNull();
    expect(ask).toHaveBeenCalledTimes(1);
    expect(filter.stats()).toEqual({ calls: 1, capped: 1, cap: 1 });
  });
});

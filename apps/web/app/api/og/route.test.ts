import { describe, expect, it } from 'vitest';

import { GET } from './route';

// The "cool feature only" fix (social-strategy.md §2): a lens/mode deep
// link must render a feature-specific card, not the generic brand card.
// Real ImageResponse rendering (Satori/resvg) is slow and font-dependent,
// so these check what's cheap and load-bearing: the route returns a real
// PNG response, and it does so for every recognized param — an
// unrecognized one falls back rather than 500ing.
describe('GET /api/og', () => {
  function get(qs: string): Response {
    return GET(new Request(`http://localhost/api/og${qs}`) as never);
  }

  it('renders a PNG for a recognized lens id', async () => {
    const res = await get('?lens=hidden-clues');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
  });

  it('renders a PNG for each of the six thread lenses', async () => {
    const lensIds = [
      'the-proposal',
      'love-story',
      'fashion',
      'taylors-version',
      'easter-eggs',
      'hidden-clues',
    ];
    for (const id of lensIds) {
      const res = await get(`?lens=${id}`);
      expect(res.status).toBe(200);
    }
  });

  it('renders a PNG for the mood and clownbot feature modes', async () => {
    for (const mode of ['mood', 'clownbot']) {
      const res = await get(`?mode=${mode}`);
      expect(res.status).toBe(200);
    }
  });

  it('falls back to the generic card for an unrecognized lens (never 500s)', async () => {
    const res = await get('?lens=not-a-real-thread');
    expect(res.status).toBe(200);
  });

  it('falls back to the generic card for a non-feature mode', async () => {
    const res = await get('?mode=merch');
    expect(res.status).toBe(200);
  });

  it('falls back to the generic card with no params at all', async () => {
    const res = await get('');
    expect(res.status).toBe(200);
  });
});

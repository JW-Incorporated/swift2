import { describe, expect, it } from 'vitest';
import { SOCIAL_LINKS } from './social';

describe('footer social links (#736)', () => {
  it('links exactly IG, TikTok and X — no Facebook/Reddit/Threads', () => {
    expect(SOCIAL_LINKS.map((l) => l.id)).toEqual(['instagram', 'tiktok', 'x']);
  });

  it('points every link at the live @longlivetscom handles', () => {
    const targets = Object.fromEntries(
      SOCIAL_LINKS.map((l) => {
        const url = new URL(l.href);
        return [l.id, url.origin + url.pathname];
      }),
    );
    expect(targets).toEqual({
      instagram: 'https://www.instagram.com/longlivetscom',
      tiktok: 'https://www.tiktok.com/@longlivetscom',
      x: 'https://x.com/longlivetscom',
    });
  });

  it('tags every link with the site-footer UTM params', () => {
    for (const link of SOCIAL_LINKS) {
      const params = new URL(link.href).searchParams;
      expect(params.get('utm_source')).toBe('site');
      expect(params.get('utm_medium')).toBe('footer');
    }
  });
});

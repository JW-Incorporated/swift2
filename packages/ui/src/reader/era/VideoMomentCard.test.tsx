// @vitest-environment jsdom
import { createElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { WatchableVideoNote } from '@swift2/content-enrichment';
import { VideoMomentCard } from './VideoMomentCard';

afterEach(cleanup);

// #6267 / WCAG 2.5.3: the watch-link's accessible name must contain its
// visible text ("Watch on {platform}").
describe('VideoMomentCard watch link accessible name', () => {
  it('contains the visible text and still names the video, with no aria-label', () => {
    const video = {
      slug: 'v1',
      title: 'Cruel Summer (Official Video)',
      kind: 'music-video',
      platform: 'Vevo',
      watchUrl: 'https://example.com/watch',
    } as unknown as WatchableVideoNote;
    render(
      createElement('ul', null,
        createElement(VideoMomentCard, {
          video,
          eraId: 'lover' as never,
          sortDate: '2019-08-23',
          displayDate: '2019-08-23',
        }),
      ),
    );
    const link = screen.getByRole('link', { name: /^Watch on Vevo/ });
    expect(link.hasAttribute('aria-label')).toBe(false);
    expect(link.textContent).toContain('Watch on Vevo');
    expect(link.textContent).toContain('Cruel Summer (Official Video)');
  });
});

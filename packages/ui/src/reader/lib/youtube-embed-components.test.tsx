// @vitest-environment jsdom
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { MoodMatch } from '@swift2/experience';
import { HostProvider } from '../../host/context';
import type { HostAdapter } from '../../host/types';
import { MoodSongCard } from '../clown/MoodSongCard';
import { MomentVideo } from '../era/MomentVideo';

const ID = 'dQw4w9WgXcQ';
const DIRECT = `https://www.youtube-nocookie.com/embed/${ID}?autoplay=1&rel=0`;
const WRAPPER = `https://www.longlivets.com/embed/youtube/${ID}`;

const adapter = (embedOrigin?: string) => ({ embedOrigin }) as unknown as HostAdapter;

const video = { youtubeId: ID, title: 'A video' } as never;
const pick = { title: 'A song', youtubeId: ID, slug: 's', eraId: 'e' } as unknown as MoodMatch;

const momentSrc = (embedOrigin?: string) => {
  const { container } = render(
    <HostProvider adapter={adapter(embedOrigin)}>
      <MomentVideo video={video} startPlaying />
    </HostProvider>,
  );
  return container.querySelector('iframe')!;
};

const moodSrc = (embedOrigin?: string) => {
  const { container, getByRole } = render(
    <HostProvider adapter={adapter(embedOrigin)}>
      <MoodSongCard pick={pick} eraName="Era" />
    </HostProvider>,
  );
  fireEvent.click(getByRole('button'));
  return container.querySelector('iframe')!;
};

describe('YouTube iframe src by host (#4954)', () => {
  it('MomentVideo: direct without embedOrigin, wrapper with it', () => {
    expect(momentSrc().getAttribute('src')).toBe(DIRECT);
    expect(momentSrc().getAttribute('referrerpolicy')).toBe('strict-origin-when-cross-origin');
    expect(momentSrc('https://www.longlivets.com').getAttribute('src')).toBe(WRAPPER);
  });

  it('MoodSongCard: direct without embedOrigin, wrapper with it', () => {
    expect(moodSrc().getAttribute('src')).toBe(DIRECT);
    expect(moodSrc().getAttribute('referrerpolicy')).toBe('strict-origin-when-cross-origin');
    expect(moodSrc('https://www.longlivets.com').getAttribute('src')).toBe(WRAPPER);
  });
});

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

// Each render is unmounted before returning: only one embed may play at a time
// (use-stop-when-hidden.ts), so a second mounted player would stop the first.
const momentSrc = (embedOrigin?: string) => {
  const { container, unmount } = render(
    <HostProvider adapter={adapter(embedOrigin)}>
      <MomentVideo video={video} startPlaying />
    </HostProvider>,
  );
  const iframe = container.querySelector('iframe')!;
  unmount();
  return iframe;
};

const moodSrc = (embedOrigin?: string) => {
  const { container, getByRole, unmount } = render(
    <HostProvider adapter={adapter(embedOrigin)}>
      <MoodSongCard pick={pick} eraName="Era" />
    </HostProvider>,
  );
  fireEvent.click(getByRole('button'));
  const iframe = container.querySelector('iframe')!;
  unmount();
  return iframe;
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

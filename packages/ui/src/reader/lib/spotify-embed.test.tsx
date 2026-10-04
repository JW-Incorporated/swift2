// @vitest-environment jsdom
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HostProvider } from '../../host/context';
import type { HostAdapter } from '../../host/types';
import { SpotifyCompare } from '../threads/taylors-version/SpotifyCompare';
import { spotifyEmbedSrc } from './spotify-embed';

const ID = '1A2b3C4d5E6f7G8h9I0jKl';
const DIRECT = `https://open.spotify.com/embed/album/${ID}?utm_source=generator&theme=0`;
const WRAPPER = `https://www.longlivets.com/embed/spotify/album/${ID}`;

describe('spotifyEmbedSrc', () => {
  it('web (no embedOrigin): the direct embed, unchanged', () => {
    expect(spotifyEmbedSrc('album', ID)).toBe(DIRECT);
  });

  it('app (embedOrigin): the wrapper page on that origin', () => {
    expect(spotifyEmbedSrc('album', ID, 'https://www.longlivets.com')).toBe(WRAPPER);
    expect(spotifyEmbedSrc('track', ID, 'https://www.longlivets.com/')).toBe(
      `https://www.longlivets.com/embed/spotify/track/${ID}`,
    );
  });
});

const adapter = (embedOrigin?: string) => ({ embedOrigin }) as unknown as HostAdapter;

const compareSrc = (embedOrigin?: string) => {
  const { container, getAllByRole } = render(
    <HostProvider adapter={adapter(embedOrigin)}>
      <SpotifyCompare spotify={{ original: null, taylorsVersion: ID } as never} albumName="Album" isPending={false} />
    </HostProvider>,
  );
  fireEvent.click(getAllByRole('button', { name: /Play on Spotify/ })[0]!);
  return container.querySelector('iframe')!;
};

describe('SpotifyCompare iframe src by host', () => {
  it('direct without embedOrigin, wrapper with it', () => {
    expect(compareSrc().getAttribute('src')).toBe(DIRECT);
    expect(compareSrc('https://www.longlivets.com').getAttribute('src')).toBe(WRAPPER);
  });
});

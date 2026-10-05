// @vitest-environment jsdom
import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HostProvider } from '../../host/context';
import type { HostAdapter } from '../../host/types';
import { MomentVideo } from '../era/MomentVideo';
import {
  EMBED_FAILED_MESSAGE,
  EMBED_LOAD_TIMEOUT_MS,
  EMBED_OFFLINE_MESSAGE,
} from './use-embed-gate';

const video = { youtubeId: 'abc123', title: 'A video' } as never;

function setOnline(v: boolean) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => v });
}

const mount = () =>
  render(
    <HostProvider adapter={{ Image: () => null } as unknown as HostAdapter}>
      <MomentVideo video={video} />
    </HostProvider>,
  );

describe('embed gate offline behavior', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    setOnline(true);
  });

  it('keeps the poster and shows a message when tapped offline', () => {
    setOnline(false);
    const { container, getByRole, getByText } = mount();
    fireEvent.click(getByRole('button'));
    expect(container.querySelector('iframe')).toBeNull();
    expect(getByText(EMBED_OFFLINE_MESSAGE)).toBeTruthy();
  });

  it('clears the message on the online event and allows a retry', () => {
    setOnline(false);
    const { container, getByRole, queryByText } = mount();
    fireEvent.click(getByRole('button'));
    setOnline(true);
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(queryByText(EMBED_OFFLINE_MESSAGE)).toBeNull();
    fireEvent.click(getByRole('button'));
    expect(container.querySelector('iframe')).not.toBeNull();
  });

  it('restores a retryable poster when the iframe never loads', () => {
    const { container, getByRole, getByText } = mount();
    fireEvent.click(getByRole('button'));
    expect(container.querySelector('iframe')).not.toBeNull();
    act(() => {
      vi.advanceTimersByTime(EMBED_LOAD_TIMEOUT_MS + 1);
    });
    expect(container.querySelector('iframe')).toBeNull();
    expect(getByText(EMBED_FAILED_MESSAGE)).toBeTruthy();
    fireEvent.click(getByRole('button'));
    expect(container.querySelector('iframe')).not.toBeNull();
  });

  it('keeps the player when it loads before the timeout', () => {
    const { container, getByRole } = mount();
    fireEvent.click(getByRole('button'));
    fireEvent.load(container.querySelector('iframe')!);
    act(() => {
      vi.advanceTimersByTime(EMBED_LOAD_TIMEOUT_MS + 1);
    });
    expect(container.querySelector('iframe')).not.toBeNull();
  });
});

// @vitest-environment jsdom
import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HostProvider } from '../../host/context';
import type { HostAdapter } from '../../host/types';
import { MomentVideo } from '../era/MomentVideo';
import {
  EMBED_FAILED_MESSAGE,
  EMBED_OFFLINE_MESSAGE,
  EMBED_READY_BOUND_MS,
  EMBED_STALLED_MESSAGE,
} from './use-embed-gate';

const video = { youtubeId: 'abc123', title: 'A video' } as never;
const ORIGIN = 'https://www.longlivets.com';

function setOnline(v: boolean) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => v });
}

const mount = (embedOrigin?: string) =>
  render(
    <HostProvider adapter={{ Image: () => null, embedOrigin } as unknown as HostAdapter}>
      <MomentVideo video={video} />
    </HostProvider>,
  );

const post = (data: unknown, source: Window | null, origin = ORIGIN) =>
  act(() => {
    window.dispatchEvent(new MessageEvent('message', { data, source, origin }));
  });

describe('embed gate', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    setOnline(true);
  });

  it('offline is only a hint: the tap still mounts the player', () => {
    setOnline(false);
    const { container, getByRole, getByText } = mount();
    fireEvent.click(getByRole('button'));
    expect(container.querySelector('iframe')).not.toBeNull();
    expect(getByText(EMBED_OFFLINE_MESSAGE)).toBeTruthy();
  });

  it('the online event clears the offline hint', () => {
    setOnline(false);
    const { getByRole, queryByText } = mount();
    fireEvent.click(getByRole('button'));
    setOnline(true);
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(queryByText(EMBED_OFFLINE_MESSAGE)).toBeNull();
  });

  it('website (no wrapper): never tears the iframe down on a timer', () => {
    const { container, getByRole, queryByText } = mount();
    fireEvent.click(getByRole('button'));
    act(() => {
      vi.advanceTimersByTime(EMBED_READY_BOUND_MS * 3);
    });
    expect(container.querySelector('iframe')).not.toBeNull();
    expect(queryByText(EMBED_STALLED_MESSAGE, { exact: false })).toBeNull();
  });

  it('wrapper: silence past the bound shows a Reload control, iframe stays, reload remounts', () => {
    const { container, getByRole, getByText } = mount(ORIGIN);
    fireEvent.click(getByRole('button'));
    const first = container.querySelector('iframe')!;
    act(() => {
      vi.advanceTimersByTime(EMBED_READY_BOUND_MS + 1);
    });
    expect(container.querySelector('iframe')).toBe(first);
    expect(getByText(EMBED_STALLED_MESSAGE, { exact: false })).toBeTruthy();
    fireEvent.click(getByRole('button', { name: 'Reload' }));
    expect(container.querySelector('iframe')).not.toBe(first);
    expect(container.querySelector('iframe')).not.toBeNull();
  });

  it('wrapper: a verified embed-ready cancels the stall', () => {
    const { container, getByRole, queryByText } = mount(ORIGIN);
    fireEvent.click(getByRole('button'));
    post({ type: 'embed-ready' }, container.querySelector('iframe')!.contentWindow);
    act(() => {
      vi.advanceTimersByTime(EMBED_READY_BOUND_MS + 1);
    });
    expect(queryByText(EMBED_STALLED_MESSAGE, { exact: false })).toBeNull();
  });

  it('wrapper: embed-error restores a retryable poster', () => {
    const { container, getByRole, getByText } = mount(ORIGIN);
    fireEvent.click(getByRole('button'));
    post({ type: 'embed-error' }, container.querySelector('iframe')!.contentWindow);
    expect(container.querySelector('iframe')).toBeNull();
    expect(getByText(EMBED_FAILED_MESSAGE)).toBeTruthy();
    fireEvent.click(getByRole('button'));
    expect(container.querySelector('iframe')).not.toBeNull();
  });

  it('wrapper: ignores messages from another source or origin', () => {
    const { container, getByRole } = mount(ORIGIN);
    fireEvent.click(getByRole('button'));
    const win = container.querySelector('iframe')!.contentWindow;
    post({ type: 'embed-error' }, window);
    post({ type: 'embed-error' }, win, 'https://evil.example');
    expect(container.querySelector('iframe')).not.toBeNull();
  });
});

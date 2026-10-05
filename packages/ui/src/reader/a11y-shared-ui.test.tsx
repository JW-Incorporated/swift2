// @vitest-environment jsdom
import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EGG_NODES } from '@swift2/experience';
import { HostProvider } from '../host/context';
import type { HostAdapter } from '../host/types';
import { ClueWebNode } from './threads/ClueWebNode';
import { ShareFallbackToast } from './shell/ShareFallbackToast';
import { MomentLightbox } from './moment/MomentLightbox';

afterEach(() => vi.useRealTimers());

describe('ClueWebNode keyboard operation', () => {
  it('is a named button that toggles on Enter and Space', () => {
    const node = EGG_NODES[0]!;
    const onToggle = vi.fn();
    const { getByRole } = render(
      <svg>
        <ClueWebNode node={node} isActive={false} muted={false} onToggle={onToggle} onHover={() => {}} />
      </svg>,
    );
    const btn = getByRole('button', { name: node.label });
    expect(btn.getAttribute('tabindex')).toBe('0');
    expect(btn.getAttribute('aria-pressed')).toBe('false');
    fireEvent.keyDown(btn, { key: 'Enter' });
    fireEvent.keyDown(btn, { key: ' ' });
    expect(onToggle).toHaveBeenCalledTimes(2);
  });
});

describe('ShareFallbackToast', () => {
  const show = () =>
    act(() => {
      window.dispatchEvent(
        new CustomEvent('longlive-share-fallback', {
          detail: { title: 't', text: 'x', url: 'https://e.test', copied: false },
        }),
      );
    });
  const mount = () =>
    render(
      <HostProvider adapter={{} as unknown as HostAdapter}>
        <ShareFallbackToast />
      </HostProvider>,
    );

  it('auto-dismisses after 7s, but pauses while focused and resumes on blur', () => {
    vi.useFakeTimers();
    const { getByLabelText, queryByLabelText } = mount();
    show();
    const input = getByLabelText('Share link');
    act(() => input.focus());
    act(() => void vi.advanceTimersByTime(20000));
    expect(queryByLabelText('Share link')).not.toBeNull();
    act(() => input.blur());
    act(() => void vi.advanceTimersByTime(7001));
    expect(queryByLabelText('Share link')).toBeNull();
  });

  it('has a Close button', () => {
    const { getByLabelText, queryByLabelText } = mount();
    show();
    fireEvent.click(getByLabelText('Close'));
    expect(queryByLabelText('Share link')).toBeNull();
  });
});

describe('MomentLightbox status', () => {
  it('announces photo N of M with caption', () => {
    const images = [
      { url: '/a.jpg', caption: 'First' },
      { url: '/b.jpg', caption: 'Second' },
    ] as never;
    const adapter = { Image: () => null } as unknown as HostAdapter;
    const ui = (index: number) => (
      <HostProvider adapter={adapter}>
        <MomentLightbox images={images} onIndex={() => {}} onClose={() => {}} title="T" index={index} />
      </HostProvider>
    );
    const { getByRole, rerender } = render(ui(0));
    expect(getByRole('status').textContent).toBe('Photo 1 of 2: First');
    rerender(ui(1));
    expect(getByRole('status').textContent).toBe('Photo 2 of 2: Second');
  });
});

describe('InboxPage status', () => {
  it('keeps a persistent polite status and updates its text', async () => {
    const { InboxPage } = await import('./settings/InboxPage');
    const adapter = {
      apiFetch: async () => ({ status: 200, body: JSON.stringify({ events: [] }) }),
    } as unknown as HostAdapter;
    const { getByRole, findByText } = render(
      <HostProvider adapter={adapter}>
        <InboxPage onClose={() => {}} onOpenItem={() => {}} />
      </HostProvider>,
    );
    const status = getByRole('status');
    expect(status.getAttribute('aria-live')).toBe('polite');
    await findByText('Inbox is empty. Nothing here yet.');
    expect(getByRole('status')).toBe(status);
  });
});

describe('embed play focus', () => {
  it('moves focus to the titled iframe after Play', async () => {
    const { MomentVideo } = await import('./era/MomentVideo');
    const adapter = { Image: () => null } as unknown as HostAdapter;
    const { getByRole, container } = render(
      <HostProvider adapter={adapter}>
        <MomentVideo video={{ youtubeId: 'abc123', title: 'A video' } as never} />
      </HostProvider>,
    );
    const play = getByRole('button');
    play.focus();
    fireEvent.click(play);
    const frame = container.querySelector('iframe')!;
    expect(frame.getAttribute('title')).toBe('A video');
    expect(document.activeElement).toBe(frame);
  });
});

// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HostProvider } from '../../host/context';
import type { HostAdapter } from '../../host/types';
import { InboxPage } from './InboxPage';

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

const row = (id: string, category: string, title: string) => ({
  id,
  category,
  tier: 1,
  title,
  body: 'b',
  deep_link: 'https://longlivets.com/',
  available_at: '2026-10-15T12:00:00Z',
});

const mount = () => {
  const apiFetch = async () => ({
    status: 200,
    body: JSON.stringify({
      events: [row('1', 'song_drop', 'New song'), row('2', 'baby_watch', 'Official announcement')],
    }),
  });
  render(
    <HostProvider adapter={{ apiFetch } as unknown as HostAdapter}>
      <InboxPage onClose={() => undefined} onOpenItem={() => undefined} />
    </HostProvider>,
  );
};

describe('InboxPage Baby Watch rendering (behind NEXT_PUBLIC_BABY_WATCH_ENABLED)', () => {
  it('hides baby_watch items when the flag is off (default)', async () => {
    mount();
    await screen.findByText('New song');
    expect(screen.queryByText('Official announcement')).toBeNull();
  });

  it('shows baby_watch items with the category label when the flag is on', async () => {
    vi.stubEnv('NEXT_PUBLIC_BABY_WATCH_ENABLED', 'true');
    mount();
    await screen.findByText('Official announcement');
    expect(screen.getByText('Baby Watch: official announcements only')).toBeTruthy();
  });
});

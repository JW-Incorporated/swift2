// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { HostProvider } from '../../host/context';
import type { HostAdapter } from '../../host/types';
import { WebNotificationSettings } from './WebNotificationSettings';

afterEach(cleanup);

const webPush = {
  isSupported: () => true,
  getDeviceId: () => 'dev-1',
  loadPrefs: async () => ({
    settings: { masterEnabled: true },
    prefs: [{ category: 'new_content', cadence: 'immediate' }],
  }),
  savePrefs: async () => ({ settings: { masterEnabled: true }, prefs: [] }),
};

const mount = () =>
  render(
    <HostProvider adapter={{ webPush } as unknown as HostAdapter}>
      <WebNotificationSettings vapidPublicKey="k" />
    </HostProvider>,
  );

describe('WebNotificationSettings accessible names and targets', () => {
  it('names the master switch from its visible label and gives it a 44px hit area', async () => {
    Object.defineProperty(window, 'Notification', { configurable: true, value: { permission: 'granted' } });
    mount();
    const sw = await screen.findByRole('switch', { name: 'Notifications' });
    expect(sw.className).toContain('before:h-11');
    expect(sw.className).toContain('before:w-[max(100%,44px)]');
  });

  it('names every cadence radiogroup after its category and gives radios a 44px hit area', async () => {
    Object.defineProperty(window, 'Notification', { configurable: true, value: { permission: 'granted' } });
    mount();
    await screen.findByRole('switch', { name: 'Notifications' });
    const groups = screen.getAllByRole('radiogroup');
    expect(groups.length).toBeGreaterThan(0);
    for (const g of groups) {
      const label = g.getAttribute('aria-labelledby')!;
      expect(document.getElementById(label)?.textContent).toBeTruthy();
    }
    const first = groups[0]!;
    expect(screen.getByRole('radiogroup', { name: document.getElementById(first.getAttribute('aria-labelledby')!)!.textContent! })).toBe(first);
    for (const r of screen.getAllByRole('radio')) expect(r.className).toContain('before:h-11');
  });
});

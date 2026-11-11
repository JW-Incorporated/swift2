// @vitest-environment jsdom
import type {} from '@testing-library/jest-dom/vitest';
import { act, createElement as h } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { HostProvider, resOk } from '@swift2/ui';
import { FeedbackButton } from '@swift2/ui/reader/legal/FeedbackButton';
// @ts-expect-error no types for the deep path; only the runtime module matters
vi.mock('react', async () => await import('../../../web/node_modules/react'));
vi.mock('@swift2/ui/reader/store/index', () => ({ useAppState: () => ({ mode: 'era' }) }));
vi.mock('@swift2/ui/reader/settings/NotificationSettingsPage', () => ({ NotificationSettingsPage: () => null }));
import { createAppAdapter } from '../bridge/app-adapter';
import { currentDomUrl, setDomPath } from '../bridge/dom-path';
import { resetBackStackForTests, waitForBackStackIdle } from '@swift2/ui/reader/lib/useBackDismiss';
import { SettingsPage } from './settings-page';
import { resetSettingsOverlayForTests, settingsOverlay } from './settings-store';

function mount() {
  const adapter = createAppAdapter({
    client: { call: vi.fn(async () => resOk(null)) as never },
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
    isNativeRoute: () => false,
    navigateDom: (url: string) => void setDomPath(url),
    getPath: currentDomUrl,
    apiFetch: (async () => resOk(null)) as never,
    onBack: () => () => {},
  });
  render(h(HostProvider, { adapter, children: h('div', null, h(FeedbackButton), h(SettingsPage)) }));
}

afterEach(async () => {
  cleanup();
  resetSettingsOverlayForTests();
  await waitForBackStackIdle();
  resetBackStackForTests();
  window.history.replaceState(null, '');
});

const pill = () => screen.queryByRole('button', { name: 'Send feedback' });

describe('Feedback pill over native-host full-screen overlays', () => {
  it('is not rendered while the settings overlay is open, and returns when it closes', async () => {
    mount();
    expect(pill()).not.toBeNull();
    act(() => settingsOverlay.open());
    expect(screen.getByRole('dialog', { name: 'Notification settings' })).toBeInTheDocument();
    expect(pill()).toBeNull();
    act(() => settingsOverlay.close());
    expect(pill()).not.toBeNull();
  });
});

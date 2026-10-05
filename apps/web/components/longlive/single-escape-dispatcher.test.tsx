// @vitest-environment jsdom
import type {} from '@testing-library/jest-dom/vitest';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { trackKey } from '@swift2/experience';
import { FeedbackButton } from './FeedbackButton';
import { MomentDetail } from './MomentDetail';
import { SearchOverlay } from './SearchOverlay';
import { TrackDetail } from './TrackDetail';
import { CONTENT } from '@/lib/longlive/content';
import { tracksForEra } from '@/lib/longlive/tracks';
import { renderWithReader } from '@/lib/longlive/render-with-reader';
import { AppProvider, useAppActions } from '@/lib/longlive/store';
import { TestHostProvider } from '@/lib/test-host';
import { resetBackStackForTests, waitForBackStackIdle } from '@/lib/longlive/useBackDismiss';

const ERA = 'fearless' as const;
const KEY = trackKey(ERA, tracksForEra(ERA)[1]);
const MOMENT = CONTENT[0].id;

let actions: ReturnType<typeof useAppActions>;
function Grab() {
  actions = useAppActions();
  useEffect(() => void 0, []);
  return null;
}

const settle = () => act(async () => void (await waitForBackStackIdle()));
const escape = async (target: Element | Window = window) => {
  fireEvent.keyDown(target, { key: 'Escape' });
  await settle();
};

function mount() {
  return renderWithReader(
    <TestHostProvider>
      <AppProvider>
        <Grab />
        <MomentDetail />
        <TrackDetail />
        <SearchOverlay />
        <FeedbackButton />
      </AppProvider>
    </TestHostProvider>,
  );
}

const momentOpen = () => screen.queryByRole('heading', { level: 1, name: CONTENT[0].title }) !== null;
const feedbackOpen = () => screen.queryByLabelText('Describe the issue') !== null;
const trackOpen = () => screen.queryByRole('dialog', { name: /song detail/ }) !== null;
const searchOpen = () => screen.queryByRole('dialog', { name: 'Search the archive' }) !== null;

describe('single Escape dispatcher', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    resetBackStackForTests();
  });
  afterEach(() => {
    cleanup();
    resetBackStackForTests();
  });

  it('Feedback over a moment: Escape closes only Feedback, the second closes the moment', async () => {
    mount();
    act(() => actions.openItem(MOMENT));
    await settle();
    expect(momentOpen()).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));
    await settle();
    expect(feedbackOpen()).toBe(true);
    await escape(screen.getByLabelText('Describe the issue'));
    expect(feedbackOpen()).toBe(false);
    expect(momentOpen()).toBe(true);
    await escape();
    expect(momentOpen()).toBe(false);
  });

  it('TrackDetail over a moment: Escape closes only the top', async () => {
    mount();
    act(() => actions.openItem(MOMENT));
    await settle();
    act(() => actions.openSong(ERA, KEY));
    await settle();
    expect(trackOpen()).toBe(true);
    expect(momentOpen()).toBe(true);
    await escape();
    expect(trackOpen()).toBe(false);
    expect(momentOpen()).toBe(true);
    await escape();
    expect(momentOpen()).toBe(false);
  });

  it('Search over a moment: Escape closes only search, even from its input', async () => {
    mount();
    act(() => actions.openItem(MOMENT));
    await settle();
    act(() => actions.setSearchOpen(true));
    await settle();
    expect(searchOpen()).toBe(true);
    await escape(screen.getByRole('combobox'));
    expect(searchOpen()).toBe(false);
    expect(momentOpen()).toBe(true);
  });

  it('Escape in a textarea inside a dialog dismisses that dialog exactly once', async () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));
    await settle();
    const area = screen.getByLabelText('Describe the issue');
    fireEvent.change(area, { target: { value: 'typed' } });
    await escape(area);
    expect(feedbackOpen()).toBe(false);
    await escape(document.body);
    expect(feedbackOpen()).toBe(false);
  });

  it('with nothing open Escape is left alone (not swallowed)', async () => {
    mount();
    let seen = 0;
    const spy = () => void (seen += 1);
    window.addEventListener('keydown', spy);
    await escape(document.body);
    window.removeEventListener('keydown', spy);
    expect(seen).toBe(1);
  });
});

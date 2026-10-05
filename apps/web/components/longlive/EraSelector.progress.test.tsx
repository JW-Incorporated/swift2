// @vitest-environment jsdom
import type {} from '@testing-library/jest-dom/vitest';
import { act, cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CONTENT } from '@/lib/longlive/content';
import { renderWithReader } from '@/lib/longlive/render-with-reader';
import { AppProvider, useAppActions } from '@/lib/longlive/store';
import { createWebAdapter } from '@/lib/host-adapter';
import { TestHostProvider } from '@/lib/test-host';
import { HostProvider } from '@swift2/ui';
import { EraSelector } from './EraSelector';

// The "Your Long Live" card lives in the shared EraSelector, so the web wrapper and the app slot get it from one place.

let actions: ReturnType<typeof useAppActions>;
function Capture() {
  actions = useAppActions();
  return null;
}

async function openSelector() {
  renderWithReader(
    <TestHostProvider>
      <AppProvider>
        <Capture />
        <EraSelector />
      </AppProvider>
    </TestHostProvider>,
  );
  await act(async () => actions.setSelectorOpen(true));
}

beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

describe('EraSelector "Your Long Live" card (web wrapper)', () => {
  it('renders the card when progress exists', async () => {
    window.localStorage.setItem(
      'll-progress-v1',
      JSON.stringify({ v: 1, moments: [], eggs: [], trails: [], favorites: [CONTENT[0].id] }),
    );
    await openSelector();
    expect(screen.getByRole('heading', { name: 'Your Long Live' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /make my card/i })).toBeInTheDocument();
  });

  it('renders no card when progress is empty', async () => {
    await openSelector();
    expect(screen.getByText('Choose an era')).toBeInTheDocument();
    expect(screen.queryByText('Your Long Live')).toBeNull();
  });

  it('renders the card after hydrating from a fake host storage (the app progress source)', async () => {
    const data = new Map([
      ['ll-progress-v1', JSON.stringify({ v: 1, moments: [], eggs: [], trails: [], favorites: [CONTENT[0].id] })],
    ]);
    const fake: ReturnType<typeof createWebAdapter>['storage']['local'] = {
      get: (k) => data.get(k) ?? null,
      set: (k, v) => void data.set(k, v),
      remove: (k) => void data.delete(k),
    };
    const adapter = { ...createWebAdapter({ push() {}, replace() {} }), storage: { local: fake, session: fake } };
    renderWithReader(
      <HostProvider adapter={adapter}>
        <AppProvider>
          <Capture />
          <EraSelector />
        </AppProvider>
      </HostProvider>,
    );
    await act(async () => actions.setSelectorOpen(true));
    expect(screen.getByRole('heading', { name: 'Your Long Live' })).toBeInTheDocument();
  });
});

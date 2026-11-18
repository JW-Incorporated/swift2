// @vitest-environment jsdom
import type {} from '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { renderWithReader } from '@/lib/longlive/render-with-reader';
import { AppProvider, useAppActions } from '@/lib/longlive/store';
import { TestHostProvider } from '@/lib/test-host';
import { SearchOverlay } from './SearchOverlay';

const HEADLINE = 'Taylor reportedly set to perform at the CMA Awards for the first time';
const LIVE_ITEM = {
  id: 'cma-live',
  observedOn: '2026-11-13',
  eraId: 'tloas',
  category: 'sighting',
  tags: ['Lore'],
  headline: HEADLINE,
  summary:
    'A notable thing happened today in the fandom, according to multiple reports. Fans reacted quickly across social media and began sharing their reactions widely online.',
  detail:
    'This is a longer, our-words paragraph describing the event in enough detail to clear the current-item-quality detail floor for test fixtures across this whole file every single time word count matters here today in testing, with extra context about the era, the timing, and why fans would care, written out at length so the word count comfortably clears the sixty-word floor every single run without being anywhere near borderline.',
  imageUrl: 'https://www.people.com/photo.jpg',
  status: 'reported',
  confidence: 'reputable_reporting',
  sourceTier: 'established',
  sources: [{ name: 'People', url: 'https://people.com/x', tier: 'established' }],
  symbols: [],
  entities: [],
  heat: 1,
  lastCheckedOn: '2026-11-13',
  expiresAt: '2026-12-31T00:00:00.000Z',
  updatedAt: '2026-11-13T12:00:00.000Z',
  redlineOk: true,
};

let actions: ReturnType<typeof useAppActions>;
function Capture() {
  actions = useAppActions();
  return null;
}

beforeAll(() => {
  Element.prototype.scrollIntoView = () => {};
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const liveResponse = () => new Response(JSON.stringify({ items: [LIVE_ITEM], theories: [], signals: [] }), { status: 200 });

function mount() {
  renderWithReader(
    <TestHostProvider>
      <AppProvider>
        <Capture />
        <SearchOverlay />
      </AppProvider>
    </TestHostProvider>,
  );
}

const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });

async function openLiveStory() {
  vi.stubGlobal('fetch', vi.fn(async () => liveResponse()));
  mount();
  await flush();
  act(() => actions.setSearchOpen(true));
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'CMA Awards' } });
  const option = await screen.findByRole('option', { name: new RegExp(HEADLINE) }, { timeout: 2000 });
  expect(screen.getByText('News')).toBeInTheDocument();
  fireEvent.click(option);
}

describe('search finds live news', () => {
  it('lists a live story under News and opens its detail when picked', async () => {
    await openLiveStory();
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.getByRole('dialog')).toHaveTextContent(HEADLINE);
  });

  it('forgets the open story when search reopens, so closing search does not bring it back', async () => {
    await openLiveStory();
    act(() => actions.setSearchOpen(true));
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    act(() => actions.setSearchOpen(false));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('resets the highlight when live rows land mid-query, so Enter never opens a shifted row', async () => {
    let land: (r: Response) => void = () => {};
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((resolve) => (land = resolve))));
    mount();
    act(() => actions.setSearchOpen(true));
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'CMA Awards' } });
    await screen.findAllByRole('option', {}, { timeout: 2000 });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(screen.getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true');
    land(liveResponse());
    await screen.findByRole('option', { name: new RegExp(HEADLINE) }, { timeout: 2000 });
    const first = screen.getAllByRole('option')[0]!;
    expect(first).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});

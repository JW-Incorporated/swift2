// @vitest-environment jsdom
import type {} from '@testing-library/jest-dom/vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { useState, type ReactElement } from 'react';
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { getEra, trackKey } from '@swift2/experience';
import type { CurrentItem } from '@swift2/shared';
import { CONTENT } from '@/lib/longlive/content';
import { renderWithReader } from '@/lib/longlive/render-with-reader';
import { AppProvider, useAppActions } from '@/lib/longlive/store';
import { tracksForEra } from '@/lib/longlive/tracks';
import { TestHostProvider } from '@/lib/test-host';
import { CurrentItemDetail } from './CurrentItemDetail';
import { EraSelector } from './EraSelector';
import { FeedbackButton } from './FeedbackButton';
import { MomentDetail } from './MomentDetail';
import { SearchOverlay } from './SearchOverlay';
import { TheoryGuide } from './TheoryGuide';
import { TrackDetail } from './TrackDetail';
import { TrackGuide } from './TrackGuide';

// Every aria-modal surface in packages/ui/src/reader must move focus in, keep
// Tab inside, and hand focus back on close. The source scan at the bottom
// fails when a new aria-modal file is added without a case here.

const ERA = 'fearless' as const;
const era = getEra(ERA)!;
const SONG = trackKey(ERA, tracksForEra(ERA)[1]);
const MOMENT = CONTENT.find((c) => c.images.length > 1 && !c.images[0].caption && c.tags.length > 0)!;
const ITEM = {
  id: 'ci-1',
  eraId: ERA,
  observedOn: '2026-10-01',
  headline: 'A headline',
  summary: 'A summary',
  detail: 'A detail',
  status: 'rumor',
  sources: [{ name: 'Pub', url: 'https://pub.example/a', tier: 'tier1' }],
} as unknown as CurrentItem;

let actions: ReturnType<typeof useAppActions>;
function Capture() {
  actions = useAppActions();
  return null;
}

let setItem: (v: CurrentItem | null) => void;
function CurrentItemHarness() {
  const [item, set] = useState<CurrentItem | null>(null);
  setItem = set;
  return <CurrentItemDetail item={item} era={era} onClose={() => set(null)} />;
}

type Surface = {
  file: string;
  ui: () => ReactElement;
  open: () => void;
  dialog: () => HTMLElement;
  close: () => void;
  /** Where focus must land on close; defaults to the harness trigger. */
  opener?: () => HTMLElement;
};

const escape = () => fireEvent.keyDown(window, { key: 'Escape' });
const byName = (name: RegExp) => () => screen.getByRole('dialog', { name });

const SURFACES: Surface[] = [
  {
    file: 'era/CurrentItemDetail.tsx',
    ui: () => <CurrentItemHarness />,
    open: () => act(() => setItem(ITEM)),
    dialog: byName(/A headline/),
    close: () => setItem(null),
  },
  {
    file: 'legal/FeedbackButton.tsx',
    ui: () => <FeedbackButton />,
    open: () => fireEvent.click(screen.getByRole('button', { name: /send feedback/i })),
    dialog: () => screen.getByRole('dialog'),
    close: escape,
  },
  {
    file: 'moment/MomentDetail.tsx',
    ui: () => <MomentDetail />,
    open: () => act(() => actions.openItem(MOMENT.id)),
    dialog: () =>
      screen.getByRole('heading', { level: 1, name: MOMENT.title }).closest('[role="dialog"]') as HTMLElement,
    close: () => actions.closeItem(),
  },
  {
    file: 'moment/MomentLightbox.tsx',
    ui: () => <MomentDetail />,
    open: () => {
      act(() => actions.openItem(MOMENT.id));
      fireEvent.click(screen.getAllByRole('button', { name: /view photo full screen/i })[0]);
    },
    dialog: byName(/photo viewer/i),
    opener: () => screen.getAllByRole('button', { name: /view photo full screen/i })[0]!,
    close: escape,
  },
  {
    file: 'search/SearchOverlay.tsx',
    ui: () => <SearchOverlay />,
    open: () => act(() => actions.setSearchOpen(true)),
    dialog: () => screen.getByRole('dialog'),
    close: () => actions.setSearchOpen(false),
  },
  {
    file: 'shell/EraSelector.tsx',
    ui: () => <EraSelector />,
    open: () => act(() => actions.setSelectorOpen(true)),
    dialog: () => screen.getByRole('dialog'),
    close: () => actions.setSelectorOpen(false),
  },
  {
    file: 'threads/TheoryGuide.tsx',
    ui: () => <TheoryGuide />,
    open: () => act(() => actions.openTheoryGuide(ERA)),
    dialog: () => screen.getByRole('dialog'),
    close: () => actions.closeTheoryGuide(),
  },
  {
    file: 'tracks/TrackGuide.tsx',
    ui: () => <TrackGuide />,
    open: () => act(() => actions.openTrackGuide(ERA)),
    dialog: () => screen.getByRole('dialog'),
    close: () => actions.closeTrackGuide(),
  },
  {
    file: 'tracks/TrackDetail.tsx',
    ui: () => <TrackDetail />,
    open: () => act(() => actions.openSong(ERA, SONG)),
    dialog: byName(/song detail/i),
    close: () => actions.closeTrack(),
  },
];

beforeAll(() => {
  // jsdom has no layout, so offsetParent is always null and the trap would see no focusables.
  Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
    configurable: true,
    get(this: HTMLElement) {
      return this.parentNode as Element | null;
    },
  });
});

afterEach(cleanup);

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const tab = (shiftKey: boolean) => {
  const from = document.activeElement as HTMLElement;
  act(() => void fireEvent.keyDown(from, { key: 'Tab', shiftKey }));
};

describe.each(SURFACES)('modal focus contract: $file', (s) => {
  function mount() {
    renderWithReader(
      <TestHostProvider>
        <AppProvider>
          <Capture />
          <button type="button">trigger</button>
          {s.ui()}
        </AppProvider>
      </TestHostProvider>,
    );
    const trigger = screen.getByRole('button', { name: 'trigger' });
    trigger.focus();
    s.open();
    return { trigger, dialog: s.dialog() };
  }

  it('moves initial focus inside the dialog', () => {
    const { dialog } = mount();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('keeps Tab and Shift+Tab inside the dialog', () => {
    const { dialog } = mount();
    const list = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
    expect(list.length).toBeGreaterThan(0);
    list.at(-1)!.focus();
    tab(false);
    expect(document.activeElement).toBe(list[0]);
    tab(true);
    expect(document.activeElement).toBe(list.at(-1));
  });

  it('restores focus to the opener on close', () => {
    const { trigger } = mount();
    act(() => s.close());
    expect(() => s.dialog()).toThrow();
    expect(document.activeElement).toBe(s.opener ? s.opener() : trigger);
  });
});

describe('every aria-modal file under packages/ui/src/reader has a case above', () => {
  it('has no uncovered surface', () => {
    const root = fileURLToPath(new URL('../../../../packages/ui/src/reader', pathToFileURL(__filename)));
    const found = (readdirSync(root, { recursive: true }) as string[])
      .map((p) => p.replace(/\\/g, '/'))
      .filter((p) => p.endsWith('.tsx') && !p.includes('.test.'))
      .filter((p) => readFileSync(join(root, p), 'utf8').includes('aria-modal'))
      .sort();
    expect(found).toEqual(SURFACES.map((s) => s.file).sort());
  });
});

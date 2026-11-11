// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { getEra } from '@swift2/experience';
import { EraFeedList } from '@swift2/ui/reader/era/EraFeedList';
import { EraSecretCard } from '@swift2/ui/reader/era/EraSecretCard';
import { EraThreadsPivot } from '@swift2/ui/reader/era/EraThreadsPivot';
import { ThisWeekNews } from '@swift2/ui/reader/era/ThisWeekNews';
import { TrackGuideBar } from '@swift2/ui/reader/era/TrackGuideBar';
import type { CurrentItem } from '@swift2/shared';

import { renderWithReader } from '@/lib/longlive/render-with-reader';
import { AppProvider } from '@/lib/longlive/store';
import { TestHostProvider } from '@/lib/test-host';
import {
  SCRUBBER_GUTTER_CLASS,
  SCRUBBER_GUTTER_MIN_VIEWPORT_REM,
  SCRUBBER_GUTTER_SYMMETRIC_CLASS,
} from './timelineScrubberLayout';

const COLUMN_MAX_PX = 896; // max-w-4xl
const RAIL_FOOTPRINT_PX = 16 + 28 + 4; // RAIL_RIGHT + RIDGE_WIDTH + gap

const wrap = (ui: React.ReactElement) =>
  renderWithReader(
    <TestHostProvider>
      <AppProvider>{ui}</AppProvider>
    </TestHostProvider>,
  );

function expectGutter(el: Element | null | undefined, desktopPadding: 'pr-8' | 'pr-4') {
  expect(el).toBeTruthy();
  const cls = el!.classList;
  expect(cls.contains('pl-4')).toBe(true);
  expect(cls.contains('pr-12')).toBe(true);
  expect(cls.contains(`min-[${SCRUBBER_GUTTER_MIN_VIEWPORT_REM}rem]:${desktopPadding}`)).toBe(true);
  expect(cls.contains('md:pr-8')).toBe(false);
  expect(cls.contains('px-4')).toBe(false);
}

describe('scrubber gutter', () => {
  it('turns off exactly where the centered column can no longer reach the rail', () => {
    // The column's right edge is (vw + COLUMN_MAX_PX) / 2 from the left, so it is
    // within RAIL_FOOTPRINT_PX of the right edge until vw = COLUMN_MAX_PX + 2 * footprint.
    expect((COLUMN_MAX_PX + 2 * RAIL_FOOTPRINT_PX) / 16).toBe(SCRUBBER_GUTTER_MIN_VIEWPORT_REM);
    expect(SCRUBBER_GUTTER_CLASS).toBe(`pr-12 min-[${SCRUBBER_GUTTER_MIN_VIEWPORT_REM}rem]:pr-8`);
    expect(SCRUBBER_GUTTER_SYMMETRIC_CLASS).toBe(`pr-12 min-[${SCRUBBER_GUTTER_MIN_VIEWPORT_REM}rem]:pr-4`);
  });

  it('feed list', () => {
    const { container } = wrap(
      <EraFeedList
        entries={[]}
        era={getEra('folklore')}
        tiers={new Map()}
        videoOwnerIds={new Set()}
        imageHiddenIds={new Set()}
        filters={new Set()}
        onOpenItem={() => {}}
        onOpenDoorway={() => {}}
        onOpenCurrentItem={() => {}}
      />,
    );
    expectGutter(container.querySelector('.max-w-4xl'), 'pr-8');
  });

  it('this-week news keeps its original symmetric padding on desktop', () => {
    const item = {
      id: 'a',
      eraId: 'tloas',
      observedOn: '2026-11-02',
      headline: 'h',
      summary: 's',
      status: 'reported',
      sources: [{ name: 'People', url: 'https://www.people.com/s', tier: 'established' }],
    } as unknown as CurrentItem;
    const { getByTestId } = wrap(<ThisWeekNews items={[item]} filters={new Set()} onOpen={() => {}} />);
    expectGutter(getByTestId('this-week-news'), 'pr-4');
  });

  it('era secret', () => {
    const { container } = wrap(<EraSecretCard eraId="tloas" />);
    const section = container.querySelector('section[aria-label^="Era secret"]');
    expectGutter(section, 'pr-8');
  });

  it('threads pivot', () => {
    const { container } = wrap(
      <EraThreadsPivot
        era={getEra('folklore')}
        eraThreads={[{ id: 'fashion', count: 3 }]}
        onOpenThread={() => {}}
      />,
    );
    expectGutter(container.querySelector('.max-w-4xl'), 'pr-8');
  });

  it('track guide bar insets symmetrically, never with one-sided padding', () => {
    const { container } = wrap(<TrackGuideBar trackCount={12} onOpen={() => {}} />);
    const bar = container.firstElementChild!;
    expect(bar.className).toContain('mx-auto');
    expect(bar.className).toContain('max-w-[min(28rem,calc(100vw-6rem))]');
    expect(bar.className).not.toMatch(/\bp[rl]-/);
  });
});

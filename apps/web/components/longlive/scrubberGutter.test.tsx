// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { getEra } from '@swift2/experience';
import { EraFeedList } from '@swift2/ui/reader/era/EraFeedList';

import { renderWithReader } from '@/lib/longlive/render-with-reader';
import { TestHostProvider } from '@/lib/test-host';
import { SCRUBBER_GUTTER_CLASS } from './timelineScrubberLayout';

describe('scrubber gutter', () => {
  it('reserves the rail footprint as right padding on the feed list at phone and tablet widths', () => {
    expect(SCRUBBER_GUTTER_CLASS).toBe('pr-12 md:pr-14');
    const { container } = renderWithReader(
      <TestHostProvider>
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
        />
      </TestHostProvider>,
    );
    const list = container.firstElementChild as HTMLElement;
    for (const cls of SCRUBBER_GUTTER_CLASS.split(' ')) expect(list.classList.contains(cls)).toBe(true);
    expect(list.classList.contains('md:pr-8')).toBe(false);
  });
});

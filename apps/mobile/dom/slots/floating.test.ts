import { describe, expect, it } from 'vitest';
import { FeedbackButton } from '@swift2/ui/reader/legal/FeedbackButton';
import { buildReaderSlots } from './reader-slots';

describe('floating slot (FeedbackButton)', () => {

  it('registers the package FeedbackButton as `floating` and the mapper hands it to ReaderSlots.floating', async () => {
    const { slots } = await import('./index');
    expect(slots().floating).toBe(FeedbackButton);
    const s = buildReaderSlots(slots(), { overlays: [], fallback: (() => null) as never });
    expect(s.floating).toBe(FeedbackButton);
  });
});

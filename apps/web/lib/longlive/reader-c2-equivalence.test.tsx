// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { contentForThread, THREADS, threadPoints } from '@swift2/experience';
import { useReader } from '@swift2/ui';
import { describe, expect, it } from 'vitest';

import { CONTENT, getContentItem } from './content';
import { resolveRelatedMoments } from './related';
import { WebReaderSnapshotProvider } from './reader-snapshot-provider';

function renderReader() {
  return renderHook(() => useReader(), { wrapper: WebReaderSnapshotProvider }).result.current;
}

describe('WP2.2-C2: moment detail and threads read the same data through useReader()', () => {
  it('getContentItem matches the module lookup', () => {
    const q = renderReader();
    for (const c of CONTENT.slice(0, 50)) expect(q.getContentItem(c.id)).toEqual(getContentItem(c.id));
    expect(q.getContentItem('no-such-moment')).toBeUndefined();
  });

  it('related moments resolve identically against either lookup', () => {
    const q = renderReader();
    for (const c of CONTENT.filter((x) => x.relatedIds?.length).slice(0, 50)) {
      expect(resolveRelatedMoments(q.getContentItem, c.relatedIds, c.id)).toEqual(
        resolveRelatedMoments(getContentItem, c.relatedIds, c.id),
      );
    }
  });

  it('thread content and rail points match the module accessors, per thread', () => {
    const q = renderReader();
    for (const lens of THREADS) {
      expect(q.contentForThread(lens.id).map((c) => c.id)).toEqual(contentForThread(lens.id).map((c) => c.id));
      expect(q.threadPoints(lens.id)).toEqual(threadPoints(lens.id));
    }
  });
});

// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { eraVideoFeed } from '@swift2/content-enrichment';
import { ERAS } from '@swift2/experience';
import { useReader } from '@swift2/ui';
import { describe, expect, it } from 'vitest';

import { contentForEra, getContentItemByIdOrSlug, milestonesForEra } from './content';
import { WebReaderSnapshotProvider } from './reader-snapshot-provider';
import { eraVideoFeed as webEraVideoFeed, findVideoEraId, allVideoRecordsForEra } from './videos';

function renderReader() {
  return renderHook(() => useReader(), { wrapper: WebReaderSnapshotProvider }).result.current;
}

describe('WP2.2-C1: the migrated call sites read the same data through useReader()', () => {
  const embedded = new Set<string>();

  it('content, milestones and deep-link lookups match the module accessors', () => {
    const q = renderReader();
    for (const era of ERAS) {
      expect(q.contentForEra(era.id).map((c) => c.id)).toEqual(contentForEra(era.id).map((c) => c.id));
      expect(q.milestonesForEra(era.id)).toEqual(milestonesForEra(era.id));
      for (const c of contentForEra(era.id)) {
        expect(q.getContentItemByIdOrSlug(c.id)?.id).toBe(getContentItemByIdOrSlug(c.id)?.id);
        if (c.slug) {
          expect(q.getContentItemByIdOrSlug(c.slug)?.id).toBe(getContentItemByIdOrSlug(c.slug)?.id);
        }
      }
    }
    // Test unknown ids/slugs
    expect(q.getContentItemByIdOrSlug('unknown-id')).toBeUndefined();
    expect(q.getContentItemByIdOrSlug('unknown-slug')).toBeUndefined();
  });

  it('the era video feed built from the snapshot records matches the module feed', () => {
    const q = renderReader();
    for (const era of ERAS) {
      expect(eraVideoFeed(q.allVideoRecordsForEra(era.id), embedded)).toEqual(webEraVideoFeed(era.id, embedded));
    }
  });

  it('the store\'s inline video-slug resolver matches findVideoEraId', () => {
    const q = renderReader();
    const find = (slug: string) =>
      q.eras.find((e) => q.allVideoRecordsForEra(e.id).some((v) => v.slug === slug))?.id ?? null;
    for (const era of ERAS) {
      for (const v of allVideoRecordsForEra(era.id)) expect(find(v.slug)).toBe(findVideoEraId(v.slug));
    }
    expect(find('no-such-video-slug')).toBeNull();
  });
});

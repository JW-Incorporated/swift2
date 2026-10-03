// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { ERAS, getThread, resolveTrackKey, trackKey, type ShareTarget } from '@swift2/experience';
import { useReader } from '@swift2/ui';
import { describe, expect, it } from 'vitest';

import { CONTENT, getContentItem, getContentItemByIdOrSlug } from './content';
import { WebReaderSnapshotProvider } from './reader-snapshot-provider';
import { sharePayloadForTarget } from './share-payload';
import { canonicalShareCardPath, parseShareCardRequest } from './share-card-spec';
import { tracksForEra } from './tracks';

function renderReader() {
  return renderHook(() => useReader(), { wrapper: WebReaderSnapshotProvider }).result.current;
}

const baseUrl = 'https://www.longlivets.com/';
const moduleData = { getContentItem, resolveTrackKey, getContentItemByIdOrSlug };

function sampleTargets(): ShareTarget[] {
  const targets: ShareTarget[] = [
    { kind: 'item', itemId: 'no-such-item' },
    { kind: 'track', eraId: 'debut', trackKey: 'no-such::key' },
    { kind: 'threads' },
    { kind: 'mood' },
    { kind: 'community' },
    { kind: 'merch' },
    { kind: 'clownbot' },
  ] as ShareTarget[];
  for (const era of ERAS) {
    targets.push({ kind: 'era', eraId: era.id });
    targets.push({ kind: 'trackGuide', eraId: era.id });
    targets.push({ kind: 'theoryGuide', eraId: era.id });
    for (const item of CONTENT.filter((c) => c.eraId === era.id).slice(0, 3)) {
      targets.push({ kind: 'item', itemId: item.id });
    }
    for (const t of tracksForEra(era.id).slice(0, 2)) {
      targets.push({ kind: 'track', eraId: era.id, trackKey: trackKey(era.id, t) });
    }
  }
  targets.push({ kind: 'lens', lensId: getThread('fashion').id } as ShareTarget);
  return targets;
}

describe('WP2.2-C3: share payloads and card specs are identical on snapshot and module data', () => {
  it('sharePayloadForTarget: every sample target equals the module-data payload', () => {
    const q = renderReader();
    const targets = sampleTargets();
    expect(targets.length).toBeGreaterThan(40);
    for (const target of targets) {
      expect(sharePayloadForTarget(target, baseUrl, q), JSON.stringify(target)).toEqual(
        sharePayloadForTarget(target, baseUrl, moduleData),
      );
    }
  });

  it('parseShareCardRequest and the canonical card path: sample items, slugs, eras', () => {
    const q = renderReader();
    const items = ERAS.flatMap((e) => CONTENT.filter((c) => c.eraId === e.id).slice(0, 3));
    expect(items.length).toBeGreaterThan(20);
    const qs = [
      '',
      '?item=no-such-item',
      '?eras=debut,fearless&m=3&e=1&f=0',
      ...ERAS.map((e) => `?era=${e.id}&size=portrait`),
      ...items.flatMap((c) => [`?item=${c.id}`, `?item=${c.slug ?? c.id}&size=story`]),
    ];
    for (const s of qs) {
      const url = new URL(`https://www.longlivets.com/api/share-card${s}`);
      const next = parseShareCardRequest(url, q);
      expect(next, s).toEqual(parseShareCardRequest(url, moduleData));
      expect(canonicalShareCardPath(next), s).toBe(
        canonicalShareCardPath(parseShareCardRequest(url, moduleData)),
      );
    }
  });
});

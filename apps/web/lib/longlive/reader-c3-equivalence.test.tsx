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
    for (const item of CONTENT.filter((c) => c.eraId === era.id)) {
      targets.push({ kind: 'item', itemId: item.id });
    }
    for (const t of tracksForEra(era.id)) {
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

  it('parseShareCardRequest and the canonical card path: every item, slug, era, myEras combo', () => {
    const q = renderReader();
    const items = ERAS.flatMap((e) => CONTENT.filter((c) => c.eraId === e.id));
    expect(items.length).toBeGreaterThan(20);
    const ids = ERAS.map((e) => e.id);
    const erasCombos = [
      '',
      'nope',
      ids[0],
      ids.slice(0, 2).join(','),
      ids.join(','),
      `${ids[0]},nope,${ids[1]}`,
      encodeURIComponent(ids.slice(0, 3).join(',')),
    ];
    const perms = ['m=3&e=1&f=0', 'm=0&e=0&f=0', 'e=2&f=5&m=1', 'f=9', 'm=x&e=&f=-1', ''];
    const qs = [
      '',
      '?item=no-such-item',
      '?item=',
      ...erasCombos.flatMap((e) => perms.map((p) => `?eras=${e}&${p}`)),
      ...ERAS.map((e) => `?era=${e.id}&size=portrait`),
      ...items.flatMap((c) => [
        `?item=${encodeURIComponent(c.id)}`,
        `?item=${encodeURIComponent(c.slug ?? c.id)}&size=story`,
        `?item=${encodeURIComponent(c.id)}&eras=${ids.slice(0, 2).join(',')}&m=2&e=1&f=3`,
      ]),
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

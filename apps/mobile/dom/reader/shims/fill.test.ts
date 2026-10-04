import { describe, expect, it } from 'vitest';
import {
  contentItemInjected,
  eraSecretsRawInjected,
  songTargetOf,
  theoriesRawInjected,
  tracksForEra,
} from '@swift2/experience';
import type { ReaderSnapshot } from '@swift2/experience/reader-snapshot';
import { fillExtensions } from './fill-extensions';
import * as content from './content';
import * as eraSecrets from './era-secrets';
import { fill } from './fill';
import * as merch from './merch';
import * as theories from './theories';
import * as tracks from './tracks';
import * as videos from './videos';

const item = (id: string, eraId: string, date: string) =>
  ({ id, eraId, date, slug: `${id}-slug` }) as never;

function snapshot(): ReaderSnapshot {
  return {
    version: 1,
    state: 'ready',
    origin: { kind: 'bundle', bundleVersion: 'test' },
    domains: {
      eras: [{ id: 'fearless' }, { id: 'debut' }],
      content: {
        fearless: [item('a', 'fearless', '2009-01-01'), item('b', 'fearless', '2010-01-01')],
        debut: [item('c', 'debut', '2006-01-01')],
      },
      milestones: [{ id: 'm1', eraId: 'debut', date: '2006-10-24' }],
      videos: { debut: [{ slug: 'v1' }] },
      tracks: { debut: [{ title: 'Tim McGraw', slug: 'tim-mcgraw' }] },
      theories: { debut: [{ id: 't1' }] },
      eraSecrets: { debut: [{ id: 's1' }] },
      merch: { shopTheLook: [{ id: 'x' }], officialStore: [{ id: 'y' }], fanMade: [{ id: 'z' }] },
      songMoods: [{ slug: 'tim-mcgraw' }],
    },
  } as unknown as ReaderSnapshot;
}

describe('fill(snapshot)', () => {
  it('populates the live arrays and maps in place (same references)', () => {
    const refs = {
      content: content.CONTENT,
      milestones: content.MILESTONES,
      videos: videos.VIDEOS_RAW,
      tracks: tracks.TRACKS_RAW,
      theories: theories.THEORIES_RAW,
      secrets: eraSecrets.ERA_SECRETS_RAW,
      shop: merch.MERCH_CATALOGUE.shopTheLook,
      official: merch.MERCH_CATALOGUE.officialStore,
      fan: merch.MERCH_CATALOGUE.fanMade,
    };
    const s = snapshot();
    fill(s);
    fillExtensions(s.domains);
    expect(content.CONTENT).toBe(refs.content);
    expect(content.CONTENT.map((c) => c.id)).toEqual(['a', 'b', 'c']);
    expect(content.MILESTONES).toBe(refs.milestones);
    expect(content.MILESTONES).toHaveLength(1);
    expect(videos.VIDEOS_RAW).toBe(refs.videos);
    expect(Object.keys(videos.VIDEOS_RAW)).toEqual(['debut']);
    expect(tracks.TRACKS_RAW).toBe(refs.tracks);
    expect(theories.THEORIES_RAW).toBe(refs.theories);
    expect(eraSecrets.ERA_SECRETS_RAW).toBe(refs.secrets);
    expect(merch.MERCH_CATALOGUE.shopTheLook).toBe(refs.shop);
    expect(merch.MERCH_CATALOGUE.shopTheLook).toHaveLength(1);
    expect(merch.MERCH_CATALOGUE.officialStore).toBe(refs.official);
    expect(merch.MERCH_CATALOGUE.fanMade).toBe(refs.fan);
  });

  it('refills without keeping stale data', () => {
    fill(snapshot());
    const next = snapshot();
    next.domains.content = { fearless: [item('z', 'fearless', '2011-01-01')] };
    next.domains.eras = [{ id: 'fearless' }] as ReaderSnapshot['domains']['eras'];
    next.domains.tracks = {};
    fill(next);
    expect(content.CONTENT.map((c) => c.id)).toEqual(['z']);
    expect(tracks.TRACKS_RAW).toEqual({});
  });

  it('serves the shim lookups', () => {
    fill(snapshot());
    expect(content.getContentItem('a')?.id).toBe('a');
    expect(content.getContentItemByIdOrSlug('b-slug')?.id).toBe('b');
    expect(content.contentForEra('fearless' as never).map((c) => c.id)).toEqual(['b', 'a']);
    expect(videos.allVideoRecordsForEra('debut' as never)).toHaveLength(1);
  });

  it('installs every experience-core provider', () => {
    fill(snapshot());
    expect(contentItemInjected('c')?.id).toBe('c');
    expect(eraSecretsRawInjected()).toBe(eraSecrets.ERA_SECRETS_RAW);
    expect(theoriesRawInjected()).toBe(theories.THEORIES_RAW);
    expect(tracksForEra('debut' as never).map((t) => t.title)).toEqual(['Tim McGraw']);
    expect(songTargetOf('song:tim-mcgraw')?.track.title).toBe('Tim McGraw');
  });
});

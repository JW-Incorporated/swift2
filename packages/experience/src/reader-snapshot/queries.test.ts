// Zero-behavior-change proof for the reader's snapshot accessors: every one
// deep-equals the web module function it replaces, over every era / id / thread.
// The web modules are imported by path (they live in apps/web, outside this
// package's typecheck graph), the same way equivalence.test.ts does.
import { beforeAll, describe, expect, it } from 'vitest';
import {
  allVideoRecords,
  eraVideoFeed,
  musicVideosForEra,
  videosForEra,
} from '@swift2/content-enrichment';
import { ERAS } from '../eras';
import { THREADS } from '../lenses';
import { contentForThread } from '../threads-injected';
import { threadPoints } from '../lenses-injected';
import { eggDoorwaysForEra, threadDoorwaysForEra } from '../doorways-injected';
import type { ContentItem, EraId } from '../types';
import { fromBakedCore, type BakedCoreModules } from './sources';
import { createReaderQueries, type ReaderQueries } from './queries';
import type { ReaderSnapshotCore } from './types';

const web = '../../../../apps/web/lib/longlive/';
const deps = { videosForEra, musicVideosForEra, allVideoRecords };

type Web = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
let content: Web;
let tracks: Web;
let theories: Web;
let videos: Web;
let secrets: Web;
let q: ReaderQueries;

beforeAll(async () => {
  const [c, t, th, v, s, bm] = await Promise.all([
    import(/* @vite-ignore */ `${web}content`),
    import(/* @vite-ignore */ `${web}tracks`),
    import(/* @vite-ignore */ `${web}theories`),
    import(/* @vite-ignore */ `${web}videos`),
    import(/* @vite-ignore */ `${web}era-secrets`),
    import(/* @vite-ignore */ `${web}baked-modules`),
  ]);
  [content, tracks, theories, videos, secrets] = [c, t, th, v, s];
  const mods = (bm as { bakedModules(): BakedCoreModules }).bakedModules();
  q = createReaderQueries(fromBakedCore(mods, { eraVideoFeed }), deps);
}, 120_000);

describe('createReaderQueries equals the web modules', () => {
  it('is not vacuous', () => {
    expect(content.CONTENT.length).toBeGreaterThan(0);
    expect(ERAS.some((e) => q.contentForEra(e.id).length > 0)).toBe(true);
    expect(ERAS.some((e) => q.allVideoRecordsForEra(e.id).length > 0)).toBe(true);
  });

  it('per-era accessors', () => {
    for (const { id } of ERAS) {
      expect(q.contentForEra(id), `contentForEra ${id}`).toEqual(content.contentForEra(id));
      expect(q.milestonesForEra(id), `milestonesForEra ${id}`).toEqual(content.milestonesForEra(id));
      expect(q.tracksForEra(id), `tracksForEra ${id}`).toEqual(tracks.tracksForEra(id));
      expect(q.theoriesForEra(id), `theoriesForEra ${id}`).toEqual(theories.theoriesForEra(id));
      expect(q.eraSecretsForEra(id), `eraSecretsForEra ${id}`).toEqual(secrets.eraSecretsForEra(id));
    }
  });

  it('video accessors read domains.videos (all records)', () => {
    for (const { id } of ERAS) {
      expect(q.videosForEra(id), `videosForEra ${id}`).toEqual(videos.videosForEra(id));
      expect(q.allVideoRecordsForEra(id), `allVideoRecordsForEra ${id}`).toEqual(
        videos.allVideoRecordsForEra(id),
      );
      expect(q.musicVideosForEra(id), `musicVideosForEra ${id}`).toEqual(videos.musicVideosForEra(id));
    }
  });

  it('id and slug lookups, for every item', () => {
    for (const item of content.CONTENT) {
      expect(q.getContentItem(item.id)).toEqual(content.getContentItem(item.id));
      expect(q.getContentItemByIdOrSlug(item.id)).toEqual(content.getContentItemByIdOrSlug(item.id));
      if (item.slug) {
        expect(q.getContentItemByIdOrSlug(item.slug)).toEqual(content.getContentItemByIdOrSlug(item.slug));
      }
    }
    expect(q.getContentItem('no-such-id')).toBeUndefined();
    expect(q.getContentItemByIdOrSlug('no-such-id')).toBeUndefined();
  });

  it('milestones are the domain (flat order), never re-derived', () => {
    expect(q.milestones).toEqual(content.MILESTONES);
  });

  it('threads and doorways', () => {
    for (const t of THREADS) {
      expect(q.contentForThread(t.id), `contentForThread ${t.id}`).toEqual(contentForThread(t.id));
      expect(q.threadPoints(t.id), `threadPoints ${t.id}`).toEqual(threadPoints(t.id));
    }
    for (const e of ERAS) {
      expect(q.threadDoorwaysForEra(e.id, e.start, e.end)).toEqual(threadDoorwaysForEra(e.id, e.start, e.end));
      expect(q.eggDoorwaysForEra(e.id, e.start, e.end)).toEqual(eggDoorwaysForEra(e.id, e.start, e.end));
    }
  });

  it('searchIndex is the snapshot domain; the core queries carry no merch', () => {
    expect(q.searchIndex.length).toBeGreaterThan(0);
    expect('merch' in q).toBe(false);
  });
});

describe('createReaderQueries ordering and lookup edge cases', () => {
  const item = (id: string, date: string, slug?: string) =>
    ({ id, eraId: 'debut', date, slug }) as unknown as ContentItem;
  const synthetic = (content: ContentItem[]) =>
    createReaderQueries(
      {
        version: 1,
        state: 'ready',
        origin: { kind: 'baked' },
        domains: {
          eras: [{ id: 'debut' }],
          content: { debut: content },
          milestones: [],
          videos: {},
          tracks: {},
          theories: {},
          eraSecrets: {},
          searchIndex: [],
        },
      } as unknown as ReaderSnapshotCore,
      deps,
    );

  it('contentForEra sorts newest first and keeps domain order on equal dates', () => {
    const r = synthetic([
      item('a', '2020-01-01'),
      item('b', '2021-05-05'),
      item('c', '2020-01-01'),
      item('d', '2021-05-05'),
      item('e', '2019-01-01'),
    ]);
    expect(r.contentForEra('debut' as EraId).map((i) => i.id)).toEqual(['b', 'd', 'a', 'c', 'e']);
  });

  it('contentForEra does not mutate the domain array', () => {
    const r = synthetic([item('a', '2020-01-01'), item('b', '2021-01-01')]);
    r.contentForEra('debut' as EraId);
    expect(r.getContentItem('a')?.id).toBe('a');
  });

  it('getContentItemByIdOrSlug: an id beats another item\'s slug; the first of duplicate slugs wins', () => {
    const r = synthetic([
      item('one', '2020-01-01', 'shared'),
      item('shared', '2020-02-01', 'other'),
      item('two', '2020-03-01', 'shared'),
    ]);
    expect(r.getContentItemByIdOrSlug('shared')?.id).toBe('shared');
    expect(r.getContentItemByIdOrSlug('other')?.id).toBe('shared');
    expect(r.getContentItemByIdOrSlug('one')?.id).toBe('one');
    expect(r.getContentItemByIdOrSlug('missing')).toBeUndefined();
  });

  it('getContentItemByIdOrSlug: slug-only collision returns the first item', () => {
    const r = synthetic([item('x1', '2020-01-01', 'dup'), item('x2', '2020-02-01', 'dup')]);
    expect(r.getContentItemByIdOrSlug('dup')?.id).toBe('x1');
  });
});

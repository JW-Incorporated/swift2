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
import { CROSSING_THREADS, THREADS } from '../lenses';
import { contentForThread } from '../threads-injected';
import { threadCrossings, threadPoints, threadsInEra } from '../lenses-injected';
import { trackKey } from '../track-guide';
import { adjacentTrackOnAlbum, keepExploring, resolveTrackKey } from '../track-guide-injected';
import { resolveRelatedTheory } from '../theories-injected';
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
let threads: Web;
let secrets: Web;
let q: ReaderQueries;

beforeAll(async () => {
  const [c, t, th, v, s, bm, thr] = await Promise.all([
    import(/* @vite-ignore */ `${web}content`),
    import(/* @vite-ignore */ `${web}tracks`),
    import(/* @vite-ignore */ `${web}theories`),
    import(/* @vite-ignore */ `${web}videos`),
    import(/* @vite-ignore */ `${web}era-secrets`),
    import(/* @vite-ignore */ `${web}baked-modules`),
    import(/* @vite-ignore */ `${web}threads`),
  ]);
  [content, tracks, theories, videos, secrets, threads] = [c, t, th, v, s, thr];
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

  it('threadsInEra and threadCrossings, over every era and every thread pair', () => {
    for (const e of ERAS) {
      expect(q.threadsInEra(e.id), `threadsInEra ${e.id}`).toEqual(threadsInEra(e.id));
    }
    expect(ERAS.some((e) => q.threadsInEra(e.id).length > 0)).toBe(true);
    let crossed = 0;
    for (const a of CROSSING_THREADS) {
      for (const b of CROSSING_THREADS) {
        const got = q.threadCrossings(a, b);
        expect(got, `threadCrossings ${a}/${b}`).toEqual(threadCrossings(a, b));
        expect(q.threadCrossings(a, b, 30), `threadCrossings ${a}/${b} 30d`).toEqual(
          threadCrossings(a, b, 30),
        );
        crossed += got.length;
      }
    }
    expect(crossed).toBeGreaterThan(0);
  });

  it('track and theory lookups, over every era', () => {
    let tracked = 0;
    let related = 0;
    for (const { id } of ERAS) {
      for (const t of tracks.tracksForEra(id)) {
        const key = trackKey(id, t);
        expect(q.resolveTrackKey(key), `resolveTrackKey ${key}`).toEqual(resolveTrackKey(key));
        expect(q.keepExploring(id, t), `keepExploring ${key}`).toEqual(keepExploring(id, t));
        for (const dir of ['previous', 'next'] as const) {
          expect(q.adjacentTrackOnAlbum(id, t, dir), `adjacent ${dir} ${key}`).toEqual(
            adjacentTrackOnAlbum(id, t, dir),
          );
        }
        tracked += 1;
      }
      for (const th of theories.theoriesForEra(id)) {
        for (const ref of th.relatedSlugs ?? []) {
          expect(q.resolveRelatedTheory(ref), `resolveRelatedTheory ${ref}`).toEqual(resolveRelatedTheory(ref));
          related += 1;
        }
      }
    }
    expect(tracked).toBeGreaterThan(0);
    expect(related).toBeGreaterThan(0);
    for (const bad of ['', 'nope', 'debut::missing', 'zzz::x']) {
      expect(q.resolveTrackKey(bad)).toEqual(resolveTrackKey(bad));
    }
    expect(q.resolveRelatedTheory('no-colon')).toBeNull();
  });

  it('thread range/era, song target and era-secret link queries (WP2.2-C2)', () => {
    let nonEmpty = 0;
    for (const t of THREADS) {
      for (const e of ERAS) {
        const inEra = q.contentForThreadInEra(t.id, e.id);
        nonEmpty += inEra.length;
        expect(inEra, `InEra ${t.id} ${e.id}`).toEqual(threads.contentForThreadInEra(t.id, e.id));
        for (const end of [e.end, null]) {
          expect(q.contentForThreadInRange(t.id, e.start, end), `InRange ${t.id} ${e.id} ${end}`).toEqual(
            threads.contentForThreadInRange(t.id, e.start, end),
          );
        }
      }
    }
    expect(nonEmpty).toBeGreaterThan(0);
    let songs = 0;
    for (const { id } of ERAS) {
      for (const track of tracks.tracksForEra(id)) {
        songs += 1;
        expect(q.songTargetOf(`song:${track.slug}`)).toEqual(tracks.songTargetOf(`song:${track.slug}`));
      }
      for (const s of secrets.eraSecretsForEra(id)) {
        expect(q.resolveEraSecretLink(s.deeperLink), `link ${s.deeperLink}`).toEqual(
          secrets.resolveEraSecretLink(s.deeperLink),
        );
      }
    }
    expect(songs).toBeGreaterThan(0);
    for (const bad of ['', 'song:', 'song:no-such-slug', 'moment:no-such-id', 'egg:x', 'x']) {
      expect(q.songTargetOf(bad)).toEqual(tracks.songTargetOf(bad));
      expect(q.resolveEraSecretLink(bad)).toEqual(secrets.resolveEraSecretLink(bad));
    }
    expect(q.resolveEraSecretLink(undefined)).toEqual(secrets.resolveEraSecretLink(undefined));
    for (const item of content.CONTENT) {
      const link = `moment:${item.id}`;
      expect(q.resolveEraSecretLink(link)).toEqual(secrets.resolveEraSecretLink(link));
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

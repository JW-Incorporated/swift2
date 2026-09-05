/**
 * `vault-bundle-map.ts` unit tests (OS-015). Imports the real OS-010 fixture
 * bundle files directly (`packages/content/src/fixtures/bundle/**`, the same
 * fixture `packages/content`'s own tests validate against) via
 * `resolveJsonModule`, so this exercises the mapper against genuine,
 * schema-valid content instead of a hand-rolled shape that could silently
 * drift from the real schemas. (Reads the files via ESM JSON imports rather
 * than `node:fs` — `apps/mobile`'s Expo tsconfig has no Node type-lib, unlike
 * the root workspace's `packages/content` test which is Node-only.)
 */
import { describe, expect, it } from 'vitest';
import { manifestSchema, contentBundleSchemas, type BundleFiles } from '@swift2/content';
import erasJson from '../../../packages/content/src/fixtures/bundle/eras.json';
import milestonesJson from '../../../packages/content/src/fixtures/bundle/milestones.json';
import folkloreJson from '../../../packages/content/src/fixtures/bundle/eras/folklore.json';
import tracksJson from '../../../packages/content/src/fixtures/bundle/tracks.json';
import manifestJson from '../../../packages/content/src/fixtures/bundle/manifest.json';
import {
  findMoment,
  findTrackGuide,
  mapBundleToSkeleton,
  mapContentItemToMoment,
  mapContentItemToMonthItem,
  mapContentTrackNote,
  mapEra,
  mapErasToVaultEras,
  mapMilestone,
} from './vault-bundle-map';

manifestSchema.parse(manifestJson); // sanity: fixture manifest itself is still valid (packages/content owns full coverage)

const files: BundleFiles = {
  eras: contentBundleSchemas.eras.parse(erasJson),
  milestones: contentBundleSchemas.milestones.parse(milestonesJson),
  'content:folklore': contentBundleSchemas.content.parse(folkloreJson),
  tracks: contentBundleSchemas.tracks.parse(tracksJson),
};

// Re-parsed (not just cast) so each fixture's loosely-typed JSON literal
// import widens to the schema's inferred type — same values `files` above
// already holds, just typed the way the real loader's validated output
// would be, instead of the raw `string[]`/`number` shapes `resolveJsonModule`
// infers from the on-disk JSON.
const contentEras = contentBundleSchemas.eras.parse(erasJson);
const contentMilestones = contentBundleSchemas.milestones.parse(milestonesJson);
const folkloreContentFile = contentBundleSchemas.content.parse(folkloreJson);

describe('mapEra / mapErasToVaultEras', () => {
  it('maps id/name/album/start/end to slug/title/album/startDate/endDate', () => {
    const era = mapEra(contentEras[0]!, 0);
    expect(era.slug).toBe('folklore');
    expect(era.title).toBe('folklore');
    expect(era.album).toBe('folklore');
    expect(era.startDate).toBe('2020-07-24');
    expect(era.endDate).toBe('2020-12-10');
    expect(era.order).toBe(0);
    expect(era.coverImageUrl).toBe('/eras/folklore.png');
  });

  it('derives heroGradient from the two accent colors and eyebrow from the tagline', () => {
    const era = mapEra(contentEras[0]!, 0);
    expect(era.theme.heroGradient).toBe('linear-gradient(135deg, #8a8a6d, #5f5f4a)');
    expect(era.theme.eyebrow).toBe('Wistful, literary, surprise-released.');
    expect(era.theme.bg).toBe('#1a1a1a');
  });

  it('assigns order by ascending start date across all eras', () => {
    const twoEras = [
      { ...contentEras[0]!, id: 'debut' as const, start: '2006-10-24', end: '2008-12-31' },
      contentEras[0]!,
    ];
    const mapped = mapErasToVaultEras(twoEras);
    expect(mapped.map((e) => e.slug)).toEqual(['debut', 'folklore']);
    expect(mapped[0]!.order).toBe(0);
    expect(mapped[1]!.order).toBe(1);
  });
});

describe('mapMilestone', () => {
  it('maps id/eraId/label/date to id/eraSlug/title/date and collapses kind to album_release/tour', () => {
    const m = mapMilestone(contentMilestones[0]!);
    expect(m).toEqual({
      id: 'ms-folklore-release',
      eraSlug: 'folklore',
      type: 'album_release',
      title: 'folklore released',
      date: '2020-07-24',
    });
  });

  it('maps a "tour" kind milestone to the tour type', () => {
    const m = mapMilestone({
      id: 'ms-x',
      eraId: 'reputation',
      date: '2018-05-08',
      label: 'Tour kicks off',
      kind: 'tour',
    });
    expect(m.type).toBe('tour');
  });

  it('collapses every non-tour kind (life, business, award, fandom) to album_release', () => {
    for (const kind of ['life', 'business', 'award', 'fandom'] as const) {
      const m = mapMilestone({ id: 'ms-x', eraId: 'folklore', date: '2020-01-01', label: 'x', kind });
      expect(m.type).toBe('album_release');
    }
  });
});

describe('mapContentItemToMonthItem', () => {
  const item = folkloreContentFile.items[0]!;

  it('maps date -> year/month, title/summary -> title/snippet, first source/image -> sourceUrl/thumbnailUrl', () => {
    const mi = mapContentItemToMonthItem(item);
    expect(mi.id).toBe('vault-folklore-001');
    expect(mi.eraSlug).toBe('folklore');
    expect(mi.year).toBe(2020);
    expect(mi.month).toBe(7);
    expect(mi.title).toBe('folklore released with no announcement');
    expect(mi.snippet).toBe(item.summary);
    expect(mi.sourceUrl).toBe('https://example.com/folklore-surprise');
    expect(mi.thumbnailUrl).toBe('/eras/folklore.png');
  });

  it('categorizes an item with milestone.kind "album" as release, overriding its tags', () => {
    const mi = mapContentItemToMonthItem(item);
    expect(mi.category).toBe('release');
  });

  it('falls back to the tag-derived category when there is no album milestone', () => {
    const { milestone: _milestone, ...rest } = item;
    const mi = mapContentItemToMonthItem(rest as typeof item);
    expect(mi.category).toBe('music'); // tags: ["Music"]
  });

  it('falls back to "sighting" when an item has neither an album milestone nor a mappable tag', () => {
    const { milestone: _m, ...rest } = item;
    const mi = mapContentItemToMonthItem({ ...rest, tags: [] } as typeof item);
    expect(mi.category).toBe('sighting');
  });

  it('is null-safe when an item has no sources', () => {
    const { sources: _s, ...rest } = item;
    const mi = mapContentItemToMonthItem(rest as typeof item);
    expect(mi.sourceUrl).toBeNull();
  });
});

describe('mapContentItemToMoment', () => {
  it('joins body paragraphs and maps sources/images to MomentSource/MomentPhoto', () => {
    const item = folkloreContentFile.items[0]!;
    const moment = mapContentItemToMoment(item);
    expect(moment.monthItemId).toBe('vault-folklore-001');
    expect(moment.context).toContain('Taylor Swift announced folklore');
    expect(moment.sources).toEqual([{ outlet: 'Rolling Stone', url: 'https://example.com/folklore-surprise' }]);
    expect(moment.photos).toEqual([{ url: '/eras/folklore.png', credit: null }]);
  });
});

describe('mapContentTrackNote', () => {
  it('maps slug/title/note/sources plus passthrough facts fields', () => {
    const trackFile = contentBundleSchemas.tracks.parse(tracksJson);
    const note = mapContentTrackNote('folklore', trackFile.tracks[0]!);
    expect(note.id).toBe('the-1');
    expect(note.eraSlug).toBe('folklore');
    expect(note.trackTitle).toBe('the 1');
    expect(note.trackNumber).toBe(1);
    expect(note.sourceUrl).toBe('https://example.com/the-1-review');
    expect(note.writers).toEqual(['Taylor Swift', 'Aaron Dessner']);
    expect(note.producers).toEqual(['Aaron Dessner']);
    expect(note.release).toBe('folklore');
    expect(note.isSingle).toBe(false);
  });
});

describe('mapBundleToSkeleton', () => {
  it('assembles eras, milestones, and every content:<eraId> file into one VaultSkeleton', () => {
    const skeleton = mapBundleToSkeleton(files);
    expect(skeleton.eras).toHaveLength(1);
    expect(skeleton.eras[0]!.slug).toBe('folklore');
    expect(skeleton.milestones).toHaveLength(1);
    expect(skeleton.monthItems).toHaveLength(1);
    expect(skeleton.monthItems[0]!.id).toBe('vault-folklore-001');
  });

  it('throws loudly when the bundle is missing eras or milestones', () => {
    const { eras: _e, ...withoutEras } = files;
    expect(() => mapBundleToSkeleton(withoutEras)).toThrow(/missing its "eras" file/);
    const { milestones: _m, ...withoutMilestones } = files;
    expect(() => mapBundleToSkeleton(withoutMilestones)).toThrow(/missing its "milestones" file/);
  });
});

describe('findMoment', () => {
  it('finds a moment by MonthItem id across content:<eraId> files', () => {
    const moment = findMoment(files, 'vault-folklore-001');
    expect(moment).not.toBeNull();
    expect(moment!.monthItemId).toBe('vault-folklore-001');
  });

  it('returns null when no item has that id', () => {
    expect(findMoment(files, 'nonexistent-id')).toBeNull();
  });
});

describe('findTrackGuide', () => {
  it('returns the flat tracks entry filtered to the requested era', () => {
    const notes = findTrackGuide(files, 'folklore');
    expect(notes).toHaveLength(1);
    expect(notes[0]!.trackTitle).toBe('the 1');
  });

  it('returns an empty array for an era with no track guide', () => {
    expect(findTrackGuide(files, 'reputation')).toEqual([]);
  });

  it('prefers a per-era tracks:<eraSlug> entry over the flat tracks entry when both exist', () => {
    const perEra = { eraId: 'folklore', tracks: [{ slug: 'exile', trackNumber: 2, title: 'exile', note: 'x' }] };
    const withPerEra = { ...files, 'tracks:folklore': perEra };
    const notes = findTrackGuide(withPerEra, 'folklore');
    expect(notes).toHaveLength(1);
    expect(notes[0]!.trackTitle).toBe('exile');
  });
});

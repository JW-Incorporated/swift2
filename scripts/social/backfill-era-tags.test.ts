import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { backfillEraTags } from './backfill-era-tags.mjs';
import { ERA_TAG_SLUGS, eraTagOf, guessEraTag, missingEraTag, withEraTag } from './lib/era-tags.mjs';
import { buildCandidate } from './source-reddit-photos.mjs';

const ROOT = path.resolve(__dirname, '..', '..');

const entry = (over: Record<string, unknown> = {}) => ({
  id: 'p1',
  mediaPath: '/social/library/photos/p1.jpg',
  credit: 'u/someone via r/TaylorSwiftPictures',
  source: 'https://www.reddit.com/r/TaylorSwiftPictures/comments/p1/x/',
  alt: 'Fan photo from the Eras Tour, shared on r/TaylorSwiftPictures: The Life of a Showgirl🧡',
  tags: ['fan-photo', 'eras-tour'],
  ...over,
});

describe('era-tags: Showgirl-era inference (issue #6644)', () => {
  it('reads the-life-of-a-showgirl off every way a Showgirl post names itself', () => {
    expect(guessEraTag('The Life of a Showgirl🧡')).toBe('the-life-of-a-showgirl');
    expect(guessEraTag('Beautiful Showgirl')).toBe('the-life-of-a-showgirl');
    expect(guessEraTag('Showgirl [3840x2160]')).toBe('the-life-of-a-showgirl');
    expect(guessEraTag('the life of a showgirl album variant photo! (Shiny bug)')).toBe('the-life-of-a-showgirl');
    expect(guessEraTag('TLOAS vinyl shot')).toBe('the-life-of-a-showgirl');
  });

  it('uses the seed-data slug, not the site era id "tloas"', () => {
    expect(ERA_TAG_SLUGS).toContain('the-life-of-a-showgirl');
    expect(ERA_TAG_SLUGS).not.toContain('tloas');
  });

  it('tags a newly sourced Showgirl post era-FIRST, so photo-coverage.mjs counts it', () => {
    const candidate = buildCandidate('TaylorSwiftPictures', {
      id: 'zz1',
      title: 'The Life of a Showgirl album variant',
      permalink: 'https://www.reddit.com/r/TaylorSwiftPictures/comments/zz1/x/',
      url: 'https://preview.redd.it/zz1.jpg',
      author: 'someRedditor',
    });
    // photo-coverage.mjs tallies `tags[0]` as the era — appended-last was the bug.
    expect(candidate.tags[0]).toBe('the-life-of-a-showgirl');
    expect(candidate.tags).toContain('fan-photo');
  });
});

describe('backfillEraTags', () => {
  it('adds the inferred era tag first and leaves the original tags behind it', () => {
    const { photos, changes } = backfillEraTags([entry()]);
    expect(photos[0].tags).toEqual(['the-life-of-a-showgirl', 'fan-photo', 'eras-tour']);
    expect(changes).toEqual([{ id: 'p1', era: 'the-life-of-a-showgirl' }]);
  });

  it('never re-classifies an entry that already carries an era tag', () => {
    // Real case from the library: site photos tagged `1989` whose alt text
    // describes the reputation Stadium Tour. Text inference would overwrite a
    // correct era with a wrong one, which is worse than no era tag at all.
    const already = entry({
      id: 'site-1989-x',
      tags: ['1989', 'site-photo'],
      alt: 'At the reputation piano in Seattle, May 22, 2018',
    });
    const { photos, changes } = backfillEraTags([already]);
    expect(photos[0].tags).toEqual(['1989', 'site-photo']);
    expect(changes).toEqual([]);
    expect(eraTagOf(already)).toBe('1989');
    expect(missingEraTag(already)).toBeNull();
    expect(withEraTag(already)).toBeNull();
  });

  it('leaves an entry whose alt names no era untouched, rather than guessing', () => {
    const vague = entry({ alt: 'Fan photo from the Eras Tour, shared on r/erastour: my favorite shot' });
    const { photos, changes } = backfillEraTags([vague]);
    expect(photos[0].tags).toEqual(['fan-photo', 'eras-tour']);
    expect(changes).toEqual([]);
  });

  it('never fires on the "Eras Tour" boilerplate every reddit alt carries', () => {
    expect(guessEraTag('Fan photo from the Eras Tour, shared on r/erastour: ')).toBeNull();
  });

  it('is pure — it returns new entries instead of mutating the input', () => {
    const input = entry();
    const before = [...input.tags];
    backfillEraTags([input]);
    expect(input.tags).toEqual(before);
  });

  it('is idempotent: a second pass over its own output changes nothing', () => {
    const first = backfillEraTags([entry()]);
    const second = backfillEraTags(first.photos);
    expect(second.changes).toEqual([]);
    expect(second.photos[0].tags).toEqual(first.photos[0].tags);
  });

  it('tags an IG-sized variant as well as its original, so a themed pair can ship', () => {
    const { photos } = backfillEraTags([
      entry({ id: 'p1' }),
      entry({ id: 'p1-ig45', mediaPath: '/social/library/photos/p1-ig45.jpg', variantOf: 'p1', width: 1080, height: 1350 }),
    ]);
    for (const photo of photos) expect(photo.tags).toContain('the-life-of-a-showgirl');
  });
});

describe('social/photo-library.json', () => {
  it('has at least one IG-sized Showgirl-era photo, and needs no further backfill', async () => {
    const inventory = JSON.parse(await readFile(path.join(ROOT, 'social', 'photo-library.json'), 'utf8'));
    const showgirl = inventory.photos.filter((p: { tags?: string[] }) => p.tags?.includes('the-life-of-a-showgirl'));
    expect(showgirl.length).toBeGreaterThan(0);
    // Instagram rejects anything outside 0.8-1.91 (lib/photo-dimensions.mjs),
    // so a Showgirl pair needs at least one entry inside that window.
    const igSized = showgirl.filter((p: { width?: number; height?: number }) => {
      const ratio = (p.width ?? 0) / (p.height ?? 1);
      return ratio >= 0.8 && ratio <= 1.91;
    });
    expect(igSized.length).toBeGreaterThan(0);
    // The backfill has been applied: re-running it over main is a no-op, so a
    // future era added to the keyword list is the only thing that can reopen this.
    expect(backfillEraTags(inventory.photos).changes).toEqual([]);
  });
});

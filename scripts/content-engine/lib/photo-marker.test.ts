import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no types
import {
  isPhotoDone,
  parseMarkerBody,
  recoverKeysFromComments,
  serializeMarker,
  reviewedSparseKeys,
  buildQueue,
} from './photo-marker.mjs';

// A moment whose key contains commas — the exact shape the legacy comma marker
// could not represent.
const COMMA_KEY = 'midnights|2024|2|A record fourth Album of the Year Grammy, for Midnights';

const moment = (over: Record<string, unknown> = {}) => ({
  type: 'moment',
  era: 'midnights',
  key: COMMA_KEY,
  title: 'A record fourth Album of the Year Grammy, for Midnights',
  ...over,
});

const withPhotos = (photos: Array<Record<string, unknown>>) =>
  moment({ raw: { moment: { photos } } });

describe('isPhotoDone', () => {
  it('is done with >=2 photos each having a focalPoint', () => {
    expect(isPhotoDone(withPhotos([{ url: 'a', focalPoint: '50% 50%' }, { url: 'b', focalPoint: '48% 20%' }]))).toBe(true);
  });
  it('is not done with only one photo (editorial-max case)', () => {
    expect(isPhotoDone(withPhotos([{ url: 'a', focalPoint: '50% 50%' }]))).toBe(false);
  });
  it('is not done when any photo lacks a focalPoint', () => {
    expect(isPhotoDone(withPhotos([{ url: 'a', focalPoint: '50% 50%' }, { url: 'b' }]))).toBe(false);
  });
  it('is not done with a blank focalPoint', () => {
    expect(isPhotoDone(withPhotos([{ url: 'a', focalPoint: '50% 50%' }, { url: 'b', focalPoint: '  ' }]))).toBe(false);
  });
  it('is not done with no photos', () => {
    expect(isPhotoDone(withPhotos([]))).toBe(false);
  });
});

describe('marker serialize/parse round-trips a comma-containing key', () => {
  it('survives a key with commas (the whole point)', () => {
    const marker = serializeMarker([COMMA_KEY, 'plain-slug']);
    const body = marker.replace(/^<!--\s*photo-done:\s*/, '').replace(/\s*-->$/, '');
    expect(parseMarkerBody(body)).toEqual(['midnights|2024|2|A record fourth Album of the Year Grammy, for Midnights', 'plain-slug'].sort());
  });
  it('serializes sorted + deduped', () => {
    expect(serializeMarker(['b', 'a', 'b'])).toBe('<!-- photo-done: ["a","b"] -->');
  });
});

describe('legacy recovery', () => {
  it('recovers whole comma-keys from a legacy comma marker by substring match', () => {
    const legacy = `<!-- photo-done: plain-slug,${COMMA_KEY},other-slug -->`;
    const recovered = recoverKeysFromComments(legacy, [COMMA_KEY, 'plain-slug', 'other-slug', 'never-recorded']);
    expect(recovered.sort()).toEqual([COMMA_KEY, 'other-slug', 'plain-slug'].sort());
    expect(recovered).not.toContain('never-recorded');
  });
  it('drops a shredded fragment that is not a real key', () => {
    // Degraded marker: the ", for Midnights" tail was re-joined without its
    // space (or reordered away), so the whole key never appears contiguously —
    // exactly the corruption we are migrating away from. It must NOT recover.
    const degraded = '<!-- photo-done: midnights|2024|2|A record fourth Album of the Year Grammy,for Midnights -->';
    expect(recoverKeysFromComments(degraded, [COMMA_KEY])).not.toContain(COMMA_KEY);
  });
  it('reads the new JSON format too', () => {
    const jsonMarker = serializeMarker([COMMA_KEY]);
    expect(recoverKeysFromComments(jsonMarker)).toEqual([COMMA_KEY]);
  });
  it('does not over-recover a key that is a substring of a longer recorded key', () => {
    // Only the longer key was recorded; the shorter substring key must NOT be
    // recovered from the longer one's text.
    const legacy = '<!-- photo-done: 1989-bad-blood-video-vevo-record -->';
    const recovered = recoverKeysFromComments(legacy, ['1989-bad-blood', '1989-bad-blood-video-vevo-record']);
    expect(recovered).toEqual(['1989-bad-blood-video-vevo-record']);
    expect(recovered).not.toContain('1989-bad-blood');
  });
  it('recovers both when both substring and superstring were recorded', () => {
    const legacy = '<!-- photo-done: 1989-bad-blood,1989-bad-blood-video-vevo-record -->';
    const recovered = recoverKeysFromComments(legacy, ['1989-bad-blood', '1989-bad-blood-video-vevo-record']);
    expect(recovered.sort()).toEqual(['1989-bad-blood', '1989-bad-blood-video-vevo-record'].sort());
  });
});

describe('reviewedSparseKeys keeps only not-yet-done sparse pages', () => {
  const items = [
    withPhotos([{ url: 'a', focalPoint: '1' }, { url: 'b', focalPoint: '2' }]), // objectively done
    moment({ key: 'sparse-one', raw: { moment: { photos: [{ url: 'a', focalPoint: '1' }] } } }), // 1 photo
    moment({ key: 'sparse-zero', raw: { moment: { photos: [] } } }), // 0 photos
  ];
  it('drops objectively-done keys, keeps sparse reviewed keys, drops unknown keys', () => {
    const kept = reviewedSparseKeys(items, [COMMA_KEY, 'sparse-one', 'sparse-zero', 'ghost-key']);
    expect(kept.sort()).toEqual(['sparse-one', 'sparse-zero'].sort());
  });
});

describe('buildQueue', () => {
  const items = [
    withPhotos([{ url: 'a', focalPoint: '1' }, { url: 'b', focalPoint: '2' }]), // done → excluded
    moment({ key: 'needs-work-hi', title: 'x', raw: { moment: { photos: [{ url: 'a', focalPoint: '1' }] } } }),
    moment({ key: 'needs-work-lo', title: 'y', raw: { moment: { photos: [] } } }),
    moment({ key: 'reviewed', title: 'z', raw: { moment: { photos: [] } } }), // recorded → excluded
  ];
  const score = (it: { key: string }) => (it.key === 'needs-work-hi' ? 9 : 1);
  it('returns only not-done, not-reviewed moments ranked by score', () => {
    const q = buildQueue(items, ['reviewed'], score, 10);
    expect(q.map((x: { key: string }) => x.key)).toEqual(['needs-work-hi', 'needs-work-lo']);
    expect(q[0].v).toBe(9);
  });
  it('respects the n cap', () => {
    expect(buildQueue(items, [], score, 1)).toHaveLength(1);
  });
});

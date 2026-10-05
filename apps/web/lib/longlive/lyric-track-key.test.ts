import { describe, expect, it } from 'vitest';
import { deepLinkTarget, resolveTrackKey, trackKey } from '@swift2/experience';
import { songLink } from '@swift2/shared';
import { LYRIC_STARTER_POOL } from '../../../../supabase/seed/lyrics/starter-pool.mjs';
import './tracks';
import { trackKeyForLyricSlug } from './lyric-track-key';
import { TRACKS_RAW } from './tracks.generated';
import { buildLyricTrackKeys } from '../../../../scripts/lib/lyric-track-keys.mjs';
import committed from './lyric-track-keys.json';

describe('trackKeyForLyricSlug', () => {
  it('the committed map matches the seeds (rerun scripts/sync-lyric-track-keys.mjs if stale) and the generated corpus', async () => {
    expect(committed).toEqual(await buildLyricTrackKeys());
    for (const [eraId, tracks] of Object.entries(TRACKS_RAW)) {
      for (const t of tracks ?? []) if (t.slug) expect(trackKeyForLyricSlug(t.slug)).toBe(trackKey(eraId, t));
    }
  });


  it('returns null for an unknown slug', () => {
    expect(trackKeyForLyricSlug('not-a-real-song')).toBeNull();
  });

  it('every seeded lyric slug becomes a link the site deep-link reader and resolveTrackKey open', () => {
    const unresolved: string[] = [];
    for (const row of LYRIC_STARTER_POOL as { slug: string }[]) {
      const key = trackKeyForLyricSlug(row.slug);
      if (!key) {
        unresolved.push(row.slug);
        continue;
      }
      const target = deepLinkTarget(new URL(songLink(key)).search, []);
      expect(target).toEqual({ kind: 'song', key });
      expect(resolveTrackKey(key)).not.toBeNull();
    }
    expect(unresolved).toEqual([]);
  });
});

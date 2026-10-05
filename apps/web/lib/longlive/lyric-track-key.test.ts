import { describe, expect, it } from 'vitest';
import { deepLinkTarget, resolveTrackKey } from '@swift2/experience';
import { songLink } from '@swift2/shared';
import { LYRIC_STARTER_POOL } from '../../../../supabase/seed/lyrics/starter-pool.mjs';
import './tracks';
import { trackKeyForLyricSlug } from './lyric-track-key';

describe('trackKeyForLyricSlug', () => {
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

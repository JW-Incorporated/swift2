import { eraVideoFeed } from '@swift2/content-enrichment';
import { ERAS } from '@swift2/experience';
import { fromBaked, hashSnapshot, type BakedModules } from '@swift2/experience/reader-snapshot';

import { CONTENT, MILESTONES } from '@/lib/longlive/content';
import { eraSecretsForEra } from '@/lib/longlive/era-secrets';
import { MERCH_CATALOGUE } from '@/lib/longlive/merch';
import { getSearchIndex } from '@/lib/longlive/search';
import { SONG_MOODS } from '@/lib/longlive/song-moods.generated';
import { theoriesForEra } from '@/lib/longlive/theories';
import { tracksForEra } from '@/lib/longlive/tracks';
import { allVideoRecordsForEra } from '@/lib/longlive/videos';

export const dynamic = 'force-dynamic';

/**
 * One UI parity harness only (e2e/parity, docs/one-ui/parity.md): reports the
 * equivalence hash of the content this build baked, so the harness can assert
 * it at runtime against the fixture hash. 404 unless PARITY_PROBE=1 is set in
 * the server's environment (only playwright.parity.config.ts sets it).
 */
export async function GET(): Promise<Response> {
  if (process.env.PARITY_PROBE !== '1') return new Response('not found', { status: 404 });
  const snapshot = fromBaked(
    {
      ERAS,
      CONTENT,
      MILESTONES,
      MERCH_CATALOGUE: MERCH_CATALOGUE as unknown as BakedModules['MERCH_CATALOGUE'],
      SONG_MOODS,
      tracksForEra,
      theoriesForEra,
      allVideoRecordsForEra,
      eraSecretsForEra,
      getSearchIndex,
    },
    { eraVideoFeed },
  );
  const { hash } = await hashSnapshot(snapshot);
  return Response.json({ hash });
}

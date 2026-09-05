// Internal helper for scripts/build-content-bundle.mjs (OS-011): loads the
// longlive TS modules (content.ts, tracks.ts, theories.ts, videos.ts,
// era-secrets.ts, merch.ts, clownbot-lore.ts, eras.ts, song-moods.generated
// .ts) and the OS-010 zod schema module, then prints one JSON object with
// everything the bundle builder needs to stdout.
//
// Run via `tsx` (the dev-only TS loader already used elsewhere in this repo,
// e.g. scripts/sync-source-tiers.mjs) IN A SEPARATE PROCESS from
// build-content-bundle.mjs, rather than tsx's in-process register()/
// unregister() API: registering tsx and then importing content.ts (which
// pulls in eras.ts, content-vault.generated.ts, etc. — a real module graph
// with cycles-through-require the CJS/ESM interop layer does not like) hits
// Node's ERR_REQUIRE_CYCLE_MODULE in-process. A child process sidesteps that
// entirely: tsx owns the whole process's module loading from the start,
// the way it does when a human runs `tsx some-script.ts` directly.
import { eraSecretsForEra } from '../../apps/web/lib/longlive/era-secrets';
import { CONTENT, MILESTONES } from '../../apps/web/lib/longlive/content';
import { ERAS } from '@swift2/experience';
import { MERCH_CATALOGUE } from '../../apps/web/lib/longlive/merch';
import { LORE, LORE_UPDATED_ON } from '../../apps/web/lib/longlive/clownbot-lore';
import { SONG_MOODS } from '../../apps/web/lib/longlive/song-moods.generated';
import { theoriesForEra } from '../../apps/web/lib/longlive/theories';
import { tracksForEra } from '../../apps/web/lib/longlive/tracks';
import { allVideoRecordsForEra } from '../../apps/web/lib/longlive/videos';

void LORE_UPDATED_ON; // not part of the bundle schema; imported for completeness only

process.stdout.write(
  JSON.stringify({
    ERAS,
    MILESTONES,
    CONTENT,
    perEra: ERAS.map((era) => ({
      eraId: era.id,
      tracks: tracksForEra(era.id),
      theories: theoriesForEra(era.id),
      videos: allVideoRecordsForEra(era.id),
      eraSecrets: eraSecretsForEra(era.id),
    })),
    SONG_MOODS,
    LORE,
    MERCH_CATALOGUE,
  }),
);

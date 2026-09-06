import { setContentGeneratedAtSource } from '@swift2/experience';
import * as vault from './content-vault.generated';

// OS-024: wires apps/web's generated Vault modules into the headless core's
// injected providers (packages/experience never imports app-layer generated
// data directly — see content-item-provider.ts / track-catalogue-provider.ts
// / song-catalogue-provider.ts / freshness.ts for why). Side-effect-only:
// import this module once, early, so every provider is wired before any
// experience-core function that reads through one is called.
//
// - `./content` (imported for side effects only) wires the content-item
//   lookup via setContentItemLookup(getContentItem).
// - `./tracks` wires the per-era track map via
//   setTracksRawProvider(TRACKS_RAW) — OS-014b-2: reads the published
//   content bundle when available, falling back to `./tracks.generated`.
// - `./song-moods.generated` wires the mood-match catalogue via
//   setDefaultSongCatalogue(SONG_MOODS).
// - the content-freshness stamp is wired here directly, since no other
//   apps/web module already imports content-vault.generated for its side
//   effects the way the other three do.
import './content';
import './tracks';
import './song-moods.generated';

setContentGeneratedAtSource(vault as unknown as Record<string, unknown>);

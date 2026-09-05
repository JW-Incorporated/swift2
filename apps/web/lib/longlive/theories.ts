import type { EraId, TheoryNote } from '@swift2/experience';
import { setTheoriesRawProvider } from '@swift2/experience';
import { THEORIES_RAW } from './theories.generated';

export { theoriesForEra, resolveRelatedTheory } from '@swift2/experience';

// Wires the app's generated theories dataset into
// `packages/experience`'s `theories.ts` (OS-023 — see
// `thread-content-provider.ts`'s doc comment): the headless package can't
// load generated content itself (content loading is OS-013/OS-014 scope),
// so the app injects `THEORIES_RAW` in at import time.
setTheoriesRawProvider((): Partial<Record<EraId, TheoryNote[]>> => THEORIES_RAW);

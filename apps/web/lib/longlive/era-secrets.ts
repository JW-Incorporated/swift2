export {
  eraSecretsForEra,
  epochDay,
  dailyEraSecret,
  resolveEraSecretLink,
} from '@swift2/experience';
export type { EraSecretLink } from '@swift2/experience';

// Wires the app's generated era-secrets dataset, song resolver, and content
// lookup into `packages/experience`'s `era-secrets.ts` (OS-023 — see
// `thread-content-provider.ts`'s doc comment): the headless package can't
// load generated content itself (content loading is OS-013/OS-014 scope),
// so the app injects the real implementations in at import time.
import type { EraId, EraSecret } from '@swift2/experience';
import { setEraSecretsRawProvider, setSongTargetResolver, setThreadContentProvider } from '@swift2/experience';
import { ERA_SECRETS_RAW } from './era-secrets.generated';
import { songTargetOf } from '@swift2/experience';
import { getContentItem } from './content';
import { CONTENT } from './content';

setEraSecretsRawProvider((): Partial<Record<EraId, EraSecret[]>> => ERA_SECRETS_RAW);
setSongTargetResolver(songTargetOf);
// `contentItemInjected` (used by `resolveEraSecretLink`'s `moment:` case)
// reads through the same content-corpus provider `threads.ts` wires — safe
// to set again here even if `threads.ts` already has, since both set it to
// the same `CONTENT` array; also covers the case where only `era-secrets.ts`
// is imported (e.g. from `gloss-rotation.ts`) without `threads.ts`.
setThreadContentProvider(() => CONTENT);
void getContentItem; // re-exported indirectly via contentItemInjected; kept for clarity

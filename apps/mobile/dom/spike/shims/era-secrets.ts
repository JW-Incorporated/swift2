// Shim for apps/web/lib/longlive/era-secrets.ts: same exports; ERA_SECRETS_RAW
// is live and `fill()` installs the providers.
import type { EraId, EraSecret } from '@swift2/experience';

export {
  eraSecretsForEra,
  epochDay,
  dailyEraSecret,
  resolveEraSecretLink,
} from '@swift2/experience';
export type { EraSecretLink } from '@swift2/experience';

export const ERA_SECRETS_RAW: Partial<Record<EraId, EraSecret[]>> = {};

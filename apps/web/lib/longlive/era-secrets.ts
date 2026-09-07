/**
 * BUNDLE AS SOURCE OF TRUTH, LITERAL AS RUNTIME VALUE (OS-014b-4, same
 * reasoning recorded for merch.ts and clownbot-lore.ts's OS-014b-5 — see
 * that file's header for the fuller writeup): `ERA_SECRETS_RAW` keeps
 * importing straight from `era-secrets.generated.ts` (a plain object
 * literal with zero imports) rather than reading the published bundle's
 * `era-secrets.json` via `packages/content`'s async `loadBundle()` or the
 * synchronous `readBundleArtifact()` helper (`./read-bundle-artifact.ts`).
 *
 * This module is reachable from `EraSecretCard.tsx`, a `'use client'`
 * component (`EraSecretCard` -> `era-secrets.ts` -> `era-secrets.generated`)
 * — Next.js/Turbopack statically traces every module in a client
 * component's import graph and refuses to bundle `node:fs`/`node:path` for
 * the browser, so `readBundleArtifact()` is not usable here (see its own
 * doc comment for the concrete build failure this constraint comes from).
 * `loadBundle()` is likewise the wrong shape: it is an async HTTP client,
 * and every one of the ~100+ call sites across the app reads
 * `eraSecretsForEra`/`dailyEraSecret`/etc. synchronously today (this
 * migration's explicit "zero pixel/behavior change" bar) — switching to an
 * async load would ripple into every consumer's render path for no benefit
 * apps/web's own build doesn't already get for free (the generated file is
 * produced from the exact same `supabase/seed/era-secrets/**` source the
 * bundle is built from, by the same `prebuild` step, before either is
 * read).
 *
 * `era-secrets.test.ts` enforces the actual invariant instead: a
 * byte-identical-to-the-published-bundle regression check, so any drift
 * between this literal and `era-secrets.json` fails the suite immediately
 * — see that file for the assertion.
 */
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

/**
 * Manifest entry name -> zod schema mapping, split out of `load.ts` so the
 * warm-path fingerprint pin (`warm-cache.test.ts`) covers it: changing which
 * schema validates which entry must bump `SCHEMA_FINGERPRINT`.
 */
import type { z } from 'zod';
import { contentBundleSchemas } from './schema';

/** Same manifest-entry-name -> schema mapping the OS-010 fixture test uses (`content:<eraId>` prefix -> the per-era content file schema; everything else keyed directly into `contentBundleSchemas`). Undefined when this build has no schema for `name`. */
export function lookupSchema(name: string): z.ZodTypeAny | undefined {
  if (name.startsWith('content:')) return contentBundleSchemas.content;
  return (contentBundleSchemas as Record<string, z.ZodTypeAny>)[name];
}

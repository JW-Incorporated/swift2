import { eraVideoFeed } from '@swift2/content-enrichment';
import { fromBaked, hashSnapshot } from '@swift2/experience/reader-snapshot';

import { bakedModulesFull } from '@/lib/longlive/baked-modules-full';

export const dynamic = 'force-dynamic';

/**
 * One UI parity harness only (e2e/parity, docs/one-ui/parity.md): reports the
 * equivalence hash of the content this build baked, so the harness can assert
 * it at runtime against the fixture hash. 404 unless PARITY_PROBE=1 is set in
 * the server's environment (only playwright.parity.config.ts sets it).
 */
export async function GET(): Promise<Response> {
  if (process.env.PARITY_PROBE !== '1') return new Response('not found', { status: 404 });
  const snapshot = fromBaked(bakedModulesFull(), { eraVideoFeed });
  const { hash } = await hashSnapshot(snapshot);
  return Response.json({ hash });
}

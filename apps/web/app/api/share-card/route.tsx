import type { NextRequest } from 'next/server';

import { renderShareCard } from '@/lib/longlive/share-card';
import { parseShareCardRequest } from '@/lib/longlive/share-card-spec';
import '../../../lib/longlive/vault-wiring';

// W9 share cards: a deterministic PNG of site content (a moment, an era, or a
// visitor's "My Eras" summary) fans can save or post. The query string only
// ever SELECTS from allowlisted ids and bucketed counts (share-card-spec.ts) —
// it never supplies text — and every invalid input degrades to the default
// brand card rather than an error, so the cache key space stays bounded.
// No LLM, no DB; /api/og is a separate renderer and is untouched.
export const runtime = 'nodejs';

export function GET(req: NextRequest): Response {
  try {
    const { spec, size } = parseShareCardRequest(new URL(req.url));
    return renderShareCard(spec, size);
  } catch {
    // A render failure must not become a cacheable 500 for a shared link.
    return new Response('Share card unavailable', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}

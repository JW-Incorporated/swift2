import type { NextRequest } from 'next/server';

import { renderShareCard } from '@/lib/longlive/share-card';
import { canonicalShareCardPath, parseShareCardRequest } from '@/lib/longlive/share-card-spec';
import '../../../lib/longlive/vault-wiring';

// W9 share cards: a deterministic PNG of site content (a moment, an era, or a
// visitor's "My Eras" summary) fans can save or post. The query string only
// ever SELECTS from allowlisted ids and bucketed counts (share-card-spec.ts) —
// it never supplies text. Any query that is not already the canonical URL for
// the card it resolves to (extra keys, a slug, conflicting ids, invalid ids,
// unbucketed counts) gets a 308 to the canonical one, so the CDN only ever
// renders canonical URLs and the cache key space stays bounded. No LLM, no DB;
// /api/og is a separate renderer and is untouched.
export const runtime = 'nodejs';

export function GET(req: NextRequest): Response {
  const url = new URL(req.url);
  try {
    const request = parseShareCardRequest(url);
    const canonical = canonicalShareCardPath(request);
    if (url.pathname + url.search !== canonical) {
      // Redirects are cheap and carry no render, so only browsers keep them.
      return new Response(null, {
        status: 308,
        headers: {
          Location: new URL(canonical, url).toString(),
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
    return renderShareCard(request.spec, request.size);
  } catch {
    // Anything thrown while parsing or setting up the render is not cacheable.
    // ImageResponse renders lazily, so a failure inside the render itself
    // surfaces when the body is read and is not caught here.
    return new Response('Share card unavailable', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}

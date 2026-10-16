import { revalidatePath } from 'next/cache';
import { bearerToken, makeRateLimiter, timingSafeSecretEqual } from '../../../lib/longlive/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const defaultLimiter = makeRateLimiter({ windowMs: 60_000, max: 20 });
const ERA_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface HandlerDeps {
  getSecret?: () => string | undefined;
  invalidate?: (path: string) => void | Promise<void>;
  limiter?: { isLimited(key: string): boolean };
}

export function createRevalidateLiveHandler(deps: HandlerDeps = {}) {
  const getSecret = deps.getSecret ?? (() => process.env.REVALIDATE_SECRET);
  const invalidate = deps.invalidate ?? revalidatePath;
  const limiter = deps.limiter ?? defaultLimiter;

  return async function POST(req: Request): Promise<Response> {
    const expected = getSecret();
    if (!expected) return Response.json({ error: 'Not found.' }, { status: 404 });

    const provided = bearerToken(req);
    if (!provided || !timingSafeSecretEqual(provided, expected)) {
      return Response.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    if (limiter.isLimited('revalidate-live')) {
      return Response.json({ error: 'Too many requests.' }, { status: 429 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid request.' }, { status: 400 });
    }
    const eraId = typeof body === 'object' && body !== null && 'eraId' in body
      ? (body as { eraId?: unknown }).eraId
      : null;
    if (typeof eraId !== 'string' || !ERA_ID.test(eraId)) {
      return Response.json({ error: 'Invalid era.' }, { status: 400 });
    }

    await invalidate(`/vault/live/${eraId}`);
    return Response.json({ revalidated: true, path: `/vault/live/${eraId}` });
  };
}

export const POST = createRevalidateLiveHandler();

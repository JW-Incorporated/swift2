import { afterEach, describe, expect, it, vi } from 'vitest';
import { signAckToken } from '@swift2/core/community-ack';

const LEAD_ID = '11111111-1111-4111-8111-111111111111';
const SECRET = 'test-ack-secret';

function get(qs: string, ip = '10.0.0.1'): Promise<Response> {
  return import('./route').then(({ GET }) =>
    GET(new Request(`http://localhost/api/community/ack?${qs}`, { headers: { 'x-forwarded-for': ip } })),
  );
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.doUnmock('@swift2/core/community-ack');
  vi.resetModules();
});

describe('GET /api/community/ack — validation', () => {
  it('rejects a missing lead id with 400', async () => {
    const res = await get(`action=posted&token=aa`, '10.5.0.1');
    expect(res.status).toBe(400);
  });

  it('rejects a non-UUID lead id with 400', async () => {
    const res = await get(`lead=not-a-uuid&action=posted&token=aa`, '10.5.0.2');
    expect(res.status).toBe(400);
  });

  it('rejects an invalid action with 400', async () => {
    const res = await get(`lead=${LEAD_ID}&action=delete&token=aa`, '10.5.0.3');
    expect(res.status).toBe(400);
  });

  it('rejects a missing token with 400', async () => {
    const res = await get(`lead=${LEAD_ID}&action=posted`, '10.5.0.4');
    expect(res.status).toBe(400);
  });

  it('rejects a non-hex token with 400', async () => {
    const res = await get(`lead=${LEAD_ID}&action=posted&token=not-hex!!`, '10.5.0.5');
    expect(res.status).toBe(400);
  });

  it('degrades to 503 when COMMUNITY_ACK_SECRET is not configured', async () => {
    vi.stubEnv('COMMUNITY_ACK_SECRET', '');
    const res = await get(`lead=${LEAD_ID}&action=posted&token=aa`, '10.5.0.6');
    expect(res.status).toBe(503);
  });

  it('rate-limits after the per-IP burst window', async () => {
    vi.stubEnv('COMMUNITY_ACK_SECRET', SECRET);
    const ip = '10.5.0.7';
    for (let i = 0; i < 30; i++) {
      const res = await get(`lead=${LEAD_ID}&action=posted&token=aa`, ip);
      expect(res.status).not.toBe(429);
    }
    const limited = await get(`lead=${LEAD_ID}&action=posted&token=aa`, ip);
    expect(limited.status).toBe(429);
  });
});

describe('GET /api/community/ack — tamper cases', () => {
  it('rejects a token that does not match the lead+action pair', async () => {
    vi.stubEnv('COMMUNITY_ACK_SECRET', SECRET);
    const wrongToken = signAckToken(SECRET, { leadId: LEAD_ID, action: 'skip', linkIncluded: false });
    const res = await get(`lead=${LEAD_ID}&action=posted&token=${wrongToken}`, '10.5.1.1');
    expect(res.status).toBe(403);
  });

  it('rejects a token signed for a different lead id', async () => {
    vi.stubEnv('COMMUNITY_ACK_SECRET', SECRET);
    const otherLead = '22222222-2222-4222-8222-222222222222';
    const wrongToken = signAckToken(SECRET, {
      leadId: otherLead,
      action: 'posted',
      linkIncluded: false,
    });
    const res = await get(`lead=${LEAD_ID}&action=posted&token=${wrongToken}`, '10.5.1.2');
    expect(res.status).toBe(403);
  });

  it('rejects a "posted" token minted with link=0 when the URL is edited to link=1 (etiquette-counter tamper case)', async () => {
    vi.stubEnv('COMMUNITY_ACK_SECRET', SECRET);
    const token = signAckToken(SECRET, { leadId: LEAD_ID, action: 'posted', linkIncluded: false });
    const res = await get(`lead=${LEAD_ID}&action=posted&link=1&token=${token}`, '10.5.1.3');
    expect(res.status).toBe(403);
  });
});

describe('GET /api/community/ack — happy path', () => {
  it('degrades to 503 when the service-role key is not configured', async () => {
    vi.stubEnv('COMMUNITY_ACK_SECRET', SECRET);
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    const token = signAckToken(SECRET, { leadId: LEAD_ID, action: 'posted', linkIncluded: false });
    const res = await get(`lead=${LEAD_ID}&action=posted&token=${token}`, '10.5.2.1');
    expect(res.status).toBe(503);
  });

  it('a valid posted ack calls ackPosted with linkIncluded parsed from the query', async () => {
    vi.stubEnv('COMMUNITY_ACK_SECRET', SECRET);
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');
    vi.doMock('@supabase/supabase-js', () => ({ createClient: () => ({}) }));
    const ackPosted = vi.fn().mockResolvedValue({ ok: true, alreadyActed: false });
    vi.doMock('@swift2/core/community-ack', async () => {
      const actual = await vi.importActual<typeof import('@swift2/core/community-ack')>(
        '@swift2/core/community-ack',
      );
      return { ...actual, ackPosted, ackSkipped: vi.fn() };
    });
    vi.resetModules();

    const token = signAckToken(SECRET, { leadId: LEAD_ID, action: 'posted', linkIncluded: true });
    const { GET } = await import('./route');
    const res = await GET(
      new Request(
        `http://localhost/api/community/ack?lead=${LEAD_ID}&action=posted&link=1&token=${token}`,
        { headers: { 'x-forwarded-for': '10.5.3.1' } },
      ),
    );
    expect(res.status).toBe(200);
    expect(ackPosted).toHaveBeenCalledWith(expect.anything(), LEAD_ID, true);
    vi.doUnmock('@supabase/supabase-js');
  });

  it('a valid skip ack calls ackSkipped, not ackPosted', async () => {
    vi.stubEnv('COMMUNITY_ACK_SECRET', SECRET);
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');
    vi.doMock('@supabase/supabase-js', () => ({ createClient: () => ({}) }));
    const ackSkipped = vi.fn().mockResolvedValue({ ok: true, alreadyActed: false });
    const ackPosted = vi.fn();
    vi.doMock('@swift2/core/community-ack', async () => {
      const actual = await vi.importActual<typeof import('@swift2/core/community-ack')>(
        '@swift2/core/community-ack',
      );
      return { ...actual, ackPosted, ackSkipped };
    });
    vi.resetModules();

    const token = signAckToken(SECRET, { leadId: LEAD_ID, action: 'skip', linkIncluded: false });
    const { GET } = await import('./route');
    const res = await GET(
      new Request(`http://localhost/api/community/ack?lead=${LEAD_ID}&action=skip&token=${token}`, {
        headers: { 'x-forwarded-for': '10.5.3.2' },
      }),
    );
    expect(res.status).toBe(200);
    expect(ackSkipped).toHaveBeenCalledWith(expect.anything(), LEAD_ID);
    expect(ackPosted).not.toHaveBeenCalled();
    vi.doUnmock('@supabase/supabase-js');
  });

  it('returns 404 for a lead that does not exist', async () => {
    vi.stubEnv('COMMUNITY_ACK_SECRET', SECRET);
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');
    vi.doMock('@supabase/supabase-js', () => ({ createClient: () => ({}) }));
    vi.doMock('@swift2/core/community-ack', async () => {
      const actual = await vi.importActual<typeof import('@swift2/core/community-ack')>(
        '@swift2/core/community-ack',
      );
      return { ...actual, ackPosted: vi.fn().mockResolvedValue({ ok: false, error: 'not_found' }) };
    });
    vi.resetModules();

    const token = signAckToken(SECRET, { leadId: LEAD_ID, action: 'posted', linkIncluded: false });
    const { GET } = await import('./route');
    const res = await GET(
      new Request(`http://localhost/api/community/ack?lead=${LEAD_ID}&action=posted&token=${token}`, {
        headers: { 'x-forwarded-for': '10.5.3.3' },
      }),
    );
    expect(res.status).toBe(404);
    vi.doUnmock('@supabase/supabase-js');
  });

  it('a second ack for an already-acted lead returns 200 (idempotent), not an error', async () => {
    vi.stubEnv('COMMUNITY_ACK_SECRET', SECRET);
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');
    vi.doMock('@supabase/supabase-js', () => ({ createClient: () => ({}) }));
    vi.doMock('@swift2/core/community-ack', async () => {
      const actual = await vi.importActual<typeof import('@swift2/core/community-ack')>(
        '@swift2/core/community-ack',
      );
      return {
        ...actual,
        ackPosted: vi.fn().mockResolvedValue({ ok: true, alreadyActed: true }),
      };
    });
    vi.resetModules();

    const token = signAckToken(SECRET, { leadId: LEAD_ID, action: 'posted', linkIncluded: false });
    const { GET } = await import('./route');
    const res = await GET(
      new Request(`http://localhost/api/community/ack?lead=${LEAD_ID}&action=posted&token=${token}`, {
        headers: { 'x-forwarded-for': '10.5.3.4' },
      }),
    );
    expect(res.status).toBe(200);
    vi.doUnmock('@supabase/supabase-js');
  });
});

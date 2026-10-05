import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
let admin: { rpc: typeof rpc } | null = { rpc };
vi.mock('../../../lib/supabase-server', () => ({ supabaseAdmin: () => admin }));

import { QUOTA_CAPS, claimFeedbackSlot, hashIp } from './feedback-quota';
import { POST } from './route';

beforeEach(() => {
  rpc.mockReset();
  admin = { rpc };
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it('pins every configured cap', () => {
  expect(QUOTA_CAPS).toEqual({
    feedback: { ip: 5, global: 200 },
    diag: { ip: 60, global: 500 },
  });
});

describe('claimFeedbackSlot', () => {
  it.each(['ok', 'ip_capped', 'global_capped'])('maps %s through', async (v) => {
    rpc.mockResolvedValue({ data: v, error: null });
    expect(await claimFeedbackSlot('feedback', '1.2.3.4')).toBe(v);
  });

  it('is unavailable when the function is missing, errors, or Supabase is unset', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: 'PGRST202' } });
    expect(await claimFeedbackSlot('diag', '1.2.3.4')).toBe('unavailable');
    rpc.mockRejectedValue(new Error('boom'));
    expect(await claimFeedbackSlot('diag', '1.2.3.4')).toBe('unavailable');
    admin = null;
    expect(await claimFeedbackSlot('diag', '1.2.3.4')).toBe('unavailable');
  });

  it('passes only a hashed IP, the day, and the caps', async () => {
    rpc.mockResolvedValue({ data: 'ok', error: null });
    await claimFeedbackSlot('feedback', '203.0.113.9', new Date('2026-10-04T23:00:00Z'));
    const [name, args] = rpc.mock.calls[0];
    expect(name).toBe('claim_feedback_slot');
    expect(JSON.stringify(args)).not.toContain('203.0.113.9');
    expect(args).toEqual({
      p_day: '2026-10-04',
      p_kind: 'feedback',
      p_ip_hash: hashIp('203.0.113.9'),
      p_ip_max: QUOTA_CAPS.feedback.ip,
      p_global_max: QUOTA_CAPS.feedback.global,
    });
    expect(hashIp('203.0.113.9')).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('POST /api/feedback durable quota', () => {
  const post = (ip: string, message = 'something is broken') =>
    POST(
      new Request('http://x/api/feedback', {
        method: 'POST',
        headers: { 'x-real-ip': ip },
        body: JSON.stringify({ message }),
      }),
    );

  it.each(['ip_capped', 'global_capped'])('returns 429 on %s without reaching GitHub', async (v) => {
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 't');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    rpc.mockResolvedValue({ data: v, error: null });
    const res = await post('198.51.100.1');
    expect(res.status).toBe(429);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('falls back to the in-memory limits when the function is missing', async () => {
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 't');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ number: 1, html_url: 'u' }) }),
    );
    rpc.mockResolvedValue({ data: null, error: { code: 'PGRST202' } });
    expect((await post('198.51.100.2')).status).toBe(201);
  });
});

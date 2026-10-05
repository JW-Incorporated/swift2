import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
const eq = vi.fn();
const update = vi.fn(() => ({ eq }));
const del = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ update, delete: del }));
let admin: { rpc: typeof rpc; from: typeof from } | null = { rpc, from };
vi.mock('../../../lib/supabase-server', () => ({ supabaseAdmin: () => admin }));

import { claimFeedbackId } from './idempotency-durable';
import { resetIdempotencyForTests } from './idempotency';
import { POST } from './route';

const req = (body: unknown, ip: string) =>
  new Request('http://localhost/api/feedback', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-real-ip': ip },
    body: JSON.stringify(body),
  });

const ok = (n: number) =>
  new Response(JSON.stringify({ number: n, html_url: `https://github.com/o/r/issues/${n}` }), { status: 201 });

beforeEach(() => {
  resetIdempotencyForTests();
  rpc.mockReset();
  eq.mockReset().mockResolvedValue({ error: null });
  update.mockClear();
  del.mockClear();
  from.mockClear();
  admin = { rpc, from };
  vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'feedback-scoped-token');
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

// The quota rpc is also on this mock; answer it 'ok' and route the id claim.
const claimAs = (state: string, url: string | null = null) =>
  rpc.mockImplementation(async (name: string) =>
    name === 'claim_feedback_id' ? { data: { state, url }, error: null } : { data: 'ok', error: null },
  );

describe('claimFeedbackId', () => {
  it.each(['new', 'pending', 'posted'])('maps %s through', async (state) => {
    claimAs(state, 'https://x/1');
    expect((await claimFeedbackId('abcd-1234-efgh')).state).toBe(state);
  });

  it('is unavailable when the function is missing, malformed, throws, or Supabase is unset', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: 'PGRST202' } });
    expect((await claimFeedbackId('abcd-1234-efgh')).state).toBe('unavailable');
    rpc.mockResolvedValue({ data: { state: 'bogus' }, error: null });
    expect((await claimFeedbackId('abcd-1234-efgh')).state).toBe('unavailable');
    rpc.mockRejectedValue(new Error('boom'));
    expect((await claimFeedbackId('abcd-1234-efgh')).state).toBe('unavailable');
    admin = null;
    expect((await claimFeedbackId('abcd-1234-efgh')).state).toBe('unavailable');
  });
});

describe('route durable idempotency', () => {
  it('new claim posts, then marks the id posted with the issue url', async () => {
    claimAs('new');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok(7)));
    const res = await POST(req({ id: 'durable-new-01', message: 'hello' }, '10.1.0.1'));
    expect(res.status).toBe(201);
    expect(from).toHaveBeenCalledWith('feedback_idempotency');
    expect(update).toHaveBeenCalledWith({ status: 'posted', issue_url: 'https://github.com/o/r/issues/7' });
    expect(eq).toHaveBeenCalledWith('id', 'durable-new-01');
    expect(del).not.toHaveBeenCalled();
  });

  it('posted claim returns 200 with the existing url and does not post', async () => {
    claimAs('posted', 'https://github.com/o/r/issues/3');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const res = await POST(req({ id: 'durable-done-01', message: 'hello' }, '10.1.0.2'));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, duplicate: true, url: 'https://github.com/o/r/issues/3' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('pending claim returns 409 with the pending marker and does not post', async () => {
    claimAs('pending');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const res = await POST(req({ id: 'durable-busy-01', message: 'hello' }, '10.1.0.3'));
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ pending: true });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('a failed GitHub post releases the claim', async () => {
    claimAs('new');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 500 })));
    const res = await POST(req({ id: 'durable-fail-01', message: 'hello' }, '10.1.0.4'));
    expect(res.status).toBe(502);
    expect(del).toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith('id', 'durable-fail-01');
    expect(update).not.toHaveBeenCalled();
  });

  it('a missing function falls back to the in-memory dedupe', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: 'PGRST202' } });
    const fetchSpy = vi.fn().mockResolvedValue(ok(9));
    vi.stubGlobal('fetch', fetchSpy);
    const body = { id: 'fallback-id-01', message: 'hello' };
    expect((await POST(req(body, '10.1.0.5'))).status).toBe(201);
    const again = await POST(req(body, '10.1.0.6'));
    expect(again.status).toBe(200);
    expect(await again.json()).toMatchObject({ duplicate: true });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('no token means no claim is made', async () => {
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', '');
    claimAs('new');
    const res = await POST(req({ id: 'durable-tok-01', message: 'hello' }, '10.1.0.7'));
    expect(res.status).toBe(503);
    expect(rpc).not.toHaveBeenCalledWith('claim_feedback_id', expect.anything());
  });
});

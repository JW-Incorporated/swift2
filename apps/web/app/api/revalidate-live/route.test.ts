import { describe, expect, it, vi } from 'vitest';
import { revalidatePath } from 'next/cache';
import { createRevalidateLiveHandler, POST } from './route';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const request = (secret = 'fixture-secret', body: unknown = { eraId: 'tloas' }) => new Request(
  'https://preview.example/api/revalidate-live',
  {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  },
);

function deps(secret: string | undefined) {
  return {
    getSecret: () => secret,
    invalidate: vi.fn(),
    limiter: { isLimited: vi.fn(() => false) },
  };
}

describe('POST /api/revalidate-live', () => {
  it('fails closed with 404 when REVALIDATE_SECRET is unset', async () => {
    const prior = process.env.REVALIDATE_SECRET;
    delete process.env.REVALIDATE_SECRET;
    try {
      const response = await POST(request());
      expect(response.status).toBe(404);
      expect(revalidatePath).not.toHaveBeenCalled();
    } finally {
      if (prior === undefined) delete process.env.REVALIDATE_SECRET;
      else process.env.REVALIDATE_SECRET = prior;
    }
  });

  it('rejects missing or incorrect bearer credentials', async () => {
    const injected = deps('fixture-secret');
    const missing = new Request('https://preview.example/api/revalidate-live', {
      method: 'POST', body: JSON.stringify({ eraId: 'tloas' }),
    });
    expect((await createRevalidateLiveHandler(injected)(missing)).status).toBe(401);
    expect((await createRevalidateLiveHandler(injected)(request('wrong'))).status).toBe(401);
    expect(injected.invalidate).not.toHaveBeenCalled();
  });

  it('invalidates only the requested live route after authorization', async () => {
    const injected = deps('fixture-secret');
    const response = await createRevalidateLiveHandler(injected)(request());
    expect(response.status).toBe(200);
    expect(injected.invalidate).toHaveBeenCalledOnce();
    expect(injected.invalidate).toHaveBeenCalledWith('/vault/live/tloas');
  });

  it('rejects invalid era paths and authorized bursts', async () => {
    const invalid = deps('fixture-secret');
    expect((await createRevalidateLiveHandler(invalid)(request('fixture-secret', {
      eraId: '../admin',
    }))).status).toBe(400);
    expect(invalid.invalidate).not.toHaveBeenCalled();

    const limited = deps('fixture-secret');
    limited.limiter.isLimited.mockReturnValue(true);
    expect((await createRevalidateLiveHandler(limited)(request())).status).toBe(429);
    expect(limited.invalidate).not.toHaveBeenCalled();
  });
});

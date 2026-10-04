import { describe, expect, it } from 'vitest';
import { enqueueRegistration } from './registration-queue';

describe('enqueueRegistration', () => {
  it('a hung op times out and a later superseding op still runs', async () => {
    let staleWasCurrent: boolean | null = null;
    const hung = enqueueRegistration(
      (isCurrent) =>
        new Promise<void>((resolve) => {
          setTimeout(() => ((staleWasCurrent = isCurrent()), resolve()), 60);
        }),
      { supersede: false, timeoutMs: 20 },
    );
    const hungResult = hung.then(
      () => 'ok',
      (e: Error) => e.message,
    );
    const ran: string[] = [];
    await enqueueRegistration(async () => void ran.push('unregister'), { supersede: true });
    expect(ran).toEqual(['unregister']);
    expect(await hungResult).toMatch(/timed out/);
    await new Promise((r) => setTimeout(r, 80));
    expect(staleWasCurrent).toBe(false);
  });

  it('a rejected op does not wedge the tail', async () => {
    const bad = enqueueRegistration(async () => Promise.reject(new Error('boom')), { supersede: false });
    await expect(bad).rejects.toThrow('boom');
    await expect(enqueueRegistration(async () => 'next', { supersede: true })).resolves.toBe('next');
  });
});

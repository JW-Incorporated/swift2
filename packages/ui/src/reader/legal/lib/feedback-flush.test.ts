import { describe, expect, it, vi } from 'vitest';
import type { HostAdapter } from '../../../host/types';
import { fakeHost } from './feedback-test-host';
import { flushQueue } from './feedback-flush';
import { enqueue, readQueue } from './feedback-outbox';

const ctx = () => ({ location: {}, hp: '' });

function hostWith(apiFetch: ReturnType<typeof vi.fn>) {
  return Object.assign(fakeHost(), { apiFetch }) as unknown as HostAdapter;
}

describe('flushQueue', () => {
  it('a 2xx dequeues and reports the id', async () => {
    const host = hostWith(vi.fn().mockResolvedValue({ status: 201, body: '{}' }));
    const item = enqueue(host, 'hello')!;
    const res = await flushQueue(host, { current: false }, ctx);
    expect(res.sent).toEqual([item.id]);
    expect(readQueue(host)).toEqual([]);
  });

  it('an HTTP error dequeues (deliberate) and surfaces the error', async () => {
    const host = hostWith(
      vi.fn().mockResolvedValue({ status: 429, body: JSON.stringify({ error: 'Slow down.' }) }),
    );
    const item = enqueue(host, 'spam')!;
    const res = await flushQueue(host, { current: false }, ctx);
    expect(res.http).toEqual({ item, error: 'Slow down.' });
    expect(res.sent).toEqual([]);
    expect(readQueue(host)).toEqual([]);
  });

  it('a transport failure keeps the item queued', async () => {
    const host = hostWith(vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    enqueue(host, 'offline');
    const res = await flushQueue(host, { current: false }, ctx);
    expect(res.transport).toBe(true);
    expect(readQueue(host)).toHaveLength(1);
  });

  it('inFlight returns busy without posting', async () => {
    const apiFetch = vi.fn();
    const host = hostWith(apiFetch);
    enqueue(host, 'x');
    const res = await flushQueue(host, { current: true }, ctx);
    expect(res.busy).toBe(true);
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('sends the stable idempotency id with each post', async () => {
    const apiFetch = vi.fn().mockResolvedValue({ status: 200, body: '{}' });
    const host = hostWith(apiFetch);
    const item = enqueue(host, 'with id')!;
    await flushQueue(host, { current: false }, ctx);
    expect(JSON.parse(apiFetch.mock.calls[0]![0].body).id).toBe(item.id);
  });
});

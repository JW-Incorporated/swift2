import { describe, expect, it } from 'vitest';
import { fakeHost } from './feedback-test-host';
import { MAX_ITEM_CHARS, MAX_QUEUE, dequeue, enqueue, readQueue } from './feedback-outbox';

describe('feedback outbox queue', () => {
  it('enqueue dedupes identical text, reusing the id', () => {
    const host = fakeHost();
    const a = enqueue(host, 'same text')!;
    const b = enqueue(host, 'same text')!;
    expect(b.id).toBe(a.id);
    expect(readQueue(host)).toHaveLength(1);
  });

  it('caps the queue at 3', () => {
    const host = fakeHost();
    for (let i = 0; i < MAX_QUEUE; i++) expect(enqueue(host, `report ${i}`)).not.toBeNull();
    expect(enqueue(host, 'one too many')).toBeNull();
    expect(readQueue(host)).toHaveLength(3);
  });

  it('clips each item to 5000 chars', () => {
    expect(MAX_ITEM_CHARS).toBe(5000);
    const host = fakeHost();
    expect(enqueue(host, 'x'.repeat(20_000))!.message).toHaveLength(5000);
  });

  it('dequeue removes only that item', () => {
    const host = fakeHost();
    const a = enqueue(host, 'one')!;
    enqueue(host, 'two');
    dequeue(host, a.id);
    expect(readQueue(host).map((i) => i.message)).toEqual(['two']);
  });
});

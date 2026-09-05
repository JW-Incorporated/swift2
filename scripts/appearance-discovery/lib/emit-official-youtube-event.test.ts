import { describe, expect, it, vi } from 'vitest';
import { emitOfficialYoutubeEvent } from './emit-official-youtube-event.mjs';

function fakeDb() {
  const insert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'evt-1' }, error: null }),
    }),
  });
  return { from: vi.fn().mockReturnValue({ insert }), _insert: insert };
}

describe('emitOfficialYoutubeEvent', () => {
  it('skips non-official-channel candidates (taylor-swift/swift-title rules)', async () => {
    const db = fakeDb();
    const result = await emitOfficialYoutubeEvent(
      { rule: 'taylor-swift', videoId: 'abc12345678', title: 'Reaction video' },
      { db },
    );
    expect(result).toEqual({ emitted: false, reason: 'not-official-channel' });
    expect(db.from).not.toHaveBeenCalled();
  });

  it('skips when db is not configured', async () => {
    const result = await emitOfficialYoutubeEvent({ rule: 'all-uploads', videoId: 'abc12345678' });
    expect(result).toEqual({ emitted: false, reason: 'no-db-client' });
  });

  it('emits an official_youtube event for an all-uploads candidate', async () => {
    const db = fakeDb();
    const result = await emitOfficialYoutubeEvent(
      {
        rule: 'all-uploads',
        videoId: 'abc12345678',
        title: 'BTS of the video shoot',
        url: 'https://www.youtube.com/watch?v=abc12345678',
      },
      { db },
    );
    expect(result.emitted).toBe(true);
    expect(db.from).toHaveBeenCalledWith('events');
    const row = db._insert.mock.calls[0][0];
    expect(row.category).toBe('official_youtube');
    expect(row.dedupe_key).toBe('official_youtube:abc12345678');
    expect(row.deep_link).toBe('https://www.youtube.com/watch?v=abc12345678');
  });

  it('reports deduped:true without re-inserting on the second call for the same video', async () => {
    const insert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        maybeSingle: vi
          .fn()
          .mockResolvedValueOnce({ data: { id: 'evt-1' }, error: null })
          .mockResolvedValueOnce({
            data: null,
            error: { code: '23505', message: 'duplicate key value violates unique constraint' },
          }),
      }),
    });
    const db = { from: vi.fn().mockReturnValue({ insert }) };
    const candidate = { rule: 'all-uploads', videoId: 'xyz98765432', title: 'New video' };

    const first = await emitOfficialYoutubeEvent(candidate, { db });
    const second = await emitOfficialYoutubeEvent(candidate, { db });
    expect(first.emitted).toBe(true);
    expect(second.emitted).toBe(false);
    expect(second.deduped).toBe(true);
  });
});

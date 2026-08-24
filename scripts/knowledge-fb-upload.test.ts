import { describe, expect, it, vi } from 'vitest';
import { BUCKET, ensureBucket, uploadFiles } from './knowledge-fb-upload.mjs';

function fakeSupabase({ existingBuckets = [], uploadShouldFail = false } = {}) {
  const uploadCalls = [];
  return {
    storage: {
      listBuckets: vi.fn().mockResolvedValue({ data: existingBuckets.map((name) => ({ name })), error: null }),
      createBucket: vi.fn().mockResolvedValue({ error: null }),
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockImplementation((name, contents, opts) => {
          uploadCalls.push({ name, contents, opts });
          return Promise.resolve(uploadShouldFail ? { error: { message: 'network error' } } : { error: null });
        }),
      }),
    },
    __uploadCalls: uploadCalls,
  };
}

describe('ensureBucket', () => {
  it('creates the bucket when it does not exist yet', async () => {
    const supabase = fakeSupabase({ existingBuckets: [] });
    const created = await ensureBucket(supabase);
    expect(created).toBe(true);
    expect(supabase.storage.createBucket).toHaveBeenCalledWith(BUCKET, { public: false });
  });

  it('is idempotent — does nothing when the bucket already exists', async () => {
    const supabase = fakeSupabase({ existingBuckets: [BUCKET] });
    const created = await ensureBucket(supabase);
    expect(created).toBe(false);
    expect(supabase.storage.createBucket).not.toHaveBeenCalled();
  });

  it('throws a descriptive error when listing buckets fails', async () => {
    const supabase = fakeSupabase();
    supabase.storage.listBuckets.mockResolvedValueOnce({ data: null, error: { message: 'unauthorized' } });
    await expect(ensureBucket(supabase)).rejects.toThrow(/unauthorized/);
  });
});

describe('uploadFiles', () => {
  it('uploads each file and deletes the local copy only after a confirmed successful upload', async () => {
    const supabase = fakeSupabase();
    const fsImpl = {
      readFileSync: vi.fn().mockReturnValue(Buffer.from('<html></html>')),
      unlinkSync: vi.fn(),
    };
    const results = await uploadFiles(supabase, ['/tmp/fb-group-a-2026-08-23.html'], fsImpl);
    expect(results).toEqual([{ name: 'fb-group-a-2026-08-23.html', ok: true }]);
    expect(fsImpl.unlinkSync).toHaveBeenCalledWith('/tmp/fb-group-a-2026-08-23.html');
    expect(supabase.__uploadCalls[0].name).toBe('fb-group-a-2026-08-23.html');
  });

  it('never deletes the local file when the upload fails — nothing lost silently', async () => {
    const supabase = fakeSupabase({ uploadShouldFail: true });
    const fsImpl = { readFileSync: vi.fn().mockReturnValue(Buffer.from('x')), unlinkSync: vi.fn() };
    const results = await uploadFiles(supabase, ['/tmp/fb-group-b.html'], fsImpl);
    expect(results).toEqual([{ name: 'fb-group-b.html', ok: false, reason: 'upload failed: network error' }]);
    expect(fsImpl.unlinkSync).not.toHaveBeenCalled();
  });

  it('skips (but does not crash on) a file that cannot be read, and keeps processing the rest', async () => {
    const supabase = fakeSupabase();
    const fsImpl = {
      readFileSync: vi
        .fn()
        .mockImplementationOnce(() => {
          throw new Error('ENOENT');
        })
        .mockReturnValueOnce(Buffer.from('<html></html>')),
      unlinkSync: vi.fn(),
    };
    const results = await uploadFiles(supabase, ['/tmp/missing.html', '/tmp/real.html'], fsImpl);
    expect(results[0].ok).toBe(false);
    expect(results[1].ok).toBe(true);
    expect(fsImpl.unlinkSync).toHaveBeenCalledTimes(1);
  });
});

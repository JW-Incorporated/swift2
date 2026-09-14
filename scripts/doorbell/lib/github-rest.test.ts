import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error plain module
import { githubRequest } from './github-rest.mjs';

describe('githubRequest', () => {
  it('fails a non-204 response whose complete body cannot be read', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200, headers: { get: () => 'Sun, 14 Sep 2026 18:00:00 GMT' }, json: () => Promise.reject(new Error('cut off')) });
    const result = await githubRequest({ url: 'https://example.invalid' }, 'secret', { fetchImpl });
    expect(result).toMatchObject({ ok: false, status: 200, data: null });
    expect(result.date).toContain('Sep 2026');
  });
});

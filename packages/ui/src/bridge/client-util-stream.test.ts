import { describe, expect, it } from 'vitest';
import { API_STREAM_CHUNK_BYTES, apiCommandTimeout, CLOWN_TIMEOUT_MS } from './api-timeout';
import { resultFits } from './client-util';
import { MAX_PAYLOAD_SIZE, canonicalize } from './validate';

describe('resultFits: streamed api', () => {
  it('api accepts the buffered shape or a stream head, nothing in between', () => {
    expect(resultFits('api', { status: 200, headers: {}, body: 'x' })).toBe(true);
    expect(resultFits('api', { status: 200, headers: { a: 'b' }, streamId: 's1' })).toBe(true);
    expect(resultFits('api', { status: 200, headers: {} })).toBe(false);
    expect(resultFits('api', { status: 200, headers: {}, streamId: 7 })).toBe(false);
  });

  it('apiRead is exactly { chunk, done }', () => {
    expect(resultFits('apiRead', { chunk: '', done: false })).toBe(true);
    expect(resultFits('apiRead', { chunk: 'a', done: true, extra: 1 })).toBe(false);
    expect(resultFits('apiRead', { chunk: 1, done: true })).toBe(false);
    expect(resultFits('apiRead', null)).toBe(false);
  });

  it('the worst-case escaped 32 KB chunk still fits the canonicalize payload cap', () => {
    const worst = { chunk: '\u0001'.repeat(API_STREAM_CHUNK_BYTES), done: false };
    expect(canonicalize(worst).ok).toBe(true);
    expect(JSON.stringify(worst).length).toBeLessThan(MAX_PAYLOAD_SIZE);
  });

  it('the stream head keeps the clown total deadline', () => {
    expect(apiCommandTimeout({ req: { method: 'POST', path: '/api/clown' }, stream: true })).toBe(CLOWN_TIMEOUT_MS);
  });
});

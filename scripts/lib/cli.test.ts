import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error -- plain ESM helper, no type declarations
import { isSchemaPending, runMain } from './cli.mjs';

describe('isSchemaPending', () => {
  it('matches PostgREST schema-cache-absent errors', () => {
    expect(isSchemaPending('schema cache miss for table foo')).toBe(true);
    expect(isSchemaPending('relation "knowledge_doc" does not exist')).toBe(true);
    expect(isSchemaPending('PGRST204: column not found')).toBe(true);
    expect(isSchemaPending('PGRST205: table not found in schema cache')).toBe(true);
  });

  it('accepts an Error object as well as a string', () => {
    expect(isSchemaPending(new Error('PGRST205 table missing'))).toBe(true);
  });

  it('does not match a genuine unrelated failure', () => {
    expect(isSchemaPending('permission denied for table foo')).toBe(false);
    expect(isSchemaPending('ECONNREFUSED')).toBe(false);
  });
});

describe('runMain', () => {
  it('leaves exitCode untouched on success with no return value', async () => {
    process.exitCode = undefined;
    await runMain(() => {}, { name: 'test-script' });
    expect(process.exitCode).toBeUndefined();
  });

  it('sets exitCode to a number returned by fn', async () => {
    process.exitCode = undefined;
    await runMain(() => 2, { name: 'test-script' });
    expect(process.exitCode).toBe(2);
    process.exitCode = undefined;
  });

  it('awaits an async fn and honors its returned exit code', async () => {
    process.exitCode = undefined;
    await runMain(async () => {
      await Promise.resolve();
      return 0;
    }, { name: 'test-script' });
    expect(process.exitCode).toBe(0);
  });

  it('prints a uniform "[name] error:" line and sets exitCode 1 when fn throws', async () => {
    process.exitCode = undefined;
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await runMain(() => {
      throw new Error('boom');
    }, { name: 'test-script' });
    expect(process.exitCode).toBe(1);
    expect(spy).toHaveBeenCalledWith('[test-script] error:', expect.stringContaining('boom'));
    spy.mockRestore();
    process.exitCode = undefined;
  });

  it('catches an async rejection the same way', async () => {
    process.exitCode = undefined;
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await runMain(async () => {
      throw new Error('async boom');
    }, { name: 'test-script' });
    expect(process.exitCode).toBe(1);
    expect(spy).toHaveBeenCalledWith('[test-script] error:', expect.stringContaining('async boom'));
    spy.mockRestore();
    process.exitCode = undefined;
  });
});

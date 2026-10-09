import { describe, expect, it } from 'vitest';
import { pathToFileURL } from 'node:url';
// @ts-expect-error untyped .mjs helper
import { isMain } from './is-main.mjs';

describe('isMain', () => {
  it('matches a Windows-style drive path', () => {
    expect(isMain('file:///C:/Users/me/repo/scripts/x.mjs', 'C:\\Users\\me\\repo\\scripts\\x.mjs')).toBe(
      process.platform === 'win32',
    );
  });

  it('matches the url produced for the current platform path', () => {
    const p = process.argv[1] ?? 'x.mjs';
    expect(isMain(pathToFileURL(p).href, p)).toBe(true);
  });

  it('is false for a different file or a missing argv[1]', () => {
    expect(isMain('file:///a/b.mjs', '/a/c.mjs')).toBe(false);
    expect(isMain('file:///a/b.mjs', undefined)).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { buildLocation, pathOnly } from './feedback-location';

describe('pathOnly', () => {
  it('drops origin, query string and hash', () => {
    expect(pathOnly('https://www.longlivets.com/era/lover?x=1&email=a@b.c#sec')).toBe('/era/lover');
    expect(pathOnly('/threads?lens=a')).toBe('/threads');
    expect(pathOnly('https://x.com')).toBe('/');
    expect(pathOnly('//secret.host/era/lover?x=1')).toBe('/era/lover');
    expect(pathOnly(undefined)).toBeUndefined();
  });
});

describe('buildLocation', () => {
  it('sends a query-free path and a coarse platform, never a url or raw user agent', () => {
    const state = { eraId: 'lover', mode: 'era' } as never;
    const host = { currentUrl: () => 'https://www.longlivets.com/era/lover?token=SECRET#h' } as never;
    const loc = buildLocation(state, host) as Record<string, unknown>;
    expect(loc.path).toBe('/era/lover');
    expect(loc).not.toHaveProperty('url');
    expect(loc).not.toHaveProperty('userAgent');
    expect(JSON.stringify(loc)).not.toContain('SECRET');
    expect(JSON.stringify(loc)).not.toContain(navigator.userAgent);
  });
});

import { describe, expect, it, vi } from 'vitest';
import { buildLocation, pathOnly, platformLabel } from './feedback-location';

describe('platformLabel', () => {
  it('uses the host platform, never the user-agent, when the host names one', () => {
    expect(platformLabel('ios')).toBe('iOS app');
    expect(platformLabel('android')).toBe('Android app');
    expect(platformLabel('app')).toBe('mobile app');
  });
  it('labels the web host by viewport width', () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0' });
    vi.stubGlobal('window', { innerWidth: 500 });
    expect(platformLabel('web')).toBe('web: mobile');
    vi.stubGlobal('window', { innerWidth: 1200 });
    expect(platformLabel('web')).toBe('web: desktop');
    vi.unstubAllGlobals();
  });
  it('flows through buildLocation from the host adapter', () => {
    const state = { eraId: 'lover', mode: 'era' } as never;
    expect(buildLocation(state, { platform: 'ios' } as never).platform).toBe('iOS app');
    expect(buildLocation(state, { platform: 'android' } as never).platform).toBe('Android app');
  });
});

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

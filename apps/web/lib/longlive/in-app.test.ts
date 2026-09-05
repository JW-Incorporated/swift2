import { describe, expect, it } from 'vitest';

import { inAppPlatformFromUserAgent, isInApp } from './in-app';

describe('inAppPlatformFromUserAgent', () => {
  it('detects the iOS app marker', () => {
    const ua =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 LongLiveApp/1.2.3 (ios)';
    expect(inAppPlatformFromUserAgent(ua)).toBe('ios');
  });

  it('detects the Android app marker', () => {
    const ua = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 LongLiveApp/1.2.3 (android)';
    expect(inAppPlatformFromUserAgent(ua)).toBe('android');
  });

  it('returns null for a regular browser user-agent', () => {
    const ua =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    expect(inAppPlatformFromUserAgent(ua)).toBeNull();
  });

  it('returns null for a missing or empty user-agent', () => {
    expect(inAppPlatformFromUserAgent(null)).toBeNull();
    expect(inAppPlatformFromUserAgent(undefined)).toBeNull();
    expect(inAppPlatformFromUserAgent('')).toBeNull();
  });

  it('returns null when the marker has an unrecognized platform token', () => {
    const ua = 'Mozilla/5.0 LongLiveApp/1.2.3 (windows)';
    expect(inAppPlatformFromUserAgent(ua)).toBeNull();
  });
});

describe('isInApp', () => {
  it('is true when the UA carries the app marker', () => {
    expect(isInApp('LongLiveApp/1.0 (ios)')).toBe(true);
  });

  it('is false for a regular browser UA', () => {
    expect(isInApp('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0')).toBe(false);
  });
});

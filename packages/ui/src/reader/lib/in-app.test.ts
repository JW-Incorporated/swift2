import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  inAppPlatformFromUserAgent,
  isInApp,
  isInAppDocument,
  postToNativeApp,
} from './in-app';

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

describe('isInAppDocument', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is false when there is no document (SSR/node)', () => {
    expect(isInAppDocument()).toBe(false);
  });

  it('is true when RootLayout set data-app on <html>', () => {
    vi.stubGlobal('document', { documentElement: { dataset: { app: 'ios' } } });
    expect(isInAppDocument()).toBe(true);
  });

  it('is false when <html> has no data-app attribute', () => {
    vi.stubGlobal('document', { documentElement: { dataset: {} } });
    expect(isInAppDocument()).toBe(false);
  });
});

describe('postToNativeApp', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does nothing and returns false outside the app', () => {
    expect(postToNativeApp({ type: 'openNotificationSettings' })).toBe(false);
  });

  it('posts the exact JSON payload to window.ReactNativeWebView', () => {
    const postMessage = vi.fn();
    vi.stubGlobal('window', { ReactNativeWebView: { postMessage } });

    const result = postToNativeApp({ type: 'openNotificationSettings' });

    expect(result).toBe(true);
    expect(postMessage).toHaveBeenCalledExactlyOnceWith(
      JSON.stringify({ type: 'openNotificationSettings' }),
    );
  });

  it('posts the openInbox payload too', () => {
    const postMessage = vi.fn();
    vi.stubGlobal('window', { ReactNativeWebView: { postMessage } });

    postToNativeApp({ type: 'openInbox' });

    expect(postMessage).toHaveBeenCalledExactlyOnceWith(JSON.stringify({ type: 'openInbox' }));
  });

  it('is a no-op when window exists but the native bridge is not injected', () => {
    vi.stubGlobal('window', {});
    expect(postToNativeApp({ type: 'openInbox' })).toBe(false);
  });
});

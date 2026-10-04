import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ ActivityIndicator: 'x', BackHandler: {}, Linking: {}, Platform: { OS: 'ios' }, Pressable: 'x', StyleSheet: { create: (s: unknown) => s }, Text: 'x', View: 'x' }));
vi.mock('expo-constants', () => ({ default: { expoConfig: { version: '1' } } }));
vi.mock('react-native-webview', () => ({ WebView: 'x' }));

import { isSiteUrl } from './SiteShell';
import { SITE_URL } from '../lib/site-url';

describe('isSiteUrl (https origins only)', () => {
  it.each(['https://www.longlivets.com/era/x?y=1', 'https://longlivets.com/', SITE_URL, `${SITE_URL}/privacy`])('allows %s', (u) => {
    expect(isSiteUrl(u)).toBe(true);
  });
  it.each([
    'http://longlivets.com', 'http://www.longlivets.com/x', 'intent://longlivets.com/x', 'javascript://longlivets.com/x',
    'mailto://x@longlivets.com', 'https://longlivets.com.evil', 'https://longlivets.com.evil.test/x', 'about:blank', 'not a url',
  ])('denies %s', (u) => {
    expect(isSiteUrl(u)).toBe(false);
  });
});

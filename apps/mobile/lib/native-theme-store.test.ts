import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { ERA_TOKENS } from '@swift2/experience';
import { DEFAULT_NATIVE_THEME, effectiveNativeTheme, getNativeTheme, resetNativeTheme, setNativeTheme, subscribeNativeTheme } from './native-theme-store';

describe('native theme store', () => {
  it('starts at the site theme (web viewport themeColor / --era-bg)', () => {
    expect(DEFAULT_NATIVE_THEME).toEqual({ statusBarStyle: 'light', background: ERA_TOKENS.bg });
    expect(readFileSync(new URL('../../web/app/layout.tsx', import.meta.url), 'utf8')).toContain(`themeColor: '${ERA_TOKENS.bg}'`);
    expect(getNativeTheme()).toBe(DEFAULT_NATIVE_THEME);
  });
  it('notifies only on a real change', () => {
    const l = vi.fn();
    const off = subscribeNativeTheme(l);
    setNativeTheme(DEFAULT_NATIVE_THEME);
    expect(l).not.toHaveBeenCalled();
    setNativeTheme({ statusBarStyle: 'dark', background: '#ffffff' });
    expect(l).toHaveBeenCalledTimes(1);
    expect(getNativeTheme().background).toBe('#ffffff');
    off();
    setNativeTheme(DEFAULT_NATIVE_THEME);
    expect(l).toHaveBeenCalledTimes(1);
  });
});

describe('cold start', () => {
  it('the reader placeholder renders no visible text and uses the site background', () => {
    const src = readFileSync(new URL('../dom/AppReader.tsx', import.meta.url), 'utf8');
    expect(src).not.toMatch(/Loading\.\.\./);
    expect(src).toContain("background: 'var(--era-bg)'");
  });
});

describe('fallback reset', () => {
  const light = { statusBarStyle: 'dark', background: '#ffffff' } as const;
  it('a DOM theme applies only while the DOM is rendered; fallback and update-required use the default', () => {
    expect(effectiveNativeTheme(true, light)).toBe(light);
    expect(effectiveNativeTheme(false, light)).toBe(DEFAULT_NATIVE_THEME);
  });
  it('resetNativeTheme restores the default (host teardown, fallback)', () => {
    setNativeTheme(light);
    expect(getNativeTheme()).toBe(light);
    resetNativeTheme();
    expect(getNativeTheme()).toBe(DEFAULT_NATIVE_THEME);
  });
});

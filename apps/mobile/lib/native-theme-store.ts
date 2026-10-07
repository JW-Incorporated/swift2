// Native chrome theme (status bar content + host background). Starts at the site's default
// (ERA_TOKENS.bg, the web viewport themeColor); the reader's `theme` bridge command moves it per
// era/surface. A tiny external store so App.tsx re-renders without a context provider.
import { ERA_TOKENS } from '@swift2/experience';
import type { ThemeChange } from '@swift2/ui';

export const DEFAULT_NATIVE_THEME: ThemeChange = { statusBarStyle: 'light', background: ERA_TOKENS.bg };

let current: ThemeChange = DEFAULT_NATIVE_THEME;
const listeners = new Set<() => void>();

export const getNativeTheme = (): ThemeChange => current;

export function setNativeTheme(next: ThemeChange): void {
  if (next.background === current.background && next.statusBarStyle === current.statusBarStyle) return;
  current = next;
  listeners.forEach((l) => l());
}

export const resetNativeTheme = (): void => setNativeTheme(DEFAULT_NATIVE_THEME);

/** The reader's theme only applies while the DOM surface is rendered; native screens/fallback/update-required use the default. */
export const effectiveNativeTheme = (domRendered: boolean, theme: ThemeChange): ThemeChange =>
  domRendered ? theme : DEFAULT_NATIVE_THEME;

export function subscribeNativeTheme(listener: () => void): () => void {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

// Test setup for jsdom render tests: polyfills window.matchMedia, which
// jsdom does not implement. TimelineScrubber (mounted inside TopBar) and
// other components read it to react to viewport breakpoints. Returns a
// static non-matching MediaQueryList; render tests assert DOM structure and
// classes, not actual breakpoint-triggered behavior, so a static match is
// sufficient — components that need to exercise a specific breakpoint can
// override `window.matchMedia` per-test.
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// @testing-library/react's own auto-cleanup only self-registers when it
// finds a GLOBAL `afterEach` (typeof afterEach === 'function' at import
// time) — this project doesn't set vitest's `test.globals: true`, so that
// check never fires and every render test file leaks its mounted trees into
// the next test, causing spurious "found multiple elements" failures the
// moment a file has more than one render() call. Registering it explicitly
// here (Vitest's own `afterEach`, imported normally) restores real
// per-test isolation.
afterEach(() => {
  cleanup();
});

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList;
}

// jsdom also has no ResizeObserver (TimelineScrubber/ModeToggle use one to
// re-measure on layout changes). A no-op stub is enough for render tests
// that assert static DOM structure, not live-resize behavior.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// jsdom implements window.scrollTo but not Element.prototype.scrollTo —
// several overlays (MomentDetail's scroll-reset effect, TimelineScrubber's
// scroll listener target) call it directly on a DOM node. A no-op is
// sufficient for render tests, which assert structure, not scroll position.
if (typeof Element !== 'undefined' && !Element.prototype.scrollTo) {
  Element.prototype.scrollTo = function scrollTo() {};
}

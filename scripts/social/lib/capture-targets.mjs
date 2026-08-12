// Pure target -> { path, readiness } resolution for capture-screens.mjs,
// split out so the URL/flag logic is unit-testable without spinning up a
// real browser. Mirrors the deep-link contract in
// apps/web/lib/longlive/deepLink.ts (?item=/?lens=/?era=) plus the Mood
// mode, which has no deep link at all (TopBar.tsx's tablist) and so is
// reached by a UI click instead of a URL.
export const VIEWPORTS = {
  // IG feed-friendly: 390x844 is a common modern-phone CSS viewport (iPhone
  // 12/13/14 class); deviceScaleFactor 2 gives a crisp @2x capture without
  // needing a real high-DPI display.
  mobile: { width: 390, height: 844, deviceScaleFactor: 2 },
  desktop: { width: 1280, height: 800, deviceScaleFactor: 2 },
};

/**
 * @param {{ lens?: string, era?: string, item?: string, mood?: boolean, url?: string }} args
 * @returns {{ path: string, readiness: 'lens'|'era'|'item'|'mood'|'none' }}
 */
export function resolveTarget(args) {
  const picked = ['lens', 'era', 'item', 'mood', 'url'].filter((k) => args[k]);
  if (picked.length === 0) {
    throw new Error('Pass exactly one of --lens, --era, --item, --mood, or --url.');
  }
  if (picked.length > 1) {
    throw new Error(`Pass exactly one target, got: ${picked.map((k) => `--${k}`).join(', ')}`);
  }

  if (args.lens) return { path: `/?lens=${encodeURIComponent(args.lens)}`, readiness: 'lens' };
  if (args.era) return { path: `/?era=${encodeURIComponent(args.era)}`, readiness: 'era' };
  if (args.item) return { path: `/?item=${encodeURIComponent(args.item)}`, readiness: 'item' };
  if (args.mood) return { path: '/', readiness: 'mood' };
  // Escape hatch: an already-relative path/query, or a full URL on the same
  // site — either way Playwright's `page.goto` resolves it against baseURL.
  return { path: args.url, readiness: 'none' };
}

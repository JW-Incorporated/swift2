// WP0.5b DEV/WEB ONLY. A browser has no native cache, so this assembles the
// same `{ manifest, files }` envelope the native loader stores from a served
// copy of the bundle built by scripts/build-content-bundle.mjs
// (apps/web/public/content). Only apps/mobile/index.web.ts imports it; the DOM
// bundle shipped in the app must not contain it (scripts/parity/check-dom-bundle.mjs).
export async function loadDevEnvelope(baseUrl: string): Promise<string> {
  const get = async (path: string) => (await fetch(`${baseUrl.replace(/\/+$/, '')}/${path}`)).json();
  const { bundleVersion } = await get('current.json');
  const manifest = await get(`${bundleVersion}/manifest.json`);
  const entries = Object.entries(manifest.files as Record<string, { path: string }>);
  const files: Record<string, unknown> = {};
  await Promise.all(
    entries.map(async ([name, f]) => {
      files[name] = await get(`${bundleVersion}/${f.path}`);
    }),
  );
  return JSON.stringify({ manifest, files });
}

// WP0.5a: Metro resolution rules for the real-screens spike. When the DOM/web
// bundle (platform 'web') imports reader code that lives under apps/web, the
// Next-only modules and the baked content modules are redirected to
// app-side stubs/shims, and the React family is forced to the mobile copy.
// Native iOS/Android resolution and any origin outside apps/web are untouched.
//
// Matching is on the RESOLVED ABSOLUTE PATH, not the specifier, so
// `./content` and `@/lib/longlive/content` redirect identically.
const path = require('path');

const SHIMMED = ['content', 'videos', 'tracks', 'era-secrets', 'merch', 'theories'];
const NEXT_STUBS = { 'next/link': 'link.tsx', 'next/image': 'image.tsx', 'next/dynamic': 'dynamic.tsx' };
const SINGLETONS = ['react', 'react-dom', 'scheduler'];
const SOURCE_EXT = /\.(tsx?|jsx?)$/;

const norm = (p) => (process.platform === 'win32' ? p.toLowerCase() : p);

function createSpikeResolver({ webRoot, spikeDir, pinned }) {
  const webPrefix = norm(path.resolve(webRoot) + path.sep);
  // Also true for apps/web/node_modules origins. Acceptable: packages nested there
  // are web-only deps, so the same rules apply to them (react pinned to the mobile
  // copy, next/* stubbed or reported); native and non-web platforms never reach here.
  const underWeb = (file) => typeof file === 'string' && norm(path.resolve(file)).startsWith(webPrefix);

  const shimByPath = new Map(
    SHIMMED.map((name) => [
      norm(path.join(path.resolve(webRoot), 'lib', 'longlive', name)),
      path.join(spikeDir, 'shims', `${name}.ts`),
    ]),
  );

  function absoluteTarget(origin, specifier) {
    let abs;
    if (specifier.startsWith('@/')) abs = path.join(path.resolve(webRoot), specifier.slice(2));
    else if (specifier.startsWith('./') || specifier.startsWith('../')) {
      abs = path.resolve(path.dirname(origin), specifier);
    } else return null;
    return abs;
  }

  /**
   * Returns a Metro resolution, or null to let the normal chain run.
   * `fallback(context, moduleName, platform)` is the default resolver.
   */
  return function resolveSpike(context, moduleName, platform, fallback) {
    if (platform !== 'web') return null;
    const origin = context.originModulePath;
    if (!underWeb(origin)) return null;

    const stub = NEXT_STUBS[moduleName];
    if (stub) return { type: 'sourceFile', filePath: path.join(spikeDir, 'stubs', stub) };
    if (moduleName === 'next' || moduleName.startsWith('next/')) {
      throw new Error(
        `spike resolver: '${moduleName}' imported from ${origin} has no DOM stub; add one under dom/spike/stubs and register it in NEXT_STUBS.`,
      );
    }

    const target = absoluteTarget(origin, moduleName);
    if (target !== null) {
      const shim = shimByPath.get(norm(target.replace(SOURCE_EXT, '')));
      if (shim) return { type: 'sourceFile', filePath: shim };
      // '@/' has no tsconfig-paths support in Metro: resolve it as the absolute path.
      return moduleName.startsWith('@/') ? fallback(context, target, platform) : null;
    }

    for (const name of SINGLETONS) {
      if ((moduleName === name || moduleName.startsWith(`${name}/`)) && pinned[name]) {
        return fallback(
          { ...context, originModulePath: path.join(pinned[name], 'package.json') },
          moduleName,
          platform,
        );
      }
    }
    return null;
  };
}

module.exports = { createSpikeResolver, SHIMMED };

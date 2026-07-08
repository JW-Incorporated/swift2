// Metro config for the npm-workspace monorepo: watch the repo root and let
// Metro resolve the hoisted node_modules + the workspace packages
// (@swift2/shared, @swift2/core) that this app consumes as source.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
// Look in the app's own node_modules first, then the hoisted root — but keep
// hierarchical lookup ON (npm workspaces hoist most deps to root yet still nest
// some, e.g. react-native's @react-native/virtualized-lists, under a package's
// own node_modules; Metro must be able to walk up to resolve those).
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// ---------------------------------------------------------------------------
// Singleton pinning — the load-bearing part of this config.
//
// npm's workspace hoisting gives this repo MULTIPLE copies of packages that
// must be singletons in a React Native bundle:
//
//   - `react`        18.3.1 at the repo root (hoisted for apps/web) AND
//                    18.2.0 in apps/mobile/node_modules (RN 0.74's exact peer).
//   - `react-native` 0.74.5 in apps/mobile/node_modules AND a stray 0.86.0
//                    under node_modules/expo/node_modules (npm auto-installed
//                    it for @expo/vector-icons' loose `react-native: *` peer;
//                    root `overrides` cannot force auto-installed peers).
//
// Without pinning, imports that originate inside node_modules/expo/* walk up
// and grab the WRONG copies: RN 0.86's TS-syntax index.js breaks Babel at
// bundle time, and a second React instance would break hooks at runtime.
// Pinning by module name guarantees exactly one copy of each singleton in
// every bundle, regardless of how npm laid out the tree (locally or on EAS).
const singletons = ['react', 'react-native'];

function pinnedOrigin(name) {
  // Resolve from the app's own node_modules so we always get the copy that
  // matches the Expo SDK.
  return path.dirname(require.resolve(`${name}/package.json`, { paths: [projectRoot] }));
}

const pinnedDirs = Object.fromEntries(singletons.map((name) => [name, pinnedOrigin(name)]));

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  for (const name of singletons) {
    if (moduleName === name || moduleName.startsWith(`${name}/`)) {
      const resolve = defaultResolveRequest ?? context.resolveRequest;
      return resolve(
        // Re-anchor the request inside the pinned copy so hierarchical lookup
        // starts (and succeeds) there, including for subpath imports like
        // `react/jsx-runtime` or `react-native/Libraries/...`.
        { ...context, originModulePath: path.join(pinnedDirs[name], 'package.json') },
        moduleName,
        platform,
      );
    }
  }
  const resolve = defaultResolveRequest ?? context.resolveRequest;
  return resolve(context, moduleName, platform);
};

module.exports = config;

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
// This monorepo runs TWO React majors on purpose: apps/web (Next.js) is on
// React 18.3.1 and stays there, while Expo SDK 57 puts mobile on React 19 +
// React Native 0.86. npm resolves that split by hoisting React 18.3.1 to the
// repo root (for web) and nesting React 19.2.x under apps/mobile/node_modules.
//
//   - `react`        18.3.1 at the repo root (web) AND 19.2.x nested under
//                    apps/mobile (RN 0.86's peer). If the mobile bundle picked
//                    up the root's 18.3.1, hooks in a React-19 renderer would
//                    crash at runtime — two React copies in one bundle.
//   - `react-native` 0.86.0, only under apps/mobile today, but pinned defensively
//                    so future hoisting can never split it either.
//
// Pinning by module name guarantees exactly one copy of each singleton in
// every bundle, anchored to the app's own node_modules, regardless of how npm
// lays out the tree (locally or on EAS). react-native-reanimated/-worklets and
// -gesture-handler live only under apps/mobile, so they need no pinning.
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

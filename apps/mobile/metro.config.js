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

module.exports = config;

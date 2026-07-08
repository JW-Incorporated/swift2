module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // babel-preset-expo would normally auto-add the Reanimated plugin, but its
    // detection (`require.resolve` from the ROOT-hoisted preset) cannot see
    // apps/mobile/node_modules in this npm-workspace layout — so it must be
    // explicit here. Resolving from THIS file finds the app's copy. Keep it
    // the LAST plugin (Reanimated requirement).
    plugins: [require.resolve('react-native-reanimated/plugin')],
  };
};

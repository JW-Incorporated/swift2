module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // babel-preset-expo would normally auto-add the worklets plugin, but its
    // detection (`require.resolve` from the ROOT-hoisted preset) cannot see
    // apps/mobile/node_modules in this npm-workspace layout — so it must be
    // explicit here. Resolving from THIS file finds the app's copy.
    //
    // Reanimated 4 moved the worklet transform out to `react-native-worklets`
    // (react-native-reanimated/plugin now just re-exports it); point at the
    // canonical package. Keep it the LAST plugin (worklets requirement).
    plugins: [require.resolve('react-native-worklets/plugin')],
  };
};

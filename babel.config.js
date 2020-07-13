module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  env: {
    debug: {
      plugins: ['react-native-paper/babel'],
    },
    production: {
      plugins: ['react-native-paper/babel'],
    },
  },
};

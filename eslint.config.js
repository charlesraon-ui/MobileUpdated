// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const globals = require('globals');

module.exports = defineConfig([
  // Expo/React Native config for the mobile and app directories
  expoConfig,
  // Node backend override: recognize Node globals (e.g., Buffer, process)
  {
    files: ['backend/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    ignores: ['dist/*'],
  },
]);

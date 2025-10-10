const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

// Extend Metro config so the mobile project can resolve assets from the
// workspace root (one level up). This lets us use ../../assets/... paths.
const config = getDefaultConfig(__dirname);

// Include the workspace root so modules and assets outside the project can be watched.
config.watchFolders = [path.resolve(__dirname, "..")];

// Allow requiring assets outside the project root (needed for ../../assets/...)
config.resolver = {
  ...config.resolver,
  unstable_allowRequireOutsideProject: true,
};

module.exports = config;
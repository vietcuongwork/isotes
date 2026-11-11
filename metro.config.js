const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push("sql");

// Test flows write screenshots and logs to .sim/. Metro watched it and sent an
// HMR update when a file landed there. blockList is matched against absolute
// paths, and Expo's defaults are kept by spreading. RegExp.escape needs Node 24+
const simDir = RegExp.escape(path.join(__dirname, ".sim"));
config.resolver.blockList = [
  ...config.resolver.blockList,
  new RegExp(`^${simDir}(/|$)`),
];

module.exports = withNativeWind(config, { input: "./global.css" });

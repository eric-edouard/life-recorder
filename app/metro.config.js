const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

// Monorepo setup
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");
const config = getDefaultConfig(projectRoot);
config.watchFolders = [...(config.watchFolders || []), workspaceRoot];
config.resolver.nodeModulesPaths = [
	...new Set([
		...(config.resolver.nodeModulesPaths || []),
		path.resolve(projectRoot, "node_modules"),
		path.resolve(workspaceRoot, "node_modules"),
	]),
];
config.resolver.resolverMainFields = [
	"react-native",
	"browser",
	"main",
	...(config.resolver.resolverMainFields || []),
];

// Needed for better-auth
config.resolver.unstable_enablePackageExports = true;

config.transformer.minifierConfig = {
	compress: {
		// The option below removes all console logs statements in production.
		drop_console: true,
	},
};

// Nativewind setup
module.exports = withNativeWind(config, { input: "./global.css" });

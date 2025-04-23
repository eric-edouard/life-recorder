module.exports = (api) => {
	api.cache(true);
	return {
		presets: [
			["babel-preset-expo", { jsxImportSource: "nativewind" }],
			"nativewind/babel",
		],
		plugins: [
			[
				"module-resolver",
				{
					root: ["./src"],
					alias: {
						"@app": "../app/src",
						"@backend": "../backend/src",
						"@shared": "../shared",
					},
					extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
				},
			],
		],
	};
};
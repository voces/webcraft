module.exports = {
	extends: ["verit"],
	overrides: [
		{
			files: ["./src/core/**"],
			rules: {
				"no-restricted-imports": [
					"error",
					{ patterns: ["**/engine/*", "**/katma/*"] },
				],
			},
		},
		{
			files: ["./src/engine/**"],
			rules: {
				"no-restricted-imports": [
					"error",
					{ patterns: ["**/katma/*"] },
				],
			},
		},
	],
};

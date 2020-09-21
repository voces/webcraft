module.exports = {
	extends: ["verit"],
	rules: {
		"@typescript-eslint/no-unnecessary-type-assertion": "error",
		"@typescript-eslint/no-this-alias": [
			"error",
			{ allowedNames: ["mutable"] },
		],
	},
	parserOptions: { project: "./tsconfig.json" },
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

module.exports = {
	extends: ["verit"],
	plugins: ["simple-import-sort"],
	rules: {
		"@typescript-eslint/no-unnecessary-type-assertion": "error",
		"@typescript-eslint/no-this-alias": [
			"error",
			{ allowedNames: ["mutable"] },
		],
		"simple-import-sort/sort": "error"
	},
	parserOptions: { project: "./tsconfig.json", tsconfigRootDir: __dirname },
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
		{
			files: ["./src/katma/**"],
			rules: {
				"no-restricted-imports": [
					"error",
					{ patterns: ["**/engine/Game", "**/engine/Network"] },
				],
			},
		},
	],
};

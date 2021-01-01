module.exports = {
	extends: ["verit"],
	parserOptions: { project: "tsconfig.json", tsconfigRootDir: __dirname },
	settings: { react: { pragma: "h", version: "16.2" } },
	rules: {
		"@typescript-eslint/no-this-alias": [
			"error",
			{ allowedNames: ["mutable"] },
		],
		"@typescript-eslint/prefer-nullish-coalescing": "error",
	},
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
					{
						patterns: [
							"**/engine/Game",
							"**/engine/Network",
							"**/engine/players/Player",
						],
					},
				],
			},
		},
	],
};

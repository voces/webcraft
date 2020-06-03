const typeScript = {
	files: ["**/*.ts"],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		project: "./tsconfig.json",
	},
	plugins: ["@typescript-eslint"],
	extends: [
		"plugin:@typescript-eslint/eslint-recommended",
		"plugin:@typescript-eslint/recommended",
		"verit",
		"prettier/@typescript-eslint",
		"plugin:prettier/recommended",
	],
	rules: {
		"@typescript-eslint/camelcase": 0,
		"@typescript-eslint/no-unused-vars": 2,
		"@typescript-eslint/no-non-null-assertion": 0,
		"no-undef": 0,
		"no-unused-vars": 0,
		"no-dupe-class-members": 0,
	},
};

module.exports = {
	root: true,
	extends: ["verit", "plugin:prettier/recommended"],
	rules: {
		"@typescript-eslint/camelcase": 0,
		"@typescript-eslint/no-unused-vars": 2,
		"@typescript-eslint/no-non-null-assertion": 0,
		"no-undef": 0,
		"no-unused-vars": 0,
		"no-dupe-class-members": 0,
	},
	overrides: [typeScript],
};

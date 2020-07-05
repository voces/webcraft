const sharedRules = {
	"no-undef": "off",
	"no-unused-vars": "off",
	"no-dupe-class-members": "off",
	"padding-line-between-statements": "off",
	curly: ["error", "multi"],
};

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
		"@typescript-eslint/camelcase": "off",
		"@typescript-eslint/no-unused-vars": "error",
		"@typescript-eslint/no-non-null-assertion": "off",
		...sharedRules,
	},
};

module.exports = {
	root: true,
	extends: ["verit", "plugin:prettier/recommended"],
	rules: sharedRules,
	overrides: [typeScript],
};

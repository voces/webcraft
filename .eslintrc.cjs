module.exports = {
	extends: ["plugin:eslint-comments/recommended", "verit"],
	rules: {
		"eslint-comments/no-unused-disable": "error",
		"eslint-comments/disable-enable-pair": [
			"error",
			{ allowWholeFile: true },
		],
	},
};

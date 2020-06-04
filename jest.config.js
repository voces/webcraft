export default {
	globals: { "ts-jest": { tsConfig: "tsconfig.test.json" } },
	moduleDirectories: ["node_modules", "src"],
	moduleFileExtensions: ["ts", "js"],
	moduleNameMapper: {
		"^test/(.*)$": "<rootDir>/test/$1",
	},
	transform: {
		"^.+\\.ts$": "ts-jest",
		"^.+\\.js$": "babel-jest",
	},
	testEnvironment: "node",
	testRegex: "(/src/.*\\.test)\\.ts$",
	transformIgnorePatterns: [],
	resolver: "jest-ts-webcompat-resolver",
};

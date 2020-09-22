export default {
	moduleDirectories: ["node_modules", "src"],
	moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
	moduleNameMapper: {
		"^test/(.*)$": "<rootDir>/test/$1",
	},
	transform: {
		"^.+\\.tsx?$": "ts-jest",
		"^.+\\.jsx?$": "babel-jest",
	},
	testEnvironment: "node",
	testRegex: "(/src/.*\\.test)\\.tsx?$",
	transformIgnorePatterns: [],
	resolver: "jest-ts-webcompat-resolver",
	setupFilesAfterEnv: ["./src/engine/ui/preact/tests/setup.ts"],
};

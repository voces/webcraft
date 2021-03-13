import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "rollup-plugin-typescript2";

const plugins = [
	typescript({
		tsconfig: "tsconfig.build.json",
		tsconfigOverride: {
			compilerOptions: { declaration: true },
		},
	}),
	nodeResolve(),
	commonjs(),
];

export default [
	{
		input: ["src/katma/index.ts", "src/katma/server.ts"],
		output: [{ dir: "public/katma/js", format: "es" }],
		plugins,
	},
	{
		input: ["src/mazingcontest/index.ts", "src/mazingcontest/server.ts"],
		output: [{ dir: "public/mazingcontest/js", format: "es" }],
		plugins,
	},
];

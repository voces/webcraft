import { Basic } from "./Basic.js";
import { Dense } from "./Dense.js";
import { Huge } from "./Huge.js";
import { Large } from "./Large.js";
import { Resource } from "./Resource.js";
import { Slow } from "./Slow.js";
import { Stack } from "./Stack.js";
import { Tiny } from "./Tiny.js";
import { ValueOf } from "../../types.js";
export { Obstruction } from "./Obstruction.js";

export const obstructionMap = {
	Basic,
	Dense,
	Huge,
	Large,
	Resource,
	Slow,
	Stack,
	Tiny,
};

export type ObstructionSubclass = ValueOf<typeof obstructionMap>;

export { Basic, Dense, Huge, Large, Resource, Slow, Stack, Tiny };

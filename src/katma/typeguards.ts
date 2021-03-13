import type { App } from "../core/App";
import type { Entity } from "../core/Entity";
import type { Crosser } from "./entities/Crosser";
import type { Defender } from "./entities/Defender";
import type { Resource } from "./entities/obstructions/Resource";
import type { Slow } from "./entities/obstructions/Slow";
import type { Katma } from "./Katma";

export const isCrosser = (obj: Entity): obj is Crosser =>
	"isCrosser" in obj.constructor;

export const isDefender = (obj: Entity): obj is Defender =>
	"isDefender" in obj.constructor;

export const isResource = (obj: Entity): obj is Resource =>
	"isResource" in obj.constructor;

export const isSlow = (obj: Entity): obj is Slow => "isSlow" in obj.constructor;

export const isKatma = (obj: App): obj is Katma => "isKatma" in obj.constructor;

import { App } from "../core/App";
import { Entity } from "../core/Entity";
import { Crosser } from "./entities/Crosser";
import { Defender } from "./entities/Defender";
import { Resource } from "./entities/obstructions/Resource";
import { Slow } from "./entities/obstructions/Slow";
import { Katma } from "./Katma";

export const isCrosser = (obj: Entity): obj is Crosser =>
	"isCrosser" in obj.constructor;

export const isDefender = (obj: Entity): obj is Defender =>
	"isDefender" in obj.constructor;

export const isResource = (obj: Entity): obj is Resource =>
	"isResource" in obj.constructor;

export const isSlow = (obj: Entity): obj is Slow => "isSlow" in obj.constructor;

export const isKatma = (obj: App): obj is Katma => "isKatma" in obj.constructor;

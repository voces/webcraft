import { App } from "../core/App";
import { Entity } from "../core/Entity";
import { Crosser } from "./entities/Crosser";
import { Defender } from "./entities/Defender";
import { Slow } from "./entities/obstructions/Slow";
import { Katma } from "./Katma";

export const isKatma = (obj: App): obj is Katma => "isKatma" in obj;

export const isCrosser = (obj: Entity): obj is Crosser => "isCrosser" in obj;

export const isDefender = (obj: Entity): obj is Defender => "isDefender" in obj;

export const isSlow = (obj: Entity): obj is Slow => "isSlow" in obj;

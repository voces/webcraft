import type { App } from "../core/App";
import type { Entity } from "../core/Entity";
import type { Builder } from "./entities/Builder";
import type { Checkpoint } from "./entities/Checkpoint";
import type { Runner } from "./entities/Runner";
import type { Thunder } from "./entities/Thunder";
import type { MazingContest } from "./MazingContest";

export const isMazingContest = (obj: App): obj is MazingContest =>
	"isMazingContest" in obj.constructor;
export const isThunder = (obj: Entity): obj is Thunder => "isThunder" in obj;
export const isRunner = (obj: Entity): obj is Runner => "isRunner" in obj;
export const isCheckpoint = (obj: Entity): obj is Checkpoint =>
	"isCheckpoint" in obj;
export const isBuilder = (obj: Entity): obj is Builder => "isBuilder" in obj;

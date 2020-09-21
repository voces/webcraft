import { Entity } from "../core/Entity";
import { Widget } from "./entities/Widget";
import { Sprite } from "./entities/widgets/Sprite";
import { Unit } from "./entities/widgets/sprites/Unit";
import { Obstruction } from "./entities/widgets/sprites/units/Obstruction";
import { Game } from "./Game";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const isEntity = (obj: any): obj is Entity =>
	obj && typeof obj === "object" && obj.isEntity;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const isWidget = (obj: any): obj is Widget =>
	obj && typeof obj === "object" && obj.isWidget;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const isSprite = (obj: any): obj is Sprite =>
	obj && typeof obj === "object" && obj.isSprite;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const isUnit = (obj: any): obj is Unit =>
	obj && typeof obj === "object" && obj.isUnit;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const isObstruction = (obj: any): obj is Obstruction =>
	obj && typeof obj === "object" && obj.isObstruction;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const isGame = (obj: any): obj is Game => obj.isGame;

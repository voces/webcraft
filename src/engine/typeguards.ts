import { Entity } from "../core/Entity";
import { Sprite } from "../entities/sprites/Sprite";
import { Game } from "./Game";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const isEntity = (obj: any): obj is Entity =>
	obj && typeof obj === "object" && obj.isEntity;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const isSprite = (obj: any): obj is Sprite =>
	obj && typeof obj === "object" && obj.isSprite;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const isGame = (obj: any): obj is Game => obj.isGame;

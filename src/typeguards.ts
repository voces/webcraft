import { Sprite } from "./entities/sprites/Sprite";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const isSprite = (obj: any): obj is Sprite =>
	obj && typeof obj === "object" && obj.isSprite;

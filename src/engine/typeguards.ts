import type { Entity } from "../core/Entity";
import type { Widget } from "./entities/Widget";
import type { SelectionCircle } from "./entities/widgets/SelectionCircle";
import type { Sprite } from "./entities/widgets/Sprite";
import type { Projectile } from "./entities/widgets/sprites/Projectile";
import type { Unit } from "./entities/widgets/sprites/Unit";
import type { Obstruction } from "./entities/widgets/sprites/units/Obstruction";
import type { Game } from "./Game";

// eslint-disable-next-line @typescript-eslint/ban-types
export const isEntity = (obj: object): obj is Entity =>
	"isEntity" in obj.constructor;

// eslint-disable-next-line @typescript-eslint/ban-types
export const isWidget = (obj: object): obj is Widget =>
	"isWidget" in obj.constructor;

// eslint-disable-next-line @typescript-eslint/ban-types
export const isSelectionCircle = (obj: object): obj is SelectionCircle =>
	"isSelectionCircle" in obj.constructor;

// eslint-disable-next-line @typescript-eslint/ban-types
export const isSprite = (obj: object): obj is Sprite =>
	"isSprite" in obj.constructor;

// eslint-disable-next-line @typescript-eslint/ban-types
export const isProjectile = (obj: object): obj is Projectile =>
	"isProjectile" in obj.constructor;

// eslint-disable-next-line @typescript-eslint/ban-types
export const isUnit = (obj: object): obj is Unit => "isUnit" in obj.constructor;

// eslint-disable-next-line @typescript-eslint/ban-types
export const isObstruction = (obj: object): obj is Obstruction =>
	"isObstruction" in obj.constructor;

// eslint-disable-next-line @typescript-eslint/ban-types
export const isGame = (obj: object): obj is Game => "isGame" in obj.constructor;

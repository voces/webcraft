import { Player } from "../players/Player.js";
import { Sprite } from "../sprites/Sprite.js";

export const clone = <T>(obj: T): T => {
	if (
		typeof obj === "object" &&
		(obj instanceof Sprite || obj instanceof Player)
	)
		return obj;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const data: any = Array.isArray(obj) ? [] : {};
	for (const prop in obj) {
		data[prop] =
			typeof obj[prop] === "object" && obj[prop] !== null
				? clone(obj[prop])
				: obj[prop];
	}

	return data;
};

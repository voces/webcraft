import { PATHING_TYPES } from "../../../engine/constants";
import { Footprint } from "../../../engine/pathing/PathingMap";

export const toFootprint = (
	radius: number,
	pathing = PATHING_TYPES.WALKABLE | PATHING_TYPES.BUILDABLE,
): Footprint => {
	if (radius % 0.5 !== 0) throw new Error("radius must be a multiple of 0.5");

	return {
		map: Array<number>((radius * 4) ** 2).fill(pathing),
		top: -radius * 2,
		left: -radius * 2,
		width: radius * 4,
		height: radius * 4,
	};
};

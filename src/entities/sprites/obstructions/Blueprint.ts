import { Sprite } from "../Sprite";
import { Obstruction } from "./Obstruction";
import { Game } from "../../../Game";

export class Blueprint extends Sprite {
	static buildTime = 0;

	constructor({
		obstruction,
		...props
	}: {
		obstruction: typeof Obstruction;
		x: number;
		y: number;
		game: Game;
	}) {
		const clonedDefaults = obstruction.clonedDefaults;
		super({
			...clonedDefaults,
			selectable: false,
			id: -1,
			color: "rgba( 70, 145, 246 )",
			graphic: {
				...clonedDefaults.graphic,
				colorFilter: undefined,
				opacity: 0.5,
			},
			...props,
		});
	}
}

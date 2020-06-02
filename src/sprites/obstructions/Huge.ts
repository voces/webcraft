
import { Obstruction, ObstructionProps } from "./Obstruction.js";

export class Huge extends Obstruction {

	static defaults = {
		...Obstruction.defaults,
		radius: 2,
		maxHealth: 200,
		buildTime: 3,
		cost: { essence: 10 },
	}

	constructor( props: ObstructionProps ) {

		super( { ...Huge.defaults, ...props } );

	}

}

import { Component } from "../../core/Component";
import type { Obstruction } from "../entities/widgets/sprites/units/Obstruction";
import type { Mutable } from "../types";

export class UpgradeComponent extends Component<
	[obstruction: typeof Obstruction]
> {
	readonly obstruction!: typeof Obstruction;

	initialize(obstruction: typeof Obstruction): void {
		const mutable: Mutable<UpgradeComponent> = this;
		mutable.obstruction = obstruction;
	}
}

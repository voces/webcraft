import { Sprite } from "../sprites/Sprite";

export class Component<T extends Sprite = Sprite> {
	readonly entity: T;

	constructor(entity: T) {
		this.entity = entity;
	}

	dispose(): void {
		/* do nothing */
	}
}

export type ComponentConstructor<T extends Component> = new (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	...args: any[]
) => T;

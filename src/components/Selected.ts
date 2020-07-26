import { EComponent } from "../core/Component.js";
import { Sprite } from "../sprites/Sprite.js";

export class Selected extends EComponent {
	protected static map = new WeakMap<Sprite, Selected>();
	static get(entity: Sprite): Selected | undefined {
		return this.map.get(entity);
	}
}

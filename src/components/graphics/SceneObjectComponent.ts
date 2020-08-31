import { Component } from "../../core/Component";
import { Entity } from "../../core/Entity";
import { Object3D } from "three";

export class SceneObjectComponent extends Component<[Object3D]> {
	protected static map = new WeakMap<Entity, SceneObjectComponent>();
	static get(entity: Entity): SceneObjectComponent | undefined {
		return this.map.get(entity);
	}

	readonly object!: Object3D;

	constructor(entity: Entity, object: Object3D) {
		super(entity, object);
	}

	protected initialize(object: Object3D): void {
		// Use defineProperty to avoid readonly restriction
		Object.defineProperty(this, "object", { value: object });
	}
}

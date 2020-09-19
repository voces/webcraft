import { Component } from "../../../core/Component";
import { Object3D } from "three";

export class ThreeObjectComponent extends Component<[Object3D]> {
	readonly object!: Object3D;

	protected initialize(object: Object3D): void {
		// Use defineProperty to avoid readonly restriction
		Object.defineProperty(this, "object", { value: object });
	}
}

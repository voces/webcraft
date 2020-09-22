import { Object3D } from "three";

import { Component } from "../../../core/Component";
import { Mutable } from "../../types";

export class ThreeObjectComponent extends Component<[Object3D]> {
	readonly object!: Object3D;

	protected initialize(object: Object3D): void {
		const mutable: Mutable<ThreeObjectComponent> = this;
		mutable.object = object;
	}
}

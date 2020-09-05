import { TorusBufferGeometry, MeshBasicMaterial, Mesh } from "three";
import { SceneObjectComponent } from "../components/graphics/SceneObjectComponent";
import { Position } from "../components/Position";
import { App } from "../core/App";

export class SelectionCircle {
	id = "SELECTION_CIRCLE";

	constructor({
		radius,
		color,
		x,
		y,
	}: {
		radius: number;
		color: string;
		x: number;
		y: number;
	}) {
		const geometry = new TorusBufferGeometry(radius, radius * 0.05, 3, 24);
		const material = new MeshBasicMaterial({
			color,
		});

		const mesh = new Mesh(geometry, material);

		new SceneObjectComponent(this, mesh);
		new Position(this, x, y);

		App.current?.add(this);
	}
}

import { TorusBufferGeometry, MeshBasicMaterial, Mesh } from "three";
import { ThreeObjectComponent } from "../engine/components/graphics/ThreeObjectComponent";
import { Position } from "../engine/components/Position";
import { Entity } from "../core/Entity";
import { currentGame } from "../engine/gameContext";

export class SelectionCircle extends Entity {
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
		super();
		const geometry = new TorusBufferGeometry(radius, radius * 0.05, 3, 24);
		const material = new MeshBasicMaterial({
			color,
		});

		const mesh = new Mesh(geometry, material);

		new ThreeObjectComponent(this, mesh);
		new Position(this, x, y);

		currentGame().add(this);
	}
}

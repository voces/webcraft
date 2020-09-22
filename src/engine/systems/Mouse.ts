import { Terrain } from "notextures";
import { Intersection, Object3D, Raycaster, Vector2, Vector3 } from "three";

import { Emitter, emitter } from "../../core/emitter";
import { Entity } from "../../core/Entity";
import { System } from "../../core/System";
import { window } from "../../core/util/globals";
import { ThreeObjectComponent } from "../components/graphics/ThreeObjectComponent";
import { Hover } from "../components/Hover";
import { SelectionCircle } from "../entities/widgets/sprites/SelectionCircle";
import { isSprite } from "../typeguards";
import { EntityObject } from "../types";
import { MouseDownEvent, MouseMoveEvent, UI } from "../ui";
import { ThreeGraphics } from "./ThreeGraphics";

export enum MouseButton {
	LEFT = 0,
	WHEEL,
	RIGHT,
	BACK,
	FORWARD,
}

export type MouseEvents = {
	mouseMove: (data: { mouse: Mouse }) => void;
	mouseDown: (data: {
		button: MouseButton;
		ctrlDown: boolean;
		mouse: Mouse;
	}) => void;
};

class Mouse extends System {
	static components = [ThreeObjectComponent];

	client: Vector2;
	/** Normalized coordinates from (-1 to 1) */
	screen: Vector2;
	ground: Vector3;
	intersections: Intersection[] = [];
	target?: EventTarget;
	entity?: Entity;

	private mouseMoveListener: (e: MouseMoveEvent) => void;
	private mouseDownListener: (e: MouseDownEvent) => void;
	private graphics: ThreeGraphics;
	private raycaster = new Raycaster();
	private mouseMoved = false;
	private ui: UI;

	constructor(graphics: ThreeGraphics, ui: UI) {
		super();
		emitter(this);

		this.graphics = graphics;
		this.ui = ui;

		this.client = new Vector2();
		this.screen = new Vector2();
		this.ground = new Vector3();

		this.mouseMoveListener = (e: MouseMoveEvent): void => {
			this.client.x = e.x;
			this.client.y = e.y;
			this.screen.x = (e.x / window.innerWidth) * 2 - 1;
			this.screen.y = -(e.y / window.innerHeight) * 2 + 1;
			this.target = e.target ?? undefined;
			this.mouseMoved = true;
		};
		ui.addEventListener("mouseMove", this.mouseMoveListener);

		// Todo: Add click and doubleClick
		this.mouseDownListener = (e: MouseDownEvent): void => {
			this.client.x = e.x;
			this.client.y = e.y;
			this.screen.x = (e.x / window.innerWidth) * 2 - 1;
			this.screen.y = -(e.y / window.innerHeight) * 2 + 1;
			this.target = e.target ?? undefined;

			this.raycast();

			this.dispatchEvent("mouseDown", {
				mouse: this,
				button: e.button,
				ctrlDown: e.ctrlDown,
			});
		};
		ui.addEventListener("mouseDown", this.mouseDownListener);
	}

	dispose(): void {
		this.ui.removeEventListener("mouseMove", this.mouseMoveListener);
	}

	test(entity: Entity): entity is Entity {
		return (
			ThreeObjectComponent.has(entity) &&
			// todo: Add Selectable component
			!(entity instanceof SelectionCircle)
		);
	}

	raycast(): void {
		this.raycaster.setFromCamera(this.screen, this.graphics.camera);

		this.intersections = this.raycaster.intersectObjects(
			Array.from(this)
				.map((e) => e.get(ThreeObjectComponent)[0]?.object)
				.filter((e): e is Object3D => e !== undefined),
			true,
		);

		for (let i = this.intersections.length - 1; i >= 0; i--)
			if (this.intersections[i].object.parent instanceof Terrain) {
				this.ground = this.intersections[i].point;
				break;
			}

		let foundEntity = false;

		for (let i = 0; i < this.intersections.length; i++) {
			const object: EntityObject = this.intersections[i].object;
			const entity = object?.entity;
			if (entity && (!isSprite(entity) || entity.selectable)) {
				foundEntity = true;
				if (this.entity !== entity) {
					if (this.entity) Hover.clear(this.entity);
					this.entity = entity;
					new Hover(entity);
				}
				break;
			}
		}

		if (!foundEntity && this.entity) {
			Hover.clear(this.entity);
			this.entity = undefined;
		}
	}

	preRender(): void {
		this.raycast();

		if (this.mouseMoved) {
			this.dispatchEvent("mouseMove", { mouse: this });
			this.mouseMoved = false;
		}
	}
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Mouse extends Emitter<MouseEvents> {}

export { Mouse };

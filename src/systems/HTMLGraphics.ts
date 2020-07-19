import { document } from "../util/globals.js";
import { System } from "../core/System.js";
import { WORLD_TO_GRAPHICS_RATIO } from "../constants.js";
import { Sprite } from "../sprites/Sprite.js";
import { MoveTargetManager } from "../components/MoveTarget.js";
import { Unit } from "../sprites/Unit.js";
import { dragSelect } from "../sprites/dragSelect.js";

// TODO: abstract dom into a class
const arenaElement = document.getElementById("arena")!;

export type HTMLComponent = {
	htmlElement?: EntityElement;
} & (
	| {
			generator: () => EntityElement;
	  }
	| {
			shape: "square" | "circle";
	  }
);

type HTMLEntity = Sprite & {
	html: HTMLComponent;
};

export type EntityElement = HTMLDivElement & { sprite: HTMLEntity };

type EntityData = {
	onChangePositionListener: () => void;
	onHealthChangeListener: (prop: string) => void;
	updatePosition: boolean;
	updateHealth: boolean;
};

class HTMLGraphics extends System<HTMLEntity> {
	entityData: Map<HTMLEntity, EntityData> = new Map();
	protected dirty = new Set<HTMLEntity>();

	test(entity: Sprite): entity is HTMLEntity {
		return !!entity.html;
	}

	onAddEntity(entity: HTMLEntity): void {
		// Create a div if no htmlElement (only do this once!)
		if (!entity.html.htmlElement) {
			const div = Object.assign(document.createElement("div"), {
				sprite: entity,
			});
			entity.html.htmlElement = div;
		}

		// We should have one, now!
		const elem = entity.html.htmlElement!;

		elem.classList.add(this.constructor.name.toLowerCase(), "sprite");
		elem.style.left =
			(entity.position.x - entity.radius) * WORLD_TO_GRAPHICS_RATIO +
			"px";
		elem.style.top =
			(entity.position.y - entity.radius) * WORLD_TO_GRAPHICS_RATIO +
			"px";
		elem.style.width = entity.radius * WORLD_TO_GRAPHICS_RATIO * 2 + "px";
		elem.style.height = entity.radius * WORLD_TO_GRAPHICS_RATIO * 2 + "px";

		if (entity.owner) {
			if (!entity.color && entity.owner.color)
				elem.style.backgroundColor = entity.owner.color.hex;
			elem.setAttribute("owner", entity.owner.id.toString());
		} else elem.style.backgroundColor = entity.color ?? "white";

		arenaElement.appendChild(elem);

		const data = {
			onChangePositionListener: () => {
				this.dirty.add(entity);
				data.updatePosition = true;
			},
			onHealthChangeListener: (prop: string) => {
				if (prop !== "health") return;
				this.dirty.add(entity);
				data.updateHealth = true;
			},
			updatePosition: true,
			updateHealth: true,
		};

		entity.position.addEventListener(
			"change",
			data.onChangePositionListener,
		);
		entity.addEventListener("change", data.onHealthChangeListener);
		this.entityData.set(entity, data);

		if (entity.selectable) dragSelect.addSelectables([entity]);
	}

	onRemoveEntity(entity: HTMLEntity): void {
		if (!entity.html.htmlElement) return;

		arenaElement.removeChild(entity.html.htmlElement);
		const data = this.entityData.get(entity);
		if (data) {
			entity.position.removeEventListener(
				"change",
				data.onChangePositionListener,
			);
			entity.removeEventListener("change", data.onHealthChangeListener);
			this.entityData.delete(entity);
		}
	}

	private updatePosition(
		elem: EntityElement,
		entity: HTMLEntity,
		delta: number,
		time: number,
		data: EntityData,
	): boolean {
		const moveTarget = MoveTargetManager.get(entity);
		if (moveTarget && Unit.isUnit(entity)) {
			moveTarget.renderProgress += entity.speed * delta;
			const { x, y } = moveTarget.path(moveTarget.renderProgress);
			elem.style.left =
				(x - entity.radius) * WORLD_TO_GRAPHICS_RATIO + "px";
			elem.style.top =
				(y - entity.radius) * WORLD_TO_GRAPHICS_RATIO + "px";
			return true;
		}

		// If we have a tween, we should use that and continue to consider
		// the entity dirty
		if (entity.position.renderTween) {
			const { x, y } = entity.position.renderTween(time);
			elem.style.left =
				(x - entity.radius) * WORLD_TO_GRAPHICS_RATIO + "px";
			elem.style.top =
				(y - entity.radius) * WORLD_TO_GRAPHICS_RATIO + "px";
			return true;
		}

		// Otherwise update the rendering position and mark clean
		elem.style.left =
			(entity.position.x - entity.radius) * WORLD_TO_GRAPHICS_RATIO +
			"px";
		elem.style.top =
			(entity.position.y - entity.radius) * WORLD_TO_GRAPHICS_RATIO +
			"px";

		data.updatePosition = false;
		return false;
	}

	private updateHealth(
		elem: EntityElement,
		entity: HTMLEntity,
		data: EntityData,
	): boolean {
		if (entity.health <= 0) elem.classList.add("death");
		else
			elem.style.opacity = Math.max(
				entity.health / entity.maxHealth,
				0.1,
			).toString();

		data.updateHealth = false;
		return false;
	}

	render(entity: HTMLEntity, delta: number, time: number): void {
		const elem = entity.html.htmlElement;
		const data = this.entityData.get(entity);
		if (!elem || !data) return;

		const stillDirty = [
			data.updatePosition &&
				this.updatePosition(elem, entity, delta, time, data),
			data.updateHealth && this.updateHealth(elem, entity, data),
		].some((v) => v);

		if (!stillDirty) this.dirty.delete(entity);
	}
}

export { HTMLGraphics };

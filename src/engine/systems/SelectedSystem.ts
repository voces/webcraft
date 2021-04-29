import type { Entity, EntityID } from "../../core/Entity";
import { System } from "../../core/System";
import { Selected } from "../components/Selected";
import { currentGame } from "../gameContext";
import { isUnit } from "../typeguards";
import { MouseButton } from "./Mouse";

type SelectedEntity = Entity & { __selected: true };

export class SelectedSystem extends System {
	static components = [Selected];
	readonly pure = true;

	data = new WeakMap<Entity, Selected>();

	constructor() {
		super();

		const game = currentGame();

		game.mouse.addEventListener(
			"mouseDown",
			({ button, mouse: { entity } }) => {
				if (
					button === MouseButton.LEFT &&
					entity &&
					!game.obstructionPlacement.active
				)
					this.setSelection([entity]);
			},
		);
	}

	test(entity: Entity): entity is SelectedEntity {
		return Selected.has(entity);
	}

	onAddEntity(entity: Entity): void {
		const selected = entity.get(Selected);
		if (!selected || !selected[0])
			throw new Error("expected Selected component");
		this.data.set(entity, selected[0]);
		currentGame().dispatchEvent("selection", Array.from(this));
	}

	onRemoveEntity(entity: Entity): void {
		const selected = this.data.get(entity);
		if (!selected) return;
		currentGame().dispatchEvent("selection", Array.from(this));
	}

	get selection(): ReadonlyArray<Entity> {
		return Array.from(this);
	}

	select(entity: Entity): boolean {
		if (this.test(entity)) return false;
		const game = currentGame();

		new Selected(entity, {
			color:
				isUnit(entity) && game && entity.owner.isEnemy(game.localPlayer)
					? "#FF0000"
					: "#00FF00",
		});
		return true;
	}

	setSelection(entities: ReadonlyArray<Entity>): void {
		const curIds: EntityID[] = [];
		for (const curSelected of this) curIds.push(curSelected.id);
		const newIds = entities.map((e) => e.id);

		if (
			curIds.length === newIds.length &&
			curIds.every((v, i) => v === newIds[i])
		)
			return;

		for (const curSelected of this) Selected.clear(curSelected);

		const game = currentGame();
		for (const newSelected of entities)
			new Selected(newSelected, {
				color:
					isUnit(newSelected) &&
					game &&
					newSelected.owner.isEnemy(game.localPlayer)
						? "#FF0000"
						: "#00FF00",
			});
	}
}

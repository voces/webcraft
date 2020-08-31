import { Component } from "../core/Component";
import { Sprite } from "../entities/sprites/Sprite";
import { SelectionCircle } from "../entities/SelectionCircle";
import { getEntityXY } from "../components/Position";
import { Entity } from "../core/Entity";
import { App } from "../core/App";

type Props = {
	radius: number;
	color: string;
};

type InternalProps = Props & { x: number; y: number };

export abstract class Circle extends Component<[InternalProps]> {
	protected static map = new WeakMap<Entity, Circle>();

	static get(entity: Entity): Circle | undefined {
		return this.map.get(entity);
	}

	static clear(entity: Entity): boolean {
		const selected = this.get(entity);
		if (!selected) return false;

		super.clear(entity);

		App.manager.context?.remove(selected.circle);

		return true;
	}

	circle!: SelectionCircle;

	constructor(entity: Entity, props: Partial<Props> = {}) {
		const xy = getEntityXY(entity);
		super(entity, {
			radius:
				props.radius ??
				(Sprite.isSprite(entity) ? entity.radius * 1.25 : 1),
			color: props.color ?? "#00FF00",
			x: xy?.x ?? 0,
			y: xy?.y ?? 0,
		});
	}

	initialize({ radius, color, x, y }: InternalProps): void {
		this.circle = new SelectionCircle({
			radius,
			color,
			x,
			y,
		});
	}
}

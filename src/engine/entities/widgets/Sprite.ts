import type { Component, ComponentConstructor } from "../../../core/Component";
import type { Emitter } from "../../../core/emitter";
import { emitter } from "../../../core/emitter";
import type { EntityID } from "../../../core/Entity";
import type { Action } from "../../actions/types";
import { ActiveComponent } from "../../components/Active";
import { AttackTarget } from "../../components/AttackTarget";
import { GerminateComponent } from "../../components/GerminateComponent";
import type { MeshBuilderComponentProps } from "../../components/graphics/MeshBuilderComponent";
import { MeshBuilderComponent } from "../../components/graphics/MeshBuilderComponent";
import { HoldPositionComponent } from "../../components/HoldPositionComponent";
import { Hover } from "../../components/Hover";
import { MoveTarget } from "../../components/MoveTarget";
import { PathingComponent } from "../../components/PathingComponent";
import { Position } from "../../components/Position";
import { Selected } from "../../components/Selected";
import { PATHING_TYPES } from "../../constants";
import { currentGame } from "../../gameContext";
import type { Player } from "../../players/Player";
import { clone } from "../../util/clone";
import type { WidgetProps } from "../Widget";
import { Widget } from "../Widget";

export type SpriteElement = HTMLDivElement & { sprite: Sprite };

export type SpriteProps = Omit<WidgetProps, "id"> & {
	armor?: number;
	blocksPathing?: number;
	color?: string;
	facing?: number;
	health?: number;
	id?: EntityID;
	maxHealth?: number;
	meshBuilder?: MeshBuilderComponentProps;
	owner?: Player;
	priority?: number;
	collisionRadius?: number;
	requiresPathing?: number;
	selectable?: boolean;
	x: number;
	y: number;
};

export type Effect = {
	type: "slow";
	oldSpeed: number;
	timeout: number;
};

export type SpriteEvents = {
	change: <K extends keyof Sprite>(prop: K, oldValue: Sprite[K]) => void;
	death: () => void;
	remove: () => void;
};

export type SpriteDefaultProps = Required<
	Pick<SpriteProps, "collisionRadius" | "meshBuilder">
>;

const spriteDerivedComponents = [Position.name, MeshBuilderComponent.name];

class Sprite extends Widget {
	static readonly isSprite = true;

	static defaults: SpriteDefaultProps = {
		collisionRadius: 1,
		meshBuilder: { shape: "circle" as "square" | "circle" },
	};

	// TODO: figure out how to type this...
	// It may not be possible in TS: https://github.com/microsoft/TypeScript/issues/5863
	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
	static get clonedDefaults() {
		return clone(this.defaults);
	}

	armor: number;
	blocksPathing: number;
	color?: string;
	effects: Effect[] = [];
	facing: number;
	invulnerable = false;
	isAlive: boolean;
	maxHealth: number;
	owner?: Player;
	priority: number;
	collisionRadius: number;
	requiresPathing: number;
	selectable: boolean;

	private _x!: number;
	private _y!: number;
	private _health!: number;

	constructor({
		armor = 0,
		blocksPathing = PATHING_TYPES.WALKABLE | PATHING_TYPES.BUILDABLE,
		color,
		facing = (3 / 2) * Math.PI,
		maxHealth = 1,
		health = maxHealth,
		meshBuilder = clone(Sprite.defaults.meshBuilder),
		owner,
		priority = 0,
		collisionRadius = Sprite.defaults.collisionRadius,
		requiresPathing = PATHING_TYPES.WALKABLE,
		selectable = true,
		...props
	}: SpriteProps) {
		super(props);
		emitter<Sprite, SpriteEvents>(this);

		this.collisionRadius = collisionRadius;
		this.requiresPathing = requiresPathing;
		this.blocksPathing = blocksPathing;

		this.maxHealth = maxHealth;
		this.health = health;
		this.isAlive = this.health > 0;
		this.armor = armor;
		this.priority = priority;
		this.owner = owner;
		this.facing = facing;
		this.color = color;
		this.selectable = selectable;

		new MeshBuilderComponent(this, {
			...meshBuilder,
			scale: meshBuilder.scale ?? collisionRadius,
			targetable: selectable,
		});

		// Lists
		if (this.owner) this.owner.sprites.push(this);
		currentGame().add(this);
	}

	damage(amount: number): number {
		if (this.invulnerable) return 0;

		// Technically, constructing armors are treated as "Normal", but we
		// don't have armor types yet :)
		const effectiveArmor = this.has(GerminateComponent) ? 0 : this.armor;
		const actualDamage = amount * (1 - effectiveArmor);

		if (this.health <= 0) return actualDamage;
		this.health -= actualDamage;

		return actualDamage;
	}

	kill({ removeImmediately = false } = {}): void {
		if (removeImmediately) this._death({ removeImmediately: true });
		else this.health = 0;
	}

	set health(value: number) {
		this._health = Math.min(Math.max(value, 0), this.maxHealth);
		this.dispatchEvent("change", "health", this._health);

		if (value <= 0 && this.isAlive) {
			this.isAlive = false;
			this._death();
		} else if (value > 0) this.isAlive = true;
	}

	get health(): number {
		return this._health;
	}

	_death({ removeImmediately = false } = {}): void {
		const game = currentGame();
		if (removeImmediately) {
			this._health = 0;
			this.isAlive = false;
		}

		this.clear(Selected);
		this.clear(Hover);
		this.clear(PathingComponent);
		this.clear(MoveTarget);

		if (this.owner) {
			const index = this.owner.sprites.indexOf(this);
			if (index >= 0) this.owner.sprites.splice(index, 1);
		}
		// const index = this.round.sprites.indexOf(this);
		// if (index >= 0) this.round.sprites.splice(index, 1);

		this.dispatchEvent("death");

		// Death antimation
		if (removeImmediately) this.remove();
		else game.setTimeout(() => this.remove(), 0.125);
	}

	remove(callInitializedFromApp = false): void {
		const game = currentGame();
		this.isAlive = false;
		this.dispatchEvent("remove");
		if (!callInitializedFromApp) game.remove(this);
		this.removeEventListeners();

		if (this.owner) {
			const index = this.owner.sprites.indexOf(this);
			if (index >= 0) this.owner.sprites.splice(index, 1);
		}
	}

	get actions(): Action[] {
		return [];
	}

	get idle(): boolean {
		return (
			!ActiveComponent.has(this) &&
			!MoveTarget.has(this) &&
			!AttackTarget.has(this) &&
			!HoldPositionComponent.has(this) &&
			!GerminateComponent.has(this) &&
			this.isAlive
		);
	}

	toJSON(): ReturnType<Widget["toJSON"]> & {
		type: string;
		health: number;
		owner?: number;
	} {
		return {
			...super.toJSON(),
			type: this.constructor.name,
			health: this.health,
			owner: this.owner?.id,
		};
	}

	static fromJSON({
		components,
		type,
		owner: ownerId,
		...data
	}: ReturnType<Sprite["toJSON"]>): Sprite {
		const game = currentGame();
		const map = components.reduce(
			(map, component) => {
				if (!map[component.type])
					map[component.type] = {
						class: game.componentsMap[component.type],
						components: [],
					};
				map[component.type]!.components.push(component);
				return map;
			},
			{} as {
				[key: string]: {
					class: ComponentConstructor | undefined;
					components: ReturnType<Component["toJSON"]>[];
				};
			},
		);

		const position = map.Position?.components[0] ?? { x: 0, y: 0 };
		const x = typeof position.x === "number" ? position.x : 0;
		const y = typeof position.y === "number" ? position.y : 0;

		const owner =
			ownerId === undefined
				? undefined
				: game.players.find((p) => p.id === ownerId);

		const entity = new this({ x, y, owner, ...data });

		for (const { type, ...componentProps } of components.filter(
			(c) => !spriteDerivedComponents.includes(c.type),
		)) {
			const constructor = game.componentsMap[type];
			if (!constructor) {
				console.warn(`Unable to hydrate unknown component ${type}`);
				continue;
			}
			const args = constructor.argMap.map((k) => componentProps[k]);
			constructor.fromJSON(entity, ...args, componentProps);
		}

		return entity;
	}
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Sprite extends Emitter<SpriteEvents> {}

export { Sprite };

import { PATHING_TYPES } from "../../engine/constants";
import { emitter, Emitter } from "../../core/emitter";
import { Player } from "../../engine/players/Player";
import { clone } from "../../engine/util/clone";
import { Action } from "./spriteLogic";
import {
	MeshBuilderComponent,
	Props as MeshBuilderComponentProps,
} from "../../engine/components/graphics/MeshBuilderComponent";
import { MoveTarget } from "../../engine/components/MoveTarget";
import { AttackTarget } from "../../engine/components/AttackTarget";
import { HoldPositionComponent } from "../../engine/components/HoldPositionComponent";
import { GerminateComponent } from "../../engine/components/GerminateComponent";
import { Selected } from "../../engine/components/Selected";
import { currentGame } from "../../engine/gameContext";
import { Hover } from "../../engine/components/Hover";
import { Position } from "../../engine/components/Position";
import { Widget, WidgetProps } from "../../engine/entities/Widget";
import { EntityID } from "../../core/Entity";

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

class Sprite extends Widget {
	static defaults = {
		collisionRadius: 1,
		meshBuilder: { shape: "circle" as "square" | "circle" },
	};

	// TODO: figure out how to type this...
	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
	static get clonedDefaults() {
		return clone(this.defaults);
	}

	readonly isSprite = true;

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
		} else this.isAlive = true;
	}

	get health(): number {
		return this._health;
	}

	_death({ removeImmediately = false } = {}): void {
		const game = currentGame();
		if (removeImmediately) this._health = 0;

		this.clear(Selected);
		this.clear(Hover);

		if (this.owner) {
			const index = this.owner.sprites.indexOf(this);
			if (index >= 0) this.owner.sprites.splice(index, 1);
		}
		game.pathingMap.removeEntity(this);
		// const index = this.round.sprites.indexOf(this);
		// if (index >= 0) this.round.sprites.splice(index, 1);

		this.dispatchEvent("death");

		// Death antimation
		if (removeImmediately) this.remove();
		else game.setTimeout(() => this.remove(), 0.125);
	}

	remove(initializedFromApp = false): void {
		const game = currentGame();
		this.dispatchEvent("remove");
		if (!initializedFromApp) game.remove(this);
		this.removeEventListeners();
		game.pathingMap.removeEntity(this);
	}

	get actions(): Action[] {
		return [];
	}

	get idle(): boolean {
		return (
			!MoveTarget.has(this) &&
			!AttackTarget.has(this) &&
			!HoldPositionComponent.has(this) &&
			!GerminateComponent.has(this) &&
			this.isAlive
		);
	}

	toJSON(): {
		constructor: string;
		health: number;
		owner?: number;
		position: Position;
	} {
		return {
			constructor: this.constructor.name,
			health: this.health,
			owner: this.owner && this.owner.id,
			position: this.position,
		};
	}
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Sprite extends Emitter<SpriteEvents> {}

export { Sprite };

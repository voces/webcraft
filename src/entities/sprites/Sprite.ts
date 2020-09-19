import { PATHING_TYPES } from "../../engine/constants";
import { emitter, Emitter } from "../../core/emitter";
import { Player } from "../../engine/players/Player";
import { Round } from "../../katma/Round";
import { clone } from "../../engine/util/clone";
import { Action } from "./spriteLogic";
import { Game } from "../../engine/Game";
import {
	MeshBuilderComponent,
	Props as MeshBuilderComponentProps,
} from "../../engine/components/graphics/MeshBuilderComponent";
import { MoveTarget } from "../../engine/components/MoveTarget";
import { AttackTarget } from "../../engine/components/AttackTarget";
import { HoldPositionComponent } from "../../engine/components/HoldPositionComponent";
import { GerminateComponent } from "../../engine/components/GerminateComponent";
import { Selected } from "../../engine/components/Selected";
import { App } from "../../core/App";
import { currentGame } from "../../engine/gameContext";
import { Entity } from "../../core/Entity";
import { Hover } from "../../engine/components/Hover";
import { Position } from "../../engine/components/Position";

export type SpriteElement = HTMLDivElement & { sprite: Sprite };

export type SpriteProps = {
	color?: string;
	id?: number;
	radius?: number;
	requiresPathing?: number;
	blocksPathing?: number;
	selectable?: boolean;
	x: number;
	y: number;
	armor?: number;
	priority?: number;
	health?: number;
	maxHealth?: number;
	owner?: Player;
	facing?: number;
	graphic?: MeshBuilderComponentProps;
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

class Sprite extends Entity {
	readonly isSprite = true;
	app: App;
	game: Game;
	radius: number;
	id: number;
	requiresPathing: number;
	blocksPathing: number;
	armor: number;
	isAlive: boolean;
	priority: number;
	effects: Effect[] = [];
	owner?: Player;
	round: Round;
	facing: number;
	maxHealth: number;
	private _health!: number;
	invulnerable = false;
	color?: string;
	selectable: boolean;

	// todo: move these to unit
	buildProgress?: number;

	private _x!: number;
	private _y!: number;

	static defaults = {
		radius: 1,
		graphic: { shape: "circle" as "square" | "circle" },
	};

	// TODO: figure out how to type this...
	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
	static get clonedDefaults() {
		return clone(this.defaults);
	}

	// static canAttack = <T extends Sprite & {attack: ( sprite: Sprite ) => void}>( sprite: Sprite | T ): sprite is T => "attack" in sprite

	constructor({
		color,
		id,
		radius = Sprite.defaults.radius,
		requiresPathing = PATHING_TYPES.WALKABLE,
		blocksPathing = PATHING_TYPES.WALKABLE | PATHING_TYPES.BUILDABLE,
		selectable = true,
		x,
		y,
		armor = 0,
		priority = 0,
		maxHealth = 1,
		health = maxHealth,
		facing = (3 / 2) * Math.PI,
		owner,
		graphic = clone(Sprite.defaults.graphic),
	}: SpriteProps) {
		super();
		emitter<Sprite, SpriteEvents>(this);

		const game = currentGame();

		if (!game.round)
			throw new Error("trying to create a sprite outside a round");
		this.game = game;
		this.app = game;
		this.round = game.round;

		this.radius = radius;
		this.requiresPathing = requiresPathing;
		this.blocksPathing = blocksPathing;

		this.id = id === undefined ? this.round.spriteId++ : id;
		this.maxHealth = maxHealth;
		this.health = health;
		this.isAlive = this.health > 0;
		this.armor = armor;
		this.priority = priority;
		this.owner = owner;
		this.facing = facing;
		this.color = color;
		this.selectable = selectable;
		new Position(this, x, y);

		new MeshBuilderComponent(this, {
			...graphic,
			targetable: selectable,
		});

		// Lists
		if (this.owner) this.owner.sprites.push(this);
		this.round.sprites.push(this);

		this.game.add(this);
	}

	damage(amount: number): number {
		if (this.invulnerable) return 0;

		const ignoreArmor =
			this.buildProgress === undefined || this.buildProgress < 1;
		const effectiveArmor = ignoreArmor ? this.armor : 0;
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
		if (removeImmediately) this._health = 0;

		this.clear(Selected);
		this.clear(Hover);

		if (this.owner) {
			const index = this.owner.sprites.indexOf(this);
			if (index >= 0) this.owner.sprites.splice(index, 1);
		}

		this.round.pathingMap.removeEntity(this);
		const index = this.round.sprites.indexOf(this);
		if (index >= 0) this.round.sprites.splice(index, 1);

		this.dispatchEvent("death");

		// Death antimation
		if (removeImmediately) this.remove();
		else this.round.setTimeout(() => this.remove(), 0.125);
	}

	remove(initializedFromApp = false): void {
		this.dispatchEvent("remove");
		if (!initializedFromApp) currentGame().remove(this);
		this.removeEventListeners();
		this.round.pathingMap.removeEntity(this);
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

	get position(): Position {
		const pos = this.get(Position);
		if (pos.length !== 1)
			throw new Error(`Expected a position, got ${pos.length}`);

		return pos[0]!;
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

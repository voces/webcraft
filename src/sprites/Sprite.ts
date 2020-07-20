import { PATHING_TYPES } from "../constants.js";
import { dragSelect } from "./dragSelect.js";
import { emitter, Emitter } from "../emitter.js";
import { document } from "../util/globals.js";
import { Player } from "../players/Player.js";
import { Round } from "../Round.js";
import { clone } from "../util/clone.js";
import { Action } from "./spriteLogic.js";
import { Game } from "../Game.js";
import { HTMLComponent } from "../systems/HTMLGraphics.js";
import { Position } from "../components/Position.js";
import { MoveTargetManager } from "../components/MoveTarget.js";
import { AttackTargetManager } from "../components/AttackTarget.js";
import { HoldPositionManager } from "../components/HoldPositionComponent.js";
import { GerminateComponentManager } from "../components/GerminateComponent.js";

// TODO: abstract dom into a class
const arenaElement = document.getElementById("arena")!;

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
	game: Game;
};

export type Effect = {
	type: "slow";
	oldSpeed: number;
	oldBackgroundImage?: string;
	timeout: number;
};

export type SpriteEvents = {
	change: <K extends keyof Sprite>(prop: K, oldValue: Sprite[K]) => void;
	death: () => void;
	remove: () => void;
};

class Sprite {
	// eslint-disable-next-line @typescript-eslint/ban-types
	static isSprite = (object: Object): object is Sprite =>
		object instanceof Sprite;

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
	_selected = false;
	_health!: number;
	color?: string;
	selectable: boolean;

	// components
	html?: HTMLComponent;
	position: Position;

	// todo: move these to unit
	buildProgress?: number;

	private _x!: number;
	private _y!: number;

	static defaults = {
		radius: 1,
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
		facing = 270,
		owner,
		game,
	}: SpriteProps) {
		emitter<Sprite, SpriteEvents>(this);

		if (!game.round)
			throw new Error("trying to create a sprite outside a round");
		this.game = game;
		this.round = game.round;

		this.radius = radius;
		this.requiresPathing = requiresPathing;
		this.blocksPathing = blocksPathing;

		this.id = id === undefined ? this.round.spriteId++ : id;
		// this.x = x;
		// this.y = y;
		this.maxHealth = maxHealth;
		this.health = health;
		this.isAlive = this.health > 0;
		this.armor = armor;
		this.priority = priority;
		this.owner = owner;
		this.facing = facing;
		this.color = color;
		this.selectable = selectable;
		// todo:
		Object.assign(this, { html: {} });
		this.position = new Position(x, y);

		if (!selectable) this.html?.htmlElement?.classList.add("doodad");

		// Lists
		if (this.owner) this.owner.sprites.push(this);
		this.round.sprites.push(this);

		this.game.add(this);
	}

	set selected(value: boolean) {
		this._selected = value;

		if (!this.html?.htmlElement) return;

		if (value) this.html.htmlElement.classList.add("selected");
		else this.html.htmlElement.classList.remove("selected");
	}

	get selected(): boolean {
		return this._selected;
	}

	damage(amount: number): number {
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

		dragSelect.removeSelectables([this]);
		if (this._selected)
			dragSelect.setSelection(
				dragSelect.selection.filter((u: Sprite) => u !== this),
			);
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

	remove(): void {
		this.dispatchEvent("remove");
		this.removeEventListeners();
		this.round.pathingMap.removeEntity(this);

		if (
			this.html?.htmlElement &&
			arenaElement.contains(this.html.htmlElement)
		)
			arenaElement.removeChild(this.html.htmlElement);
	}

	get actions(): Action[] {
		return [];
	}

	get idle(): boolean {
		return (
			!MoveTargetManager.has(this) &&
			!AttackTargetManager.has(this) &&
			!HoldPositionManager.has(this) &&
			!GerminateComponentManager.has(this) &&
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

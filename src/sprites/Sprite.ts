import { PATHING_TYPES, WORLD_TO_GRAPHICS_RATIO } from "../constants.js";
import { dragSelect } from "./dragSelect.js";
import { emitter, Emitter } from "../emitter.js";
import { document } from "../util/globals.js";
import { Player } from "../players/Player.js";
import { Round } from "../Round.js";
import { clone } from "../util/clone.js";
import { Action } from "./spriteLogic.js";
import { Game } from "../Game.js";

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
	oldBackgroundImage: string;
	timeout: number;
};

type Activity = {
	cleanup?: () => void;
	update?: (delta: number) => void;
	render?: (delta: number) => void;
	// TODO: type this
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	toJSON: () => {
		name: string;
	};
};

export type SpriteEvents = {
	death: () => void;
};

class Sprite implements Emitter<SpriteEvents> {
	game: Game;
	radius: number;
	id: number;
	requiresPathing: number;
	blocksPathing: number;
	armor: number;
	activity: Activity | undefined;
	isAlive: boolean;
	priority: number;
	effects: Effect[] = [];
	elem: SpriteElement;
	owner?: Player;
	round: Round;
	facing: number;
	maxHealth: number;
	_selected = false;
	_health!: number;

	// todo: move these to unit
	buildProgress?: number;

	private _x!: number;
	private _y!: number;

	static defaults = {
		radius: 1,
	};

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

		// For display, but we want to set this early since setters reference
		// it
		this.elem = Object.assign(document.createElement("div"), {
			sprite: this,
		});

		this.radius = radius;
		this.requiresPathing = requiresPathing;
		this.blocksPathing = blocksPathing;

		this.id = id === undefined ? this.round.spriteId++ : id;
		this.x = x;
		this.y = y;
		this.maxHealth = maxHealth;
		this.health = health;
		this.isAlive = this.health > 0;
		this.armor = armor;
		this.priority = priority;
		this.owner = owner;
		this.facing = facing;

		// Display
		this.elem.classList.add(this.constructor.name.toLowerCase(), "sprite");
		this.elem.style.left =
			(x - this.radius) * WORLD_TO_GRAPHICS_RATIO + "px";
		this.elem.style.top =
			(y - this.radius) * WORLD_TO_GRAPHICS_RATIO + "px";
		this.elem.style.width =
			this.radius * WORLD_TO_GRAPHICS_RATIO * 2 + "px";
		this.elem.style.height =
			this.radius * WORLD_TO_GRAPHICS_RATIO * 2 + "px";
		arenaElement.appendChild(this.elem);
		if (selectable) dragSelect.addSelectables([this]);
		else this.elem.classList.add("doodad");

		if (owner) {
			if (!color && owner.color)
				this.elem.style.backgroundColor = owner.color.hex;
			this.elem.setAttribute("owner", owner.id.toString());
		} else this.elem.style.backgroundColor = color || "white";

		// Lists
		if (this.owner) this.owner.sprites.push(this);
		this.round.sprites.push(this);

		// TODO: move this into getters and setters
		let activity: Activity | undefined;
		Object.defineProperty(this, "activity", {
			set: (value) => {
				if (activity?.cleanup) activity.cleanup();
				activity = value;
			},
			get: () => activity,
		});
	}

	setPosition(x: number, y: number): void;
	setPosition(pos: { x: number; y: number }): void;
	setPosition(pos: number | { x: number; y: number }, yArg?: number) {
		const x = typeof pos === "object" ? pos.x : pos;
		// ?? 0 shouldn't happen, but TS doesn't know that
		const y = typeof pos === "object" ? pos.y : yArg ?? 0;

		this._setPosition(x, y);

		if (this.elem) {
			this.elem.style.left =
				(this._x - this.radius) * WORLD_TO_GRAPHICS_RATIO + "px";
			this.elem.style.top =
				(this._y - this.radius) * WORLD_TO_GRAPHICS_RATIO + "px";
		}
	}

	_setPosition(x: number, y: number) {
		const { x: xBefore, y: yBefore } = this;

		const { x: newX, y: newY } = this.round.pathingMap.withoutEntity(
			this,
			() => this.round.pathingMap.nearestPathing(x, y, this),
		);

		this._x = newX;
		this._y = newY;
		this.round.pathingMap.updateEntity(this);
		this.facing = Math.atan2(this.y - yBefore, this.x - xBefore);
	}

	set x(x) {
		if (isNaN(x)) throw new Error("Cannot set Sprite#x to NaN");

		this._x = x;
		if (this.elem)
			this.elem.style.left =
				(x - this.radius) * WORLD_TO_GRAPHICS_RATIO + "px";
	}

	get x() {
		return this._x;
	}

	set y(y) {
		if (isNaN(y)) throw new Error("Cannot set Sprite#y to NaN");

		this._y = y;
		if (this.elem)
			this.elem.style.top =
				(y - this.radius) * WORLD_TO_GRAPHICS_RATIO + "px";
	}

	get y() {
		return this._y;
	}

	set selected(value) {
		this._selected = value;

		if (this.elem && value) this.elem.classList.add("selected");
		else this.elem.classList.remove("selected");
	}

	get selected() {
		return this._selected;
	}

	damage(amount: number) {
		const ignoreArmor =
			this.buildProgress === undefined || this.buildProgress < 1;
		const effectiveArmor = ignoreArmor ? this.armor : 0;
		const actualDamage = amount * (1 - effectiveArmor);

		if (this.health <= 0) return actualDamage;
		this.health -= actualDamage;

		return actualDamage;
	}

	kill({ removeImmediately = false } = {}) {
		if (removeImmediately) this._death({ removeImmediately: true });
		else this.health = 0;
	}

	set health(value) {
		this._health = Math.min(Math.max(value, 0), this.maxHealth);

		if (this._health)
			this.elem.style.opacity = Math.max(
				this._health / this.maxHealth,
				0.1,
			).toString();

		if (value <= 0 && this.isAlive) {
			this.isAlive = false;
			this._death();
		} else this.isAlive = true;
	}

	get health() {
		return this._health;
	}

	_death({ removeImmediately = false } = {}) {
		if (removeImmediately) this._health = 0;

		this.activity = undefined;
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
		else {
			this.elem.classList.add("death");
			this.round.setTimeout(() => this.remove(), 0.125);
		}
	}

	remove() {
		this.removeEventListeners();
		this.round.pathingMap.removeEntity(this);

		if (arenaElement.contains(this.elem))
			arenaElement.removeChild(this.elem);
	}

	get actions(): Action[] {
		return [];
	}

	toJSON() {
		return {
			activity: this.activity,
			constructor: this.constructor.name,
			health: this.health,
			owner: this.owner && this.owner.id,
			x: this.x,
			y: this.y,
		};
	}
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Sprite extends Emitter<SpriteEvents> {}

export { Sprite };

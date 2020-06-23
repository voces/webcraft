import { WORLD_TO_GRAPHICS_RATIO } from "../constants.js";
import { tweenPoints } from "../util/tweenPoints.js";
import { Unit, UnitProps } from "./Unit.js";
import { dragSelect } from "./dragSelect.js";
import {
	stop as stopPlacement,
	active as activePlacement,
} from "./obstructionPlacement.js";
import { appendErrorMessage } from "../ui/chat.js";
import { Point } from "../pathing/PathingMap.js";
import { Sprite } from "./Sprite.js";
import {
	Obstruction,
	ObstructionSubclass,
	Basic,
	Dense,
	Huge,
	Large,
	Resource,
	Slow,
	Stack,
	Tiny,
} from "./obstructions/index.js";
import { Blueprint } from "./obstructions/Blueprint.js";
import { Action } from "./spriteLogic.js";

const destroyLastBox: Action = {
	name: "Destroy box",
	description: "Destroys selected or last created box",
	hotkey: "x" as const,
	type: "custom" as const,
	handler: ({ player }): void => {
		const crosser = player.unit;
		if (!crosser || !Crosser.isCrosser(crosser)) return;
		const obstructions = [...crosser.obstructions];
		while (obstructions.length) {
			const obstruction = obstructions.pop();
			if (obstruction && obstruction.health > 0) {
				player.game.transmit({
					type: "kill",
					sprites: [obstruction.id],
				});
				break;
			}
		}
	},
};

// Math.SQRT2 (~1.41) allows building tinies across diag space
const BUILD_DISTANCE = 1.4;

export class Crosser extends Unit {
	static isCrosser = (sprite: Sprite): sprite is Crosser =>
		sprite instanceof Crosser;

	static defaults = {
		...Unit.defaults,
		priority: 1,
		radius: 0.5,
		builds: [Basic, Dense, Huge, Large, Resource, Slow, Stack, Tiny],
	};

	// 380 in WC3 on fast
	speed = 5.9375;
	obstructions: Obstruction[] = [];

	constructor(props: UnitProps) {
		super({ ...Crosser.clonedDefaults, ...props });

		this.addEventListener("death", () => {
			// Kill all their sprites
			[...this.owner.sprites].forEach((sprite) => sprite.kill());

			// Cancel any active placements
			if (activePlacement()) stopPlacement();
		});
	}

	buildAt(target: Point, ObstructionClass: ObstructionSubclass): void {
		let updateProgress = 0;
		let updateTicks = 0;
		let renderProgress = 0;
		let path = tweenPoints(this.round.pathingMap.path(this, target));
		const blueprint =
			this.owner === this.game.localPlayer
				? new Blueprint({
						...target,
						game: this.game,
						radius: ObstructionClass.defaults.radius,
				  })
				: undefined;

		this.activity = {
			update: (delta) => {
				updateTicks++;

				updateProgress += delta * this.speed;
				const { x, y } = path(updateProgress);
				if (isNaN(x) || isNaN(y))
					throw new Error(`Returning NaN location x=${x} y=${y}`);

				const distanceRemaining = Math.sqrt(
					(x - target.x) ** 2 + (y - target.y) ** 2,
				);
				if (distanceRemaining < BUILD_DISTANCE) {
					this.activity = undefined;

					if (ObstructionClass.defaults.cost) {
						const check = this.owner.checkResources(
							ObstructionClass.defaults.cost,
						);
						if (check?.length) {
							appendErrorMessage(`Not enough ${check.join(" ")}`);
							return;
						}

						this.owner.subtractResources(
							ObstructionClass.defaults.cost,
						);
					}

					const obstruction = new ObstructionClass({
						x: target.x,
						y: target.y,
						owner: this.owner,
					});

					this.round.pathingMap.withoutEntity(this, () => {
						if (
							this.round.pathingMap.pathable(
								obstruction,
								target.x,
								target.y,
							)
						) {
							this.round.pathingMap.addEntity(obstruction);
							this.obstructions.push(obstruction);
						} else obstruction.kill({ removeImmediately: true });

						const { x, y } = path.radialStepBack(BUILD_DISTANCE);
						this.setPosition(
							this.round.pathingMap.nearestSpiralPathing(
								x,
								y,
								this,
							),
						);
					});

					// We're never going to get there
				} else if (
					path.distance < updateProgress &&
					updateProgress < BUILD_DISTANCE
				) {
					this.activity = undefined;
					this.setPosition(x, y);
				} else {
					// Update self
					this._setPosition(x, y);

					// Recheck path, start a new one periodically or if check
					// fails
					if (
						updateTicks % 5 === 0 ||
						!this.round.pathingMap.recheck(
							path.points,
							this,
							delta * this.speed * 6,
						)
					) {
						path = tweenPoints(
							this.round.pathingMap.path(this, target),
						);
						updateProgress = 0;
						renderProgress = 0;
					}
				}
			},
			render: (delta) => {
				renderProgress += delta * this.speed;
				const { x, y } = path(renderProgress);
				this.elem.style.left =
					(x - this.radius) * WORLD_TO_GRAPHICS_RATIO + "px";
				this.elem.style.top =
					(y - this.radius) * WORLD_TO_GRAPHICS_RATIO + "px";
			},
			cleanup: () =>
				blueprint && blueprint.kill({ removeImmediately: true }),
			toJSON: () => ({
				name: "buildAt",
				obstruction: Obstruction.name,
				target,
				path,
				ticks: updateTicks,
			}),
		};
	}

	ascend(): void {
		this._health = 0;
		this.activity = undefined;
		dragSelect.removeSelectables([this]);
		if (this._selected)
			dragSelect.setSelection(
				dragSelect.selection.filter((u) => u !== this),
			);
		if (this.owner) {
			const index = this.owner.sprites.indexOf(this);
			if (index >= 0) this.owner.sprites.splice(index, 1);
		}

		this.round.pathingMap.removeEntity(this);
		const index = this.round.sprites.indexOf(this);
		if (index >= 0) this.round.sprites.splice(index, 1);

		// Cancel any active placements
		if (activePlacement()) stopPlacement();

		this.elem.classList.add("ascend");

		this.round.setTimeout(() => this.remove(), 1);
	}

	get actions(): Action[] {
		const actions = super.actions;
		actions.push(destroyLastBox);
		return actions;
	}
}

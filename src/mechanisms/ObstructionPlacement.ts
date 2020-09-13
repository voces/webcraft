import { appendErrorMessage } from "../ui/chat";
import { Obstruction } from "../entities/sprites/obstructions/index";
import { Game } from "../Game";
import { Mechanism } from "../core/Merchanism";
import { Mouse } from "../systems/Mouse";
import { Grid } from "notextures";
import { Entity } from "../core/Entity";
import { SceneObjectComponent } from "../components/graphics/SceneObjectComponent";
import { MeshPhongMaterial } from "three";
import { Blueprint } from "../entities/sprites/obstructions/Blueprint";

const edgeSnap = (v: number) => Math.round(v);
const midSnap = (v: number) => Math.floor(v) + 0.5;

export class ObstructionPlacement extends Mechanism {
	static isObstructionPlacement = (
		mechanism: Mechanism,
	): mechanism is ObstructionPlacement =>
		mechanism instanceof ObstructionPlacement;

	private game: Game;
	private plannedObstruction: typeof Obstruction | undefined;
	private pathable = false;
	private mouse: Mouse;
	private requestedAnimationFrame: number | undefined;
	private placements: Grid[][] = [];
	private lastRadius?: number;
	private placementEntity: Entity = new Entity("ENTITY_PLACEMENT");
	private blueprint?: Blueprint;

	constructor(game: Game) {
		super();

		this.game = game;
		this.mouse = game.mouse;
		game.mouse.addEventListener("mouseMove", () => {
			if (this.plannedObstruction) this.updatePosition();
		});
	}

	snap(v: number): number {
		const snapFunc =
			!this.plannedObstruction ||
			this.plannedObstruction.defaults.radius % 1 === 0
				? edgeSnap
				: midSnap;

		return snapFunc(v);
	}

	private placement(): Grid | undefined {
		return this.placementEntity.get(SceneObjectComponent)[0]?.object as
			| Grid
			| undefined;
	}

	private newGrid(width: number, height: number) {
		const grid = new Grid(width, height);
		grid.material = new MeshPhongMaterial({
			vertexColors: true,
			flatShading: true,
			depthTest: false,
		});
		grid.renderOrder = 100;
		grid.material.opacity = 0.5;
		grid.material.transparent = true;
		return grid;
	}

	// We shouldn't just nuke the cells
	private updateCells() {
		if (!this.game.round || !this.plannedObstruction) return;

		const unit = this.game.localPlayer.unit;
		if (!unit) return;

		const pathing = this.plannedObstruction.defaults.requiresPathing;
		const radius = this.plannedObstruction.defaults.radius;
		const xStart = this.snap(this.mouse.ground.x) - radius;
		const yStart = this.snap(this.mouse.ground.y) - radius;

		// Grab a reference to the current Placement
		const oldPlacement = this.placement();

		// Grab a reference to the new Placement, or create if the size is new
		if (!this.placements[radius * 2]) this.placements[radius * 2] = [];
		const placement =
			this.placements[radius * 2][radius * 2] ??
			(this.placements[radius * 2][radius * 2] = this.newGrid(
				radius * 2,
				radius * 2,
			));

		// If changing placements, hide the old one and show the new one
		if (placement !== oldPlacement) {
			if (oldPlacement) {
				oldPlacement.visible = false;
				SceneObjectComponent.clear(this.placementEntity);
			}
			new SceneObjectComponent(this.placementEntity, placement);
			placement.visible = true;
		}

		this.game.round.pathingMap.withoutEntity(unit, () => {
			const xFinal = xStart + radius * 2;
			const yFinal = yStart + radius * 2;

			let overallPathable = true;
			const pathingGrid = unit.round.pathingMap.grid;
			for (let y = yStart; y < yFinal; y += 1)
				for (let x = xStart; x < xFinal; x += 1) {
					const pathable =
						pathingGrid[y * 2]?.[x * 2]?.pathable(pathing) &&
						pathingGrid[y * 2]?.[x * 2 + 1]?.pathable(pathing) &&
						pathingGrid[y * 2 + 1]?.[x * 2]?.pathable(pathing) &&
						pathingGrid[y * 2 + 1]?.[x * 2 + 1]?.pathable(pathing);

					if (pathable)
						placement.setColor(
							x - xStart,
							yFinal - y - 1,
							0.25,
							1,
							0.5,
						);
					else {
						placement.setColor(
							x - xStart,
							yFinal - y - 1,
							1,
							0.25,
							0.25,
						);

						overallPathable = false;
					}
				}

			this.pathable = overallPathable;
		});
	}

	render(): void {
		this.updateCells();
	}

	private x() {
		return this.snap(this.mouse.ground.x);
	}

	private y() {
		return this.snap(this.mouse.ground.y);
	}

	private updatePosition() {
		if (!this.plannedObstruction) return;

		const placement = this.placement();

		const x = this.x();
		const y = this.y();

		if (placement) {
			placement.position.x = x;
			placement.position.y = y;
			placement.position.z = this.game.terrain!.groundHeight(
				placement.position.x,
				placement.position.y,
			);
		}

		if (this.blueprint) {
			this.blueprint.position.x = x;
			this.blueprint.position.y = y;
		}
	}

	private updateSize() {
		if (!this.plannedObstruction) return;

		this.updateCells();
		this.updatePosition();
	}

	start(obstruction: typeof Obstruction): void {
		if (obstruction.defaults.cost) {
			const check = this.game.localPlayer.checkResources(
				obstruction.defaults.cost,
			);
			if (check.length) {
				appendErrorMessage(`Not enough ${check.join(" ")}`);
				return;
			}
		}

		this.plannedObstruction = obstruction;

		this.updateSize();

		const placement = this.placement();
		if (placement) placement.visible = true;

		this.game.add(this.placementEntity);

		if (this.blueprint) this.blueprint.remove();

		const blueprint = new Blueprint({
			obstruction,
			x: this.x(),
			y: this.y(),
			game: this.game,
		});
		this.blueprint = blueprint;
		this.game.add(blueprint);
	}

	stop(): void {
		if (!this.plannedObstruction) return;
		this.plannedObstruction = undefined;

		const placement = this.placement();
		if (placement) placement.visible = false;

		this.game.remove(this.placementEntity);

		if (this.blueprint) {
			this.blueprint.remove();
			this.game.remove(this.blueprint);
		}
	}

	get active(): typeof Obstruction | undefined {
		return this.plannedObstruction;
	}

	get valid(): boolean {
		return !!this.plannedObstruction && this.pathable;
	}
}

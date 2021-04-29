import { Grid } from "notextures";
import { MeshPhongMaterial } from "three";

import type { Entity } from "../../core/Entity";
import { Mechanism } from "../../core/Merchanism";
import { ThreeObjectComponent } from "../components/graphics/ThreeObjectComponent";
import { Position } from "../components/Position";
import { Widget } from "../entities/Widget";
import { Blueprint } from "../entities/widgets/sprites/Blueprint";
import type { Obstruction } from "../entities/widgets/sprites/units/Obstruction";
import type { Game } from "../Game";
import { currentGame } from "../gameContext";
import type { Mouse } from "../systems/Mouse";
import { appendErrorMessage } from "../ui/chat";

const edgeSnap = (v: number) => Math.round(v);
const midSnap = (v: number) => Math.floor(v) + 0.5;

class PlacementEntity extends Widget {}

export class ObstructionPlacement extends Mechanism {
	private game: Game;
	private plannedObstruction: typeof Obstruction | undefined;
	private pathable = false;
	private mouse: Mouse;
	// Cached placements, so we don't create new ones each time
	private grids: Grid[][] = [];
	// Container entity with a Grid as its scene object
	private gridEntity = new PlacementEntity({
		id: "ENTITY_PLACEMENT",
		x: 0,
		y: 0,
	});
	private blueprint?: Blueprint;
	private lastRadius?: number;
	private added = false;
	private _builder?: Entity;

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
			this.plannedObstruction.defaults.collisionRadius % 1 === 0
				? edgeSnap
				: midSnap;

		return snapFunc(v);
	}

	private getGrid(): Grid | undefined {
		return this.gridEntity.get(ThreeObjectComponent)[0]?.object as
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
		if (!this.plannedObstruction) return;

		const unit = this.game.localPlayer.getPrimarySelectedUnit();
		if (!unit) return;

		const pathing = this.plannedObstruction.defaults.requiresPathing;
		const collisionRadius = this.plannedObstruction.defaults
			.collisionRadius;
		const xStart = this.snap(this.mouse.ground.x) - collisionRadius;
		const yStart = this.snap(this.mouse.ground.y) - collisionRadius;

		// Grab a reference to the current Placement
		const oldGrid = this.getGrid();

		// Grab a reference to the new Placement, or create if the size is new
		if (!this.grids[collisionRadius * 2])
			this.grids[collisionRadius * 2] = [];
		const newGrid =
			this.grids[collisionRadius * 2][collisionRadius * 2] ??
			(this.grids[collisionRadius * 2][
				collisionRadius * 2
			] = this.newGrid(collisionRadius * 2, collisionRadius * 2));

		// If changing placements, hide the old one and show the new one
		if (newGrid !== oldGrid) {
			this.gridEntity.clear(ThreeObjectComponent);
			new ThreeObjectComponent(this.gridEntity, newGrid);
		}

		const pathingSystem = currentGame().pathingSystem!;

		pathingSystem.withoutEntity(unit, () => {
			const xFinal = xStart + collisionRadius * 2;
			const yFinal = yStart + collisionRadius * 2;

			let overallPathable = true;
			const pathingGrid = pathingSystem.grid;
			for (let y = yStart; y < yFinal; y += 1)
				for (let x = xStart; x < xFinal; x += 1) {
					const pathable =
						pathingGrid[y * 2]?.[x * 2]?.pathable(pathing) &&
						pathingGrid[y * 2]?.[x * 2 + 1]?.pathable(pathing) &&
						pathingGrid[y * 2 + 1]?.[x * 2]?.pathable(pathing) &&
						pathingGrid[y * 2 + 1]?.[x * 2 + 1]?.pathable(pathing);

					if (pathable)
						newGrid.setColor(
							x - xStart,
							yFinal - y - 1,
							0.25,
							1,
							0.5,
						);
					else {
						newGrid.setColor(
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

		const x = this.x();
		const y = this.y();

		if (this.gridEntity) Position.setXY(this.gridEntity, x, y);
		this.blueprint?.position.setXY(x, y);
	}

	private updateSize() {
		if (!this.plannedObstruction) return;

		this.updateCells();
		this.updatePosition();
	}

	start(obstruction: typeof Obstruction, builder?: Entity): void {
		if (obstruction.defaults.cost) {
			const check = this.game.localPlayer.checkResources(
				obstruction.defaults.cost,
			);
			if (check.length) {
				appendErrorMessage(`Not enough ${check.join(" or ")}`);
				return;
			}
		}

		this._builder = builder;
		this.plannedObstruction = obstruction;

		if (!this.added) {
			this.game.add(this.gridEntity);
			this.added = true;
		}

		if (this.blueprint) this.blueprint.remove();
		const blueprint = new Blueprint({
			obstruction,
			x: this.x(),
			y: this.y(),
		});
		this.blueprint = blueprint;
		this.game.add(blueprint);

		this.updateSize();
	}

	stop(): void {
		if (!this.plannedObstruction) return;
		this.plannedObstruction = undefined;

		this.game.remove(this.gridEntity);
		this.added = false;

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

	get builder(): Entity | undefined {
		return this._builder;
	}
}

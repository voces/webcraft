import { System } from "../../core/System";
import { BuildTarget } from "../components/BuildTarget";
import { MoveTarget } from "../components/MoveTarget";
import { PathingComponent } from "../components/PathingComponent";
import { BUILD_DISTANCE } from "../constants";
import type { Sprite } from "../entities/widgets/Sprite";
import type { Unit } from "../entities/widgets/sprites/Unit";
import { currentGame } from "../gameContext";
import { isUnit } from "../typeguards";
import { appendErrorMessage } from "../ui/chat";
import { distanceBetweenPoints } from "../util/tweenPoints";

export class BlueprintSystem extends System<Unit> {
	static components = [BuildTarget, MoveTarget];
	readonly pure = false;

	test(entity: Sprite): entity is Unit {
		return entity.has(BuildTarget) && isUnit(entity);
	}

	update(entity: Unit): void {
		const buildTarget = entity.get(BuildTarget)[0];
		const moveTarget = entity.get(MoveTarget)[0];

		// No target anymore, remove the entity
		if (!buildTarget) {
			BuildTarget.clear(entity);
			return;
		}

		// We're still moving
		if (moveTarget) return;

		// We're close enough, so we either will build it or not for some reason
		BuildTarget.clear(entity);

		// We're not moving, but still too far
		if (
			distanceBetweenPoints(entity.position, buildTarget.target) >
			BUILD_DISTANCE
		)
			return;

		if (buildTarget.obstructionClass.defaults.cost) {
			const check = entity.owner.checkResources(
				buildTarget.obstructionClass.defaults.cost,
			);
			if (check?.length) {
				appendErrorMessage(`Not enough ${check.join(" ")}`);
				return;
			}

			entity.owner.subtractResources(
				buildTarget.obstructionClass.defaults.cost,
			);
		}

		const obstruction = new buildTarget.obstructionClass({
			x: buildTarget.target.x,
			y: buildTarget.target.y,
			owner: entity.owner,
		});

		const game = currentGame();
		const pathingSystem = game.pathingSystem!;
		pathingSystem.withoutEntity(entity, () => {
			if (
				pathingSystem.pathable(
					obstruction,
					buildTarget.target.x,
					buildTarget.target.y,
				)
			) {
				new PathingComponent(obstruction);
				entity.obstructions.push(obstruction);
			} else obstruction.kill({ removeImmediately: true });

			const newPos = pathingSystem.nearestSpiralPathing(
				entity.position.x,
				entity.position.y,
				entity,
			);
			entity.position.setXY(newPos.x, newPos.y);
			game.dispatchEvent("build", entity, obstruction);
		});
	}
}

import { System } from "../core/System";
import { BuildTargetManager, BuildTarget } from "../components/BuildTarget";
import { Sprite } from "../entities/sprites/Sprite";
import { Unit } from "../entities/sprites/Unit";
import { MoveTarget, MoveTargetManager } from "../components/MoveTarget";
import { distanceBetweenPoints } from "../util/tweenPoints";
import { BUILD_DISTANCE } from "../constants";
import { appendErrorMessage } from "../ui/chat";

export class BlueprintSystem extends System<Unit> {
	static components = [BuildTarget, MoveTarget];

	test(entity: Sprite): entity is Unit {
		return BuildTargetManager.has(entity) && entity instanceof Unit;
	}

	update(entity: Unit): void {
		const buildTarget = BuildTargetManager.get(entity);
		const moveTarget = MoveTargetManager.get(entity);

		// No target anymore, remove the entity
		if (!buildTarget) return BuildTargetManager.delete(entity);

		// We're still moving
		if (moveTarget) return;

		// We're close enough, so we either will build it or not for some reason
		BuildTargetManager.delete(entity);

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

		entity.round.pathingMap.withoutEntity(entity, () => {
			if (
				entity.round.pathingMap.pathable(
					obstruction,
					buildTarget.target.x,
					buildTarget.target.y,
				)
			) {
				entity.round.pathingMap.addEntity(obstruction);
				entity.obstructions.push(obstruction);
			} else obstruction.kill({ removeImmediately: true });

			const newPos = entity.round.pathingMap.nearestSpiralPathing(
				entity.position.x,
				entity.position.y,
				entity,
			);
			entity.position.setXY(newPos.x, newPos.y);
		});
	}
}

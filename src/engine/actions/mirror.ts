import { ActiveComponent } from "../components/Active";
import { Animation } from "../components/graphics/Animation";
import { MeshBuilderComponent } from "../components/graphics/MeshBuilderComponent";
import { MIRROR_SEPARATION } from "../constants";
import type { Sprite } from "../entities/widgets/Sprite";
import type { Unit } from "../entities/widgets/sprites/Unit";
import { currentGame } from "../gameContext";
import type { MirrorEvent } from "../Network";
import type { Point } from "../pathing/PathingMap";
import { isUnit } from "../typeguards";
import type { ImmediateActionProps } from "./types";

const getMirroringPosition = (pos: Point, entity: Sprite, layer?: number) => {
	const pathingMap = currentGame().pathingMap;
	const nearest = pathingMap.nearestSpiralPathing(pos.x, pos.y, entity);

	if (pathingMap.layer(nearest.x, nearest.y) === layer) return nearest;

	return pathingMap.nearestSpiralPathing(nearest.x, nearest.y, entity, layer);
};

const isMirroring = (unit: Unit) => {
	const activities = unit.get(ActiveComponent);
	return activities.some((a) => a?.tag === "mirror");
};

const mirror = (unit: Unit) => {
	if (isMirroring(unit)) return;
	const game = currentGame();
	if (unit.mirrors) unit.mirrors.forEach((u) => u.kill());
	unit.mirrors = [];
	unit.stop();

	const meshBuilderComponent = unit.get(MeshBuilderComponent)[0];
	if (meshBuilderComponent) new Animation(unit, "cast", 0.5);

	const activity = new ActiveComponent(unit, "mirror");

	game.setTimeout(() => {
		unit.clear(activity);
		if (!unit.isAlive) return;

		const angle1 = unit.facing + Math.PI / 2;
		const angle2 = unit.facing - Math.PI / 2;
		let pos1 = {
			x: unit.position.x + Math.cos(angle1) * MIRROR_SEPARATION,
			y: unit.position.y + Math.sin(angle1) * MIRROR_SEPARATION,
		};
		let pos2 = {
			x: unit.position.x + Math.cos(angle2) * MIRROR_SEPARATION,
			y: unit.position.y + Math.sin(angle2) * MIRROR_SEPARATION,
		};

		if (game.random() < 0.5) {
			const temp = pos1;
			pos1 = pos2;
			pos2 = temp;
		}

		const pathingMap = game.pathingMap;

		const layer = pathingMap.layer(unit.position.x, unit.position.y);

		const realPosition = pathingMap.withoutEntity(unit, () =>
			getMirroringPosition(pos1, unit, layer),
		);
		unit.position.setXY(realPosition.x, realPosition.y);

		const klass = unit.constructor as new (
			...args: ConstructorParameters<typeof Unit>
		) => Unit;

		const mirror = new klass({
			x: unit.position.x,
			y: unit.position.y,
			owner: unit.owner,
			isIllusion: true,
			facing: unit.facing,
		});
		const mirrorPos = getMirroringPosition(pos2, mirror, layer);
		mirror.position.setXY(mirrorPos.x, mirrorPos.y);
		pathingMap.addEntity(mirror);
		unit.mirrors?.push(mirror);
	}, 0.5);
};

export const mirrorAction = {
	name: "Mirror Image",
	hotkey: "r" as const,
	type: "custom" as const,
	localHandler: ({ player }: ImmediateActionProps): void => {
		const ownUnits = player.game.selectionSystem.selection.filter(
			(u): u is Unit => isUnit(u) && u.owner === player,
		);
		const realUntis = ownUnits.filter(
			(u) => isUnit(u) && !u.isIllusion && !isMirroring(u),
		);
		if (realUntis.length)
			player.game.transmit({
				type: "mirror",
				sprites: realUntis.map((u) => u.id),
			});
	},
	syncHandler: ({ time, connection, sprites }: MirrorEvent): void => {
		const game = currentGame();
		game.update({ time });

		const player = game.players.find((p) => p.id === connection);
		if (!player) return;

		player.sprites
			.filter(
				(s): s is Unit =>
					sprites.includes(s.id) &&
					isUnit(s) &&
					s.actions.includes(mirrorAction),
			)
			.forEach((u) => mirror(u));
	},
};

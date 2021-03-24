import { UpgradeComponent } from "../components/UpgradeComponent";
import type { Obstruction } from "../entities/widgets/sprites/units/Obstruction";
import { currentGame } from "../gameContext";
import type { UpgradeEvent } from "../Network";
import { appendErrorMessage } from "../ui/chat";
import type { Action, ImmediateActionProps } from "./types";

const calculateUpgradeCost = (
	from: typeof Obstruction,
	to: typeof Obstruction,
) => {
	const toCosts: [string, number][] = Object.entries(to.defaults.cost);
	const fromCosts = from.defaults.cost as { [key: string]: number };
	return Object.fromEntries(
		toCosts.map(([k, v]) => [
			k,
			v - (k in fromCosts ? fromCosts[k] ?? 0 : 0),
		]),
	);
};

export const upgradeSyncHandler = ({
	time,
	connection,
	obstructions: obstructionIds,
	upgrade,
}: UpgradeEvent): void => {
	const game = currentGame();
	game.update({ time });

	const player = game.players.find((p) => p.id === connection);
	if (!player) return;

	const obstructions = player.sprites.filter((s): s is Obstruction =>
		obstructionIds.includes(s.id),
	);

	let obstructionClass: typeof Obstruction | undefined;
	let hasUpgradedOne = false;

	for (const obstruction of obstructions) {
		if (!obstruction.isAlive) continue;

		let hasUpgrade = false;

		if (!obstructionClass) {
			const upgrades = obstruction
				.get(UpgradeComponent)
				.filter((v): v is UpgradeComponent => !!v);
			obstructionClass = upgrades.find(
				(u) => u.obstruction.name === upgrade,
			)?.obstruction;
			if (!obstructionClass) continue;
			hasUpgrade = true;
		}

		if (
			!hasUpgrade &&
			!obstruction
				.get(UpgradeComponent)
				.some((v) => v && v.obstruction.name === upgrade)
		)
			continue;

		const cost = calculateUpgradeCost(
			obstruction.constructor as typeof Obstruction,
			obstructionClass,
		);
		const check = player.checkResources(cost);
		if (check?.length) {
			if (!hasUpgradedOne)
				appendErrorMessage(`Not enough ${check.join(" ")}`);
			return;
		}

		hasUpgradedOne = true;

		player.subtractResources(cost);
		const { x, y } = obstruction.position;
		obstruction.remove();
		const newObstruction = new obstructionClass({ x, y, owner: player });
		game.pathingMap.addEntity(newObstruction);
	}
};

export const makeUpgradeAction = ({
	fromObstruction,
	toObsturction,
}: {
	fromObstruction: typeof Obstruction;
	toObsturction: typeof Obstruction;
}): Action => ({
	name: toObsturction.name,
	description: toObsturction.defaults.buildDescription,
	hotkey: toObsturction.defaults.buildHotkey!,
	type: "custom" as const,
	localHandler: ({ player }: ImmediateActionProps): void => {
		const u = player.getPrimarySelectedUnit();
		if (!u || u.owner !== player) return;

		const cost = calculateUpgradeCost(fromObstruction, toObsturction);
		const check = player.checkResources(cost);
		if (check?.length) {
			appendErrorMessage(`Not enough ${check.join(" ")}`);
			return;
		}

		player.game.transmit({
			type: "upgrade",
			obstructions: [u.id],
			upgrade: toObsturction.name,
		});
	},
	syncHandler: upgradeSyncHandler,
});

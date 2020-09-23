import { Game } from "../Game";
import { currentGame } from "../gameContext";
import { MouseEvents } from "../systems/Mouse";
import { isUnit, isWidget } from "../typeguards";
import { attackAction } from "./attack";
import { attackMoveAction } from "./attackMove";
import { buildAction } from "./build";
import { holdPositionAction } from "./holdPosition";
import { mirrorAction } from "./mirror";
import { moveAction } from "./move";
import { stopAction } from "./stop";

const rightClick: MouseEvents["mouseDown"] = ({ mouse }) => {
	const { x, y } = mouse.ground;
	const game = currentGame();

	if ((mouse.entity && isWidget(mouse.entity)) || !mouse.entity)
		attackMoveAction.localHandler({
			player: game.localPlayer,
			target: mouse.entity,
			point: { x, y },
		});
};

const leftClick: MouseEvents["mouseDown"] = ({ mouse }) => {
	const game = currentGame();

	const obstructionPlacement = game.obstructionPlacement;
	if (!obstructionPlacement) return;
	if (!obstructionPlacement.valid) return;

	buildAction.localHandler({
		player: game.localPlayer,
		point: { x: mouse.ground.x, y: mouse.ground.y },
	});
};

export const initSpriteLogicListeners = (game: Game): void => {
	game.mouse.addEventListener("mouseDown", (e) => {
		if (e.button === 2 || e.ctrlDown) return rightClick(e);
		if (e.button === 0) leftClick(e);
	});

	game.ui.addEventListener("keyDown", (e) => {
		const hotkey = game.actions.activeActions.find(
			(b) => b.hotkey === e.key,
		);
		if (!hotkey) return;

		if (hotkey.type === "custom")
			return hotkey.localHandler({ player: game.localPlayer });

		if (hotkey.type === "build") {
			const ownBuilders = game.selectionSystem.selection.filter(
				(u) =>
					isUnit(u) &&
					u.owner === game.localPlayer &&
					u.builds.includes(hotkey.obstruction),
			);

			if (ownBuilders.length) {
				const obstructionPlacement = game.obstructionPlacement;
				if (!obstructionPlacement) return;
				obstructionPlacement.start(hotkey.obstruction);
			}
		}
	});

	game.addNetworkListener("stop", stopAction.syncHandler);
	game.addNetworkListener("mirror", mirrorAction.syncHandler);
	game.addNetworkListener("holdPosition", holdPositionAction.syncHandler);
	game.addNetworkListener("attack", attackAction.syncHandler);
	game.addNetworkListener("move", moveAction.syncHandler);
	game.addNetworkListener("build", buildAction.syncHandler);
};

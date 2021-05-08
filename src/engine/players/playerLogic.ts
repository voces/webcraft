import { logLine } from "../../core/logger";
import type { Game } from "../Game";
import { alea } from "../lib/alea";

export const initPlayerLogic = (game: Game): void => {
	// Received when someone (including us) joins
	game.addNetworkListener("connection", (data) => {
		logLine("updating random seed", data.time.toString());
		game.random = alea(data.time.toString());
		game.update(data);

		const player = game.onPlayerJoin(data);

		if (game.localPlayer === undefined && !game.isHost)
			game.localPlayer = player;
		else if (
			game.players.reduce((count, p) => count + (p.id >= 0 ? 1 : 0), 0) >
			1
		)
			game.newPlayers = true;
	});

	// Received when someone leaves
	game.addNetworkListener("disconnection", ({ time, connection }) => {
		const playerIndex = game.players.findIndex((p) => p.id === connection);
		if (playerIndex === -1) return;

		game.update({ time });

		game.onPlayerLeave(game.players[playerIndex]);
	});
};

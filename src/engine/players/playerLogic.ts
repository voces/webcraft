import { Game } from "../Game";
import { alea } from "../lib/alea";

export const initPlayerLogic = (game: Game): void => {
	// Received when someone (including us) joins
	game.addNetworkListener("connection", (data) => {
		game.random = alea(data.time.toString());
		game.update(data);

		const player = game.onPlayerJoin(data);

		if (game.localPlayer === undefined && !game.isHost)
			game.localPlayer = player;
		else game.newPlayers = true;
	});

	// Received when someone leaves
	game.addNetworkListener("disconnection", ({ time, connection }) => {
		const playerIndex = game.players.findIndex((p) => p.id === connection);
		if (playerIndex === -1) return;

		game.update({ time });

		game.onPlayerLeave(game.players[playerIndex]);
	});
};

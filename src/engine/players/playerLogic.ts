import { Player } from "./Player";
import { next as nextColor } from "./colors";
import { alea } from "../lib/alea";
import { Game } from "../Game";

export const initPlayerLogic = (game: Game): void => {
	// Received when someone (including us) joins
	game.addNetworkListener("connection", (data) => {
		game.random = alea(data.time.toString());

		game.update(data);

		const player = new Player({
			color: nextColor(),
			id: data.connection,
			username: data.username,
			crosserPlays: Math.max(
				0,
				...game.players.map((p) => p.crosserPlays),
			),
			game,
		});

		if (game.localPlayer === undefined && !game.isHost)
			game.localPlayer = player;
		else game.newPlayers = true;

		game.onPlayerJoin();
	});

	// Received when someone leaves
	game.addNetworkListener("disconnection", ({ time, connection }) => {
		const playerIndex = game.players.findIndex((p) => p.id === connection);
		if (playerIndex === -1) return;

		game.update({ time });

		game.onPlayerLeave(game.players[playerIndex]);
	});
};

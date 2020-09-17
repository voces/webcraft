import { Player, patchInState } from "./Player";
import { next as nextColor, release as releaseColor } from "./colors";
import { updateDisplay } from "./elo";
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

		updateDisplay(game);
	});

	// Received when someone leaves
	game.addNetworkListener("disconnection", ({ time, connection }) => {
		game.update({ time });

		const playerIndex = game.players.findIndex((p) => p.id === connection);
		if (playerIndex === -1) return;
		const player = game.players[playerIndex];

		player.isHere = false;

		if (game.round) game.round.onPlayerLeave();

		game.players.splice(playerIndex, 1);

		if (player.color) releaseColor(player.color);

		updateDisplay(game);
	});

	// Received by the the upon someone connecting after the round ends
	game.addNetworkListener(
		"state",
		({ time, state: { arena, players: inputPlayers } }) => {
			game.update({ time });

			patchInState(game, inputPlayers);

			game.setArena(arena);
			game.receivedState = "state";
			game.lastRoundEnd = time / 1000;
			// game.random = new Random( time );

			updateDisplay(game);
		},
	);
};

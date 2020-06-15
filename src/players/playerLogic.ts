import { Player, patchInState } from "./Player.js";
import { next as nextColor, release as releaseColor } from "./colors.js";
import { updateDisplay } from "./elo.js";
import { alea } from "../lib/alea.js";
import "./login.js";
import { context } from "../superContext.js";

setTimeout(() => {
	// Received when someone (including us) joins
	context.game.addNetworkListener("connection", (data) => {
		const { game } = context;
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

		updateDisplay();
	});

	// Received when someone leaves
	context.game.addNetworkListener("disconnection", ({ time, connection }) => {
		context.game.update({ time });

		const playerIndex = context.game.players.findIndex(
			(p) => p.id === connection,
		);
		if (playerIndex === -1) return;
		const player = context.game.players[playerIndex];

		player.isHere = false;

		if (context.game.round) context.game.round.onPlayerLeave();

		context.game.players.splice(playerIndex, 1);

		if (player.color) releaseColor(player.color);

		updateDisplay();
	});

	// Received by the the upon someone connecting after the round ends
	context.game.addNetworkListener(
		"state",
		({ time, state: { arena, players: inputPlayers } }) => {
			context.game.update({ time });

			patchInState(inputPlayers);

			context.game.setArena(arena);
			context.game.receivedState = "state";
			context.game.lastRoundEnd = time / 1000;
			// context.game.random = new Random( time );

			updateDisplay();
		},
	);
});

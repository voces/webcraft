import { document } from "../../core/util/globals";
import { Player } from "./Player";
import { emptyElement } from "../util/html";
import { Game } from "../Game";

// Formula taken from
// https://metinmediamath.wordpress.com/2013/11/27/how-to-calculate-the-elo-rating-including-example/

const K = 32;

const calculatePower = (team: number[]) =>
	team.reduce((sum, player) => sum + Math.pow(10, player / 400), 0);

const calculateExpectedWin = (teamA: number[], teamB: number[]) => {
	const teamAPower = calculatePower(teamA);
	return teamAPower / (teamAPower + calculatePower(teamB));
};

const calculateNewRatings = (
	teamA: number[],
	teamB: number[],
	score: number,
) => {
	const expectedWin = calculateExpectedWin(teamA, teamB);
	const won = score > 0 ? 1 : 0;
	const totalChange = (Math.sqrt(score) || 1) * K * (won - expectedWin);
	return [
		teamA.map((player) => player + totalChange / teamA.length),
		teamB.map((player) => player - totalChange / teamB.length),
	];
};

export const elo = ({
	mode,
	crossers,
	defenders,
	scores,
	game,
}: {
	mode: keyof Player["score"];
	crossers: Player[];
	defenders: Player[];
	scores: number;
	game: Game;
}): void => {
	const newRatings = calculateNewRatings(
		crossers.map((p) => p.score[mode]),
		defenders.map((p) => p.score[mode]),
		scores,
	);

	newRatings[0].forEach(
		(score, index) => (crossers[index].score[mode] = score),
	);
	newRatings[1].forEach(
		(score, index) => (defenders[index].score[mode] = score),
	);

	updateDisplay(game);
};

export const updateDisplay = (game: Game): void => {
	const container = document.getElementById("scores")!;
	emptyElement(container);

	game.players.forEach((player) => {
		const playerName = document.createElement("span");
		playerName.textContent = player.username;
		if (player.color?.hex) playerName.style.color = player.color?.hex;
		playerName.classList.add("player");
		container.appendChild(playerName);

		const plays = document.createElement("span");
		plays.textContent = player.crosserPlays.toFixed(0);
		plays.classList.add("plays");
		container.appendChild(plays);

		const score = document.createElement("span");
		score.textContent = player.score[game.settings.mode].toFixed(0);
		score.classList.add("score");
		container.appendChild(score);
	});
};

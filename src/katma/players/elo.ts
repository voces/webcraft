import { document } from "../../core/util/globals";
import { Player } from "../../engine/players/Player";
import { emptyElement } from "../../engine/util/html";
import { Game } from "../../engine/Game";

// Formula taken from
// https://metinmediamath.wordpress.com/2013/11/27/how-to-calculate-the-elo-rating-including-example/

const K = 16;

type ScoreAndPlays = { score: number; plays: number };

const calculatePower = (team: ScoreAndPlays[]) =>
	team.reduce((sum, player) => sum + Math.pow(10, player.score / 400), 0);

const calculateExpectedWin = (
	teamA: ScoreAndPlays[],
	teamB: ScoreAndPlays[],
) => {
	const teamAPower = calculatePower(teamA);
	return teamAPower / (teamAPower + calculatePower(teamB));
};

const calculateNewRatings = (
	teamA: ScoreAndPlays[],
	teamB: ScoreAndPlays[],
	score: number,
) => {
	const expectedWin = calculateExpectedWin(teamA, teamB);
	const won = score > 0 ? 1 : 0;

	const players = [...teamA, ...teamB];
	const averagePlays =
		players.reduce((sum, player) => sum + player.plays, 0) / players.length;

	const totalChange =
		(Math.sqrt(score) || 1) *
		K *
		(1 + 9 / averagePlays ** (1 / 2)) *
		(won - expectedWin);

	return [
		teamA.map((player) => player.score + totalChange / teamA.length),
		teamB.map((player) => player.score - totalChange / teamB.length),
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
		crossers.map((p) => ({ score: p.score[mode], plays: p.crosserPlays })),
		defenders.map((p) => ({ score: p.score[mode], plays: p.crosserPlays })),
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

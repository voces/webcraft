import { Context } from "./Context.js";
import { Game } from "./Game.js";

export const gameContext = new Context<Game>();

export const context = {
	get game(): Game {
		return gameContext.current;
	},
};

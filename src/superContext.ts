import { Context } from "./Context.js";
import { Game } from "./Game.js";
import { Network } from "./Network.js";

export const gameContext = new Context<Game>();
export const networkContext = new Context<Network>();

export const context = {
	get game(): Game {
		return gameContext.current;
	},
	get network(): Network {
		return networkContext.current;
	},
};

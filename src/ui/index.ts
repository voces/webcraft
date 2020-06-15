import "./clock.js";
import "./essence.js";
import "./hotkeys.js";
import "./listeners.js";
import "./waitingSplash.js";
import "./chat.js";
import { window } from "../util/globals.js";
import { Game } from "../Game.js";
import { emitter, Emitter } from "../emitter.js";
import { initCameraListeners } from "../players/camera.js";

type UIEvents = {
	keyDown: (data: { key: string; ctrlDown: boolean; game: Game }) => void;
	keyUp: (data: { key: string; ctrlDown: boolean; game: Game }) => void;
	mouseMove: (data: {
		target: EventTarget | null;
		x: number;
		y: number;
	}) => void;
	mouseOut: (data: { relatedTarget: EventTarget | null }) => void;
	wheel: (data: { deltaY: number }) => void;
};

class UI {
	private game: Game;

	constructor(game: Game) {
		emitter(this);
		this.game = game;

		window.addEventListener("keydown", (e) => {
			if (e.key === "f" && e.ctrlKey) {
				e.preventDefault();
			}

			this.dispatchEvent("keyDown", {
				ctrlDown: e.ctrlKey,
				game,
				key: e.key,
			});
		});

		window.addEventListener("keyup", (e) => {
			this.dispatchEvent("keyUp", {
				ctrlDown: e.ctrlKey,
				game,
				key: e.key,
			});
		});

		window.addEventListener("mousemove", (e) => {
			this.dispatchEvent("mouseMove", {
				target: e.target,
				x: e.pageX,
				y: e.pageY,
			});
		});

		window.addEventListener("mouseout", (e) => {
			this.dispatchEvent("mouseOut", {
				relatedTarget: e.relatedTarget,
			});
		});

		window.addEventListener("wheel", (e) => {
			this.dispatchEvent("wheel", {
				deltaY: e.deltaY,
			});
		});

		initCameraListeners(this);
	}
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface UI extends Emitter<UIEvents> {}

export { UI };

import "./hotkeys.js";
import { window } from "../util/globals.js";
import { Game } from "../Game.js";
import { emitter, Emitter } from "../emitter.js";
import { initCameraListeners } from "../players/camera.js";
import { initListeners } from "./listeners.js";
import { initChatListeners } from "./chat.js";
import { initSplashListeners } from "./waitingSplash.js";
import { initEssenceListeners } from "./essence.js";
import { initClockListeners } from "./clock.js";
import { initLogin } from "./login.js";

enum MouseButton {
	LEFT = 0,
	WHEEL,
	RIGHT,
	BACK,
	FORWARD,
}

export type UIEvents = {
	keyDown: (data: { key: string; ctrlDown: boolean; game: Game }) => void;
	keyUp: (data: { key: string; ctrlDown: boolean; game: Game }) => void;
	mouseMove: (data: {
		target: EventTarget | null;
		x: number;
		y: number;
	}) => void;
	mouseOut: (data: { relatedTarget: EventTarget | null }) => void;
	mouseDown: (data: {
		button: MouseButton;
		ctrlDown: boolean;
		game: Game;
		target: EventTarget | null;
		x: number;
		y: number;
	}) => void;
	wheel: (data: { deltaY: number }) => void;
};

class UI {
	private game: Game;

	constructor(game: Game) {
		emitter(this);
		this.game = game;

		window.addEventListener("keydown", (e) => {
			if (e.key === "f" && e.ctrlKey) e.preventDefault();

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
				x: e.clientX,
				y: e.clientY,
			});
		});

		window.addEventListener("mouseout", (e) => {
			this.dispatchEvent("mouseOut", {
				relatedTarget: e.relatedTarget,
			});
		});

		window.addEventListener("mousedown", (e) => {
			this.dispatchEvent("mouseDown", {
				button: e.button,
				ctrlDown: e.ctrlKey,
				game,
				target: e.target,
				x: e.clientX,
				y: e.clientY,
			});
		});

		window.addEventListener("wheel", (e) => {
			this.dispatchEvent("wheel", {
				deltaY: e.deltaY,
			});
		});

		initCameraListeners(this);
		initListeners(this);
		initChatListeners(game, this);
		initSplashListeners(game);
		initEssenceListeners(game);
		initClockListeners(game);
		initLogin(game);
	}
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface UI extends Emitter<UIEvents> {}

export { UI };

import "./hotkeys";
import { window } from "../util/globals";
import { Game } from "../Game";
import { emitter, Emitter } from "../emitter";
import { initCameraListeners } from "../players/camera";
import { initListeners } from "./listeners";
import { initChatListeners } from "./chat";
import { initSplashListeners } from "./waitingSplash";
import { initEssenceListeners } from "./essence";
import { initClockListeners } from "./clock";
import { initLogin } from "./login";

enum MouseButton {
	LEFT = 0,
	WHEEL,
	RIGHT,
	BACK,
	FORWARD,
}

export type MouseMoveEvent = {
	target: EventTarget | null;
	x: number;
	y: number;
};

export type MouseDownEvent = MouseMoveEvent & {
	button: MouseButton;
	ctrlDown: boolean;
	game: Game;
};

export type UIEvents = {
	keyDown: (data: { key: string; ctrlDown: boolean; game: Game }) => void;
	keyUp: (data: { key: string; ctrlDown: boolean; game: Game }) => void;
	mouseMove: (data: MouseMoveEvent) => void;
	mouseOut: (data: { relatedTarget: EventTarget | null }) => void;
	mouseDown: (data: MouseDownEvent) => void;
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

import "./hotkeys";
import { window, document } from "../util/globals";
import { Game } from "../Game";
import { emitter, Emitter } from "../emitter";
import { initCameraListeners } from "../players/camera";
import { initListeners } from "./listeners";
import { initChatListeners } from "./chat";
import { initSplashListeners } from "./waitingSplash";
import { currentGame, wrapGame } from "../gameContext";

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
	keyDown: (data: {
		key: string;
		ctrlDown: boolean;
		game: Game;
		target: EventTarget | null;
	}) => void;
	keyUp: (data: { key: string; ctrlDown: boolean; game: Game }) => void;
	mouseMove: (data: MouseMoveEvent) => void;
	mouseOut: (data: { relatedTarget: EventTarget | null }) => void;
	mouseDown: (data: MouseDownEvent) => void;
	wheel: (data: { deltaY: number }) => void;
};

class UI {
	constructor() {
		emitter(this);

		const game = currentGame();

		window.addEventListener(
			"keydown",
			wrapGame(game, (e) => {
				if (e.key === "f" && e.ctrlKey) e.preventDefault();

				this.dispatchEvent("keyDown", {
					ctrlDown: e.ctrlKey,
					game,
					key: e.key,
					target: e.target,
				});
			}),
		);

		window.addEventListener(
			"keyup",
			wrapGame(game, (e) => {
				this.dispatchEvent("keyUp", {
					ctrlDown: e.ctrlKey,
					game,
					key: e.key,
				});
			}),
		);

		window.addEventListener(
			"mousemove",
			wrapGame(game, (e) => {
				this.dispatchEvent("mouseMove", {
					target: e.target,
					x: e.clientX,
					y: e.clientY,
				});
			}),
		);

		window.addEventListener(
			"mouseout",
			wrapGame(game, (e) => {
				this.dispatchEvent("mouseOut", {
					relatedTarget: e.relatedTarget,
				});
			}),
		);

		window.addEventListener(
			"mousedown",
			wrapGame(game, (e) => {
				this.dispatchEvent("mouseDown", {
					button: e.button,
					ctrlDown: e.ctrlKey,
					game,
					target: e.target,
					x: e.clientX,
					y: e.clientY,
				});
			}),
		);

		window.addEventListener(
			"wheel",
			wrapGame(game, (e) => {
				this.dispatchEvent("wheel", {
					deltaY: e.deltaY,
				});
			}),
		);

		initCameraListeners(this);
		initListeners(this);
		initChatListeners(game, this);
		initSplashListeners(game);

		const loadApp = async () => {
			const { initialize } = await import("./preact/App");
			initialize(game);
		};

		if (
			document.readyState === "complete" ||
			document.readyState === "interactive"
		)
			loadApp();
		else window.addEventListener("DOMContentLoaded", loadApp);
	}
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface UI extends Emitter<UIEvents> {}

export { UI };

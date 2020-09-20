import { PathTweener } from "../util/tweenPoints";
import {
	document,
	requestAnimationFrame,
	window,
} from "../../core/util/globals";
import { registerCommand } from "../../ui/chat";
// https://github.com/voces/mvp-bd-client/issues/35
// eslint-disable-next-line no-restricted-imports
import { Round } from "../../katma/Round";
import { UI } from "../../ui/index";
import { currentGame, wrapGame } from "../gameContext";
// https://github.com/voces/mvp-bd-client/issues/33
// eslint-disable-next-line no-restricted-imports
import { Katma } from "../../katma/Katma";

type Direction = "right" | "left" | "down" | "up";

const CAMERA_SPEED = 25;
const ZOOM_SPEED = 1 / 500;

const uiElem = document.getElementById("ui")!;
let keyboard: Record<string, boolean> = {};

type Mouse = {
	left: boolean;
	right: boolean;
	up: boolean;
	down: boolean;
};
const emptyMouse = (mouse?: Mouse): Mouse => {
	const empty = { right: false, left: false, down: false, up: false };
	if (!mouse) return empty;
	return Object.assign(mouse, empty);
};
const mouse = emptyMouse();

let knownRound: Round;
let requestedAnimationFrame: number | undefined;
let pan: (PathTweener & { duration: number }) | undefined;

const setMouseAndRender = (direction: Direction) => {
	if (mouse[direction]) return;
	if (pan) pan = undefined;
	mouse[direction] = true;
	renderCamera();
};

const setZoom = (zoom: number) => {
	const camera = currentGame().graphics.camera;
	if (camera) camera.position.z = zoom;
};

export const initCameraListeners = (ui: UI): void => {
	ui.addEventListener("keyDown", ({ key, game }) => {
		const katma = game as Katma;
		if (!katma.round) return;

		if (knownRound !== katma.round) {
			keyboard = {};
			lastRender = 0;
		}

		knownRound = katma.round;

		if (key.startsWith("Arrow") && !keyboard[key]) {
			if (pan) pan = undefined;
			keyboard[key] = true;
			if (!requestedAnimationFrame) renderCamera();
		}
	});

	ui.addEventListener("keyUp", ({ key, game }) => {
		const katma = game as Katma;
		if (!katma.round || !keyboard) return;

		if (key.startsWith("Arrow")) keyboard[key] = false;
	});

	ui.addEventListener("mouseMove", ({ target, x, y }) => {
		if (target && target instanceof Element && uiElem.contains(target))
			return emptyMouse(mouse);

		if (x > window.innerWidth - 48) setMouseAndRender("right");
		else if (x > window.innerWidth / 2) mouse.right = false;
		else if (x > 48) mouse.left = false;
		else setMouseAndRender("left");

		if (y > window.innerHeight - 48) setMouseAndRender("down");
		else if (y > window.innerHeight / 2) mouse.down = false;
		else if (y > 48) mouse.up = false;
		else setMouseAndRender("up");
	});

	ui.addEventListener("mouseOut", ({ relatedTarget }) => {
		if (relatedTarget) return;

		emptyMouse(mouse);
	});

	ui.addEventListener("wheel", ({ deltaY }) => {
		const camera = currentGame().graphics.camera;
		if (camera) setZoom(camera.position.z + deltaY * ZOOM_SPEED);
	});
};

let lastRender: number | undefined = 0;
const renderCamera = (time?: number) => {
	const delta = (lastRender && time ? time - lastRender : 17) / 1000;
	lastRender = time;

	const game = currentGame();
	const graphics = game.graphics;

	if (pan) {
		const { x, y } = pan.step((delta * pan.distance) / pan.duration);

		if (x !== pan.target.x || y !== pan.target.y)
			requestedAnimationFrame = requestAnimationFrame(
				wrapGame(game, renderCamera),
			);
		else requestedAnimationFrame = undefined;
	} else {
		let y = 0;
		let x = 0;
		if (keyboard.ArrowDown) y -= delta * CAMERA_SPEED;
		if (keyboard.ArrowUp) y += delta * CAMERA_SPEED;
		if (keyboard.ArrowRight) x += delta * CAMERA_SPEED;
		if (keyboard.ArrowLeft) x -= delta * CAMERA_SPEED;

		if (mouse.up) y += delta * CAMERA_SPEED;
		if (mouse.down) y -= delta * CAMERA_SPEED;
		if (mouse.left) x -= delta * CAMERA_SPEED;
		if (mouse.right) x += delta * CAMERA_SPEED;

		graphics.panTo(
			{
				x: graphics.camera.position.x + x,
				y: graphics.camera.position.y + 7 + y,
			},
			0,
		);

		if (mouse.up)
			if (mouse.left) document.body.style.cursor = "nw-resize";
			else if (mouse.right) document.body.style.cursor = "ne-resize";
			else document.body.style.cursor = "n-resize";
		else if (mouse.down)
			if (mouse.left) document.body.style.cursor = "sw-resize";
			else if (mouse.right) document.body.style.cursor = "se-resize";
			else document.body.style.cursor = "s-resize";
		else if (mouse.left) document.body.style.cursor = "w-resize";
		else if (mouse.right) document.body.style.cursor = "e-resize";
		else document.body.style.cursor = "";

		if (
			Object.values(keyboard).some(Boolean) ||
			Object.values(mouse).some(Boolean)
		)
			requestedAnimationFrame = requestAnimationFrame(
				wrapGame(game, renderCamera),
			);
		else requestedAnimationFrame = undefined;
	}
};

registerCommand({
	name: "zoom",
	comment: "Zooms in or out. Initial 10",
	args: [{ required: true, name: "level" }],
	handler: (_, zoom) => setZoom(parseFloat(zoom)),
});

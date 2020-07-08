import { WORLD_TO_GRAPHICS_RATIO } from "../constants.js";
import { tweenPoints, PathTweener } from "../util/tweenPoints.js";
import { document, requestAnimationFrame, window } from "../util/globals.js";
import { dragSelect } from "../sprites/dragSelect.js";
import { registerCommand } from "../ui/chat.js";
import { Round } from "../Round.js";
import { Point } from "../pathing/PathingMap.js";
import { UI } from "../ui/index.js";

type Direction = "right" | "left" | "down" | "up";

const CAMERA_SPEED = 800;
const ZOOM_SPEED = 1 / 500;

const arena = document.getElementById("arena") as HTMLElement &
	Point & { scale: number };
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
let followInterval: number | undefined;

const setMouseAndRender = (direction: Direction) => {
	if (mouse[direction]) return;
	if (pan) pan = undefined;
	mouse[direction] = true;
	renderCamera();
};

const setScale = (scale: number) => {
	const oldHeight = arena.clientHeight * arena.scale;
	const oldWidth = arena.clientWidth * arena.scale;
	arena.scale = Math.max(scale, 0.1);
	arena.style.transform = `scale(${arena.scale})`;

	// We should find where the camera is and scale as if that is the origin
	// This just treats the center of the arena as the origin
	arena.style.top =
		(arena.y += (oldHeight - arena.clientHeight * arena.scale) / 2) + "px";
	arena.style.left =
		(arena.x += (oldWidth - arena.clientWidth * arena.scale) / 2) + "px";
};

export const initCameraListeners = (ui: UI): void => {
	ui.addEventListener("keyDown", ({ key, ctrlDown, game }) => {
		if (key === "f" && ctrlDown)
			if (followInterval) {
				clearInterval(followInterval);
				followInterval = undefined;
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			else followInterval = <any>setInterval(follow, 500);

		if (!game.round) return;

		if (knownRound !== game.round) {
			keyboard = {};
			lastRender = 0;
		}

		knownRound = game.round;

		if (key.startsWith("Arrow") && !keyboard[key]) {
			if (pan) pan = undefined;
			keyboard[key] = true;
			if (!requestedAnimationFrame) renderCamera();
		}
	});

	ui.addEventListener("keyUp", ({ key, game }) => {
		if (!game.round || !keyboard) return;

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

	ui.addEventListener("wheel", ({ deltaY }) =>
		setScale(arena.scale + deltaY * ZOOM_SPEED),
	);
};

let lastRender: number | undefined = 0;
const renderCamera = (time?: number) => {
	const delta = (lastRender && time ? time - lastRender : 17) / 1000;
	lastRender = time;

	if (pan) {
		const { x, y } = pan.step((delta * pan.distance) / pan.duration);

		arena.style.top = (arena.y = y) + "px";
		arena.style.left = (arena.x = x) + "px";

		if (x !== pan.target.x || y !== pan.target.y)
			requestedAnimationFrame = requestAnimationFrame(renderCamera);
		else requestedAnimationFrame = undefined;
	} else {
		if (keyboard.ArrowDown)
			arena.style.top = (arena.y = arena.y - delta * CAMERA_SPEED) + "px";
		if (keyboard.ArrowUp)
			arena.style.top = (arena.y = arena.y + delta * CAMERA_SPEED) + "px";
		if (keyboard.ArrowRight)
			arena.style.left =
				(arena.x = arena.x - delta * CAMERA_SPEED) + "px";
		if (keyboard.ArrowLeft)
			arena.style.left =
				(arena.x = arena.x + delta * CAMERA_SPEED) + "px";

		if (mouse.up)
			arena.style.top = (arena.y = arena.y + delta * CAMERA_SPEED) + "px";
		if (mouse.down)
			arena.style.top = (arena.y = arena.y - delta * CAMERA_SPEED) + "px";
		if (mouse.left)
			arena.style.left =
				(arena.x = arena.x + delta * CAMERA_SPEED) + "px";
		if (mouse.right)
			arena.style.left =
				(arena.x = arena.x - delta * CAMERA_SPEED) + "px";

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
			requestedAnimationFrame = requestAnimationFrame(renderCamera);
		else requestedAnimationFrame = undefined;
	}
};

export const panTo = ({
	x,
	y,
	duration = 0.125,
}: {
	x: number;
	y: number;
	duration?: number;
}): void => {
	x *= WORLD_TO_GRAPHICS_RATIO * arena.scale;
	y *= WORLD_TO_GRAPHICS_RATIO * arena.scale;

	const xCenter = window.innerWidth / 2;
	const yCenter = window.innerHeight / 2;

	pan = Object.assign(
		tweenPoints([
			{ x: arena.x || 0, y: arena.y || 0 },
			{ x: xCenter - x, y: yCenter - y },
		]),
		{ duration },
	);

	renderCamera();
};

const follow = () => {
	if (dragSelect.selection.length === 0) return;

	const { xSum, ySum } = dragSelect.selection.reduce(
		({ xSum, ySum }, { position: { x, y } }) => ({
			xSum: xSum + x,
			ySum: ySum + y,
		}),
		{ xSum: 0, ySum: 0 },
	);

	const x = xSum / dragSelect.selection.length;
	const y = ySum / dragSelect.selection.length;
	panTo({ x, y, duration: 10 });
};

registerCommand({
	name: "zoom",
	comment: "Zooms in or out. Initial 1650",
	args: [{ required: true, name: "level" }],
	handler: (_, zoom) => setScale(1650 / parseFloat(zoom)),
});

export const clientToWorld = ({ x, y }: Point): Point => ({
	x: (x - arena.x) / arena.scale / WORLD_TO_GRAPHICS_RATIO,
	y: (y - arena.y) / arena.scale / WORLD_TO_GRAPHICS_RATIO,
});

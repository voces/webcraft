import { WORLD_TO_GRAPHICS_RATIO } from "../constants";
import { tweenPoints, PathTweener } from "../util/tweenPoints";
import { document, requestAnimationFrame, window } from "../util/globals";
import { registerCommand } from "../ui/chat";
import { Round } from "../Round";
import { Point } from "../pathing/PathingMap";
import { UI } from "../ui/index";
import { Game } from "../Game";
import { Sprite } from "../entities/sprites/Sprite";

type Direction = "right" | "left" | "down" | "up";

const CAMERA_SPEED = 25;
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

const setZoom = (zoom: number) => {
	const camera = Game.manager.context?.graphics.camera;
	if (camera) camera.position.z = zoom;
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

	ui.addEventListener("wheel", ({ deltaY }) => {
		const camera = Game.manager.context?.graphics.camera;
		if (camera) setZoom(camera.position.z + deltaY * ZOOM_SPEED);
	});
};

let lastRender: number | undefined = 0;
const renderCamera = (time?: number) => {
	const delta = (lastRender && time ? time - lastRender : 17) / 1000;
	lastRender = time;

	const graphics = Game.manager.context?.graphics;

	if (pan) {
		const { x, y } = pan.step((delta * pan.distance) / pan.duration);

		arena.style.top = (arena.y = y) + "px";
		arena.style.left = (arena.x = x) + "px";

		if (x !== pan.target.x || y !== pan.target.y)
			requestedAnimationFrame = requestAnimationFrame(renderCamera);
		else requestedAnimationFrame = undefined;
	} else {
		if (graphics) {
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
		}

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
	const selection = Game.manager.context?.selectionSystem.selection;
	if (!selection?.length) return;

	const { xSum, ySum } = selection.filter(Sprite.isSprite).reduce(
		({ xSum, ySum }, { position: { x, y } }) => ({
			xSum: xSum + x,
			ySum: ySum + y,
		}),
		{ xSum: 0, ySum: 0 },
	);

	const x = xSum / selection.length;
	const y = ySum / selection.length;
	panTo({ x, y, duration: 10 });
};

registerCommand({
	name: "zoom",
	comment: "Zooms in or out. Initial 10",
	args: [{ required: true, name: "level" }],
	handler: (_, zoom) => setZoom(parseFloat(zoom)),
});

export const clientToWorld = ({ x, y }: Point): Point => ({
	x: (x - arena.x) / arena.scale / WORLD_TO_GRAPHICS_RATIO,
	y: (y - arena.y) / arena.scale / WORLD_TO_GRAPHICS_RATIO,
});

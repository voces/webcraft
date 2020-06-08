import { Action } from "../sprites/spriteLogic.js";
import { document } from "../util/globals.js";
import { dragSelect } from "../sprites/dragSelect.js";
import { defined } from "../types.js";
import { Unit } from "../sprites/Unit.js";
import { emptyElement } from "../util/html.js";
import { game } from "../index.js";
import { panTo } from "../players/camera.js";

const container = document.getElementById("hotkeys")!;

const qwertySort = "qwertyuiopasdfghjklzxcvbnm".split("");
qwertySort.push("Escape");

const genNode = (action: Action) => {
	const elem = document.createElement("div");
	elem.classList.add("hotkey");

	const key = document.createElement("span");
	key.classList.add("key");
	key.textContent = action.hotkey.toUpperCase();
	elem.appendChild(key);

	const tooltip = document.createElement("div");
	tooltip.classList.add("tooltip");

	const title = document.createElement("div");
	title.classList.add("title");
	const hotkeyIndex = action.name.toLowerCase().indexOf(action.hotkey);
	const casedHotkey =
		hotkeyIndex >= 0
			? action.name[hotkeyIndex]
			: action.hotkey.toUpperCase();
	const highlight = `<span class="highlight">${casedHotkey}</span>`;
	title.innerHTML =
		hotkeyIndex >= 0
			? action.name.slice(0, hotkeyIndex) +
			  highlight +
			  action.name.slice(hotkeyIndex + 1)
			: action.name + ` (${highlight})`;
	tooltip.appendChild(title);

	const description = document.createElement("div");
	description.classList.add("description");
	if (action.description) description.textContent = action.description;
	tooltip.appendChild(description);

	elem.appendChild(tooltip);

	action.elem = elem;

	return elem;
};

export const activeHotkeys: Action[] = [];

const center = {
	name: "Center",
	hotkey: " " as const,
	type: "custom" as const,
	handler: (): void => {
		if (
			dragSelect.selection.length === 0 &&
			game.localPlayer.sprites.length
		)
			return dragSelect.setSelection([game.localPlayer.sprites[0]]);

		const { xSum, ySum } = dragSelect.selection.reduce(
			({ xSum, ySum }, { x, y }) => ({ xSum: xSum + x, ySum: ySum + y }),
			{ xSum: 0, ySum: 0 },
		);
		const x = xSum / dragSelect.selection.length;
		const y = ySum / dragSelect.selection.length;
		panTo({ x, y });
	},
};

const aCharCode = "a".charCodeAt(0);
const zCharCode = "z".charCodeAt(0);

dragSelect.addEventListener("selection", (sprites) => {
	// Clear hotkeys
	emptyElement(container);
	activeHotkeys.splice(0);
	activeHotkeys.push(center);

	// Get actions
	const units = sprites.filter(Unit.isUnit);
	if (!units.length) return;

	let activeUnit = units[0];
	for (let i = 1; i < units.length; i++)
		if (units[i].priority > activeUnit.priority) activeUnit = units[i];
	const actions = activeUnit.actions;
	const sortedActions = qwertySort
		.map((k) => actions.find((b) => b.hotkey === k))
		.filter(defined);
	activeHotkeys.push(...sortedActions);

	activeHotkeys.forEach((action) => {
		const charCode = action.hotkey.charCodeAt(0);
		if (
			charCode < aCharCode ||
			charCode > zCharCode ||
			action.hotkey.length > 1
		)
			return;

		const elem = action.elem ?? genNode(action);
		container.appendChild(elem);
	});
});

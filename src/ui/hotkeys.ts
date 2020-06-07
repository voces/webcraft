import { Button } from "../sprites/spriteLogic.js";
import { document } from "../util/globals.js";
import { dragSelect } from "../sprites/dragSelect.js";
import { defined } from "../types.js";
import { Unit } from "../sprites/Unit.js";
import { emptyElement } from "../util/html.js";
import { game } from "../index.js";
import { panTo } from "../players/camera.js";

const container = document.getElementById("hotkeys")!;

const qwertySort = "qwertyuiopasdfghjklzxcvbnm".split("");

const genNode = (button: Button) => {
	const elem = document.createElement("div");
	elem.classList.add("hotkey");

	const key = document.createElement("span");
	key.classList.add("key");
	key.textContent = button.hotkey.toUpperCase();
	elem.appendChild(key);

	const tooltip = document.createElement("div");
	tooltip.classList.add("tooltip");

	const title = document.createElement("div");
	title.classList.add("title");
	const hotkeyIndex = button.name.toLowerCase().indexOf(button.hotkey);
	const casedHotkey =
		hotkeyIndex >= 0
			? button.name[hotkeyIndex]
			: button.hotkey.toUpperCase();
	const highlight = `<span class="highlight">${casedHotkey}</span>`;
	title.innerHTML =
		hotkeyIndex >= 0
			? button.name.slice(0, hotkeyIndex) +
			  highlight +
			  button.name.slice(hotkeyIndex + 1)
			: button.name + ` (${highlight})`;
	tooltip.appendChild(title);

	const description = document.createElement("div");
	description.classList.add("description");
	if (button.description) description.textContent = button.description;
	tooltip.appendChild(description);

	elem.appendChild(tooltip);

	button.elem = elem;

	return elem;
};

export const activeHotkeys: Button[] = [];

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

	// Get buttons
	const units = sprites.filter(Unit.isUnit);
	if (!units.length) return;

	let activeUnit = units[0];
	for (let i = 1; i < units.length; i++)
		if (units[i].priority > activeUnit.priority) activeUnit = units[i];
	const buttons = activeUnit.buttons;
	const sortedButtons = qwertySort
		.map((k) => buttons.find((b) => b.hotkey === k))
		.filter(defined);
	activeHotkeys.push(...sortedButtons);

	activeHotkeys.forEach((button) => {
		const charCode = button.hotkey.charCodeAt(0);
		if (
			charCode < aCharCode ||
			charCode > zCharCode ||
			button.hotkey.length > 1
		)
			return;

		const elem = button.elem ?? genNode(button);
		container.appendChild(elem);
	});
});

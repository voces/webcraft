import { Action } from "../entities/sprites/spriteLogic";
import { document } from "../util/globals";
import { defined } from "../types";
import { Unit } from "../entities/sprites/Unit";
import { emptyElement } from "../util/html";
import { Entity } from "../core/Entity";
import { Mechanism } from "../core/Merchanism";
import { isSprite } from "../typeguards";
import { currentGame } from "../gameContext";

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

const center: Action = {
	name: "Center",
	hotkey: " " as const,
	type: "custom" as const,
	handler: ({ player }): void => {
		const selectionSystem = player.game.selectionSystem;
		const selection = selectionSystem.selection;

		if (selection.length === 0 && player.sprites.length)
			return selectionSystem.setSelection([player.sprites[0]]);

		const { xSum, ySum } = selection.filter(isSprite).reduce(
			({ xSum, ySum }, { position: { x, y } }) => ({
				xSum: xSum + x,
				ySum: ySum + y,
			}),
			{ xSum: 0, ySum: 0 },
		);
		const x = xSum / selection.length;
		const y = ySum / selection.length;
		player.game.graphics.panTo({ x, y });
	},
};

const aCharCode = "a".charCodeAt(0);
const zCharCode = "z".charCodeAt(0);

export class Hotkeys extends Mechanism {
	activeActions: Action[] = [];

	constructor() {
		super();
		currentGame().addEventListener(
			"selection",
			(entities: ReadonlyArray<Entity>) => this.onSelection(entities),
		);
	}

	private onSelection(entities: ReadonlyArray<Entity>) {
		// Clear actions
		emptyElement(container);
		this.activeActions.splice(0);
		this.activeActions.push(center);

		// Get actions
		const game = currentGame();
		const units = entities
			.filter(Unit.isUnit)
			.filter((u) => u.owner === game.localPlayer);
		if (!units.length) return;

		let activeUnit = units[0];
		for (let i = 1; i < units.length; i++)
			if (units[i].priority > activeUnit.priority) activeUnit = units[i];
		const actions = activeUnit.actions;
		const sortedActions = qwertySort
			.map((k) => actions.find((b) => b.hotkey === k))
			.filter(defined);
		this.activeActions.push(...sortedActions);

		this.activeActions.forEach((action) => {
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
	}
}

import type { Entity } from "../../core/Entity";
import { Mechanism } from "../../core/Merchanism";
import { document } from "../../core/util/globals";
import { centerAction } from "../../engine/actions/center";
import type { Action } from "../../engine/actions/types";
import { currentGame } from "../../engine/gameContext";
import { defined } from "../../engine/types";
import { emptyElement } from "../../engine/util/html";

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

	if ("cost" in action) {
		const cost = Object.entries(action.cost).filter(([, v]) => v > 0);
		const container = document.createElement("div");
		container.classList.add("resources");
		for (const [key, value] of cost) {
			const resource = document.createElement("div");
			resource.classList.add("resource", key);
			resource.textContent = value.toString();
			resource.title = `${key[0].toUpperCase()}${key.slice(1)}: ${value}`;
			container.appendChild(resource);
		}
		tooltip.appendChild(container);
	}

	const description = document.createElement("div");
	description.classList.add("description");
	if (action.description) description.textContent = action.description;
	tooltip.appendChild(description);

	elem.appendChild(tooltip);

	action.elem = elem;

	return elem;
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
		this.activeActions.push(centerAction);

		// Get actions
		const game = currentGame();
		const activeUnit = game.localPlayer.getPrimarySelectedUnit(entities);
		if (!activeUnit) return;

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

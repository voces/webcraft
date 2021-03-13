import marked from "marked";

import { document } from "../../core/util/globals";
import type { Game } from "../../engine/Game";
import { wrapGame } from "../../engine/gameContext";
// import { toggleDebugging } from "../pathing/PathingMap";
import { emptyElement } from "../../engine/util/html";
import type { UI } from "./index";

type Command = {
	name: string;
	aliases?: string[];
	args?: {
		name: string;
		required: boolean;
	}[];
	comment: string;
	handler: (...words: string[]) => void;
};

marked.setOptions({ breaks: true });

const uiElem = document.getElementById("ui")!;

const scratch = document.createElement("span");
const sanitize = (text: string): string => {
	scratch.textContent = text;
	return scratch.innerHTML;
};

const maxLength = 256;

const chatLog = document.getElementById("chat-log")!;
const chatInputContainer = document.getElementById("chat-input-container")!;
const chatInput = <HTMLInputElement>document.getElementById("chat-input");
const chatInputSuggestion = <HTMLInputElement>(
	document.getElementById("chat-input-suggestion")
);
const commands: Command[] = [];

class Chat {
	active = false;
	game!: Game;

	activate() {
		chatInputContainer.style.visibility = "visible";
		chatInput.focus();
	}

	onEnter() {
		chatInputContainer.style.visibility = "hidden";
		const message = chatInput.value;
		if (message.length) {
			this.game.transmit({
				type: "chat",
				message: chatInput.value,
			});
			chatInput.value = "";
			chatInputSuggestion.value = "";
		}
	}

	onEscape() {
		chatInput.value = "";
		chatInputSuggestion.value = "";
		chatInputContainer.style.visibility = "hidden";
	}
}

const chat = new Chat();

export const initChatListeners = (game: Game, ui: UI): void => {
	ui.addEventListener("keyDown", ({ key, target }) => {
		if (
			!chat.active &&
			key === "Enter" &&
			(!target ||
				!(target instanceof HTMLElement) ||
				!uiElem.contains(target))
		)
			chat.activate();
	});

	game.addNetworkListener(
		"chat",
		({ connection, message }: { connection: number; message: string }) => {
			message = message.slice(0, maxLength);

			const player = game.players.find((p) => p.id === connection);
			if (!player) return;

			const playerTag = `<span style="color: ${player.color?.hex}">${player.username}</span>`;
			appendMessage(`${playerTag}: ${sanitize(message)}`);
		},
	);

	chat.game = game;

	chatInput.addEventListener(
		"keydown",
		wrapGame(game, (e) => {
			e.stopPropagation();
			if (e.key === "Enter")
				if (chatInput.value[0] === "/")
					return onCommandEnter(chatInput.value.slice(1));
				else return chat.onEnter();

			if (e.key === "Escape") return chat.onEscape();

			if (e.key === "Tab") {
				e.preventDefault();
				onCommandTab(chatInput.value.slice(1));
				return;
			}
		}),
	);

	chatInput.addEventListener(
		"input",
		wrapGame(game, () => {
			if (chatInput.value[0] === "/")
				onCommandInput(chatInput.value.slice(1));
			else chatInputSuggestion.value = "";
		}),
	);
};

const _appendMessage = (html: HTMLElement) => {
	chatLog.appendChild(html);

	setTimeout(() => {
		html.style.opacity = "0";
		setTimeout(() => html.remove(), 1000);
	}, 10000 + (html.textContent ?? "").replace(/\s+/g, " ").trim().length * 50);
};

export const appendMessage = (markdown: string): void => {
	const div = document.createElement("div");
	div.innerHTML = marked(markdown);

	_appendMessage(div);
};

export const appendGameMessage = (markdown: string): void => {
	const div = document.createElement("div");
	div.classList.add("game");
	div.innerHTML = marked(markdown);

	_appendMessage(div);
};

export const appendErrorMessage = (markdown: string): void => {
	const div = document.createElement("div");
	div.classList.add("error");
	div.innerHTML = marked(markdown);

	_appendMessage(div);
};

const onCommandInput = (text: string) => {
	const words = text.trim().split(" ");
	const firstWord = words[0].toLowerCase();

	for (const command of commands)
		if (command.name.toLowerCase().startsWith(firstWord)) {
			const name = words[0] + command.name.slice(firstWord.length);
			const args =
				command.args &&
				command.args
					.slice(words.length - 1)
					.map((a) => (a.required ? `<${a.name}>` : `[${a.name}]`))
					.join(" ");
			const comment =
				command.comment &&
				(!command.args || words.length <= command.args.length)
					? "    " + command.comment.split("\n")[0]
					: false;
			chatInputSuggestion.value =
				"/" + [name, args, comment].filter(Boolean).join(" ");
			return;
		}

	chatInputSuggestion.value = "";
};

const onCommandEnter = (text: string) => {
	const words = text.trim().split(" ");
	const firstWord = words[0].toLowerCase();

	for (const command of commands)
		if (command.name.toLowerCase() === firstWord) {
			if (
				!command.args ||
				words.length > command.args.filter((a) => a.required).length
			) {
				command.handler(...words);
				chat.onEscape();
			}

			return;
		}
};

const onCommandTab = (text: string) => {
	const words = text.trim().split(" ");
	const firstWord = words[0].toLowerCase();

	for (const command of commands)
		if (command.name.toLowerCase().startsWith(firstWord)) {
			if (command.name.length <= firstWord.length) return;

			chatInput.value = "/" + command.name + (command.args ? " " : "");
			onCommandInput(chatInput.value.slice(1));

			return;
		}
};

export const registerCommand = ({
	name,
	aliases,
	args,
	comment,
	handler,
}: Command): void => {
	const existingCommand = commands.find(
		(c) =>
			c.name === name ||
			(c.aliases && c.aliases.includes(name)) ||
			(aliases && aliases.includes(c.name)) ||
			(c.aliases &&
				aliases &&
				c.aliases.some((a) => aliases.includes(a))),
	);

	if (existingCommand)
		throw new Error(
			`Command ${name} conflicts with ${existingCommand.name}`,
		);

	commands.push({ name, aliases, args, comment, handler });
	commands.sort((a, b) => {
		if (a.name === "help") return -1;
		if (b.name === "help") return 1;
		return a.name.localeCompare(b.name);
	});
};

registerCommand({
	name: "help",
	comment: "Shows a list of all commands",
	handler: () => {
		appendGameMessage(
			commands
				.map((command) => {
					const args =
						command.args &&
						command.args
							.map((a) =>
								a.required ? `<${a.name}>` : `[${a.name}]`,
							)
							.join(" ");
					const comment = command.comment
						? `\n<span style="font-weight: normal;">${command.comment}</span>`
						: "";
					return (
						"/" +
						[command.name, args].filter(Boolean).join(" ") +
						comment
					);
				})
				.join("\n\n"),
		);
	},
});

registerCommand({
	name: "clear",
	comment: "Clears the chat log",
	handler: () => {
		emptyElement(chatLog);
	},
});

// registerCommand({
// 	name: "debug",
// 	comment: "Shows debugging information",
// 	handler: toggleDebugging,
// });

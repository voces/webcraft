import { emitter } from "./emitter.js";
import { game } from "./index.js";
import { newPingMessage } from "./ui/ping.js";
import { location } from "./util/globals.js";
import { obstructionMap } from "./sprites/obstructions/index.js";
import { Game } from "./Game.js";

let connection: WebSocket;

export const activeHost = location.port
	? `${location.hostname}:${8080}`
	: `ws.${location.hostname}`;

type Event = {
	time: number;
};

type InitEvent = Event & {
	type: "init";
	connections: number;
	state: ReturnType<typeof Game.prototype.toJSON>;
};

type StateEvent = Event & {
	type: "state";
	state: ReturnType<typeof Game.prototype.toJSON>;
};

type PlayerEvent = Event & {
	connection: number;
};

type BuildEvent = PlayerEvent & {
	type: "build";
	builder: number;
	x: number;
	y: number;
	obstruction: keyof typeof obstructionMap;
};

type MoveEvent = PlayerEvent & {
	type: "move";
	connection: number;
	sprites: number[];
	x: number;
	y: number;
	obstruction: keyof typeof obstructionMap;
};

type AttackEvent = PlayerEvent & {
	type: "move";
	connection: number;
	attackers: number[];
	target: number;
};

type KillEvent = PlayerEvent & {
	type: "kill";
	connection: number;
	sprites: number[];
};

type HoldPositionEvent = PlayerEvent & {
	type: "kill";
	connection: number;
	sprites: number[];
};

type StopEvent = PlayerEvent & {
	type: "stop";
	connection: number;
	sprites: number[];
};

type MirrorEvent = PlayerEvent & {
	type: "mirror";
	connection: number;
	sprites: number[];
};

type ChatEvent = PlayerEvent & {
	type: "chat";
	message: string;
};

type DisconnectionEvent = PlayerEvent & {
	type: "disconnection";
};

type ConnectionEvent = PlayerEvent & {
	type: "connection";
	username: string;
};

/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function */
const networkEvents = {
	init: (data: InitEvent) => {},
	state: (data: StateEvent) => {},
	update: (data: { time: number }) => {},
	build: (data: BuildEvent) => {},
	move: (data: MoveEvent) => {},
	attack: (data: AttackEvent) => {},
	kill: (data: KillEvent) => {},
	holdPosition: (data: HoldPositionEvent) => {},
	stop: (data: StopEvent) => {},
	mirror: (data: MirrorEvent) => {},
	chat: (data: ChatEvent) => {},
	disconnection: (data: DisconnectionEvent) => {},
	connection: (data: ConnectionEvent) => {},
};
/* eslint-enable @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function */

const host = {
	send: <T>(data: T) =>
		connection.send(
			JSON.stringify(Object.assign(data, { sent: performance.now() })),
		),
	connect: (token: string) => {
		connection = new WebSocket(
			`ws://${activeHost}?${encodeURIComponent(token)}`,
		);

		connection.addEventListener("message", (message) => {
			const json = JSON.parse(message.data);

			if (game.localPlayer && game.localPlayer.id === json.connection)
				newPingMessage({
					type: json.type,
					ping: performance.now() - json.sent,
				});

			if (typeof json.type === "string" && json.type.length) {
				if (!(json.type in networkEvents))
					console.warn("untyped event", json);

				network.dispatchEvent(json.type, json);
			}
		});
	},
	get isHost() {
		return !connection;
	},
};

export const network = emitter<typeof host, typeof networkEvents>(host);

const wrappedFetch = <T>(
	url: string,
	body: T,
	options: {
		headers?: Record<string, string>;
		body?: string;
		method?: "POST";
	} = {},
) => {
	if (!url.match(/^\w+:\/\//))
		url = `http://${activeHost}/${url.replace(/^\//, "")}`;

	if (!options.headers) options.headers = {};
	if (!options.headers["Content-Type"])
		options.headers["Content-Type"] = "application/json";

	if (body && typeof body !== "string") options.body = JSON.stringify(body);

	if (options.body && options.method === undefined) options.method = "POST";

	return fetch(url, options).then((r) => r.json());
};

export { wrappedFetch as fetch };

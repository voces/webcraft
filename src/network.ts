import { emitter, Emitter } from "./emitter";
import { newPingMessage } from "./ui/ping";
import { location } from "./util/globals";
import { obstructionMap } from "./entities/sprites/obstructions/index";
import { Game } from "./Game";
import { ValueOf } from "./types";

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

type UpdateEvent = Event & {
	type: "update";
};

type PlayerEvent = Event & {
	connection: number;
	sent?: number;
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
	update: (data: UpdateEvent) => {},
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
} as const;
/* eslint-enable @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function */

export type NetworkEventCallback = typeof networkEvents;
type NetworkEvent = Parameters<ValueOf<NetworkEventCallback>>[0];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isNetworkEvent = (json: any): json is NetworkEvent =>
	typeof json === "object" &&
	typeof json.type === "string" &&
	json.type.length &&
	json.type in networkEvents;

class Network {
	private connection?: WebSocket;
	private localPlayerId?: number;

	constructor() {
		emitter(this);
	}

	send<T extends Record<string, unknown>>(data: T): void {
		if (!this.connection) throw new Error("Network has not been connected");

		this.connection.send(
			JSON.stringify(Object.assign(data, { sent: performance.now() })),
		);
	}

	connect(token: string): void {
		this.connection = new WebSocket(
			`ws://${activeHost}?${encodeURIComponent(token)}`,
		);

		this.connection.addEventListener("message", (message) =>
			this.onMessage(message),
		);
	}

	onMessage(message: MessageEvent): void {
		const json = JSON.parse(message.data);

		if (isNetworkEvent(json)) {
			// TypeScript doesn't allow refinements on guarded types
			const event: NetworkEvent = json;
			if (event.type === "connection") this.onConnection(event);

			if (
				"connection" in event &&
				"sent" in event &&
				this.localPlayerId === event.connection &&
				typeof event.sent === "number"
			)
				newPingMessage({
					type: event.type,
					ping: performance.now() - event.sent,
				});

			// Not sure why TypeScript can't hold the type info here...
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			this.dispatchEvent(event.type, event as any);
		} else console.warn("untyped event", json);
	}

	private onConnection(message: ConnectionEvent) {
		if (this.localPlayerId === undefined && !this.isHost)
			this.localPlayerId = message.connection;
	}

	get isHost(): boolean {
		return !this.connection;
	}
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Network extends Emitter<NetworkEventCallback> {}

export { Network };

const wrappedFetch = <T>(
	url: string,
	body: T,
	options: {
		headers?: Record<string, string>;
		body?: string;
		method?: "POST";
	} = {},
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> => {
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

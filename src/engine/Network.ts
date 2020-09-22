import { Emitter, emitter } from "../core/emitter";
import { EntityID } from "../core/Entity";
import { location } from "../core/util/globals";
import { Game } from "./Game";
import { ValueOf } from "./types";

export const activeHost = location.port
	? `${location.hostname}:${8080}`
	: `ws.${location.hostname}`;

type Event = {
	time: number;
};

export type InitEvent = Event & {
	type: "init";
	connections: number;
	state: ReturnType<Game["toJSON"]>;
};

export type StateEvent = Event & {
	type: "state";
	state: ReturnType<Game["toJSON"]>;
};

type UpdateEvent = Event & {
	type: "update";
};

type PlayerEvent = Event & {
	connection: number;
	sent?: number;
};

export type BuildEvent = PlayerEvent & {
	type: "build";
	builder: number;
	x: number;
	y: number;
	obstruction: string;
};

export type MoveEvent = PlayerEvent & {
	type: "move";
	connection: number;
	sprites: EntityID[];
	x: number;
	y: number;
	obstruction: string;
};

export type AttackEvent = PlayerEvent & {
	type: "move";
	connection: number;
	attackers: EntityID[];
	target: EntityID | undefined;
	x: number;
	y: number;
};

export type SelfDestructEvent = PlayerEvent & {
	type: "selfDestruct";
	connection: number;
	sprites: EntityID[];
};

export type HoldPositionEvent = PlayerEvent & {
	type: "holdPosition";
	connection: number;
	sprites: EntityID[];
};

export type StopEvent = PlayerEvent & {
	type: "stop";
	connection: number;
	sprites: EntityID[];
};

export type MirrorEvent = PlayerEvent & {
	type: "mirror";
	connection: number;
	sprites: EntityID[];
};

type ChatEvent = PlayerEvent & {
	type: "chat";
	message: string;
};

type DisconnectionEvent = PlayerEvent & {
	type: "disconnection";
};

export type ConnectionEvent = PlayerEvent & {
	type: "connection";
	username: string;
};

type PingEvent = {
	type: "ping";
	eventType: Exclude<keyof typeof networkEvents, "ping">;
	ping: number;
};

/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function */
const networkEvents = {
	init: (data: InitEvent) => {},
	state: (data: StateEvent) => {},
	update: (data: UpdateEvent) => {},
	build: (data: BuildEvent) => {},
	move: (data: MoveEvent) => {},
	attack: (data: AttackEvent) => {},
	selfDestruct: (data: SelfDestructEvent) => {},
	holdPosition: (data: HoldPositionEvent) => {},
	stop: (data: StopEvent) => {},
	mirror: (data: MirrorEvent) => {},
	chat: (data: ChatEvent) => {},
	disconnection: (data: DisconnectionEvent) => {},
	connection: (data: ConnectionEvent) => {},
	ping: (data: PingEvent) => {},
} as const;
/* eslint-enable @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function */

export type NetworkEventCallback = typeof networkEvents;
type NetworkEvent = Parameters<ValueOf<NetworkEventCallback>>[0];

const isNetworkEvent = (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	json: any,
	networkEvents: Record<string, unknown>,
): json is NetworkEvent =>
	typeof json === "object" &&
	typeof json.type === "string" &&
	json.type.length &&
	json.type in networkEvents;

export class Network implements Emitter<NetworkEventCallback> {
	static networkEvents = networkEvents;

	// These are implemented via calling emitter(this)
	addEventListener!: Emitter<NetworkEventCallback>["addEventListener"];
	removeEventListener!: Emitter<NetworkEventCallback>["removeEventListener"];
	removeEventListeners!: Emitter<
		NetworkEventCallback
	>["removeEventListeners"];
	dispatchEvent!: Emitter<NetworkEventCallback>["dispatchEvent"];

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
			`${
				location.protocol === "https:" ? "wss:" : "ws:"
			}//${activeHost}?${encodeURIComponent(token)}`,
		);

		this.connection.addEventListener("message", (message) =>
			this.onMessage(message),
		);
	}

	onMessage(message: MessageEvent): void {
		const json = JSON.parse(message.data);

		if (
			isNetworkEvent(
				json,
				(this.constructor as typeof Network).networkEvents,
			)
		) {
			// TypeScript doesn't allow refinements on guarded types
			const event: NetworkEvent = json;
			if (event.type === "connection") this.onConnection(event);

			if (
				"connection" in event &&
				"sent" in event &&
				this.localPlayerId === event.connection &&
				typeof event.sent === "number"
			)
				this.dispatchEvent("ping", {
					type: "ping",
					eventType: event.type,
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

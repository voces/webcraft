import type { Widget } from "../entities/Widget";
import type { Obstruction } from "../entities/widgets/sprites/units/Obstruction";
import type { NetworkEventCallback } from "../Network";
import type { Point } from "../pathing/PathingMap";
import type { Player } from "../players/Player";

export type Action<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	NetworkEvent extends keyof NetworkEventCallback | undefined = any,
> = {
	description?: string;
	name: string;
	hotkey:
		| "a"
		| "b"
		| "c"
		| "d"
		| "e"
		| "f"
		| "g"
		| "h"
		| "i"
		| "j"
		| "k"
		| "l"
		| "m"
		| "n"
		| "o"
		| "p"
		| "q"
		| "r"
		| "s"
		| "t"
		| "u"
		| "v"
		| "w"
		| "x"
		| "y"
		| "z"
		| " "
		| "Escape";
	elem?: HTMLElement;
	syncHandler?: NetworkEvent extends keyof NetworkEventCallback
		? NetworkEventCallback[NetworkEvent]
		: never;
	/**
	 * Whether the action is available on non-owned units.
	 */
	available?: () => boolean;
} & (
	| {
			type: "build";
			cost: { [key: string]: number };
			obstruction: typeof Obstruction;
	  }
	| {
			type: "custom";
			cost?: { [key: string]: number };
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			localHandler: (data: ImmediateActionProps<any>) => void;
	  }
	| {
			type: "target";
			localHandler: (data: TargetActionProps) => void;
	  }
	| {
			type: "point";
			localHandler: (data: PointActionProps) => void;
	  }
	| {
			type: "targetOrPoint";
			localHandler: (data: TargetOrPointActionProps) => void;
	  }
);

export type ImmediateActionProps<P extends Player = Player> = { player: P };
export type TargetActionProps = { player: Player; target: Widget };
export type PointActionProps = { player: Player; point: Point };
export type TargetOrPointActionProps = {
	player: Player;
	target: Widget | undefined;
	point: Point | undefined;
};

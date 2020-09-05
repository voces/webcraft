import { Entity } from "./core/Entity";
import { Mesh, Object3D } from "three";

// Teams
interface TeamMap<T> {
	crossers: T;
	defenders: T;
}
type Team = keyof TeamMap<unknown>;
export const teamKeys: Team[] = ["crossers", "defenders"];

// Resource
export interface ResourceMap {
	essence: number;
}
export type Resource = keyof ResourceMap;
export const resourceKeys: Resource[] = ["essence"];

export interface Settings {
	arenaIndex: number;
	crossers: number;
	duration: number;
	mode: "bulldog";
	resources: Record<
		Team,
		Record<Resource, { starting: number; rate: number }>
	>;
}

export type ValueOf<T> = T[keyof T];

export const defined = <T>(value: T | undefined): value is T => !!value;

export type NonEmptyArray<T> = [T, ...T[]];

export type RecursivePartial<T> = {
	[P in keyof T]?: T[P] extends (infer U)[]
		? RecursivePartial<U>[] // eslint-disable-next-line @typescript-eslint/ban-types
		: T[P] extends object
		? RecursivePartial<T[P]>
		: T[P];
};

export type EntityObject = Object3D & { entity?: Entity };

export type EntityMesh = Mesh & { entity?: Entity };

import { Mesh, Object3D } from "three";

import { Entity } from "../core/Entity";

// Resource
export interface ResourceMap {
	essence: number;
}
export type Resource = keyof ResourceMap;
export const resourceKeys: Resource[] = ["essence"];

export type ValueOf<T> = T[keyof T];

export const defined = <T>(value: T | undefined): value is T => !!value;

export type NonEmptyArray<T> = [T, ...T[]];

export type EntityObject = Object3D & { entity?: Entity };

export type EntityMesh = Mesh & { entity?: Entity };

export type Mutable<T> = {
	-readonly [P in keyof T]: T[P];
};

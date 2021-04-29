import type { Mesh, Object3D } from "three";

import type { Entity } from "../core/Entity";

export type ValueOf<T> = T[keyof T];

export const defined = <T>(value: T | undefined): value is T => !!value;

export type NonEmptyArray<T> = [T, ...T[]];

export type EntityObject = Object3D & { entity?: Entity };

export type EntityMesh = Mesh & { entity?: Entity };

export type Mutable<T> = {
	-readonly [P in keyof T]: T[P];
};

export const isObject = (obj: unknown): obj is Record<string, unknown> =>
	typeof obj === "object" && !!obj;

// const in_ = <K extends string, O>(key: K, object: O): key is K & keyof O =>
// 	key in object;

import type { Entity, EntityID } from "../../core/Entity";
import { isConstructor } from "../helpers";

interface EntityConstructor<E extends Entity> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	new (...args: any[]): E;
	fromJSON?: boolean | ((entity: ReturnType<E["toJSON"]>) => E);
}

type EntityFactory = (props: {
	[key: string]: unknown;
	id: EntityID;
	components: {
		[key: string]: unknown;
		type: string;
	}[];
}) => Entity;

const _entityRegistry: Record<
	string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	EntityConstructor<any> | EntityFactory
> = {};

export const entityRegistry = _entityRegistry as Readonly<
	typeof _entityRegistry
>;

export const registerEntity = (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	factory: EntityConstructor<any> | EntityFactory,
	name?: string,
): void => {
	if (!name) if (isConstructor(factory)) name = factory.name;
	if (!name) throw new Error("Expected a name with factory");

	_entityRegistry[name] = factory;
};

import { Entity } from "./types.js";

type SystemEvents = {
	add: (entity: Entity) => void;
	remove: (entity: Entity) => void;
};

class System extends Array {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	test(entity: Entity): boolean {
		return true;
	}

	add(...entites: Entity[]): void {
		for (let i = 0; i < entites.length; i++)
			if (this.test(entites[i])) this.push(entites[i]);
	}

	remove(...entites: Entity[]) {
		for (let i = 0; i < entites.length; i++) this.push(entites[i]);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	preUpdate(delta: number): void {
		/* do nothing */
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	postUpdate(delta: number): void {
		/* do nothing */
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	preRender(delta: number): void {
		/* do nothing */
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	postRender(delta: number): void {
		/* do nothing */
	}

	dispose(): void {
		/* do nothing */
	}
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface System {
	update?: (entity: Entity, delta: number) => void;
	render?: (entity: Entity, delta: number) => void;
}

export { System };

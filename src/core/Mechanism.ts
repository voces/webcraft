import type { App } from "./App";

/**
 * A merchanism is a container of code that does not work on individual
 * entities. Examples would be UI management, network management, or user input.
 */
export class Mechanism {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	update(delta: number, time: number): void {
		/* do nothing */
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	render(delta: number, time: number): void {
		/* do nothing */
	}

	dispose(): void {
		/* do nothing */
	}

	addToApp(app: App): this {
		app.addMechanism(this);
		return this;
	}
}

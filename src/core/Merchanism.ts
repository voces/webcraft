/**
 * A merchanism is a container of code that does not work on individual
 * entities. Examples would be UI management, network management, or user input.
 */
export class Mechanism {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	update(delta: number): void {
		/* do nothing */
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	render(delta: number): void {
		/* do nothing */
	}

	dispose(): void {
		/* do nothing */
	}
}

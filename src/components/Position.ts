import { emitter, Emitter } from "../emitter.js";

type PositionEvents = {
	change: <T extends keyof Position>(prop: T, oldValue: Position[T]) => void;
};

class Position {
	private _x!: number;
	private _y!: number;
	renderTween?: (delta: number) => { x: number; y: number };

	constructor(x: number, y: number) {
		emitter(this);

		this.x = x;
		this.y = y;
	}

	get x(): number {
		return this._x;
	}

	set x(value: number) {
		if (this._x === value) return;
		const oldValue = this._x;
		this._x = value;
		this.dispatchEvent("change", "x", oldValue);
	}

	get y(): number {
		return this._y;
	}

	set y(value: number) {
		if (this._y === value) return;
		const oldValue = this._y;
		this._y = value;
		this.dispatchEvent("change", "y", oldValue);
	}

	/** Utility method that does `this.x = x` and `this.y = y`. */
	setXY(x: number, y: number): void {
		this.x = x;
		this.y = y;
	}
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Position extends Emitter<PositionEvents> {}

export { Position };

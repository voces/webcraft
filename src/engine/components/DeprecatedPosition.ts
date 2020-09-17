import { emitter, Emitter } from "../../core/emitter";

type DeprecatedPositionEvents = {
	change: <T extends keyof DeprecatedPosition>(
		prop: T,
		oldValue: DeprecatedPosition[T],
	) => void;
};

class DeprecatedPosition {
	private _x!: number;
	private _y!: number;

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
interface DeprecatedPosition extends Emitter<DeprecatedPositionEvents> {}

export { DeprecatedPosition };

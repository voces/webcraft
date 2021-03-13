import { Component } from "../../core/Component";
import type { Mutable } from "../types";

/**
 * An empty component that tags an entity as active for the purpose of idle
 * checks.
 */
export class ActiveComponent extends Component {
	readonly tag!: string | undefined;

	initialize(tag?: string): void {
		if (tag === undefined) return;
		const mutable: Mutable<ActiveComponent> = this;
		mutable.tag = tag;
	}
}

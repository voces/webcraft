import type { Entity } from "../../core/Entity";
import { System } from "../../core/System";
import { Timer } from "../components/Timer";

export class TimerSystem extends System {
	static components = [Timer];
	readonly pure = true;

	test(entity: Entity): entity is Entity {
		return Timer.has(entity);
	}

	update(entity: Entity, delta: number, time: number): void {
		entity.get(Timer).forEach((timer) => {
			if (!timer) return;
			if (timer.next > time) return;

			// Invoke the timer safely
			try {
				timer.fn();
			} catch (err) {
				console.error(err);
			}

			// If periodic, queue the next time
			if (timer.periodic) {
				timer.next = timer.oncePerUpdate
					? time + timer.timeout
					: timer.next + timer.timeout;
				return;
			}

			// Otherwise remove the timer from the entity
			entity.clear(timer);
		});
	}
}

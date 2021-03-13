import type { Entity } from "../../core/Entity";
import { System } from "../../core/System";
import { Timer } from "../components/Timer";
import { TimerWindow } from "../components/TimerWindow";

export class TimerWindows extends System {
	static readonly components = [Timer, TimerWindow];
	readonly pure = true;

	test(entity: Entity): entity is Entity {
		return Timer.has(entity) && TimerWindow.has(entity);
	}

	getTimerWindows(): ReadonlyArray<{
		entity: Entity;
		timerWindow: TimerWindow;
		timer: Timer;
	}> {
		return Array.from(this).map((entity) => ({
			entity,
			timerWindow: entity.get(TimerWindow)[0]!,
			timer: entity.get(Timer)[0]!,
		}));
	}
}

import type { JSX } from "preact";
import { h } from "preact";
import { useContext, useState } from "preact/hooks";

import { Game } from "../contexts/Game";
import { useEventListener } from "../hooks/useEventListener";

const formatSeconds = (time: number) => {
	// Don't render millieconds
	time = Math.floor(time);

	const seconds = Math.max(time % 60, 0).toString();
	time = Math.floor(time / 60);

	const minutes = Math.max(time % 60, 0).toString();

	return minutes.padStart(2, "0") + ":" + seconds.padStart(2, "0");
};

export const TimerWindows = (): JSX.Element => {
	const [time, setTime] = useState<number>(0);
	const game = useContext(Game);
	useEventListener(game, "update", setTime);

	return (
		<span className="timer-windows">
			{game.timerWindows
				.getTimerWindows()
				.map(({ entity, timerWindow, timer }) => (
					<span key={entity.id} className="timer-window">
						<span className="title">{timerWindow.title}</span>
						<span className="time">
							{formatSeconds(timer.next - time)}
						</span>
					</span>
				))}
		</span>
	);
};

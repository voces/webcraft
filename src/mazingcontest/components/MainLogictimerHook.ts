import { Component } from "../../core/Component";
import { currentMazingContest } from "../mazingContestContext";

export class MainLogicTimerHook extends Component {
	initialize(): void {
		currentMazingContest().mainLogic.timer = this.entity;
	}
}

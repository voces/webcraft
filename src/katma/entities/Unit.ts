import type { UnitProps as EngineUnitProps } from "../../engine/entities/widgets/sprites/Unit";
import { Unit as EngineUnit } from "../../engine/entities/widgets/sprites/Unit";
import type { Player } from "../players/Player";

export type UnitProps = EngineUnitProps;

export class Unit extends EngineUnit {
	owner!: Player;
}

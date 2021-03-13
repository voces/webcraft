import type { ObstructionProps as EngineObstructionProps } from "../../engine/entities/widgets/sprites/units/Obstruction";
import { Obstruction as EngineObstruction } from "../../engine/entities/widgets/sprites/units/Obstruction";
import type { Resource } from "../types";

export type ObstructionProps = EngineObstructionProps<Resource>;

export class Obstruction extends EngineObstruction<Resource> {}

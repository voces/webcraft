import { Resource } from "../engine/types";

// Teams
interface TeamMap<T> {
	crossers: T;
	defenders: T;
}
type Team = keyof TeamMap<unknown>;
export const teamKeys: Team[] = ["crossers", "defenders"];

export interface Settings {
	arenaIndex: number;
	crossers: number;
	duration: number;
	mode: "bulldog";
	resources: Record<
		Team,
		Record<Resource, { starting: number; rate: number }>
	>;
}

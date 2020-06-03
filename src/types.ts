// Teams
interface TeamMap<T> {
	crossers: T;
	defenders: T;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Team = keyof TeamMap<any>;
export const teamKeys: Team[] = ["crossers", "defenders"];

// Resource
export interface ResourceMap {
	essence: number;
}
export type Resource = keyof ResourceMap;
export const resourceKeys: Resource[] = ["essence"];

export interface Settings {
	arenaIndex: number;
	crossers: number;
	duration: number;
	mode: "bulldog";
	resources: Partial<
		Record<Team, Record<Resource, { starting: number; rate: number }>>
	>;
}

export type ValueOf<T> = T[keyof T];

export const defined = <T>(value: T | undefined): value is T => !!value;

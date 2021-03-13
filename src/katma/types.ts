export type Resource = "essence";
export const resourceKeys = ["essence"] as const;
export const isResourceKey = (key: string): key is Resource =>
	resourceKeys.some((k) => k === key);

// Teams
interface TeamMap<T> {
	crossers: T;
	defenders: T;
}
type Team = keyof TeamMap<unknown>;
export const teamKeys: Team[] = ["crossers", "defenders"];
export const isTeamKey = (key: string): key is Team =>
	teamKeys.some((k) => k === key);

export interface Settings {
	arenaIndex: number;
	crossers: number;
	duration: number;
	mode: "bulldog";
	resources: {
		[T in Team]: { [Key in Resource]: { starting: number; rate: number } };
	};
}

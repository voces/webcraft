export type Resource = "gold" | "lumber";
export const resourceKeys = ["gold", "lumber"] as const;

export interface Settings {
	numberOfRounds: number;
	buildTime: number;
	thunderTowers: boolean;
	checkpoints: boolean;
}

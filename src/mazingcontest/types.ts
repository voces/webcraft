export type Resource = "gold" | "lumber" | "tnt";
export const resourceKeys = ["gold", "lumber", "tnt"] as const;

export interface Settings {
	numberOfRounds: number;
	buildTime: number;
	thunderTowers: boolean;
	checkpoints: boolean;
	tnt: boolean;
}

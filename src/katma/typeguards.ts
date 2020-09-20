import { Katma } from "./Katma";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const isKatma = (obj: any): obj is Katma => obj.isKatma;

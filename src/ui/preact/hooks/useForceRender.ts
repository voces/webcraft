import { useReducer } from "preact/hooks";

export const useForceRender = (): (() => void) =>
	useReducer(() => ({}), {})[1] as () => void;

import { useEffect, useRef } from "preact/hooks";

export const usePrevious = <T>(value: T): T => {
	const ref = useRef<T>(value);
	useEffect(() => {
		ref.current = value;
	});
	return ref.current;
};

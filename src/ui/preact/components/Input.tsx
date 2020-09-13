import { h, JSX } from "preact";
import { useEffect, useRef } from "preact/hooks";

export const Input = ({
	error,
	inputRef,
	...props
}: JSX.HTMLAttributes<HTMLInputElement> & {
	error?: string;
	inputRef?: { current: HTMLInputElement };
}): JSX.Element => {
	const input = inputRef ?? useRef<HTMLInputElement>();

	useEffect(() => {
		input.current.setCustomValidity(error ?? "");
		input.current.reportValidity();
	}, [error]);

	return <input ref={input} {...props} />;
};

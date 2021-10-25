import type { JSX } from "preact";
import { h } from "preact";
import { useEffect, useRef } from "preact/hooks";

export const Input = ({
	error,
	inputRef,
	...props
}: JSX.HTMLAttributes<HTMLInputElement> & {
	error?: string;
	inputRef?: { current: HTMLInputElement | null };
	hidden?: boolean;
}): JSX.Element => {
	const input = inputRef ?? useRef<HTMLInputElement>(null);

	useEffect(() => {
		input.current?.setCustomValidity(error ?? "");
		input.current?.reportValidity();
		if (error) input.current?.focus();
	}, [error]);

	return <input ref={input} {...props} />;
};

import type { JSX } from "preact";
import { h } from "preact";

export const Button = ({
	buttonRef,
	type,
	children,
	...props
}: JSX.HTMLAttributes<HTMLButtonElement> & {
	error?: string;
	buttonRef?: { current: HTMLButtonElement };
}): JSX.Element => (
	<button {...props} ref={buttonRef} type={type ?? "button"}>
		{children}
	</button>
);

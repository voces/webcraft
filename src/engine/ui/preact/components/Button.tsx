import { h, JSX } from "preact";

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

import type { ComponentChildren, JSX, VNode } from "preact";
import { h, toChildArray } from "preact";

import { classNames, styles } from "../util";

export const Group = ({
	spacing = 0,
	direction = "horizontal",
	children,
	className,
	style,
	innerStyle,
	...props
}: JSX.HTMLAttributes<HTMLDivElement> & {
	spacing?: number;
	direction?: "horizontal" | "vertical";
	style?: Record<string, string | number> | undefined;
	innerStyle?: Record<string, string | number> | undefined;
	children: ComponentChildren;
}): JSX.Element => {
	const wrappedChildren = toChildArray(children).map(
		(child: string | number | VNode<{ hidden?: boolean }>, i) => {
			const visible =
				typeof child !== "object" ||
				!("hidden" in child.props) ||
				!child.props.hidden;

			return (
				<div
					key={i}
					style={styles(
						innerStyle,
						visible
							? {
									"margin-left": spacing,
									"margin-top": spacing,
							  }
							: undefined,
					)}
				>
					{child}
				</div>
			);
		},
	);

	return (
		<div
			{...props}
			className={classNames(
				className,
				"group",
				`group--direction-${direction}`,
			)}
			style={styles(style, {
				"margin-left": -spacing,
				"margin-top": -spacing,
			})}
		>
			{wrappedChildren}
		</div>
	);
};

import { h, JSX, ComponentChild } from "preact";

export type Props<
	Row extends Record<string, ComponentChild>,
	Key extends keyof Row
> = {
	rows: Row[];
	rowKey: Key;
};

export const Multiboard = <
	Row extends Record<string, ComponentChild>,
	Key extends keyof Row
>({
	rows,
	rowKey,
}: Props<Row, Key>): JSX.Element => (
	<table>
		{rows.map((row) => (
			<tr key={row[rowKey]}>
				{Object.entries(row).map(([column, value]) => (
					<td key={column}>{value}</td>
				))}
			</tr>
		))}
	</table>
);

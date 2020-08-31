const leftTrim = (v: string) => {
	const match = v.match(/^\s+/);
	return match ? match[0].length : 0;
};

const commonLeftTrim = (rows: string[]) =>
	rows.reduce((min, row) => Math.min(min, leftTrim(row)), leftTrim(rows[0]));

export const stringMap = (map: string): number[][] => {
	const rows = map.split("\n").filter((v) => v.trim());

	const minLeftTrim = commonLeftTrim(rows);

	return rows.map((row) =>
		row
			.trimRight()
			.slice(minLeftTrim)
			.split("")
			.map((v) => {
				const num = parseInt(v);
				if (isNaN(num)) return 0;
				return num;
			}),
	);
};

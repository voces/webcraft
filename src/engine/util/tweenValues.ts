export const tweenValues = (
	...values: number[]
): ((percentProgress: number) => number) => {
	if (values.length === 1 && Array.isArray(values[0])) values = values[0];

	const totalDiff = values.reduce(
		(workingTotalDiff, v, i, arr) =>
			workingTotalDiff + (i > 0 ? Math.abs(v - arr[i - 1]) : 0),
		0,
	);

	const segments = Array(values.length)
		.fill(0)
		.map(() => ({
			startPercent: 0,
			endPercent: 0,
			diff: 0,
		}));
	for (let i = 0; i < values.length; i++) {
		if (i > 0) segments[i].startPercent = segments[i - 1].endPercent;

		if (i < values.length - 1) {
			segments[i].endPercent =
				segments[i].startPercent +
				Math.abs(values[i + 1] - values[i]) / totalDiff;

			segments[i].diff = values[i + 1] - values[i];
		}
	}

	let curIndex = 0;
	const func = (percentProgress: number) => {
		if (percentProgress <= 0) return values[0];
		if (percentProgress >= 1) return values[values.length - 1];

		while (percentProgress < segments[curIndex].startPercent) curIndex--;

		while (percentProgress > segments[curIndex].endPercent) curIndex++;

		// Calc percentage progress
		const partialProgress =
			(percentProgress - segments[curIndex].startPercent) /
			(segments[curIndex].endPercent - segments[curIndex].startPercent);
		return values[curIndex] + segments[curIndex].diff * partialProgress;
	};

	let internalProgress = 0;
	return Object.assign(func, {
		totalDiff,
		step: (deltaProgress: number) => {
			internalProgress += deltaProgress;
			return func(internalProgress);
		},
		start: values[0],
		end: values[values.length - 1],
	});
};

const contexts: unknown[] = [];

export const withLoggingContext = (context: unknown, fn: () => void): void => {
	contexts.push(context);
	fn();
	contexts.pop();
};

export const pushLoggingContext = (context: unknown): void => {
	contexts.push(context);
};

export const popLoggingContext = (context: unknown): void => {
	if (contexts[contexts.length - 1] !== context)
		return logLine("Poped logging context does not match", {
			attemptedPop: context,
			head: contexts[contexts.length - 1],
		});

	contexts.pop();
};

export const logLine = (...data: unknown[]): void => {
	// eslint-disable-next-line no-console
	console.log(new Date(), ...contexts, ...data);
};

import { useCallback, useState } from "preact/hooks";

import { fetch, Options } from "../../../util/fetch";

type Initial = {
	status: "initial";
	isInitial: true;
	isPending: false;
	isCompleted: false;
	isErrored: false;
	data: undefined;
	error: undefined;
};

const initial: Initial = Object.freeze({
	status: "initial",
	isInitial: true,
	isPending: false,
	isCompleted: false,
	isErrored: false,
	data: undefined,
	error: undefined,
});

type Pending = {
	status: "pending";
	isInitial: false;
	isPending: true;
	isCompleted: false;
	isErrored: false;
	data: undefined;
	error: undefined;
};

const pending: Pending = Object.freeze({
	status: "pending",
	isInitial: false,
	isPending: true,
	isCompleted: false,
	isErrored: false,
	data: undefined,
	error: undefined,
});

type Completed<T> = {
	status: "completed";
	isInitial: false;
	isPending: false;
	isCompleted: true;
	isErrored: false;
	data: T;
	error: undefined;
};

const completed = <T>(data: T): Completed<T> => ({
	status: "completed",
	isInitial: false,
	isPending: false,
	isCompleted: true,
	isErrored: false,
	data,
	error: undefined,
});

type Errored<Error> = {
	status: "errored";
	isInitial: false;
	isPending: false;
	isCompleted: false;
	isErrored: true;
	data: undefined;
	error: Error;
};

const errored = <Error>(error: Error): Errored<Error> => ({
	status: "errored",
	isInitial: false,
	isPending: false,
	isCompleted: false,
	isErrored: true,
	data: undefined,
	error,
});

type UnhandledError = { code: -1; message: string };

export type FetchState<Result, Error> =
	| Initial
	| Pending
	| Completed<Result>
	| Errored<Error | UnhandledError>;

type UseFetchProps<T> = {
	url: string;
	body?: T;
	options?: Options;
};

export const useFetch = <Body, Result, Error>({
	url,
	body,
	options,
}: UseFetchProps<Body>): FetchState<Result, Error> & {
	performFetch: (
		props: UseFetchProps<Body>,
	) => Promise<FetchState<Result, Error>>;
} => {
	const [fetchState, setFetchState] = useState<FetchState<Result, Error>>(
		initial,
	);

	const performFetch = useCallback(
		async ({
			url: finalUrl = url,
			body: finalBody = body,
			options: finalOptions = options,
		}) => {
			setFetchState(pending);

			try {
				// Makes tests cleaner to test for
				const args: [string, Body | undefined, Options | undefined] = [
					finalUrl,
					finalBody,
					finalOptions,
				];
				for (let i = args.length - 1; i >= 0 && !args[i]; i--)
					args.length--;

				const result = await fetch(...args);

				if (!result.ok) {
					const newFetchState = errored(result.body);
					setFetchState(newFetchState);
					return newFetchState;
				}

				const newFetchState = completed(result.body);
				setFetchState(newFetchState);
				return newFetchState;
			} catch (error) {
				const newFetchState = errored({
					code: -1 as const,
					message: String(error.message),
				});
				setFetchState(newFetchState);
				return newFetchState;
			}
		},
		[url, body, options],
	);

	return { ...fetchState, performFetch };
};

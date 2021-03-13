import type { FetchState } from "./useFetch";
import { useFetch } from "./useFetch";

type LoginResult = { token: string; username: string; room?: string };

type LoginErrors =
	| {
			code: 0;
			field: "username";
			message: string;
	  }
	| {
			code: 1;
			field: "password";
			message: string;
	  }
	| {
			code: 2;
			field: "username";
			message: string;
	  }
	| {
			code: 3;
			message: string;
	  };

export const useLogin = (): FetchState<LoginResult, LoginErrors> & {
	performFetch: (
		username?: string,
		password?: string,
		register?: boolean,
		room?: string,
	) => Promise<FetchState<LoginResult, LoginErrors>>;
} => {
	const fetch = useFetch<
		{ username?: string; password?: string },
		LoginResult,
		LoginErrors
	>({
		url: "auth/login",
	});

	const performFetch = (
		username?: string,
		password?: string,
		register = false,
		room?: string,
	) =>
		fetch.performFetch({
			url: password
				? register
					? "auth/register"
					: "auth/login"
				: "auth/anon",
			body: { username, password, ...(room ? { room } : null) },
		});

	return { ...fetch, performFetch };
};

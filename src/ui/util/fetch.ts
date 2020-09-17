import { activeHost } from "../../engine/Network";

export type Options = {
	headers?: Record<string, string>;
	body?: string;
	method?: "POST";
};

const wrappedFetch = async <T>(
	url: string,
	body: T,
	options: Options = {},
): Promise<{
	status: number;
	ok: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	body: any;
}> => {
	if (!url.match(/^\w+:\/\//))
		url = `//${activeHost}/${url.replace(/^\//, "")}`;

	if (!options.headers) options.headers = {};
	if (!options.headers["Content-Type"])
		options.headers["Content-Type"] = "application/json";

	if (body && typeof body !== "string") options.body = JSON.stringify(body);

	if (options.body && options.method === undefined) options.method = "POST";

	const result = await fetch(url, options);

	return {
		status: result.status,
		ok: result.ok,
		body: await result.json(),
	};
};

export { wrappedFetch as fetch };

import { fetch } from "../../util/fetch";

jest.mock("../../util/fetch");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mockFetch = (fetch as any) as jest.Mock<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	{ ok: boolean; body: any },
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[string, any, any]
>;

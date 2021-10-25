import type { ReactWrapper } from "enzyme";
import { act } from "preact/test-utils";

import { Button } from "../components/Button";
import { Input } from "../components/Input";

export const findInput = (
	wrapper: ReactWrapper,
	dataTest: string,
): ReactWrapper<Parameters<typeof Input>[0]> =>
	wrapper.find(Input).filter({ "data-test": dataTest });

export const simulateInput = (
	wrapper: ReactWrapper,
	dataTest: string,
	value: string,
): void => {
	const input = findInput(wrapper, dataTest);
	const actualInput = input.find("input");
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(actualInput.instance() as any as HTMLInputElement).value = value;
	actualInput.simulate("input");
	wrapper.update();
};

export const findButton = (
	wrapper: ReactWrapper,
	dataTest: string,
): ReactWrapper<Parameters<typeof Button>[0]> =>
	wrapper.find(Button).filter({ "data-test": dataTest });

export const submitForm = async (wrapper: ReactWrapper): Promise<void> => {
	await act(async () => {
		wrapper.find("form").simulate("submit");
	});

	wrapper.update();
};

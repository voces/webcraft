import type { ReactWrapper } from "enzyme";
import { mount } from "enzyme";
import { h } from "preact";

import { Game as GameC } from "../contexts/Game";
import { fakeGame } from "../tests/fake/FakeGame";
import { mockFetch } from "../tests/fetch";
import {
	findButton,
	findInput,
	simulateInput,
	submitForm,
} from "../tests/forms";
import { Login } from "./Login";

const passwordTest = (wrapper: ReactWrapper, visible: boolean) => {
	const password = findInput(wrapper, "password");
	expect(password.exists()).toBeTruthy();
	expect(password.prop("hidden")).toEqual(!visible);
};

beforeEach(() => {
	mockFetch.mockClear();
	mockFetch.mockImplementation((url, { username }) => {
		if (url === "auth/anon")
			if (username === "verit") return { ok: false, body: { code: 0 } };
			else return { ok: true, body: { token: "tok", username } };

		if (url === "auth/login")
			return { ok: true, body: { token: "tok", username } };

		throw new Error(`Unmocked request: ${url}`);
	});
});

it("starts in an initialized state", () => {
	const wrapper = mount(
		<GameC.Provider value={fakeGame()}>
			<Login onSuccess={jest.fn()} />
		</GameC.Provider>,
	);

	expect(findInput(wrapper, "username").exists()).toBeTruthy();
	expect(findButton(wrapper, "login").exists()).toBeTruthy();
	expect(findButton(wrapper, "register-1").exists()).toBeTruthy();

	passwordTest(wrapper, false);
	expect(findInput(wrapper, "verify-password").exists()).toBeFalsy();
	expect(findButton(wrapper, "register-2").exists()).toBeFalsy();
	expect(findButton(wrapper, "cancel").exists()).toBeFalsy();
});

it("empty login works", async () => {
	const onSuccess = jest.fn();
	const wrapper = mount(
		<GameC.Provider value={fakeGame()}>
			<Login onSuccess={onSuccess} />
		</GameC.Provider>,
	);

	await submitForm(wrapper);

	expect(mockFetch).toHaveBeenCalledWith("auth/anon", { username: "" });
	expect(onSuccess).toHaveBeenCalled();
});

it("switches to login on failure", async () => {
	const onSuccess = jest.fn();
	const wrapper = mount(
		<GameC.Provider value={fakeGame()}>
			<Login onSuccess={onSuccess} />
		</GameC.Provider>,
	);

	simulateInput(wrapper, "username", "verit");
	await submitForm(wrapper);

	// We expect an error

	expect(mockFetch).toHaveBeenCalledWith("auth/anon", { username: "verit" });
	expect(onSuccess).not.toHaveBeenCalled();

	expect(findInput(wrapper, "username").exists()).toBeTruthy();
	passwordTest(wrapper, true);
	expect(findButton(wrapper, "login").exists()).toBeTruthy();
	expect(findButton(wrapper, "register-1").exists()).toBeTruthy();
	expect(findButton(wrapper, "cancel").exists()).toBeTruthy();

	expect(findInput(wrapper, "verify-password").exists()).toBeFalsy();
	expect(findButton(wrapper, "register-2").exists()).toBeFalsy();

	simulateInput(wrapper, "password", "hunter2");
	await submitForm(wrapper);

	// Now we expect success

	expect(mockFetch).toHaveBeenLastCalledWith("auth/login", {
		username: "verit",
		password: "hunter2",
	});
	expect(onSuccess).toHaveBeenCalled();
});

it("can register", async () => {
	const onSuccess = jest.fn();
	const wrapper = mount(
		<GameC.Provider value={fakeGame()}>
			<Login onSuccess={onSuccess} />
		</GameC.Provider>,
	);

	findButton(wrapper, "register-1").find("button").simulate("click");

	expect(findInput(wrapper, "username").exists()).toBeTruthy();
	passwordTest(wrapper, true);
	expect(findInput(wrapper, "verify-password").exists()).toBeTruthy();
	expect(findButton(wrapper, "register-2").exists()).toBeTruthy();
	expect(findButton(wrapper, "cancel").exists()).toBeTruthy();

	expect(findButton(wrapper, "login").exists()).toBeFalsy();
	expect(findButton(wrapper, "register-1").exists()).toBeFalsy();

	simulateInput(wrapper, "username", "verit");
	simulateInput(wrapper, "password", "hunter2");
	await submitForm(wrapper);

	expect(mockFetch).not.toHaveBeenCalled();
	expect(onSuccess).not.toHaveBeenCalled();
});

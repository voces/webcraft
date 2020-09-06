import { fetch as rawFetch } from "../network";
import { document } from "../util/globals";
import { Game } from "../Game";

let game: Game;

const login = <HTMLFormElement>document.getElementById("login");
const username = <HTMLInputElement>document.getElementById("login-name");
const register = document.getElementById("login-register")!;
const password = <HTMLInputElement>document.getElementById("login-password");
const verifyPassword = <HTMLInputElement>(
	document.getElementById("login-verify-password")
);

username.focus();

login.onsubmit = (e) => e.preventDefault();

const setFormState = (disabled: boolean) =>
	[username, password, verifyPassword].forEach(
		(i) => (i.disabled = disabled),
	);

const disable = () => setFormState(true);
const enable = () => setFormState(false);

let fetching = false;
const fetch = async (...args: Parameters<typeof rawFetch>) => {
	disable();
	fetching = true;
	const result = await rawFetch(...args);
	fetching = false;
	enable();
	return result;
};

const markInputInvalid = (input: HTMLInputElement, message: string) => {
	input.setCustomValidity(message);
	input.reportValidity();
	input.select();
};

const connect = (token: string) => {
	game.connect(token);
	login.style.visibility = "hidden";
};

username.addEventListener("keydown", async (e: KeyboardEvent) => {
	e.stopPropagation();

	username.setCustomValidity("");

	if (e.key === "Enter") {
		if (fetching) return;

		const result = await fetch("auth/anon", { username: username.value });

		if (result.token) connect(result.token);

		showPassword();
	}
});

const showPassword = () => {
	register.style.display = "none";
	password.style.display = "block";
	password.focus();
};

register.addEventListener("click", () => {
	showPassword();
	verifyPassword.style.display = "block";
});

password.addEventListener("keydown", async (e: KeyboardEvent) => {
	e.stopPropagation();

	if (e.key === "Enter") {
		if (verifyPassword.style.display === "block") {
			verifyPassword.focus();
			return;
		}

		if (fetching) return;

		const result = await fetch("auth/login", {
			username: username.value,
			password: password.value,
		});

		if (result.token) {
			game.connect(result.token);
			login.style.visibility = "hidden";
			return;
		}

		if (result.field === "password")
			return markInputInvalid(password, result.message);

		markInputInvalid(username, result.message);
	}
});

verifyPassword.addEventListener("keydown", async (e: KeyboardEvent) => {
	e.stopPropagation();

	verifyPassword.setCustomValidity("");

	if (e.key === "Enter") {
		if (fetching) return;

		if (password.value !== verifyPassword.value)
			return markInputInvalid(verifyPassword, "Passwords don't match");

		const result = await fetch("auth/register", {
			username: username.value,
			password: password.value,
		});

		if (result.token) return connect(result.token);

		markInputInvalid(username, result.message);
	}
});

export const initLogin = (_game: Game): void => {
	game = _game;
};

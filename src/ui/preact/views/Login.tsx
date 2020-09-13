import { h, JSX } from "preact";
import { useContext, useEffect, useRef, useState } from "preact/hooks";
import { Input } from "../components/Input";
import { useLogin } from "../hooks/api/useLogin";
import { Game } from "../contexts/Game";

export const Login = (): JSX.Element => {
	const game = useContext(Game);
	const [mode, setMode] = useState<"init" | "login" | "register" | "done">(
		"init",
	);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState<string | undefined>(undefined);
	const [verifyPassword, setVerifyPassword] = useState<string | undefined>(
		undefined,
	);
	const usernameInput = useRef<HTMLInputElement>();
	const passwordInput = useRef<HTMLInputElement>();
	const verifyPasswordInput = useRef<HTMLInputElement>();
	const [dirty, setDirty] = useState(false);
	const login = useLogin();

	useEffect(() => setDirty(true), [username, password, verifyPassword]);
	return (
		<form
			style={{ visibility: mode === "done" ? "hidden" : "default" }}
			onSubmit={async (e) => {
				e.preventDefault();

				if (login.isPending) return;

				setDirty(false);

				if (mode === "register" && password !== verifyPassword) {
					verifyPasswordInput.current.select();
					return;
				}

				const result = await login.performFetch(
					username,
					password,
					mode === "register",
				);

				if (result.isCompleted) {
					game.connect(result.data.token);
					setMode("done");
					return;
				}

				if (result.isErrored)
					if (result.error.code === 0 && mode === "init") {
						setMode("login");
						passwordInput.current.select();
					} else if (result.error.code === 1)
						passwordInput.current.select();
					else if (result.error.code === 2)
						usernameInput.current.select();
			}}
		>
			<h2>katma</h2>
			<Input
				inputRef={usernameInput}
				value={username}
				maxLength={16}
				placeholder="username"
				onInput={(e) => setUsername(e.currentTarget.value)}
				error={
					!dirty && login.isErrored && login.error.code === 2
						? login.error.message
						: undefined
				}
				disabled={login.isPending}
				autoFocus
			/>
			{mode === "init" && (
				<button
					type="button"
					onClick={() => {
						setMode("register");
						passwordInput.current.select();
					}}
					disabled={login.isPending}
				>
					Register
				</button>
			)}
			<Input
				inputRef={passwordInput}
				placeholder="password"
				type="password"
				autoComplete="password"
				onInput={(e) => setPassword(e.currentTarget.value)}
				style={
					mode === "init"
						? { padding: 0, height: 0, overflow: "hidden" }
						: undefined
				}
				error={
					!dirty && login.isErrored && login.error.code === 1
						? login.error.message
						: undefined
				}
				disabled={login.isPending}
			/>
			{mode === "register" && (
				<Input
					inputRef={verifyPasswordInput}
					placeholder="verify password"
					type="password"
					autoComplete="password"
					onInput={(e) => setVerifyPassword(e.currentTarget.value)}
					disabled={login.isPending}
					error={
						!dirty && password !== verifyPassword
							? "Passwords don't match"
							: undefined
					}
				/>
			)}
			{login.isErrored &&
				![0, 1, 2].includes(login.error.code) &&
				login.error.message}
			<button
				style={{ visibility: "hidden", position: "absolute" }}
				disabled={login.isPending}
			></button>
		</form>
	);
};

import { h, JSX } from "preact";
import { useContext, useEffect, useRef, useState } from "preact/hooks";

import { Button } from "../components/Button";
import { Group } from "../components/Group";
import { Input } from "../components/Input";
import { Game } from "../contexts/Game";
import { useLogin } from "../hooks/api/useLogin";

const RegisterButton = (props: Parameters<typeof Button>[0]) => (
	<Button {...props}>Reserve username</Button>
);

export const Login = ({
	onSuccess,
}: {
	onSuccess: () => void;
}): JSX.Element => {
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
					verifyPasswordInput.current.focus();
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
					onSuccess();
					return;
				}

				if (result.isErrored)
					if (result.error.code === 0 && mode === "init") {
						setMode("login");
						passwordInput.current.focus();
					} else if (result.error.code === 1)
						passwordInput.current.focus();
					else if (result.error.code === 2)
						usernameInput.current.focus();
			}}
		>
			<Group spacing={8}>
				<h2>katma</h2>
				<Input
					data-test="username"
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
				<Input
					data-test="password"
					inputRef={passwordInput}
					placeholder="password"
					type="password"
					autoComplete="password"
					onInput={(e) => setPassword(e.currentTarget.value)}
					hidden={mode === "init"}
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
					tabIndex={mode === "init" ? -1 : undefined}
				/>
				{(mode === "init" || mode === "login") && (
					<Button
						data-test="login"
						type="submit"
						disabled={login.isPending}
					>
						Login
					</Button>
				)}
				{mode !== "register" && (
					<RegisterButton
						data-test="register-1"
						onClick={() => {
							setMode("register");
							if (username.trim().length > 0)
								passwordInput.current.focus();
							else usernameInput.current.focus();
						}}
						disabled={login.isPending}
					/>
				)}
				{mode === "register" && (
					<Group spacing={8}>
						<Input
							data-test="verify-password"
							inputRef={verifyPasswordInput}
							placeholder="verify password"
							type="password"
							autoComplete="password"
							onInput={(e) =>
								setVerifyPassword(e.currentTarget.value)
							}
							disabled={login.isPending}
							error={
								!dirty && password !== verifyPassword
									? "Passwords don't match"
									: undefined
							}
						/>
						<RegisterButton
							data-test="register-2"
							type="submit"
							disabled={login.isPending}
						/>
					</Group>
				)}
				{mode !== "init" && (
					<Button
						data-test="cancel"
						disabled={login.isPending}
						onClick={() => {
							setMode("init");
							usernameInput.current.focus();
						}}
					>
						Cancel
					</Button>
				)}
				<div data-test="error">
					{login.isErrored &&
						![0, 1, 2].includes(login.error.code) &&
						login.error.message}
				</div>
			</Group>
		</form>
	);
};

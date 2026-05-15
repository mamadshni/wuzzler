type Props = {
	error?: string;
};

export const LoginForm = ({ error }: Props) => (
	<form hx-post="/sessions" hx-target="body" hx-swap="outerHTML">
		<label>
			Email
			<input type="email" name="email" required autocomplete="email" />
		</label>
		<label>
			Password
			<input
				type="password"
				name="password"
				required
				autocomplete="current-password"
			/>
		</label>
		{error && <p role="alert">{error}</p>}
		<button type="submit">Log in</button>
	</form>
);

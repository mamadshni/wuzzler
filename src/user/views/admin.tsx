type Props = {
	email: string;
};

export const AdminPage = ({ email }: Props) => (
	<section>
		<h1>Admin</h1>
		<p>
			Logged in as <strong>{email}</strong>.
		</p>
		<button
			type="button"
			hx-delete="/sessions/current"
			hx-target="body"
			hx-swap="outerHTML"
		>
			Log out
		</button>
	</section>
);

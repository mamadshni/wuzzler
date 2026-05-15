type Props = {
	active?: "players" | "games" | "login";
};

export const Sidebar = ({ active }: Props) => (
	<nav aria-label="Primary">
		<ul>
			<li>
				<a
					href="/players"
					aria-current={active === "players" ? "page" : undefined}
				>
					Players
				</a>
			</li>
			<li>
				<a href="/games" aria-current={active === "games" ? "page" : undefined}>
					Games
				</a>
			</li>
			<li>
				<a href="/login" aria-current={active === "login" ? "page" : undefined}>
					Login
				</a>
			</li>
		</ul>
	</nav>
);

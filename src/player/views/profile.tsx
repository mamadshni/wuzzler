import type { Player } from "../domain";

type Props = {
	player: Player;
};

export const PlayerProfile = ({ player }: Props) => (
	<article id="player-profile">
		<header>
			<h1>{player.name}</h1>
		</header>
		<section
			hx-get={`/players/${player.id}/games`}
			hx-trigger="load"
			hx-swap="innerHTML"
		>
			<p>Loading games…</p>
		</section>
		<footer>
			<button
				type="button"
				hx-get={`/players/${player.id}/edit`}
				hx-target="#player-profile"
				hx-swap="outerHTML"
			>
				Edit
			</button>
			<button
				type="button"
				hx-delete={`/players/${player.id}`}
				hx-target="main"
				hx-swap="innerHTML"
				hx-push-url="/players"
				hx-confirm="Delete this player?"
			>
				Delete
			</button>
		</footer>
	</article>
);

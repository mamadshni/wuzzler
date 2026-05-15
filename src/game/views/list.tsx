import { Pagination } from "../../shared/blocks/pagination";
import type { Game } from "../domain";
import { GameRow } from "./row";

type Props = {
	items: ReadonlyArray<Game>;
	page: number;
	total: number;
	nameOf: (id: string) => string;
};

export const Scoreboard = ({ items, page, total, nameOf }: Props) => (
	<section id="scoreboard">
		<header>
			<h2>Scoreboard</h2>
			<a
				href="/games/new"
				hx-get="/games/new"
				hx-target="#register-game-dialog"
				hx-swap="innerHTML"
				onclick="document.getElementById('register-game-dialog').showModal()"
			>
				Record game
			</a>
		</header>
		<dialog id="register-game-dialog" />
		{items.length === 0 ? (
			<p>No games recorded yet.</p>
		) : (
			<table>
				<thead>
					<tr>
						<th>Date</th>
						<th>Mode</th>
						<th>Players</th>
						<th>Winner</th>
					</tr>
				</thead>
				<tbody>
					{items.map((g) => (
						<GameRow game={g} nameOf={nameOf} />
					))}
				</tbody>
			</table>
		)}
		<Pagination page={page} total={total} hrefFor={(n) => `/games?page=${n}`} />
	</section>
);

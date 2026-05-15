import { Pagination } from "../../shared/blocks/pagination";
import type { Player } from "../domain";

type Props = {
	items: ReadonlyArray<Player>;
	page: number;
	total: number;
	pageSize: number;
	q?: string;
};

export const PlayerList = ({ items, page, total, q }: Props) => (
	<section id="player-list">
		<header>
			<h2>Players</h2>
			<form
				hx-get="/players"
				hx-target="#player-list"
				hx-swap="outerHTML"
				hx-push-url="true"
			>
				<input
					name="q"
					type="search"
					value={q ?? ""}
					placeholder="Search players…"
					aria-label="Search players"
				/>
				<button type="submit">Search</button>
			</form>
			<button
				type="button"
				hx-get="/players/new"
				hx-target="#register-dialog"
				hx-swap="innerHTML"
				onclick="document.getElementById('register-dialog').showModal()"
			>
				Add player
			</button>
		</header>
		<dialog id="register-dialog" />
		{items.length === 0 ? (
			<p>No players yet.</p>
		) : (
			<table>
				<thead>
					<tr>
						<th>Name</th>
					</tr>
				</thead>
				<tbody>
					{items.map((p) => (
						<tr>
							<td>
								<a href={`/players/${p.id}`} hx-push-url="true">
									{p.name}
								</a>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		)}
		<Pagination
			page={page}
			total={total}
			hrefFor={(n) =>
				`/players?page=${n}${q ? `&q=${encodeURIComponent(q)}` : ""}`
			}
		/>
	</section>
);

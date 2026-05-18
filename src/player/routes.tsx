import {
	HttpRouter,
	HttpServerRequest,
	HttpServerResponse,
} from "@effect/platform";
import { Effect, pipe, Schema } from "effect";
import { Games } from "../game/service";
import { Layout } from "../shared/layout";
import { fragment, html } from "../shared/render";
import { isPartial, respond } from "../shared/routing";
import {
	DuplicatePlayerName,
	EditPlayerInput,
	PlayerNotFound,
	RegisterPlayerInput,
} from "./domain";
import { Players } from "./service";
import { EditPlayer } from "./views/edit";
import { PlayerList } from "./views/list";
import { PlayerProfile } from "./views/profile";
import { RegisterPlayer } from "./views/register";
import { SearchResults } from "./views/search-result";
import { A } from "andale";
import { is } from "drizzle-orm";
import { toHtml } from "tsx-to-html";

const ListSearchParams = Schema.Struct({
	q: Schema.optional(Schema.String),
	page: Schema.optional(Schema.String),
});

export const playerRoutes = A.Router.from(
	A.path("/") //TODO this belongs in the root router
		.pipe(
			A.verb("GET"),
			A.respond(function* () {
				return A.Response.redirect("/games");
			}),
		),

	A.path("/players").pipe(
		A.verb("GET"),
		A.query(ListSearchParams),
		A.respond(function* ({ query }) {
			const q = query.q;
			const page = query.page ? parseInt(query.page, 10) : 1;
			const players = yield* Players;
			const result = yield* players.list({ q, page });
			const isHx = yield* isPartial;

			const temp = respond(
				isHx,
				<PlayerList
					items={result.items}
					page={result.page}
					total={result.total}
					pageSize={result.pageSize}
					q={q}
				/>,
				(body) => (
					<Layout title="Players" active="players">
						{body}
					</Layout>
				),
			);

			return A.Response.asHtml(A.Response.of(temp));
		}),
	),

	// must come before /players/:id
	A.path("/players/new").pipe(
		A.verb("GET"),
		A.respond(function* () {
			return A.Response.asHtml(A.Response.of(toHtml(<RegisterPlayer />)));
		}),
	),

	// must come before /players/:id
	A.path("/players/search").pipe(
		A.verb("GET"),
		A.query(ListSearchParams),
		A.respond(function* ({ query }) {
			const q = query.q ?? "";
			const players = yield* Players;
			const results = yield* players.search(q);
			return A.Response.asHtml(
				A.Response.of(toHtml(<SearchResults items={results} />)),
			);
		}),
	),

	A.path("/players").pipe(
		A.verb("POST"),
		A.body(RegisterPlayerInput),
		A.respond(function* ({ body }) {
			const players = yield* Players;
			yield* players
				.create({ name: body.name })
				.pipe(
					Effect.catchTag("DuplicatePlayerName", () =>
						Effect.fail(
							A.Response.asHtml(
								A.Response.of(
									<RegisterPlayer
										error={`Name "${body.name}" is already taken`}
										values={{ name: body.name }}
									/>,
									{ status: 422 },
								),
							),
						),
					),
				);
			const result = yield* players.list();
			const isHx = yield* isPartial;

			return A.Response.asHtml(
				A.Response.created(
					respond(
						isHx,
						<PlayerList
							items={result.items}
							page={result.page}
							total={result.total}
							pageSize={result.pageSize}
						/>,
						(body) => (
							<Layout title="Players" active="players">
								{body}
							</Layout>
						),
					),
				),
			);

			// return A.Response.redirect("/players"); //TODO redirect better than full page reload??? Discuss with AI.
		}),
	),

	A.path("/players/:id").pipe(
		A.verb("GET"),
		A.respond(function* ({ path: { id } }) {
			const players = yield* Players;
			const player = yield* players
				.get(id)
				.pipe(
					Effect.catchTag("PlayerNotFound", () =>
						Effect.fail(A.Response.notFound("Player not found")),
					),
				);
			const isHx = yield* isPartial;

			return A.Response.asHtml(
				A.Response.success(
					respond(isHx, <PlayerProfile player={player} />, (body) => (
						<Layout title={player.name} active="players">
							{body}
						</Layout>
					)),
				),
			);
		}),
	),

	A.path("/players/:id/edit").pipe(
		A.verb("GET"),
		A.respond(function* ({ path: { id } }) {
			const players = yield* Players;
			const player = yield* players
				.get(id)
				.pipe(
					Effect.catchTag("PlayerNotFound", () =>
						Effect.fail(A.Response.notFound("Player not found")),
					),
				);
			const isHx = yield* isPartial;

			return A.Response.asHtml(
				A.Response.success(
					respond(isHx, <EditPlayer player={player} />, (body) => (
						<Layout title={player.name} active="players">
							{body}
						</Layout>
					)),
				),
			);
		}),
	),

	A.path("/players/:id").pipe(
		A.verb("PATCH"),
		A.body(EditPlayerInput),
		A.respond(function* ({ path: { id }, body }) {
			const players = yield* Players;
			const player = yield* players.update(id, { name: body.name }).pipe(
				Effect.catchTag("DuplicatePlayerName", () =>
					Effect.fail(
						A.Response.asHtml(
							A.Response.of(
								<EditPlayer
									player={{ id, name: body.name }}
									error={body.name}
								/>,
								{ status: 422 },
							),
						),
					),
				),
				Effect.catchTag("PlayerNotFound", () =>
					Effect.fail(
						A.Response.asHtml(
							A.Response.notFound(
								<EditPlayer
									player={{ id, name: body.name }}
									error={body.name}
								/>,
							),
						),
					),
				),
			);

			const isHx = yield* isPartial;

			return A.Response.asHtml(
				A.Response.success(
					respond(isHx, <PlayerProfile player={player} />, (body) => (
						<Layout title={player.name} active="players">
							{body}
						</Layout>
					)),
				),
			);
		}),
	),

	A.path("/players/:id").pipe(
		A.verb("DELETE"),
		A.respond(function* ({ path: { id } }) {
			const players = yield* Players;
			yield* players
				.remove(id)
				.pipe(
					Effect.catchTag("PlayerNotFound", () =>
						Effect.fail(A.Response.notFound("Player not found")),
					),
				);
			const result = yield* players.list();

			const isHx = yield* isPartial;

			return A.Response.asHtml(
				A.Response.success(
					respond(
						isHx,
						<PlayerList
							items={result.items}
							page={result.page}
							total={result.total}
							pageSize={result.pageSize}
						/>,
						(body) => (
							<Layout title="Players" active="players">
								{body}
							</Layout>
						),
					),
				),
			);
		}),
	),

	A.path("/players/:id/games").pipe(
		A.verb("GET"),
		A.respond(function* ({ path: { id } }) {
			const games = yield* Games;
			const result = yield* games.list({ playerId: id, pageSize: 1000 });

			console.log("result.items", result.items);

			if (!result.items || result.items.length === 0) {
				console.log("No games found for player", id);
				return A.Response.asHtml(
					A.Response.success(toHtml(<p>No games yet.</p>)),
				);
			}

			return A.Response.asHtml(
				A.Response.success(
					toHtml(
						<table>
							<thead>
								<tr>
									<th>Date</th>
									<th>Mode</th>
									<th>Winner</th>
								</tr>
							</thead>
							<tbody>
								{result.items.map((g) => {
									const date = new Date(g.playedAt).toLocaleDateString();
									const winner =
										g.mode.kind === "1v1"
											? g.winner === "left"
												? g.mode.leftPlayer
												: g.mode.rightPlayer
											: g.winner === "left"
												? "Left team"
												: "Right team";
									return (
										<tr>
											<td>{date}</td>
											<td>{g.mode.kind}</td>
											<td>
												<strong>{winner}</strong>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>,
					),
				),
			);
		}),
	),
);

import {
	HttpRouter,
	HttpServerRequest,
	HttpServerResponse,
} from "@effect/platform";
import { Effect, Schema } from "effect";
import { Games } from "../game/service"; // TAG only - allowed cross-feature
import { Layout } from "../shared/layout";
import { fragment, html } from "../shared/render";
import { respond } from "../shared/routing";
import { EditPlayerInput, RegisterPlayerInput } from "./domain";
import { Players } from "./service";
import { EditPlayer } from "./views/edit";
import { PlayerList } from "./views/list";
import { PlayerProfile } from "./views/profile";
import { RegisterPlayer } from "./views/register";
import { SearchResults } from "./views/search-result";

const isHtmx = (req: HttpServerRequest.HttpServerRequest) =>
	req.headers["hx-request"] === "true";

const ListSearchParams = Schema.Struct({
	q: Schema.optional(Schema.String),
	page: Schema.optional(Schema.String),
});

export const playerRoutes = HttpRouter.empty.pipe(
	// GET /players - list with search and pagination
	HttpRouter.get(
		"/players",
		Effect.gen(function* () {
			const req = yield* HttpServerRequest.HttpServerRequest;
			const params =
				yield* HttpServerRequest.schemaSearchParams(ListSearchParams);
			const q = params.q;
			const page = params.page ? parseInt(params.page, 10) : 1;
			const players = yield* Players;
			const result = yield* players.list({ q, page });
			const isPartial = isHtmx(req);
			return respond(
				isPartial,
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
		}),
	),

	// GET /players/new - register form (must come before /players/:id)
	HttpRouter.get("/players/new", fragment(<RegisterPlayer />)),

	// GET /players/search - search results for combobox (must come before /players/:id)
	HttpRouter.get(
		"/players/search",
		Effect.gen(function* () {
			const params = yield* HttpServerRequest.schemaSearchParams(
				Schema.Struct({
					q: Schema.optional(Schema.String),
				}),
			);
			const q = params.q ?? "";
			const players = yield* Players;
			const results = yield* players.search(q);
			return fragment(<SearchResults items={results} />);
		}),
	),

	// POST /players - create player
	HttpRouter.post(
		"/players",
		Effect.gen(function* () {
			const req = yield* HttpServerRequest.HttpServerRequest;
			const body =
				yield* HttpServerRequest.schemaBodyUrlParams(RegisterPlayerInput);
			const players = yield* Players;
			yield* players.create({ name: body.name });
			const result = yield* players.list();
			const isPartial = isHtmx(req);

			if (isPartial) {
				return fragment(
					<PlayerList
						items={result.items}
						page={result.page}
						total={result.total}
						pageSize={result.pageSize}
					/>,
				);
			} else {
				return html(
					<Layout title="Players" active="players">
						<PlayerList
							items={result.items}
							page={result.page}
							total={result.total}
							pageSize={result.pageSize}
						/>
					</Layout>,
				).pipe(HttpServerResponse.setStatus(303));
			}
		}).pipe(
			Effect.catchTag("DuplicatePlayerName", (e) =>
				fragment(
					<RegisterPlayer
						error={`Name "${e.name}" is already taken`}
						values={{ name: e.name }}
					/>,
				).pipe(HttpServerResponse.setStatus(422)),
			),
			Effect.catchTag("ParseError", () =>
				fragment(<RegisterPlayer error="Name is required" />).pipe(
					HttpServerResponse.setStatus(422),
				),
			),
		),
	),

	// GET /players/:id - view profile
	HttpRouter.get(
		"/players/:id",
		Effect.gen(function* () {
			const req = yield* HttpServerRequest.HttpServerRequest;
			const { id } = yield* HttpRouter.params;
			const players = yield* Players;
			const player = yield* players.get(id ?? "");
			const isPartial = isHtmx(req);
			return respond(isPartial, <PlayerProfile player={player} />, (body) => (
				<Layout title={player.name} active="players">
					{body}
				</Layout>
			));
		}).pipe(
			Effect.catchTag("PlayerNotFound", () =>
				HttpServerResponse.empty({ status: 404 }),
			),
		),
	),

	// GET /players/:id/edit - edit form
	HttpRouter.get(
		"/players/:id/edit",
		Effect.gen(function* () {
			const { id } = yield* HttpRouter.params;
			const players = yield* Players;
			const player = yield* players.get(id ?? "");
			return fragment(<EditPlayer player={player} />);
		}).pipe(
			Effect.catchTag("PlayerNotFound", () =>
				HttpServerResponse.empty({ status: 404 }),
			),
		),
	),

	// PATCH /players/:id - update player
	HttpRouter.patch(
		"/players/:id",
		Effect.gen(function* () {
			const req = yield* HttpServerRequest.HttpServerRequest;
			const { id } = yield* HttpRouter.params;
			const body =
				yield* HttpServerRequest.schemaBodyUrlParams(EditPlayerInput);
			const players = yield* Players;
			const player = yield* players.update(id ?? "", { name: body.name });
			const isPartial = isHtmx(req);

			if (isPartial) {
				return fragment(<PlayerProfile player={player} />);
			} else {
				return html(
					<Layout title={player.name} active="players">
						<PlayerProfile player={player} />
					</Layout>,
				).pipe(HttpServerResponse.setStatus(303));
			}
		}).pipe(
			Effect.catchTag("PlayerNotFound", () =>
				HttpServerResponse.empty({ status: 404 }),
			),
			Effect.catchTag("DuplicatePlayerName", (e) =>
				fragment(
					<EditPlayer
						player={{ id: "", name: e.name }}
						error={`Name "${e.name}" is already taken`}
					/>,
				).pipe(HttpServerResponse.setStatus(422)),
			),
			Effect.catchTag("ParseError", () =>
				fragment(
					<EditPlayer player={{ id: "", name: "" }} error="Name is required" />,
				).pipe(HttpServerResponse.setStatus(422)),
			),
		),
	),

	// DELETE /players/:id - remove player
	HttpRouter.del(
		"/players/:id",
		Effect.gen(function* () {
			const req = yield* HttpServerRequest.HttpServerRequest;
			const { id } = yield* HttpRouter.params;
			const players = yield* Players;
			yield* players.remove(id ?? "");
			const result = yield* players.list();
			const isPartial = isHtmx(req);

			if (isPartial) {
				return fragment(
					<PlayerList
						items={result.items}
						page={result.page}
						total={result.total}
						pageSize={result.pageSize}
					/>,
				);
			} else {
				return html(
					<Layout title="Players" active="players">
						<PlayerList
							items={result.items}
							page={result.page}
							total={result.total}
							pageSize={result.pageSize}
						/>
					</Layout>,
				).pipe(HttpServerResponse.setStatus(303));
			}
		}).pipe(
			Effect.catchTag("PlayerNotFound", () =>
				HttpServerResponse.empty({ status: 404 }),
			),
		),
	),

	// GET /players/:id/games - games for this player
	HttpRouter.get(
		"/players/:id/games",
		Effect.gen(function* () {
			const { id } = yield* HttpRouter.params;
			const games = yield* Games;
			const result = yield* games.list({ playerId: id ?? "", pageSize: 1000 });
			if (result.items.length === 0) {
				return fragment(<p>No games yet.</p>);
			}
			return fragment(
				<table>
					<thead>
						<tr>
							<th>Date</th>
							<th>Mode</th>
							<th>Score</th>
						</tr>
					</thead>
					<tbody>
						{result.items.map((g) => {
							const date = new Date(g.playedAt).toLocaleDateString();
							const score = `${g.leftGoals} – ${g.rightGoals}`;
							return (
								<tr>
									<td>{date}</td>
									<td>{g.mode.kind}</td>
									<td>{score}</td>
								</tr>
							);
						})}
					</tbody>
				</table>,
			);
		}),
	),
);

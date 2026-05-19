import { Effect, Schema } from "effect";
import { Players } from "../player/service";
import { renderPage } from "../shared/page";
import { fragment, html } from "../shared/render";
import { RegisterGameInput, validateLineup } from "./domain";
import { Games } from "./service";
import { Scoreboard } from "./views/list";
import { RegisterGame } from "./views/register";
import { A } from "andale";

const buildNameOf = (players: ReadonlyArray<{ id: string; name: string }>) => {
	const map = new Map(players.map((p) => [p.id, p.name]));
	return (id: string) => map.get(id) ?? id;
};

export const gameRoutes = A.Router.from(
	// GET /games/new must come before /games/:id
	A.path("/games/new").pipe(
		A.verb("GET"),
		A.query(
			Schema.Struct({ kind: Schema.optional(Schema.Literal("1v1", "2v2")) }),
		),
		A.respond(function* ({ query: { kind } }) {
			return fragment(<RegisterGame> kind={kind ?? "1v1"}</RegisterGame>);
		}),
	),

	A.path("/games").pipe(
		A.verb("GET"),
		A.query(Schema.Struct({ page: Schema.optional(Schema.String) })),
		A.respond(function* ({ query }) {
			const page = query.page ? parseInt(query.page, 10) : 1;
			const games = yield* Games;
			const result = yield* games.list({ page });
			const players = yield* Players;
			const allPlayers = yield* players.list({ pageSize: 1000 });
			const nameOf = buildNameOf(allPlayers.items);

			const content = yield* renderPage(
				"Scoreboard",
				<Scoreboard
					items={result.items}
					page={result.page}
					total={result.total}
					nameOf={nameOf}
				/>,
			);
			return A.Response.asHtml(A.Response.of(content));
		}),
	),

	A.path("/games").pipe(
		A.verb("POST"),
		A.body(RegisterGameInput),
		A.respond(function* ({ body }) {
			const validated = yield* validateLineup(body).pipe(
				Effect.catchTag("InvalidLineup", (e) =>
					Effect.fail(
						A.Response.asHtml(
							A.Response.of(<RegisterGame error={e.reason} />, { status: 422 }),
						),
					),
				),
			);
			const gameService = yield* Games;
			yield* gameService.create(validated);
			const result = yield* gameService.list();
			const playerService = yield* Players;
			const players = yield* playerService.list({ pageSize: 1000 });
			const nameOf = buildNameOf(players.items);

			const content = yield* renderPage(
				"Scoreboard",
				<Scoreboard
					items={result.items}
					page={result.page}
					total={result.total}
					nameOf={nameOf}
				/>,
			);
			return A.Response.asHtml(A.Response.of(content));
		}),
	),

	A.path("/games/:id").pipe(
		A.verb("GET"),
		A.respond(function* ({ path }) {
			const gameService = yield* Games;
			const game = yield* gameService
				.get(path.id)
				.pipe(
					Effect.catchTag("GameNotFound", () =>
						Effect.fail(
							A.Response.asHtml(
								A.Response.notFound(html(<p>Game Not Found</p>)),
							),
						),
					),
				);

			return A.Response.asHtml(
				A.Response.success(
					fragment(
						<table>
							<tbody>
								<tr>
									<td>{game.mode.kind}</td>
									<td>{game.winner === "left" ? "Left won" : "Right won"}</td>
								</tr>
							</tbody>
						</table>,
					),
				),
			);
		}),
	),
);

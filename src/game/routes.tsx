import {
	HttpRouter,
	HttpServerRequest,
	HttpServerResponse,
} from "@effect/platform";
import { Effect, Schema } from "effect";
import { Players } from "../player/service";
import { Layout } from "../shared/layout";
import { fragment, html } from "../shared/render";
import { isPartialRequest, respond } from "../shared/routing";
import { RegisterGameInput, validateLineup } from "./domain";
import { Games } from "./service";
import { Scoreboard } from "./views/list";
import { RegisterGame } from "./views/register";

const buildNameOf = (players: ReadonlyArray<{ id: string; name: string }>) => {
	const map = new Map(players.map((p) => [p.id, p.name]));
	return (id: string) => map.get(id) ?? id;
};

export const gameRoutes = HttpRouter.empty.pipe(
	// GET /games/new must come before /games/:id
	HttpRouter.get(
		"/games/new",
		Effect.gen(function* () {
			const params = yield* HttpServerRequest.schemaSearchParams(
				Schema.Struct({ kind: Schema.optional(Schema.Literal("1v1", "2v2")) }),
			);
			return fragment(<RegisterGame kind={params.kind ?? "1v1"} />);
		}),
	),

	HttpRouter.get(
		"/games",
		Effect.gen(function* () {
			const req = yield* HttpServerRequest.HttpServerRequest;
			const params = yield* HttpServerRequest.schemaSearchParams(
				Schema.Struct({ page: Schema.optional(Schema.String) }),
			);
			const page = params.page ? parseInt(params.page, 10) : 1;
			const games = yield* Games;
			const result = yield* games.list({ page });
			const players = yield* Players;
			const allPlayers = yield* players.list({ pageSize: 1000 });
			const nameOf = buildNameOf(allPlayers.items);
			const isPartial = isPartialRequest(req);
			return respond(
				isPartial,
				<Scoreboard
					items={result.items}
					page={result.page}
					total={result.total}
					nameOf={nameOf}
				/>,
				(body) => (
					<Layout title="Scoreboard" active="games">
						{body}
					</Layout>
				),
			);
		}),
	),

	HttpRouter.post(
		"/games",
		Effect.gen(function* () {
			const req = yield* HttpServerRequest.HttpServerRequest;
			const body =
				yield* HttpServerRequest.schemaBodyUrlParams(RegisterGameInput);
			const validated = yield* validateLineup(body);
			const games = yield* Games;
			yield* games.create(validated);
			const result = yield* games.list();
			const players = yield* Players;
			const allPlayers = yield* players.list({ pageSize: 1000 });
			const nameOf = buildNameOf(allPlayers.items);
			const isPartial = isPartialRequest(req);

			if (isPartial) {
				return fragment(
					<Scoreboard
						items={result.items}
						page={result.page}
						total={result.total}
						nameOf={nameOf}
					/>,
				);
			}
			return html(
				<Layout title="Scoreboard" active="games">
					<Scoreboard
						items={result.items}
						page={result.page}
						total={result.total}
						nameOf={nameOf}
					/>
				</Layout>,
			).pipe(HttpServerResponse.setStatus(303));
		}).pipe(
			Effect.catchTag("InvalidLineup", (e) =>
				fragment(<RegisterGame error={e.reason} />).pipe(
					HttpServerResponse.setStatus(422),
				),
			),
			Effect.catchTag("ParseError", () =>
				fragment(<RegisterGame error="Invalid form data" />).pipe(
					HttpServerResponse.setStatus(422),
				),
			),
		),
	),

	HttpRouter.get(
		"/games/:id",
		Effect.gen(function* () {
			const { id } = yield* HttpRouter.params;
			const games = yield* Games;
			const game = yield* games.get(id ?? "");
			return fragment(
				<table>
					<tbody>
						<tr>
							<td>{game.mode.kind}</td>
							<td>{game.winner === "left" ? "Left won" : "Right won"}</td>
						</tr>
					</tbody>
				</table>,
			);
		}).pipe(
			Effect.catchTag("GameNotFound", () =>
				HttpServerResponse.empty({ status: 404 }),
			),
		),
	),
);

import { desc, eq, or } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import { Db, DbLive } from "../db";
import * as schema from "../schema";
import { Game, GameId, type GameMode, GameNotFound } from "./domain";

type GameListResult = {
	items: ReadonlyArray<Game>;
	total: number;
	page: number;
	pageSize: number;
};

type GameRow = typeof schema.games.$inferSelect;

const toGame = (row: GameRow): Game => {
	const mode: GameMode =
		row.kind === "1v1"
			? {
					kind: "1v1",
					leftPlayer: row.leftPlayer ?? "",
					rightPlayer: row.rightPlayer ?? "",
				}
			: {
					kind: "2v2",
					leftPlayerA: row.leftPlayerA ?? "",
					leftPlayerB: row.leftPlayerB ?? "",
					rightPlayerA: row.rightPlayerA ?? "",
					rightPlayerB: row.rightPlayerB ?? "",
				};
	return new Game({
		id: GameId.make(row.id),
		mode,
		winner: row.winner,
		playedAt: row.playedAt,
	});
};

export class Games extends Context.Tag("Games")<
	Games,
	{
		readonly list: (opts?: {
			page?: number;
			pageSize?: number;
			playerId?: string;
		}) => Effect.Effect<GameListResult>;
		readonly get: (id: string) => Effect.Effect<Game, GameNotFound>;
		readonly create: (input: {
			mode: GameMode;
			winner: "left" | "right";
		}) => Effect.Effect<Game>;
	}
>() {}

export const GamesLive = Layer.effect(
	Games,
	Effect.gen(function* () {
		const db = yield* Db;

		return Games.of({
			list: (opts = {}) =>
				Effect.sync(() => {
					const { page = 1, pageSize = 20, playerId } = opts;
					const rows = playerId
						? db
								.select()
								.from(schema.games)
								.where(
									or(
										eq(schema.games.leftPlayer, playerId),
										eq(schema.games.rightPlayer, playerId),
										eq(schema.games.leftPlayerA, playerId),
										eq(schema.games.leftPlayerB, playerId),
										eq(schema.games.rightPlayerA, playerId),
										eq(schema.games.rightPlayerB, playerId),
									),
								)
								.orderBy(desc(schema.games.playedAt))
								.all()
						: db
								.select()
								.from(schema.games)
								.orderBy(desc(schema.games.playedAt))
								.all();
					const total = rows.length;
					const start = (page - 1) * pageSize;
					return {
						items: rows.slice(start, start + pageSize).map(toGame),
						total: Math.max(1, Math.ceil(total / pageSize)),
						page,
						pageSize,
					};
				}),

			get: (id) =>
				Effect.gen(function* () {
					const row = db
						.select()
						.from(schema.games)
						.where(eq(schema.games.id, id))
						.get();
					if (!row) return yield* new GameNotFound({ id });
					return toGame(row);
				}),

			create: (input) =>
				Effect.sync(() => {
					const id = GameId.make(crypto.randomUUID());
					const playedAt = new Date().toISOString();
					const kind = input.mode.kind;
					const leftPlayer = kind === "1v1" ? input.mode.leftPlayer : null;
					const rightPlayer = kind === "1v1" ? input.mode.rightPlayer : null;
					const leftPlayerA = kind === "2v2" ? input.mode.leftPlayerA : null;
					const leftPlayerB = kind === "2v2" ? input.mode.leftPlayerB : null;
					const rightPlayerA = kind === "2v2" ? input.mode.rightPlayerA : null;
					const rightPlayerB = kind === "2v2" ? input.mode.rightPlayerB : null;

					const values = {
						id,
						kind,
						leftPlayer,
						rightPlayer,
						leftPlayerA,
						leftPlayerB,
						rightPlayerA,
						rightPlayerB,
						winner: input.winner,
						playedAt,
					} satisfies typeof schema.games.$inferInsert;

					db.insert(schema.games).values(values).run();

					return toGame(values);
				}),
		});
	}),
).pipe(Layer.provide(DbLive));

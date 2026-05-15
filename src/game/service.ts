import { Context, Effect, Layer } from "effect";
import { Db, DbLive } from "../db";
import { Game, GameId, type GameMode, GameNotFound } from "./domain";

type GameListResult = {
	items: ReadonlyArray<Game>;
	total: number;
	page: number;
	pageSize: number;
};

type GameRow = {
	id: string;
	kind: "1v1" | "2v2";
	left_player: string | null;
	right_player: string | null;
	left_player_a: string | null;
	left_player_b: string | null;
	right_player_a: string | null;
	right_player_b: string | null;
	winner: "left" | "right";
	played_at: string;
};

const toGame = (row: GameRow): Game => {
	const mode: GameMode =
		row.kind === "1v1"
			? {
					kind: "1v1",
					leftPlayer: row.left_player!,
					rightPlayer: row.right_player!,
				}
			: {
					kind: "2v2",
					leftPlayerA: row.left_player_a!,
					leftPlayerB: row.left_player_b!,
					rightPlayerA: row.right_player_a!,
					rightPlayerB: row.right_player_b!,
				};
	return new Game({
		id: GameId.make(row.id),
		mode,
		winner: row.winner,
		playedAt: row.played_at,
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
					let rows: GameRow[];
					if (playerId) {
						rows = db
							.prepare(
								`SELECT * FROM games
               WHERE left_player = ? OR right_player = ?
                  OR left_player_a = ? OR left_player_b = ?
                  OR right_player_a = ? OR right_player_b = ?
               ORDER BY played_at DESC`,
							)
							.all(
								playerId,
								playerId,
								playerId,
								playerId,
								playerId,
								playerId,
							) as GameRow[];
					} else {
						rows = db
							.prepare(`SELECT * FROM games ORDER BY played_at DESC`)
							.all() as GameRow[];
					}
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
						.prepare(`SELECT * FROM games WHERE id = ?`)
						.get(id) as GameRow | undefined;
					if (!row) return yield* new GameNotFound({ id });
					return toGame(row);
				}),

			create: (input) =>
				Effect.sync(() => {
					const id = GameId.make(crypto.randomUUID());
					const playedAt = new Date().toISOString();
					const kind = input.mode.kind;
					const leftPlayer =
						kind === "1v1" ? input.mode.leftPlayer : null;
					const rightPlayer =
						kind === "1v1" ? input.mode.rightPlayer : null;
					const leftPlayerA =
						kind === "2v2" ? input.mode.leftPlayerA : null;
					const leftPlayerB =
						kind === "2v2" ? input.mode.leftPlayerB : null;
					const rightPlayerA =
						kind === "2v2" ? input.mode.rightPlayerA : null;
					const rightPlayerB =
						kind === "2v2" ? input.mode.rightPlayerB : null;

					db.prepare(
						`INSERT INTO games
             (id, kind, left_player, right_player, left_player_a, left_player_b, right_player_a, right_player_b, winner, played_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
					).run(
						id,
						kind,
						leftPlayer,
						rightPlayer,
						leftPlayerA,
						leftPlayerB,
						rightPlayerA,
						rightPlayerB,
						input.winner,
						playedAt,
					);

					return toGame({
						id,
						kind,
						left_player: leftPlayer,
						right_player: rightPlayer,
						left_player_a: leftPlayerA,
						left_player_b: leftPlayerB,
						right_player_a: rightPlayerA,
						right_player_b: rightPlayerB,
						winner: input.winner,
						played_at: playedAt,
					});
				}),
		});
	}),
).pipe(Layer.provide(DbLive));

// Keep old name as alias for backwards-compat with main.tsx
export const GamesMemoryLive = GamesLive;

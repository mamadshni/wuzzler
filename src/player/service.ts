import { Context, Effect, Layer } from "effect";
import { Db, DbLive } from "../db";
import {
	DuplicatePlayerName,
	Player,
	PlayerId,
	type PlayerName,
	PlayerNotFound,
} from "./domain";

type PlayerListResult = {
	items: ReadonlyArray<Player>;
	total: number;
	page: number;
	pageSize: number;
};

type PlayerRow = { id: string; name: string };

const toPlayer = (row: PlayerRow): Player =>
	new Player({
		id: PlayerId.make(row.id),
		name: row.name as typeof PlayerName.Type,
	});

export class Players extends Context.Tag("Players")<
	Players,
	{
		readonly list: (opts?: {
			q?: string;
			page?: number;
			pageSize?: number;
		}) => Effect.Effect<PlayerListResult>;
		readonly get: (id: string) => Effect.Effect<Player, PlayerNotFound>;
		readonly create: (input: {
			name: string;
		}) => Effect.Effect<Player, DuplicatePlayerName>;
		readonly update: (
			id: string,
			input: { name: string },
		) => Effect.Effect<Player, PlayerNotFound | DuplicatePlayerName>;
		readonly remove: (id: string) => Effect.Effect<void, PlayerNotFound>;
		readonly search: (q: string) => Effect.Effect<ReadonlyArray<Player>>;
	}
>() {}

export const PlayersLive = Layer.effect(
	Players,
	Effect.gen(function* () {
		const db = yield* Db;

		return Players.of({
			list: (opts = {}) =>
				Effect.sync(() => {
					const { q, page = 1, pageSize = 20 } = opts;
					const rows = q
						? (db
								.prepare(
									`SELECT * FROM players WHERE name LIKE ? ORDER BY name COLLATE NOCASE`,
								)
								.all(`%${q}%`) as PlayerRow[])
						: (db
								.prepare(
									`SELECT * FROM players ORDER BY name COLLATE NOCASE`,
								)
								.all() as PlayerRow[]);
					const total = rows.length;
					const start = (page - 1) * pageSize;
					return {
						items: rows.slice(start, start + pageSize).map(toPlayer),
						total: Math.max(1, Math.ceil(total / pageSize)),
						page,
						pageSize,
					};
				}),

			get: (id) =>
				Effect.gen(function* () {
					const row = db
						.prepare(`SELECT * FROM players WHERE id = ?`)
						.get(id) as PlayerRow | undefined;
					if (!row) return yield* new PlayerNotFound({ id });
					return toPlayer(row);
				}),

			create: (input) =>
				Effect.gen(function* () {
					const id = PlayerId.make(crypto.randomUUID());
					try {
						db.prepare(
							`INSERT INTO players (id, name) VALUES (?, ?)`,
						).run(id, input.name);
					} catch (e) {
						if (
							e instanceof Error &&
							e.message.includes("UNIQUE constraint failed")
						) {
							return yield* new DuplicatePlayerName({ name: input.name });
						}
						throw e;
					}
					return toPlayer({ id, name: input.name });
				}),

			update: (id, input) =>
				Effect.gen(function* () {
					const existing = db
						.prepare(`SELECT * FROM players WHERE id = ?`)
						.get(id) as PlayerRow | undefined;
					if (!existing) return yield* new PlayerNotFound({ id });
					try {
						db.prepare(`UPDATE players SET name = ? WHERE id = ?`).run(
							input.name,
							id,
						);
					} catch (e) {
						if (
							e instanceof Error &&
							e.message.includes("UNIQUE constraint failed")
						) {
							return yield* new DuplicatePlayerName({ name: input.name });
						}
						throw e;
					}
					return toPlayer({ id, name: input.name });
				}),

			remove: (id) =>
				Effect.gen(function* () {
					const result = db
						.prepare(`DELETE FROM players WHERE id = ?`)
						.run(id);
					if (result.changes === 0) return yield* new PlayerNotFound({ id });
				}),

			search: (q) =>
				Effect.sync(() => {
					const rows = db
						.prepare(
							`SELECT * FROM players WHERE name LIKE ? ORDER BY name COLLATE NOCASE LIMIT 10`,
						)
						.all(`%${q}%`) as PlayerRow[];
					return rows.map(toPlayer);
				}),
		});
	}),
).pipe(Layer.provide(DbLive));

// Keep old name as alias for backwards-compat with main.tsx
export const PlayersMemoryLive = PlayersLive;

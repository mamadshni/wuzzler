import { eq, like, sql } from "drizzle-orm";
import { Context, Effect, Layer, Schema } from "effect";
import { Db, DbLive } from "../db";
import * as schema from "../schema";
import {
	DuplicatePlayerName,
	Player,
	PlayerId,
	PlayerName,
	PlayerNotFound,
} from "./domain";

type PlayerListResult = {
	items: ReadonlyArray<Player>;
	total: number;
	page: number;
	pageSize: number;
};

type PlayerRow = typeof schema.players.$inferSelect;

const toPlayer = (row: PlayerRow): Player =>
	new Player({
		id: PlayerId.make(row.id),
		name: Schema.decodeSync(PlayerName)(row.name),
	});

const isUniqueViolation = (e: unknown): boolean =>
	e instanceof Error &&
	"code" in e &&
	(e as { code: string }).code === "SQLITE_CONSTRAINT_UNIQUE";

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
						? db
								.select()
								.from(schema.players)
								.where(like(schema.players.name, `%${q}%`))
								.orderBy(sql`name COLLATE NOCASE`)
								.all()
						: db
								.select()
								.from(schema.players)
								.orderBy(sql`name COLLATE NOCASE`)
								.all();
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
						.select()
						.from(schema.players)
						.where(eq(schema.players.id, id))
						.get();
					if (!row) return yield* new PlayerNotFound({ id });
					return toPlayer(row);
				}),

			create: (input) =>
				Effect.gen(function* () {
					const id = PlayerId.make(crypto.randomUUID());
					try {
						db.insert(schema.players).values({ id, name: input.name }).run();
					} catch (e) {
						if (isUniqueViolation(e)) {
							return yield* new DuplicatePlayerName({ name: input.name });
						}
						throw e;
					}
					return toPlayer({ id, name: input.name });
				}),

			update: (id, input) =>
				Effect.gen(function* () {
					const existing = db
						.select()
						.from(schema.players)
						.where(eq(schema.players.id, id))
						.get();
					if (!existing) return yield* new PlayerNotFound({ id });
					try {
						db.update(schema.players)
							.set({ name: input.name })
							.where(eq(schema.players.id, id))
							.run();
					} catch (e) {
						if (isUniqueViolation(e)) {
							return yield* new DuplicatePlayerName({ name: input.name });
						}
						throw e;
					}
					return toPlayer({ id, name: input.name });
				}),

			remove: (id) =>
				Effect.gen(function* () {
					const result = db
						.delete(schema.players)
						.where(eq(schema.players.id, id))
						.run();
					if (result.changes === 0) return yield* new PlayerNotFound({ id });
				}),

			search: (q) =>
				Effect.sync(() => {
					const rows = db
						.select()
						.from(schema.players)
						.where(like(schema.players.name, `%${q}%`))
						.orderBy(sql`name COLLATE NOCASE`)
						.limit(10)
						.all();
					return rows.map(toPlayer);
				}),
		});
	}),
).pipe(Layer.provide(DbLive));

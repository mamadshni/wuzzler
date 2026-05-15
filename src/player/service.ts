import { Context, Effect, Layer, Ref } from "effect";
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

export const PlayersMemoryLive = Layer.effect(
	Players,
	Effect.gen(function* () {
		const ref = yield* Ref.make(new Map<string, Player>());

		return Players.of({
			list: (opts = {}) =>
				Effect.gen(function* () {
					const { q, page = 1, pageSize = 20 } = opts;
					const map = yield* Ref.get(ref);
					let items = Array.from(map.values());
					if (q) {
						const lq = q.toLowerCase();
						items = items.filter((p) => p.name.toLowerCase().includes(lq));
					}
					const total = Math.ceil(items.length / pageSize);
					const start = (page - 1) * pageSize;
					return {
						items: items.slice(start, start + pageSize),
						total: Math.max(1, total),
						page,
						pageSize,
					};
				}),

			get: (id) =>
				Effect.gen(function* () {
					const map = yield* Ref.get(ref);
					const player = map.get(id);
					if (!player) return yield* new PlayerNotFound({ id });
					return player;
				}),

			create: (input) =>
				Effect.gen(function* () {
					const map = yield* Ref.get(ref);
					const existing = Array.from(map.values()).find(
						(p) => p.name.toLowerCase() === input.name.toLowerCase(),
					);
					if (existing)
						return yield* new DuplicatePlayerName({ name: input.name });
					const id = PlayerId.make(crypto.randomUUID());
					const player = new Player({
						id,
						name: input.name as typeof PlayerName.Type,
					});
					yield* Ref.update(ref, (m) => new Map(m).set(id, player));
					return player;
				}),

			update: (id, input) =>
				Effect.gen(function* () {
					const map = yield* Ref.get(ref);
					const player = map.get(id);
					if (!player) return yield* new PlayerNotFound({ id });
					const duplicate = Array.from(map.values()).find(
						(p) =>
							p.id !== id && p.name.toLowerCase() === input.name.toLowerCase(),
					);
					if (duplicate)
						return yield* new DuplicatePlayerName({ name: input.name });
					const updated = new Player({
						id: player.id,
						name: input.name as typeof PlayerName.Type,
					});
					yield* Ref.update(ref, (m) => new Map(m).set(id, updated));
					return updated;
				}),

			remove: (id) =>
				Effect.gen(function* () {
					const map = yield* Ref.get(ref);
					if (!map.has(id)) return yield* new PlayerNotFound({ id });
					yield* Ref.update(ref, (m) => {
						const next = new Map(m);
						next.delete(id);
						return next;
					});
				}),

			search: (q) =>
				Effect.gen(function* () {
					const map = yield* Ref.get(ref);
					const lq = q.toLowerCase();
					return Array.from(map.values())
						.filter((p) => p.name.toLowerCase().includes(lq))
						.slice(0, 10);
				}),
		});
	}),
);

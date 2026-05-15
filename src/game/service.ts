import { Context, Effect, Layer, Ref } from "effect";
import { Game, GameId, type GameMode, GameNotFound } from "./domain";

type GameListResult = {
	items: ReadonlyArray<Game>;
	total: number;
	page: number;
	pageSize: number;
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
			leftGoals: number;
			rightGoals: number;
		}) => Effect.Effect<Game>;
	}
>() {}

export const GamesMemoryLive = Layer.effect(
	Games,
	Effect.gen(function* () {
		const ref = yield* Ref.make(new Map<string, Game>());

		return Games.of({
			list: (opts = {}) =>
				Effect.gen(function* () {
					const { page = 1, pageSize = 20, playerId } = opts;
					const map = yield* Ref.get(ref);
					let items = Array.from(map.values()).sort((a, b) =>
						b.playedAt.localeCompare(a.playedAt),
					);
					if (playerId) {
						items = items.filter((g) => {
							if (g.mode.kind === "1v1")
								return (
									g.mode.leftPlayer === playerId ||
									g.mode.rightPlayer === playerId
								);
							return [
								g.mode.leftPlayerA,
								g.mode.leftPlayerB,
								g.mode.rightPlayerA,
								g.mode.rightPlayerB,
							].includes(playerId);
						});
					}
					const total = Math.max(1, Math.ceil(items.length / pageSize));
					const start = (page - 1) * pageSize;
					return {
						items: items.slice(start, start + pageSize),
						total,
						page,
						pageSize,
					};
				}),

			get: (id) =>
				Effect.gen(function* () {
					const map = yield* Ref.get(ref);
					const game = map.get(id);
					if (!game) return yield* new GameNotFound({ id });
					return game;
				}),

			create: (input) =>
				Effect.gen(function* () {
					const id = GameId.make(crypto.randomUUID());
					const game = new Game({
						id,
						mode: input.mode,
						leftGoals: input.leftGoals,
						rightGoals: input.rightGoals,
						playedAt: new Date().toISOString(),
					});
					yield* Ref.update(ref, (m) => new Map(m).set(id, game));
					return game;
				}),
		});
	}),
);

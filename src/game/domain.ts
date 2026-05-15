import { Effect, Schema } from "effect";

// Foreign key — string ID referencing a player. Do NOT import from player/domain.
export type PlayerId = string;

export const GameId = Schema.String.pipe(Schema.brand("GameId"));
export type GameId = typeof GameId.Type;

export const Goals = Schema.Number.pipe(
	Schema.int(),
	Schema.greaterThanOrEqualTo(0),
);

// 1v1: two distinct players
export const OneVOne = Schema.Struct({
	kind: Schema.Literal("1v1"),
	leftPlayer: Schema.String,
	rightPlayer: Schema.String,
});

// 2v2: four distinct players (left team A+B vs right team A+B)
export const TwoVTwo = Schema.Struct({
	kind: Schema.Literal("2v2"),
	leftPlayerA: Schema.String,
	leftPlayerB: Schema.String,
	rightPlayerA: Schema.String,
	rightPlayerB: Schema.String,
});

export const GameMode = Schema.Union(OneVOne, TwoVTwo);
export type GameMode = typeof GameMode.Type;

export class Game extends Schema.Class<Game>("Game")({
	id: GameId,
	mode: GameMode,
	leftGoals: Goals,
	rightGoals: Goals,
	playedAt: Schema.String, // ISO date string
}) {}

// Pure derivations — never stored
export const winnerSide = (g: Game): "left" | "right" | "draw" => {
	if (g.leftGoals > g.rightGoals) return "left";
	if (g.rightGoals > g.leftGoals) return "right";
	return "draw";
};

export const participants = (g: Game): ReadonlyArray<string> => {
	if (g.mode.kind === "1v1") return [g.mode.leftPlayer, g.mode.rightPlayer];
	return [
		g.mode.leftPlayerA,
		g.mode.leftPlayerB,
		g.mode.rightPlayerA,
		g.mode.rightPlayerB,
	];
};

export class GameNotFound extends Schema.TaggedError<GameNotFound>()(
	"GameNotFound",
	{ id: Schema.String },
) {}

export class InvalidLineup extends Schema.TaggedError<InvalidLineup>()(
	"InvalidLineup",
	{ reason: Schema.String },
) {}

// Input schema for form parsing (all fields are strings from URL params)
export const RegisterGameInput = Schema.Struct({
	kind: Schema.Literal("1v1", "2v2"),
	leftPlayer: Schema.optional(Schema.String),
	rightPlayer: Schema.optional(Schema.String),
	leftPlayerA: Schema.optional(Schema.String),
	leftPlayerB: Schema.optional(Schema.String),
	rightPlayerA: Schema.optional(Schema.String),
	rightPlayerB: Schema.optional(Schema.String),
	leftGoals: Schema.String,
	rightGoals: Schema.String,
});

export const validateLineup = (
	input: typeof RegisterGameInput.Type,
): Effect.Effect<
	{ mode: GameMode; leftGoals: number; rightGoals: number },
	InvalidLineup
> => {
	return Effect.gen(function* () {
		const leftGoals = parseInt(input.leftGoals, 10);
		const rightGoals = parseInt(input.rightGoals, 10);
		if (
			Number.isNaN(leftGoals) ||
			Number.isNaN(rightGoals) ||
			leftGoals < 0 ||
			rightGoals < 0
		) {
			return yield* new InvalidLineup({
				reason: "Goals must be non-negative numbers",
			});
		}
		if (leftGoals + rightGoals === 0) {
			return yield* new InvalidLineup({
				reason: "At least one goal must be scored",
			});
		}

		if (input.kind === "1v1") {
			const left = input.leftPlayer?.trim();
			const right = input.rightPlayer?.trim();
			if (!left || !right) {
				return yield* new InvalidLineup({
					reason: "Both players are required for 1v1",
				});
			}
			if (left === right) {
				return yield* new InvalidLineup({
					reason: "Players must be distinct",
				});
			}
			return {
				mode: { kind: "1v1", leftPlayer: left, rightPlayer: right },
				leftGoals,
				rightGoals,
			};
		}

		const lA = input.leftPlayerA?.trim();
		const lB = input.leftPlayerB?.trim();
		const rA = input.rightPlayerA?.trim();
		const rB = input.rightPlayerB?.trim();
		if (!lA || !lB || !rA || !rB) {
			return yield* new InvalidLineup({
				reason: "All four players are required for 2v2",
			});
		}
		const ids = [lA, lB, rA, rB];
		if (new Set(ids).size !== 4) {
			return yield* new InvalidLineup({
				reason: "All four players must be distinct",
			});
		}
		return {
			mode: {
				kind: "2v2",
				leftPlayerA: lA,
				leftPlayerB: lB,
				rightPlayerA: rA,
				rightPlayerB: rB,
			},
			leftGoals,
			rightGoals,
		};
	});
};

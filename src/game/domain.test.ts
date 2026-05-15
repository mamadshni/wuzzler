import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { InvalidLineup, validateLineup } from "./domain";

describe("validateLineup", () => {
	describe("1v1 mode", () => {
		it("succeeds with two distinct players", () => {
			const result = Effect.runSync(
				validateLineup({
					kind: "1v1",
					leftPlayer: "alice",
					rightPlayer: "bob",
					winner: "left",
				}),
			);

			expect(result.winner).toBe("left");
			expect(result.mode.kind).toBe("1v1");
			if (result.mode.kind === "1v1") {
				expect(result.mode.leftPlayer).toBe("alice");
				expect(result.mode.rightPlayer).toBe("bob");
			}
		});

		it("trims whitespace from player names", () => {
			const result = Effect.runSync(
				validateLineup({
					kind: "1v1",
					leftPlayer: "  alice  ",
					rightPlayer: "  bob  ",
					winner: "right",
				}),
			);

			expect(result.mode.kind).toBe("1v1");
			if (result.mode.kind === "1v1") {
				expect(result.mode.leftPlayer).toBe("alice");
				expect(result.mode.rightPlayer).toBe("bob");
			}
		});

		it("fails when left player is missing", () => {
			expect(() =>
				Effect.runSync(
					validateLineup({
						kind: "1v1",
						leftPlayer: undefined,
						rightPlayer: "bob",
						winner: "left",
					}),
				),
			).toThrow();
		});

		it("fails when right player is missing", () => {
			expect(() =>
				Effect.runSync(
					validateLineup({
						kind: "1v1",
						leftPlayer: "alice",
						rightPlayer: undefined,
						winner: "left",
					}),
				),
			).toThrow();
		});

		it("fails when both players are missing", () => {
			expect(() =>
				Effect.runSync(
					validateLineup({
						kind: "1v1",
						leftPlayer: undefined,
						rightPlayer: undefined,
						winner: "left",
					}),
				),
			).toThrow();
		});

		it("fails when left player is empty string", () => {
			expect(() =>
				Effect.runSync(
					validateLineup({
						kind: "1v1",
						leftPlayer: "",
						rightPlayer: "bob",
						winner: "left",
					}),
				),
			).toThrow();
		});

		it("fails when players are the same", () => {
			expect(() =>
				Effect.runSync(
					validateLineup({
						kind: "1v1",
						leftPlayer: "alice",
						rightPlayer: "alice",
						winner: "left",
					}),
				),
			).toThrow();
		});

		it("fails when players are the same after trimming", () => {
			expect(() =>
				Effect.runSync(
					validateLineup({
						kind: "1v1",
						leftPlayer: "  alice  ",
						rightPlayer: "alice",
						winner: "left",
					}),
				),
			).toThrow();
		});
	});

	describe("2v2 mode", () => {
		it("succeeds with four distinct players", () => {
			const result = Effect.runSync(
				validateLineup({
					kind: "2v2",
					leftPlayerA: "alice",
					leftPlayerB: "bob",
					rightPlayerA: "charlie",
					rightPlayerB: "diana",
					winner: "left",
				}),
			);

			expect(result.winner).toBe("left");
			expect(result.mode.kind).toBe("2v2");
			if (result.mode.kind === "2v2") {
				expect(result.mode.leftPlayerA).toBe("alice");
				expect(result.mode.leftPlayerB).toBe("bob");
				expect(result.mode.rightPlayerA).toBe("charlie");
				expect(result.mode.rightPlayerB).toBe("diana");
			}
		});

		it("trims whitespace from all player names", () => {
			const result = Effect.runSync(
				validateLineup({
					kind: "2v2",
					leftPlayerA: "  alice  ",
					leftPlayerB: "  bob  ",
					rightPlayerA: "  charlie  ",
					rightPlayerB: "  diana  ",
					winner: "right",
				}),
			);

			expect(result.mode.kind).toBe("2v2");
			if (result.mode.kind === "2v2") {
				expect(result.mode.leftPlayerA).toBe("alice");
				expect(result.mode.leftPlayerB).toBe("bob");
				expect(result.mode.rightPlayerA).toBe("charlie");
				expect(result.mode.rightPlayerB).toBe("diana");
			}
		});

		it("fails when leftPlayerA is missing", () => {
			expect(() =>
				Effect.runSync(
					validateLineup({
						kind: "2v2",
						leftPlayerA: undefined,
						leftPlayerB: "bob",
						rightPlayerA: "charlie",
						rightPlayerB: "diana",
						winner: "left",
					}),
				),
			).toThrow();
		});

		it("fails when leftPlayerB is missing", () => {
			expect(() =>
				Effect.runSync(
					validateLineup({
						kind: "2v2",
						leftPlayerA: "alice",
						leftPlayerB: undefined,
						rightPlayerA: "charlie",
						rightPlayerB: "diana",
						winner: "left",
					}),
				),
			).toThrow();
		});

		it("fails when rightPlayerA is missing", () => {
			expect(() =>
				Effect.runSync(
					validateLineup({
						kind: "2v2",
						leftPlayerA: "alice",
						leftPlayerB: "bob",
						rightPlayerA: undefined,
						rightPlayerB: "diana",
						winner: "left",
					}),
				),
			).toThrow();
		});

		it("fails when rightPlayerB is missing", () => {
			expect(() =>
				Effect.runSync(
					validateLineup({
						kind: "2v2",
						leftPlayerA: "alice",
						leftPlayerB: "bob",
						rightPlayerA: "charlie",
						rightPlayerB: undefined,
						winner: "left",
					}),
				),
			).toThrow();
		});

		it("fails when duplicate: leftPlayerA === leftPlayerB", () => {
			expect(() =>
				Effect.runSync(
					validateLineup({
						kind: "2v2",
						leftPlayerA: "alice",
						leftPlayerB: "alice",
						rightPlayerA: "charlie",
						rightPlayerB: "diana",
						winner: "left",
					}),
				),
			).toThrow();
		});

		it("fails when duplicate: leftPlayerA === rightPlayerA", () => {
			expect(() =>
				Effect.runSync(
					validateLineup({
						kind: "2v2",
						leftPlayerA: "alice",
						leftPlayerB: "bob",
						rightPlayerA: "alice",
						rightPlayerB: "diana",
						winner: "left",
					}),
				),
			).toThrow();
		});

		it("fails when duplicate: leftPlayerA === rightPlayerB", () => {
			expect(() =>
				Effect.runSync(
					validateLineup({
						kind: "2v2",
						leftPlayerA: "alice",
						leftPlayerB: "bob",
						rightPlayerA: "charlie",
						rightPlayerB: "alice",
						winner: "left",
					}),
				),
			).toThrow();
		});

		it("fails when duplicate: all same player", () => {
			expect(() =>
				Effect.runSync(
					validateLineup({
						kind: "2v2",
						leftPlayerA: "alice",
						leftPlayerB: "alice",
						rightPlayerA: "alice",
						rightPlayerB: "alice",
						winner: "left",
					}),
				),
			).toThrow();
		});

		it("fails when duplicates after trimming", () => {
			expect(() =>
				Effect.runSync(
					validateLineup({
						kind: "2v2",
						leftPlayerA: "  alice  ",
						leftPlayerB: "bob",
						rightPlayerA: "alice",
						rightPlayerB: "diana",
						winner: "left",
					}),
				),
			).toThrow();
		});

		it("fails when any player is empty string", () => {
			expect(() =>
				Effect.runSync(
					validateLineup({
						kind: "2v2",
						leftPlayerA: "alice",
						leftPlayerB: "",
						rightPlayerA: "charlie",
						rightPlayerB: "diana",
						winner: "left",
					}),
				),
			).toThrow();
		});
	});

	describe("error handling", () => {
		it("fails with InvalidLineup reason for 1v1 missing players", () => {
			const exit = Effect.runSyncExit(
				validateLineup({
					kind: "1v1",
					leftPlayer: undefined,
					rightPlayer: "bob",
					winner: "left",
				}),
			);

			expect(exit._tag).toBe("Failure");
			if (exit._tag === "Failure") {
				const cause = exit.cause;
				expect(cause._tag).toBe("Fail");
				if (cause._tag === "Fail") {
					const error = cause.error;
					expect(error).toBeInstanceOf(InvalidLineup);
					if (error instanceof InvalidLineup) {
						expect(error.reason).toBe("Both players are required for 1v1");
					}
				}
			}
		});

		it("fails with InvalidLineup reason for 1v1 duplicate players", () => {
			const exit = Effect.runSyncExit(
				validateLineup({
					kind: "1v1",
					leftPlayer: "alice",
					rightPlayer: "alice",
					winner: "left",
				}),
			);

			expect(exit._tag).toBe("Failure");
			if (exit._tag === "Failure") {
				const cause = exit.cause;
				expect(cause._tag).toBe("Fail");
				if (cause._tag === "Fail") {
					const error = cause.error;
					expect(error).toBeInstanceOf(InvalidLineup);
					if (error instanceof InvalidLineup) {
						expect(error.reason).toBe("Players must be distinct");
					}
				}
			}
		});

		it("fails with InvalidLineup reason for 2v2 missing players", () => {
			const exit = Effect.runSyncExit(
				validateLineup({
					kind: "2v2",
					leftPlayerA: "alice",
					leftPlayerB: undefined,
					rightPlayerA: "charlie",
					rightPlayerB: "diana",
					winner: "left",
				}),
			);

			expect(exit._tag).toBe("Failure");
			if (exit._tag === "Failure") {
				const cause = exit.cause;
				expect(cause._tag).toBe("Fail");
				if (cause._tag === "Fail") {
					const error = cause.error;
					expect(error).toBeInstanceOf(InvalidLineup);
					if (error instanceof InvalidLineup) {
						expect(error.reason).toBe("All four players are required for 2v2");
					}
				}
			}
		});

		it("fails with InvalidLineup reason for 2v2 duplicate players", () => {
			const exit = Effect.runSyncExit(
				validateLineup({
					kind: "2v2",
					leftPlayerA: "alice",
					leftPlayerB: "bob",
					rightPlayerA: "charlie",
					rightPlayerB: "bob",
					winner: "left",
				}),
			);

			expect(exit._tag).toBe("Failure");
			if (exit._tag === "Failure") {
				const cause = exit.cause;
				expect(cause._tag).toBe("Fail");
				if (cause._tag === "Fail") {
					const error = cause.error;
					expect(error).toBeInstanceOf(InvalidLineup);
					if (error instanceof InvalidLineup) {
						expect(error.reason).toBe("All four players must be distinct");
					}
				}
			}
		});
	});

	describe("winner", () => {
		it("preserves winner=left", () => {
			const result = Effect.runSync(
				validateLineup({
					kind: "1v1",
					leftPlayer: "alice",
					rightPlayer: "bob",
					winner: "left",
				}),
			);

			expect(result.winner).toBe("left");
		});

		it("preserves winner=right", () => {
			const result = Effect.runSync(
				validateLineup({
					kind: "1v1",
					leftPlayer: "alice",
					rightPlayer: "bob",
					winner: "right",
				}),
			);

			expect(result.winner).toBe("right");
		});
	});
});

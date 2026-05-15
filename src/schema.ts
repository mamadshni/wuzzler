import { sqliteTable, text } from "drizzle-orm/sqlite-core";

const gameKinds = ["1v1", "2v2"] as const;
const winners = ["left", "right"] as const;

export const players = sqliteTable("players", {
	id: text("id").primaryKey(),
	name: text("name").notNull().unique(),
});

export const games = sqliteTable("games", {
	id: text("id").primaryKey(),
	kind: text("kind", { enum: gameKinds }).notNull(),
	leftPlayer: text("left_player"),
	rightPlayer: text("right_player"),
	leftPlayerA: text("left_player_a"),
	leftPlayerB: text("left_player_b"),
	rightPlayerA: text("right_player_a"),
	rightPlayerB: text("right_player_b"),
	winner: text("winner", { enum: winners }).notNull(),
	playedAt: text("played_at").notNull(),
});

import { DatabaseSync } from "node:sqlite";
import { Context, Layer } from "effect";

export class Db extends Context.Tag("Db")<Db, DatabaseSync>() {}

export const DbLive = Layer.sync(Db, () => {
	const db = new DatabaseSync("./wuzzler.db");
	db.exec("PRAGMA journal_mode = WAL");
	db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL
    );
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      left_player TEXT,
      right_player TEXT,
      left_player_a TEXT,
      left_player_b TEXT,
      right_player_a TEXT,
      right_player_b TEXT,
      winner TEXT NOT NULL,
      played_at TEXT NOT NULL
    );
  `);
	return db;
});

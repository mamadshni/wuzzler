import Database from "better-sqlite3";
import {
	type BetterSQLite3Database,
	drizzle,
} from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { Context, Layer } from "effect";
import * as schema from "./schema";

export class Db extends Context.Tag("Db")<
	Db,
	BetterSQLite3Database<typeof schema>
>() {}

export const DbLive = Layer.sync(Db, () => {
	const sqlite = new Database("./wuzzler.db");
	sqlite.pragma("journal_mode = WAL");
	const db = drizzle(sqlite, { schema });
	migrate(db, { migrationsFolder: "./drizzle" });
	return db;
});

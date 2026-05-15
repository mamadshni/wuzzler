import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { Context, Effect, Layer, Ref } from "effect";
import type { Email } from "./domain";
import { InvalidCredentials, User, UserId } from "./domain";

const hashPassword = (password: string): string => {
	const salt = randomBytes(16).toString("hex");
	const hash = scryptSync(password, salt, 32).toString("hex");
	return `${salt}:${hash}`;
};

const verifyPassword = (password: string, stored: string): boolean => {
	const [salt, hash] = stored.split(":");
	if (!salt || !hash) return false;
	try {
		const derived = scryptSync(password, salt, 32);
		return timingSafeEqual(Buffer.from(hash, "hex"), derived);
	} catch {
		return false;
	}
};

export class Auth extends Context.Tag("Auth")<
	Auth,
	{
		readonly login: (
			email: string,
			password: string,
		) => Effect.Effect<{ token: string; user: User }, InvalidCredentials>;
		readonly verify: (token: string) => Effect.Effect<User, InvalidCredentials>;
		readonly logout: (token: string) => Effect.Effect<void>;
	}
>() {}

export const AuthMemoryLive = Layer.effect(
	Auth,
	Effect.gen(function* () {
		// Seed one dev user
		const seedUserId = UserId.make("seed-user-1");
		const seedUser = new User({
			id: seedUserId,
			email: "shmingela@gmail.com" as typeof Email.Type,
			passwordHash: hashPassword("password123"),
		});
		const users = new Map([[seedUserId, seedUser]]);
		const usersByEmail = new Map([[seedUser.email, seedUserId]]);
		const sessions = yield* Ref.make(new Map<string, UserId>()); // token → userId

		return Auth.of({
			login: (email, password) =>
				Effect.gen(function* () {
					const userId = usersByEmail.get(email);
					if (!userId) return yield* Effect.fail(new InvalidCredentials());
					const user = users.get(userId);
					if (!user) return yield* Effect.fail(new InvalidCredentials());
					const ok = yield* Effect.sync(() =>
						verifyPassword(password, user.passwordHash),
					);
					if (!ok) return yield* Effect.fail(new InvalidCredentials());
					const token = yield* Effect.sync(() =>
						randomBytes(32).toString("hex"),
					);
					yield* Ref.update(sessions, (m) => new Map(m).set(token, userId));
					return { token, user };
				}),

			verify: (token) =>
				Effect.gen(function* () {
					const map = yield* Ref.get(sessions);
					const userId = map.get(token);
					if (!userId) return yield* Effect.fail(new InvalidCredentials());
					const user = users.get(userId);
					if (!user) return yield* Effect.fail(new InvalidCredentials());
					return user;
				}),

			logout: (token) =>
				Ref.update(sessions, (m) => {
					const next = new Map(m);
					next.delete(token);
					return next;
				}),
		});
	}),
);

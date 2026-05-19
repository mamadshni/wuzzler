import { Schema } from "effect";

export const UserId = Schema.String.pipe(Schema.brand("UserId"));
export type UserId = typeof UserId.Type;

export const Email = Schema.String.pipe(
	Schema.pattern(/^[^@\s]+@[^@\s]+\.[^@\s]+$/),
);

export class User extends Schema.Class<User>("User")({
	id: UserId,
	email: Email,
	passwordHash: Schema.String,
}) {}

export const LoginInput = Schema.Struct({
	email: Schema.String,
	password: Schema.String,
});

export class InvalidCredentials extends Schema.TaggedError<InvalidCredentials>()(
		 "InvalidCredentials",
	{},
) {}

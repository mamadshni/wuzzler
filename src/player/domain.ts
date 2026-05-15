import { Schema } from "effect";

export const PlayerId = Schema.String.pipe(Schema.brand("PlayerId"));
export type PlayerId = typeof PlayerId.Type;

export const PlayerName = Schema.String.pipe(
	Schema.minLength(1),
	Schema.maxLength(40),
);

export class Player extends Schema.Class<Player>("Player")({
	id: PlayerId,
	name: PlayerName,
}) {}

export const RegisterPlayerInput = Schema.Struct({ name: PlayerName });
export const EditPlayerInput = Schema.Struct({ name: PlayerName });

export class PlayerNotFound extends Schema.TaggedError<PlayerNotFound>()(
	"PlayerNotFound",
	{ id: Schema.String },
) {}

export class DuplicatePlayerName extends Schema.TaggedError<DuplicatePlayerName>()(
	"DuplicatePlayerName",
	{ name: Schema.String },
) {}

import { join } from "node:path";
import { HttpRouter, HttpServerResponse } from "@effect/platform";
import { Effect } from "effect";
import { gameRoutes } from "./game/routes";
import { playerRoutes } from "./player/routes";
import { userRoutes } from "./user/routes";

const publicDir = join(process.cwd(), "public");

const servePublic = (subPath: string, contentType: string) =>
	HttpServerResponse.file(join(publicDir, subPath), {
		headers: { "content-type": contentType },
	});

const staticRoutes = HttpRouter.empty.pipe(
	HttpRouter.get(
		"/styles/:name",
		Effect.gen(function* () {
			const { name } = yield* HttpRouter.params;
			return yield* servePublic(`styles/${name}`, "text/css; charset=utf-8");
		}),
	),
	HttpRouter.get(
		"/components/:name",
		Effect.gen(function* () {
			const { name } = yield* HttpRouter.params;
			return yield* servePublic(
				`components/${name}`,
				"text/javascript; charset=utf-8",
			);
		}),
	),
);

export const router = HttpRouter.concatAll(
	staticRoutes,
	playerRoutes,
	gameRoutes,
	userRoutes,
);

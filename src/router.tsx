import { join } from "node:path";
import {
	HttpRouter,
	HttpServerRequest,
	HttpServerResponse,
} from "@effect/platform";
import { Effect } from "effect";
import { gameRoutes } from "./game/routes";
import { playerRoutes } from "./player/routes";
import { Card } from "./shared/blocks/card";
import { Layout } from "./shared/layout";
import { respond } from "./shared/routing";
import { userRoutes } from "./user/routes";

const publicDir = join(process.cwd(), "public");

const servePublic = (subPath: string, contentType: string) =>
	HttpServerResponse.file(join(publicDir, subPath), {
		headers: { "content-type": contentType },
	});

export const router = HttpRouter.empty.pipe(
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
	HttpRouter.get(
		"/",
		Effect.gen(function* () {
			const req = yield* HttpServerRequest.HttpServerRequest;
			const isPartial = req.headers["hx-request"] === "true";
			const card = <Card>Hello foosball</Card>;
			const page = (body: JSX.Element) => (
				<Layout title="Wuzzler">{body}</Layout>
			);
			return respond(isPartial, card, page);
		}),
	),
	HttpRouter.mountApp("/", playerRoutes),
	HttpRouter.mountApp("/", gameRoutes),
	HttpRouter.mountApp("/", userRoutes),
);

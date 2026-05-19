import "./jsx-setup";
import { createServer } from "node:http";
import { Layer } from "effect";
import { PlayersLive } from "./player/service";
import { router } from "./router";
import { createServerAdapter } from "@whatwg-node/server";
import { A } from "andale";
import { GamesLive } from "./game/service";
import { AuthMemoryLive } from "./user/service";

const createAServer = async (
	handler: (request: Request) => Promise<Response>,
) => {
	const port = 3000;
	const server = createServer(createServerAdapter(handler));

	await new Promise<void>((resolve) => server.listen(port, resolve));

	return {
		origin: `http://localhost:${port}`,
		[Symbol.dispose]() {
			server.close();
		},
	};
};

const handler = A.Router.asHandler(
	router,
	Layer.empty.pipe(
		Layer.provideMerge(PlayersLive),
		Layer.provideMerge(GamesLive),
		Layer.provideMerge(AuthMemoryLive)
	),
);

const server = createAServer(handler);

server.then((result) => {
	console.log(result.origin);
});

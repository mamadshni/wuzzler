import "./jsx-setup";
import { createServer } from "node:http";
import { HttpServer } from "@effect/platform";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Layer } from "effect";
import { GamesLive } from "./game/service";
import { PlayersLive } from "./player/service";
import { router } from "./router";
import { AuthMemoryLive } from "./user/service";

const ServerLive = NodeHttpServer.layer(createServer, { port: 3000 });

const AppLive = router.pipe(
	HttpServer.serve(),
	Layer.provide(PlayersLive),
	Layer.provide(GamesLive),
	Layer.provide(AuthMemoryLive),
	Layer.provide(ServerLive),
);

NodeRuntime.runMain(Layer.launch(AppLive));

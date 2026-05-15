import "./jsx-setup";
import { HttpServer } from "@effect/platform";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Layer } from "effect";
import { createServer } from "node:http";
import { router } from "./router";

const ServerLive = NodeHttpServer.layer(createServer, { port: 3000 });

const AppLive = router.pipe(
  HttpServer.serve(),
  Layer.provide(ServerLive),
);

NodeRuntime.runMain(Layer.launch(AppLive));

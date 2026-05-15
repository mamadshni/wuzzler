import { HttpRouter, HttpServerRequest } from "@effect/platform";
import { Effect } from "effect";
import { Layout } from "./shared/layout";
import { Card } from "./shared/blocks/card";
import { respond } from "./shared/routing";

export const router = HttpRouter.empty.pipe(
  HttpRouter.get(
    "/",
    Effect.gen(function* () {
      const req = yield* HttpServerRequest.HttpServerRequest;
      const isPartial = req.headers["hx-request"] === "true";
      const card = <Card>Hello foosball</Card>;
      const page = (body: JSX.Element) => <Layout title="Wuzzler">{body}</Layout>;
      return respond(isPartial, card, page);
    }),
  ),
);

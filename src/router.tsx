import { join, resolve } from "node:path";
import { playerRoutes } from "./player/routes";
import { A } from "andale";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { gameRoutes } from "./game/routes";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const publicDir = resolve(__dirname, "../public");

const servePublic = (subPath: string, contentType: string) => {
	try {
		const content = readFileSync(join(publicDir, subPath), "utf-8");
		return A.Response.success(content, {
			headers: { "content-type": contentType },
		});
	} catch {
		return A.Response.notFound("Not Found");
	}
};

const staticRoutes = A.Router.from(
	A.path("/components/:name").pipe(
		A.verb("GET"),
		A.respond(function* ({ path: { name } }) {
			return servePublic(
				`components/${name}`,
				"application/javascript; charset=utf-8",
			);
		}),
	),

	A.path("/styles/:name").pipe(
		A.verb("GET"),
		A.respond(function* ({ path: { name } }) {
			return servePublic(`styles/${name}`, "text/css; charset=utf-8");
		}),
	),
);

export const router = A.Router.from(
	...staticRoutes.routes,
	...playerRoutes.routes,
	...gameRoutes.routes,
	// ...userRoutes.routes,
);

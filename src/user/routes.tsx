import {
	HttpRouter,
	HttpServerRequest,
	HttpServerResponse,
} from "@effect/platform";
import { Effect } from "effect";
import { Layout } from "../shared/layout";
import { html } from "../shared/render";
import { LoginInput } from "./domain";
import { Auth } from "./service";
import { LoginForm } from "./views/login";

const parseCookie = (
	cookieHeader: string | undefined,
	name: string,
): string | undefined => {
	if (!cookieHeader) return undefined;
	const match = cookieHeader
		.split(";")
		.map((s) => s.trim())
		.find((s) => s.startsWith(`${name}=`));
	return match?.slice(name.length + 1);
};

const isHtmx = (req: HttpServerRequest.HttpServerRequest) =>
	req.headers["hx-request"] === "true";

export const userRoutes = HttpRouter.empty.pipe(
	// GET /login - login form
	HttpRouter.get(
		"/login",
		html(
			<Layout title="Log in" active="login">
				<LoginForm />
			</Layout>,
		),
	),

	// POST /sessions - create session
	HttpRouter.post(
		"/sessions",
		Effect.gen(function* () {
			const req = yield* HttpServerRequest.HttpServerRequest;
			const body = yield* HttpServerRequest.schemaBodyUrlParams(LoginInput);
			const auth = yield* Auth;
			const { token } = yield* auth.login(body.email, body.password);
			const cookie = `session=${token}; HttpOnly; SameSite=Lax; Path=/`;

			if (isHtmx(req)) {
				return HttpServerResponse.empty({ status: 200 }).pipe(
					HttpServerResponse.setHeader("Set-Cookie", cookie),
					HttpServerResponse.setHeader("HX-Redirect", "/players"),
				);
			}
			return HttpServerResponse.empty({ status: 303 }).pipe(
				HttpServerResponse.setHeader("Set-Cookie", cookie),
				HttpServerResponse.setHeader("Location", "/players"),
			);
		}).pipe(
			Effect.catchTag("InvalidCredentials", () =>
				html(
					<Layout title="Log in" active="login">
						<LoginForm error="Invalid email or password" />
					</Layout>,
				).pipe(HttpServerResponse.setStatus(401)),
			),
			Effect.catchTag("ParseError", () =>
				html(
					<Layout title="Log in" active="login">
						<LoginForm error="Please fill in all fields" />
					</Layout>,
				).pipe(HttpServerResponse.setStatus(422)),
			),
		),
	),

	// DELETE /sessions/current - logout
	HttpRouter.del(
		"/sessions/current",
		Effect.gen(function* () {
			const req = yield* HttpServerRequest.HttpServerRequest;
			const token = parseCookie(req.headers.cookie, "session");
			if (token) {
				const auth = yield* Auth;
				yield* auth.logout(token);
			}
			const clearCookie = "session=; Path=/; Max-Age=0";

			if (isHtmx(req)) {
				return HttpServerResponse.empty({ status: 200 }).pipe(
					HttpServerResponse.setHeader("Set-Cookie", clearCookie),
					HttpServerResponse.setHeader("HX-Redirect", "/login"),
				);
			}
			return HttpServerResponse.empty({ status: 303 }).pipe(
				HttpServerResponse.setHeader("Set-Cookie", clearCookie),
				HttpServerResponse.setHeader("Location", "/login"),
			);
		}),
	),
);

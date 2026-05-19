import { Effect, pipe } from "effect";
import { Layout } from "../shared/layout";
import { html } from "../shared/render";
import { LoginInput } from "./domain";
import { Auth } from "./service";
import { LoginForm } from "./views/login";
import { A } from "andale";
import { isPartial } from "../shared/routing";

export const userRoutes = A.Router.from(
	A.path("/login").pipe(
		A.verb("GET"),
		A.respond(function* () {
			return html(
				<Layout title="Log in" active="login">
					<LoginForm />
				</Layout>,
			);
		}),
	),

	A.path("/sessions").pipe(
		A.verb("POST"),
		A.body(LoginInput),
		A.respond(function* ({ body }) {
			const auth = yield* Auth;
			const { token } = yield* auth.login(body.email, body.password).pipe(
				Effect.catchTag("InvalidCredentials", () =>
					Effect.fail(
						A.Response.asHtml(
							A.Response.of(
								<Layout title="Log in" active="login">
									<LoginForm error="Invalid email or password" />
								</Layout>,
								{ status: 401 },
							),
						),
					),
				),
			);

			const cookie = `session=${token}; HttpOnly; SameSite=Lax; Path=/`;
			const isHx = yield* isPartial;

			if (isHx) {
				return A.Response.success(
					{},
					{ headers: { "Set-Cookie": cookie, "HX-Redirect": "/players" } },
				);
			}
			return A.Response.of(
				{},
				{
					headers: { "Set-Cookie": cookie, "HX-Redirect": "/players" },
					status: 303,
				},
			);
		}),
	),

	A.path("/sessions/current").pipe(
		A.verb("DELETE"),
		A.respond(function* () {
			const token = yield* pipe(
				A.Request.cookie("session"),
				Effect.catchTag("NoSuchElementException", () =>
					Effect.fail(A.Response.notFound("Invalid session")),
				),
				Effect.catchTag("ParseError", () =>
					Effect.fail(A.Response.badRequest("Invalid session format")),
				),
			);
			// const cookie = A.Cookie.get("session");// TODO which one is correct? - Katja

			if (token) {
				const auth = yield* Auth;
				yield* auth.logout(token);
			}

			const clearCookie = "session=; Path=/; Max-Age=0";

			const isHx = yield* isPartial;

			if (isHx) {
				return A.Response.success(
					{},
					{ headers: { "Set-Cookie": clearCookie, "HX-Redirect": "/login" } },
				);
			}
			return A.Response.of(
				{},
				{
					status: 303,
					headers: { "Set-Cookie": clearCookie, Location: "/login" },
				},
			);
		}),
	),
);

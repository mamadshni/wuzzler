import { Effect, pipe } from "effect";
import { renderPage } from "../shared/page";
import { LoginInput } from "./domain";
import { Auth } from "./service";
import { AdminPage } from "./views/admin";
import { LoginForm } from "./views/login";
import { A } from "andale";
import { isPartial } from "../shared/routing";

const renderAdminOrLogin = Effect.gen(function* () {
	const token = yield* pipe(
		A.Request.cookie("session"),
		Effect.catchTag("NoSuchElementException", () => Effect.succeed(undefined)),
		Effect.catchTag("ParseError", () => Effect.succeed(undefined)),
	);

	if (!token) {
		return yield* renderPage("Log in", <LoginForm />);
	}

	const auth = yield* Auth;
	const user = yield* auth.verify(token).pipe(
		Effect.catchTag("InvalidCredentials", () => Effect.succeed(undefined)),
	);

	if (!user) {
		return yield* renderPage("Log in", <LoginForm />);
	}

	return yield* renderPage("Admin", <AdminPage email={user.email} />);
});

export const userRoutes = A.Router.from(
	A.path("/admin").pipe(
		A.verb("GET"),
		A.respond(function* () {
			const content = yield* renderAdminOrLogin;
			return A.Response.asHtml(A.Response.of(content));
		}),
	),

	A.path("/sessions").pipe(
		A.verb("POST"),
		A.body(LoginInput),
		A.respond(function* ({ body }) {
			const auth = yield* Auth;
			const { token } = yield* auth.login(body.email, body.password).pipe(
				Effect.catchTag("InvalidCredentials", () =>
					Effect.gen(function* () {
						const content = yield* renderPage(
							"Log in",
							<LoginForm error="Invalid email or password" />,
						);
						return yield* Effect.fail(
							A.Response.asHtml(A.Response.of(content, { status: 401 })),
						);
					}),
				),
			);

			const cookie = `session=${token}; HttpOnly; SameSite=Lax; Path=/`;
			const isHx = yield* isPartial;

			if (isHx) {
				return A.Response.success(
					{},
					{ headers: { "Set-Cookie": cookie, "HX-Redirect": "/admin" } },
				);
			}
			return A.Response.of(
				{},
				{
					headers: { "Set-Cookie": cookie, "HX-Redirect": "/admin" },
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

			if (token) {
				const auth = yield* Auth;
				yield* auth.logout(token);
			}

			const clearCookie = "session=; Path=/; Max-Age=0";

			const isHx = yield* isPartial;

			if (isHx) {
				return A.Response.success(
					{},
					{ headers: { "Set-Cookie": clearCookie, "HX-Redirect": "/admin" } },
				);
			}
			return A.Response.of(
				{},
				{
					status: 303,
					headers: { "Set-Cookie": clearCookie, Location: "/admin" },
				},
			);
		}),
	),
);

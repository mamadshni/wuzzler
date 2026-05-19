import { A } from "andale";
import { Effect } from "effect";
import { toHtml } from "tsx-to-html";
import { Auth } from "../user/service";
import { Layout } from "./layout";
import { isPartial } from "./routing";

const pathnameEffect = A.Request.url.pipe(
	Effect.map((url) => url.pathname),
	Effect.catchTag("ParseError", () => Effect.succeed("/")),
);

const isAuthedEffect = Effect.gen(function* () {
	const token = yield* A.Request.cookie("session").pipe(
		Effect.catchTag("NoSuchElementException", () => Effect.succeed(undefined)),
		Effect.catchTag("ParseError", () => Effect.succeed(undefined)),
	);
	if (!token) return false;
	const auth = yield* Auth;
	return yield* auth.verify(token).pipe(
		Effect.match({ onFailure: () => false, onSuccess: () => true }),
	);
});

export const renderPage = (title: string, body: JSX.Element) =>
	Effect.gen(function* () {
		const isHx = yield* isPartial;
		if (isHx) return toHtml(body);
		const pathname = yield* pathnameEffect;
		const isAuthed = yield* isAuthedEffect;
		return `<!doctype html>${toHtml(
			<Layout title={title} pathname={pathname} isAuthed={isAuthed}>
				{body}
			</Layout>,
		)}`;
	});

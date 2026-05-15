# CLAUDE.md

Working notes for Claude Code in this repository. Read `AGENTS.md` first — it has the rules. This file is the *how*.

## Before you touch anything

1. Read `structure.md` to know where files live and which REST URLs map to which feature.
2. Read `AGENTS.md` for the rules. They are not negotiable.
3. Skim the existing block in the relevant feature's `views/` folder closest to what you're building. Match its shape.

## Commands

```bash
pnpm install
pnpm dev             # tsx watch src/main.tsx, serves on :3000
pnpm build:wc        # esbuild public/components/x-combobox.ts --bundle --format=esm --outfile=public/components/x-combobox.js
pnpm test            # vitest
pnpm typecheck       # tsc --noEmit
pnpm lint            # biome check .
```

There is no database yet (see `structure.md` > Storage). Don't add migration commands until SQL is wired up.

Always run `pnpm typecheck` and `pnpm test` before saying you're done.

## JSX setup (one time, already done)

`tsconfig.json` has:

```jsonc
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "tsx-to-html",
    "types": ["htmx-tsx", "node"]
  }
}
```

`src/jsx-setup.ts` is a single line:

```ts
import "htmx-tsx"; // registers HTMX attribute transformers
```

`src/main.tsx` imports it first thing:

```ts
import "./jsx-setup";
```

If `hx-*` attributes aren't autocompleting, that import is missing.

## The render helper

```ts
// src/shared/render.ts
import { toHtml } from "tsx-to-html";
import { HttpServerResponse } from "@effect/platform";

export const html = (node: JSX.Element) =>
  HttpServerResponse.html("<!doctype html>" + toHtml(node));

export const fragment = (node: JSX.Element) =>
  HttpServerResponse.html(toHtml(node));
```

`html()` for full pages (adds doctype), `fragment()` for HTMX swaps. The partial-vs-full decision lives in `shared/routing.ts` and looks roughly like:

```ts
// src/shared/routing.ts
export const respond = (
  isPartial: boolean,
  body: JSX.Element,
  page: (body: JSX.Element) => JSX.Element,
) => (isPartial ? fragment(body) : html(page(body)));
```

## Adding a feature: the routine

**You are usually adding to an existing aggregate.** Pick the right folder (`player/`, `game/`, `user/`) and add the five things below inside it. Don't sprawl across folders.

1. **Domain** — add to that feature's `domain.ts`. Define the `Schema` and any pure validation. Tests here are cheapest.
2. **Service** — add the method to that feature's `service.ts`. Implement inside the `MemoryLive` layer against the `Ref<Map<…, …>>`. When SQL arrives later, only the layer changes — your Tag and routes don't.
3. **View** — add or update a TSX block in that feature's `views/`. Pure function, takes data + JSX slot props, returns `JSX.Element`.
4. **Route** — wire it up in that feature's `routes.tsx`. RESTful URL and verb (see `structure.md > REST routes`). Decode input → call service → render block. Handle `HX-Request` via `shared/routing.ts`.
5. **Style** — add the rule to `base.css` if it's element/attribute-level. Only touch `variants.css` if you genuinely need a class.

Test points: domain has unit tests, routes have one happy-path + one validation-failure integration test.

## Adding a *new* feature (new aggregate)

Only when the new thing is genuinely its own resource (e.g. "Tournament", "Season"). Don't create a feature folder for a UI concept or a query.

1. Create `src/<name>/` with `routes.tsx`, `domain.ts`, `service.ts`, `views/`.
2. Define the REST endpoints in `structure.md > REST routes` **before** writing them. The doc update is part of the change.
3. Mount the routes in `src/router.ts` at the base path.
4. Add a `MemoryLive` layer; provide it in `main.tsx`.
5. Update the sidebar in `shared/blocks/sidebar.tsx` if it needs a nav entry.

## REST routing in practice

Every endpoint lives in exactly one feature's `routes.tsx`. Use Effect's HTTP router patterns:

```tsx
// src/game/routes.tsx
import { HttpRouter, HttpServerRequest } from "@effect/platform";
import { Effect } from "effect";
import { Games } from "./service";
import { Scoreboard } from "./views/list";
import { RegisterGame } from "./views/register";
import { respond } from "../shared/routing";
import { Layout } from "../shared/layout";

export const gameRoutes = HttpRouter.empty.pipe(
  HttpRouter.get("/games", Effect.gen(function* () {
    const req = yield* HttpServerRequest.HttpServerRequest;
    const games = yield* Games.list();
    const isPartial = req.headers["hx-request"] === "true";
    return respond(isPartial, <Scoreboard games={games} />, (body) => (
      <Layout title="Scoreboard">{body}</Layout>
    ));
  })),
  HttpRouter.get("/games/new", /* … */),
  HttpRouter.post("/games", /* … */),
);
```

`src/router.ts` composes each feature's router:

```ts
import { HttpRouter } from "@effect/platform";
import { playerRoutes } from "./player/routes";
import { gameRoutes } from "./game/routes";
import { userRoutes } from "./user/routes";

export const router = HttpRouter.concatAll(
  staticRoutes,
  playerRoutes,
  gameRoutes,
  userRoutes,
);
```

Each feature's router declares its own absolute paths (`/players`, `/games`). Use `HttpRouter.concatAll` to merge them — **do not use `mountApp("/", ...)` for multiple routers at the same prefix**, as it does not fall through on 404 and will make all but the first router unreachable.

## Cross-feature calls

A game route needs the list of players to seed a combobox. Allowed: import the `Players` Tag.

```tsx
// src/game/routes.tsx
import { Players } from "../player/service";  // ✅ Tag only
import { Games } from "./service";

HttpRouter.get("/games/new", Effect.gen(function* () {
  const players = yield* Players.list();
  return fragment(<RegisterGame players={players} />);
}));
```

Forbidden: import a view or domain type from another feature.

```tsx
// ❌ DON'T
import { PlayerRow } from "../player/views/list"; // never cross views
import { Player } from "../player/domain";        // never cross domain
```

If you need a player's name in a game view, the view accepts a string or an object you defined in `game/domain.ts`. The service call shapes it for you at the route layer.

## Adding a Web Component

Only do this if `AGENTS.md` says you should. Then:

1. One file in `public/components/`, named `x-<thing>.ts`.
2. Light DOM with `<slot>`s unless style isolation is required.
3. Form-associated if it holds a value.
4. No dependencies. Vanilla. Keep it under 150 lines.
5. Document the tag's attributes and events in a comment at the top.
6. Build with `pnpm build:wc`. The bundled JS lands next to the source.

The only Web Component planned right now is `x-combobox`. If you find yourself writing a second one, stop and ask whether HTMX can do the job.

## Escaping

`tsx-to-html` escapes every interpolated string by default. You can't accidentally inject HTML by doing `<p>{user.name}</p>`. If you need to inject pre-rendered HTML from a child component, just nest the component — its return value is already a JSX element and won't be re-escaped. There is no `dangerouslySetInnerHTML` and you don't need one.

## CSS: the three-question test

Before adding any selector, ask:

1. Can I style the **element** itself? (`button { … }`) → do that.
2. Can I use an **attribute or ARIA state**? (`button[disabled]`, `[aria-current]`) → do that.
3. Is this a real **variant** used in multiple places? → class in `variants.css`.

If you're tempted to add a class for "the button on the scoreboard page", you're styling layout. Style the **container** instead, or fix the markup so the element is semantic enough.

## Common pitfalls

- **Importing across feature folders' `views/` or `domain.ts`.** Use HTMX swaps and service Tags. See `AGENTS.md > Feature boundaries`.
- **Inventing non-REST URLs** like `POST /players/create` or `GET /players/list`. Use `POST /players`, `GET /players`. See `structure.md > REST routes`.
- **Returning JSON from a route.** Routes return HTML fragments. There is no JSON API.
- **Adding wrapper `<div>`s to give a block a margin.** Don't. The parent decides margins. The block doesn't touch its outer box.
- **Putting a feature-specific block in `shared/blocks/`.** Shared means used by ≥2 features. One feature ≠ shared.
- **Using `fetch()` in browser code.** Use HTMX attributes. The combobox is the only browser code that does I/O, and even it uses HTMX to seed options.
- **Reaching for Tailwind / React / a UI kit.** No. See `AGENTS.md`.
- **Using `class={{foo: true}}` from `tsx-to-html`.** We're classless. Stop.
- **Storing the winner of a game.** Wait — winner IS now stored directly as `"left" | "right"` on `Game`. Do not add goal counts back.
- **Checking `HX-Request` directly to detect partial requests.** Use `isPartialRequest(req)` from `shared/routing.ts`. A raw `HX-Request` check is true for both boosted navigation AND fragment swaps, causing the sidebar to vanish on link clicks.
- **Forgetting `import "./jsx-setup"` in a new entrypoint.** `hx-*` attrs will look like errors.

## When you finish a change

- `pnpm typecheck` — clean.
- `pnpm test` — clean.
- Did you do anything the docs don't already describe? Update the right file in the same commit (see *Keeping the docs alive* below).
- Did you add a new endpoint? Make sure it's in `structure.md > REST routes`.
- Did you add a class? Justify it in the commit message or remove it.
- Did you add a Web Component? Justify it in the commit message or remove it.
- Did you import across feature folders? Only Tags. Anything else is a bug.
- Did you increase total LOC by more than the feature is worth? Re-read and cut.

## Keeping the docs alive

The three docs are the source of truth. If they drift from reality, every future change drifts with them. Update them as you go — in the same commit as the code change, not "later".

| Triggered when…                                        | Update                            |
|--------------------------------------------------------|-----------------------------------|
| You add or remove a runtime/dev dependency             | `structure.md` > Stack            |
| You add a folder, file naming rule, or routing pattern | `structure.md`                    |
| You add a new RESTful endpoint                         | `structure.md` > REST routes      |
| You add a new feature folder                           | `structure.md` (folder tree)      |
| You change the tsconfig in a way other code must know  | `structure.md` and `CLAUDE.md`    |
| You discover a new convention worth following          | `AGENTS.md`                       |
| You hit a pitfall worth warning about                  | `CLAUDE.md` > Common pitfalls     |
| You add a new pnpm script                              | `CLAUDE.md` > Commands            |
| A documented rule turned out to be wrong               | **Stop. Ask the human.** Then fix. |
| A rule was violated for a good reason                  | Update the rule, or document the exception. Don't leave both in conflict. |

Adding new content: do it, no permission needed.
Changing or removing an existing rule: ask first. The docs are the contract.

If you make a code change and can't decide whether it warrants a doc update, the answer is yes.

## Things I will ask you about in review

- Why does this block live in `shared/` instead of the feature?
- Why does this feature import another feature's view?
- Why is this URL not RESTful?
- Why does the route know about the storage layer?
- Why is this `<div>` not a `<section>` / `<article>` / `<nav>`?
- Why is this margin on the child instead of the parent's gap/padding?
- Why is this a new component instead of a slot in an existing one?
- Can this function be shorter?

If you have a good answer for each, you're done. If not, fix it before committing.

# Project Structure

Foosball tracker. Server-rendered HTML via **Effect** (effect.website) + **TSX**. Browser interactivity via **HTMX** for navigation/swaps and a tiny set of **Web Components** for things HTMX can't do (autocomplete combobox).

The codebase is organized by **feature (DDD-style)**. Each top-level folder under `src/` is either `shared/` or a single aggregate (`player/`, `game/`, `user/`), and each aggregate owns its routes, domain, service, and views. Routes are **RESTful**.

## Stack

- **Effect** — HTTP server, routing, services, schema, errors.
- **tsx-to-html** — JSX runtime that emits HTML strings server-side. Auto-escapes.
- **htmx-tsx** — type-safe `hx-*` attributes inside TSX (peer-dep of `tsx-to-html`).
- **HTMX** — partial HTML over the wire, no SPA build.
- **Web Components** — only where the browser needs local state (combobox).
- **CSS** — classless first. Element + attribute selectors. Tokens via custom properties.
- **Node + pnpm** — runtime and package manager. `tsx` runs TS/TSX directly; `esbuild` bundles the Web Components.

No React. No Tailwind. No `` html`` `` tagged templates.

## Folders

```
.
├── src/
│   ├── main.tsx                       # Boots the Effect HTTP app
│   ├── jsx-setup.ts                   # `import "htmx-tsx"` — registers HTMX transformers
│   ├── router.ts                      # Mounts each feature's routes at its base path
│   │
│   ├── shared/                        # Cross-feature primitives. Imported by everyone.
│   │   ├── render.ts                  # toHtml + html()/fragment() response helpers
│   │   ├── routing.ts                 # HX-Request detection, partial-vs-full helper
│   │   ├── layout.tsx                 # Page facade: <html>, <head>, sidebar slot, main slot
│   │   └── blocks/                    # Generic building blocks
│   │       ├── sidebar.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── form.tsx               # Input, Textarea, Select, Fieldset, Label
│   │       ├── button.tsx             # Button, SubmitButton
│   │       └── pagination.tsx
│   │
│   ├── player/                        # Foosball player aggregate
│   │   ├── routes.tsx                 # All endpoints under /players
│   │   ├── domain.ts                  # Player Schema + validation
│   │   ├── service.ts                 # Players tag + MemoryLive (Ref-backed)
│   │   └── views/
│   │       ├── profile.tsx            # Player profile block
│   │       ├── register.tsx           # Create-player form
│   │       ├── edit.tsx               # Edit-player form
│   │       ├── list.tsx               # List rows (used by /players and the scoreboard)
│   │       └── search-result.tsx      # <li>s for combobox seeding
│   │
│   ├── game/                          # Game aggregate (1v1 + 2v2)
│   │   ├── routes.tsx                 # All endpoints under /games
│   │   ├── domain.ts                  # 1v1/2v2 union, score validation, winner derivation
│   │   ├── service.ts                 # Games tag + MemoryLive
│   │   └── views/
│   │       ├── register.tsx           # Register-game form (with combobox)
│   │       ├── list.tsx               # Scoreboard table body
│   │       └── row.tsx                # Single game row
│   │
│   └── user/                          # AUTH users — not foosball players
│       ├── routes.tsx                 # GET /login, POST/DELETE /sessions
│       ├── domain.ts                  # User Schema + auth rules
│       ├── service.ts                 # Auth tag + MemoryLive
│       └── views/
│           └── login.tsx
│
├── public/
│   ├── styles/
│   │   ├── tokens.css                 # CSS custom properties only
│   │   ├── base.css                   # Classless rules
│   │   └── variants.css               # The rare class
│   ├── components/
│   │   └── x-combobox.ts              # Autocomplete web component
│   └── vendor/
│       └── htmx.min.js
│
├── tsconfig.json
├── package.json
├── biome.json
├── AGENTS.md
├── CLAUDE.md
└── structure.md
```

> **`user/` vs `player/`** — easy to confuse. `user/` is **authentication** (the human logging in to record games). `player/` is the **foosball player** appearing on the scoreboard. A user is not a player, a player is not a user. Keep them apart.

## tsconfig (the parts that matter)

```jsonc
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "tsx-to-html",
    "types": ["htmx-tsx", "node"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "target": "esnext"
  }
}
```

## Cross-feature dependencies

| Direction                                       | Allowed? |
|-------------------------------------------------|----------|
| `feature/*` → `shared/*`                        | ✅ always |
| `feature-a/routes.tsx` → `feature-b/service.ts` (Tag) | ✅ — call other features' services from your routes |
| `feature-a/*` → `feature-b/views/*`             | ❌ never — compose across features via HTMX, not imports |
| `feature-a/*` → `feature-b/domain.ts`           | ❌ never — features own their domain |
| `feature-a/service.ts` → `feature-b/service.ts` (Tag) | ⚠️ avoid — push the composition up into the route if possible |

If two features need to share *types*, that's a sign the type belongs in `shared/`.

If two views need to look the same, the *block* belongs in `shared/blocks/`.

## REST routes

Each feature's `routes.tsx` mounts the endpoints listed below at the feature's base path.

### Players — `/players`

| Method  | URL                          | Returns                                          |
|---------|------------------------------|--------------------------------------------------|
| GET     | `/players`                   | List view; supports `?q=` for filter, `?page=`   |
| GET     | `/players/new`               | Create form (HTMX dialog)                        |
| POST    | `/players`                   | Create; redirects/swaps to refreshed list        |
| GET     | `/players/:id`               | Profile (name, win rate, games played)           |
| GET     | `/players/:id/edit`          | Edit form                                        |
| PATCH   | `/players/:id`               | Update                                           |
| DELETE  | `/players/:id`               | Remove                                           |
| GET     | `/players/:id/games`         | Games for this player (HTMX fragment on profile) |
| GET     | `/players/search?q=`         | `<li>`s for combobox seeding                     |

### Games — `/games`

| Method | URL              | Returns                                       |
|--------|------------------|-----------------------------------------------|
| GET    | `/games`         | Scoreboard / game list, paginated             |
| GET    | `/games/new`     | Register-game form (1v1 / 2v2 toggle)         |
| POST   | `/games`         | Record a game; swaps in refreshed scoreboard  |
| GET    | `/games/:id`     | Single game detail (optional)                 |

### Sessions — authentication

| Method | URL                  | Returns                                       |
|--------|----------------------|-----------------------------------------------|
| GET    | `/login`             | Login page                                    |
| POST   | `/sessions`          | Create session (log in)                       |
| DELETE | `/sessions/current`  | End session (log out)                         |

### Conventions

- `GET /resource/new` and `GET /resource/:id/edit` are HTMX-friendly form endpoints. They render a form block (often inside a `<dialog>`) and can be opened with `hx-get`.
- `POST /resource` returns the **refreshed list fragment** when called via HTMX so the page updates in place. On full request (no `HX-Request`), it `303`s to the canonical resource URL.
- `PATCH` and `DELETE` work directly via `hx-patch` and `hx-delete`. Plain HTML fallback uses `<form method="post">` with a hidden `_method` field; the router unwraps it.
- Validation errors re-render the form with `aria-invalid` on the offending fields. HTTP `422 Unprocessable Entity`.
- Not-found: HTTP `404`. Forbidden: `403`. Unauthorized (not logged in): `401`.

## Naming

- Feature folders: **singular** (`player/`, `game/`, `user/`). URLs are plural (`/players`, `/games`).
- TSX block files: kebab-case filename (`register.tsx`); component export PascalCase (`Register`).
- Web Components: `x-` prefix, kebab-case filename matches tag (`x-combobox.ts` → `<x-combobox>`).
- Effect service tags: PascalCase, plural for collections (`Players`, `Games`, `Auth`).

## What goes where

| Need                                          | Lives in                                                |
|-----------------------------------------------|---------------------------------------------------------|
| New endpoint for an existing feature          | that feature's `routes.tsx`                             |
| New view block for an existing feature        | that feature's `views/`                                 |
| New aggregate (new resource)                  | new top-level folder with `routes.tsx`, `domain.ts`, `service.ts`, `views/` |
| Block reused by ≥2 features                   | `shared/blocks/`                                        |
| Page shell (header, sidebar, main)            | `shared/layout.tsx`                                     |
| Render helper, route helper                   | `shared/render.ts`, `shared/routing.ts`                 |
| Domain rules / validation                     | that feature's `domain.ts`                              |
| State, persistence                            | that feature's `service.ts`                             |
| Browser-side interactivity                    | `public/components/` (only if HTMX can't)               |
| Global look & feel                            | `public/styles/base.css`                                |
| Variant class (e.g. `.danger`)                | `public/styles/variants.css`                            |

## CSS layers

```css
@layer tokens, base, variants;
```

- `tokens` — only custom properties.
- `base` — element + attribute selectors. No classes.
- `variants` — the rare class is allowed (`.danger`, `.compact`). Keep this file short.

## Storage

No database yet. Each service holds state in a `Ref<Map<…, …>>` inside a `MemoryLive` layer. The service **tag** is what routes import — the layer is implementation detail.

```
Players (Tag)              ← what routes import
  └─ MemoryLive   (now)    ← Ref-backed
  └─ SqlLive      (later)  ← swap here when DB is added; nothing else changes
```

When SQL arrives: add a `SqlLive` layer in the same `service.ts`, swap which layer `main.tsx` provides, done. Routes, blocks, and domain code stay untouched. If you find yourself changing a route to add the DB, the service tag was leaky.

## Build / run

`tsx` runs the server with native TS + JSX support — no precompile step. `esbuild` bundles the Web Components. See `CLAUDE.md` for the actual commands.

## Keeping this file alive

If you add a folder, change a file naming convention, swap a dependency, change the routing convention, add a new RESTful endpoint, or modify the tsconfig in a way other code must know about, update this file **in the same commit**. The full rule lives in `CLAUDE.md > Keeping the docs alive`.

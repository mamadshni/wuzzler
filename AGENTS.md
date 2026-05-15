# AGENTS.md

Read this before writing a single line of code in this repo. These rules are not suggestions.

## What this app is

A tisch-foosball tracker. Users log in (auth users, not players). They register **players**, record **games** (1v1 or 2v2 with goal counts), and view a **scoreboard** and individual **player profiles** with win rate, games played, etc. Players can be searched.

The codebase is organized **by feature (DDD-style)**: `player/`, `game/`, `user/`, plus a `shared/` folder. Each feature owns its `routes.tsx`, `domain.ts`, `service.ts`, and `views/`. Routes are **RESTful**. See `structure.md` for the full layout and route table.

## Prime directives

1. **Less code wins.** If you can delete code to add a feature, do it. If you are typing the same thing twice, stop and extract.
2. **Server-rendered HTML over HTMX is the default.** Reach for a Web Component only when the browser genuinely needs local state with no round-trip (autocomplete is the canonical example).
3. **Classless CSS first.** Style elements by their tag, role, state, and attributes. Add a class only when no semantic or attribute selector can express the rule.
4. **Components are selfish.** A block does not impose its own outer margin, width, or position. The parent decides where the block sits; the block only decides what it looks like internally. (Heydon Pickering, "The Selfish Component".)
5. **Mobile first.** Default styles are for the narrow viewport. Use `@media (min-width: …)` to add desktop affordances, never the reverse.
6. **Keep these docs honest.** If you do something `AGENTS.md` / `CLAUDE.md` / `structure.md` doesn't cover — a new pattern, a new dependency, a new convention, a justified deviation from a rule — update the relevant file **in the same commit**. *Adding* documentation: just do it. *Changing or removing* an existing rule: stop and ask the human first, because the docs are the contract. Stale docs are worse than no docs. See `CLAUDE.md > Keeping the docs alive` for the trigger table.

## Feature boundaries

Each top-level folder under `src/` (besides `shared/`) is one aggregate: `player`, `game`, `user`. The folder is a vertical slice — routes, domain, service, and views all live together.

**Allowed dependencies:**

- Any feature → `shared/*`: always.
- `feature-a/routes.tsx` → `feature-b/service.ts` (the **Tag**, not the layer): allowed. This is how a game route seeds a player picker, or a player profile route fetches game stats.
- `feature-a/*` → `feature-b/views/*`: **never.** Cross-feature view composition happens at runtime via HTMX swaps (one route fetches a fragment from another). Not at import time.
- `feature-a/*` → `feature-b/domain.ts`: **never.** Each feature owns its types. If two features need a shared type, the type belongs in `shared/`.
- `feature-a/service.ts` → `feature-b/service.ts`: avoid. Push the composition up to the route that calls both.

A block that two features both render is not "shared by accident" — it's a `shared/blocks/` block. Move it the moment the second feature wants it.

## REST is the contract

Routes follow REST. Every aggregate has a base URL (`/players`, `/games`, `/sessions`) and the standard verbs do the standard things. See `structure.md > REST routes` for the full table.

- Use `GET /resource/new` and `GET /resource/:id/edit` for forms. They return HTML, not JSON.
- Use `PATCH` for partial updates, `PUT` only if you genuinely replace the entire resource (rare here).
- Use `DELETE` directly via `hx-delete`. Don't invent a `POST /resource/:id/delete` endpoint.
- A POST that creates returns the **refreshed list fragment** when called with `HX-Request`; otherwise `303` to the canonical URL.
- Validation errors: `422` with the form re-rendered. Not-found: `404`. Unauthorized: `401`. Forbidden: `403`.

## Rendering: TSX, not template literals

Views are TSX components. The runtime is `tsx-to-html`, which emits HTML strings on the server. HTMX attribute types come from `htmx-tsx`. Nothing renders in the browser — there is no React, no hydration, no `useState`.

```tsx
// src/shared/blocks/card.tsx
type Props = {
  header?: JSX.Element;
  actions?: JSX.Element;
  children: JSX.Element | JSX.Element[];
};

export const Card = ({ header, actions, children }: Props) => (
  <article>
    {header && <header>{header}</header>}
    <div>{children}</div>
    {actions && <footer>{actions}</footer>}
  </article>
);
```

Usage:

```tsx
<Card header={<h2>Latest game</h2>} actions={<SubmitButton>Save</SubmitButton>}>
  <p>Alice 10 — 6 Bob</p>
</Card>
```

Note: **no `class` on `<article>`**. The classless stylesheet styles `article` directly. The caller fills `header`, `actions`, and `children` — the block does not dictate their shape. That's the selfish-component pattern.

## Slots

In TSX there is no `<slot>` element. We achieve the same thing with:

- `children` — the default slot.
- Named JSX props — `header`, `actions`, `aside`, etc. Each accepts `JSX.Element` or `JSX.Element[]`.

A block that wants three named slots takes three props. A block that wants one slot takes `children`. That's it.

## When to use HTMX vs a Web Component

Use **HTMX (a route + a TSX block)** when:
- The interaction is "fetch and swap" (open a dialog, show a list, submit a form, paginate).
- The state lives on the server (games, players, scores).
- Examples here: register-user dialog, register-game form, scoreboard table, player profile, pagination, login.

Use a **Web Component** when:
- The interaction is local and high-frequency (typing in an input filters options in real time).
- A round-trip per keystroke would feel wrong.
- Example here: `<x-combobox>` for player autocomplete. The options can still be seeded by HTMX; filtering and keyboard navigation are local.

If you cannot clearly justify a Web Component under those rules, write it as an HTMX block instead.

## Required blocks (mapped to their home)

| Block                          | Lives in                          |
|--------------------------------|-----------------------------------|
| `Layout` (facade)              | `shared/layout.tsx`               |
| `Sidebar`                      | `shared/blocks/sidebar.tsx`       |
| `Card`                         | `shared/blocks/card.tsx`          |
| `Dialog`                       | `shared/blocks/dialog.tsx`        |
| `Input`, `Textarea`, `Select`, `Fieldset`, `Label` | `shared/blocks/form.tsx` |
| `Button`, `SubmitButton`       | `shared/blocks/button.tsx`        |
| `Pagination`                   | `shared/blocks/pagination.tsx`    |
| `RegisterPlayer`               | `player/views/register.tsx`       |
| `PlayerProfile`                | `player/views/profile.tsx`        |
| `PlayerList`                   | `player/views/list.tsx`           |
| `RegisterGame`                 | `game/views/register.tsx`         |
| `Scoreboard` (game list)       | `game/views/list.tsx`             |
| `Login`                        | `user/views/login.tsx`            |

## Web Components

- Files in `public/components/`. Tag prefix `x-`.
- Use real `<slot>` elements. Render light DOM where possible; only use shadow DOM if style isolation is actually needed.
- Form-associated (`static formAssociated = true`) when the component represents a form value. The combobox must be form-associated so it submits naturally with `<form>`.
- No framework. Vanilla `customElements.define`. Total combobox should be under ~150 lines.

## CSS rules

- Three `@layer`s only: `tokens`, `base`, `variants`. Imported in that order.
- `tokens.css` is **only** `:root { --foo: …; }`. No selectors beyond `:root` and `@media (prefers-color-scheme: dark)`.
- `base.css` styles **elements and attributes**. Allowed selector forms:
  - Type: `button`, `article`, `input`, `dialog`.
  - Attribute: `[type="email"]`, `[aria-invalid="true"]`, `[aria-current]`, `[disabled]`.
  - Pseudo: `:focus-visible`, `:hover`, `:has(...)`, `:where(...)`.
  - Structural: `nav ul`, `form > p`, `article > header`.
  - **Not allowed in `base.css`:** any `.class` selector.
- `variants.css` is the escape hatch. A class here must be:
  - Single word, semantic (`.danger`, `.compact`, `.muted`).
  - Documented at top of file.
  - Used in more than one place, or it does not belong here.
- Use logical properties: `margin-inline`, `padding-block`, `inset-inline-start`. No `left`/`right`.
- Use `:where()` to keep specificity at 0 for default rules so callers can override without `!important`.
- **Do not use `tsx-to-html`'s conditional-class object syntax** (`class={{foo: true}}`). We're classless. If you find yourself reaching for it, you're styling layout from the wrong end.

## HTML rules

- Use the right element. Forms use `<form>`. Dialogs use `<dialog>`. Tables use `<table>`. Nav is `<nav>`. Pagination is a `<nav>` with an ordered list and `aria-label="Pagination"`.
- Every form control has a `<label>`. Use `<fieldset>` + `<legend>` for groups (e.g. the two teams in a 2v2 game).
- Buttons that submit: `<button type="submit">`. Buttons that don't: `<button type="button">`. Always set `type`.
- Set `aria-invalid` and render an error `<p id="x-error">` linked via `aria-describedby` for invalid fields.
- Never use `<div>` when a semantic element exists.

## HTMX patterns

- `hx-boost="true"` on `<body>` so links and forms upgrade for free.
- Detect partial requests via the `HX-Request` header. If present, return the block; otherwise return `<Layout>{block}</Layout>`. The helper for this lives in `shared/routing.ts`.
- Swap targets are explicit (`hx-target="#scoreboard"`), and the target is rendered with that id by the same route's full-page response.
- Use `hx-push-url="true"` for anything that should be linkable (player profile, paginated scoreboard page).
- `hx-*` attributes are type-checked thanks to `htmx-tsx`. A typo is a compile error.

## Effect patterns

- One service per aggregate (`Players`, `Games`, `Auth`). Each is defined inside its feature folder's `service.ts`.
- A service exports a Tag and at least one Live layer. The Tag is what routes import — never the layer directly.
- State lives in an in-memory `Ref<Map<…, …>>` inside the `MemoryLive` layer for now. When SQL is added, only the layer changes — the Tag and every consumer stay identical. If your service Tag leaks "this is in-memory", you've designed it wrong.
- Use `Schema` for all request input parsing. Decode at the route boundary, never inside services.
- Errors are typed (`PlayerNotFound`, `InvalidScore`). Routes map known errors to HTTP status + an error fragment.
- No try/catch in route handlers. Use `Effect.catchTags`.
- Keep route handlers small — they decode input, call one or two services, render one block.

## Domain rules

- A 1v1 game has exactly two players, distinct. A 2v2 game has exactly four players, all distinct.
- Games track the **winner** (`"left"` or `"right"`) directly — there are no goal counts. Validate in `game/domain.ts`, not in the route.
- Win rate is derived. Services store raw games; aggregates are computed.

## Accessibility

- Keyboard reachable for every interaction. Combobox follows the WAI-ARIA Authoring Practices combobox pattern (arrow keys, Enter, Escape, `aria-activedescendant`).
- Focus is visible (`:focus-visible` styled in `base.css`).
- Color is never the only signal. Use icons or text alongside.
- Respect `prefers-reduced-motion`.

## Don't

- Don't add a build tool, framework, or CSS library.
- Don't import another feature's `views/` or `domain.ts`.
- Don't write a class when an attribute or element selector would do.
- Don't put inline styles in HTML except via the tokens system.
- Don't fetch on the client with `fetch()` — that's what HTMX is for.
- Don't write a Web Component to wrap something HTMX already does.
- Don't invent non-REST URLs (`/players/create`, `/games/delete/:id`). Use the verbs.
- Don't return JSON. Routes return HTML fragments.
- Don't store derived values (winner, win rate) in the service.
- Don't import React, or JSX from anywhere except `tsx-to-html`.
- Don't generate 200 lines when 40 will do. Re-read what you wrote and cut it.

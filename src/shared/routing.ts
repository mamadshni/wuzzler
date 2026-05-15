import { fragment, html } from "./render";

export const respond = (
  isPartial: boolean,
  body: JSX.Element,
  page: (body: JSX.Element) => JSX.Element,
) => (isPartial ? fragment(body) : html(page(body)));

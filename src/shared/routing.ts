import { fragment, html } from "./render";

// True only for targeted HTMX swaps. Boosted navigation (HX-Boosted) returns
// the full page so HTMX can swap <body> content including the sidebar.
export const isPartialRequest = (req: {
	headers: Record<string, string | undefined>;
}): boolean =>
	req.headers["hx-request"] === "true" && req.headers["hx-boosted"] !== "true";

export const respond = (
	isPartial: boolean,
	body: JSX.Element,
	page: (body: JSX.Element) => JSX.Element,
) => (isPartial ? fragment(body) : html(page(body)));

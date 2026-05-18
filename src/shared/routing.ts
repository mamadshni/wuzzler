import { A } from "andale";
import { fragment, html } from "./render";
import { Effect } from "effect";
import { toHtml } from "tsx-to-html";

// True only for targeted HTMX swaps. Boosted navigation (HX-Boosted) returns
// the full page so HTMX can swap <body> content including the sidebar.

const isHxRequest = A.Request.header("HX-Request").pipe(
  Effect.mapBoth({ onFailure: () => false, onSuccess: () => true }),
  Effect.merge,
);


const isHxBoosted = A.Request.header("HX-Boosted").pipe(
  Effect.mapBoth({ onFailure: () => false, onSuccess: () => true }),
  Effect.merge,
);

export const isPartial = Effect.zipWith(isHxRequest, isHxBoosted, (isReq, isBs) => isReq && !isBs);

export const respond = (
	isHx: boolean,
	htmlElement: JSX.Element,
	page: (body: JSX.Element) => JSX.Element
) =>
  toHtml(
      isHx 
      ? htmlElement 
      : page(htmlElement)
    );

import { A } from "andale";
import { toHtml } from "tsx-to-html";

export const html = (node: JSX.Element) =>
	A.Response.asHtml(A.Response.of(`<!doctype html>${toHtml(node)}`));

export const fragment = (node: JSX.Element) =>
	A.Response.asHtml(A.Response.of(toHtml(node)));

import { toHtml } from "tsx-to-html";
import { HttpServerResponse } from "@effect/platform";

export const html = (node: JSX.Element) =>
  HttpServerResponse.html("<!doctype html>" + toHtml(node));

export const fragment = (node: JSX.Element) =>
  HttpServerResponse.html(toHtml(node));

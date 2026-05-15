import { Sidebar } from "./blocks/sidebar";

type Props = {
	title?: string;
	active?: "players" | "games" | "login";
	children: JSX.Element | JSX.Element[];
};

export const Layout = ({ title = "Wuzzler", active, children }: Props) => (
	<html lang="en">
		<head>
			<meta charset="utf-8" />
			<meta name="viewport" content="width=device-width, initial-scale=1" />
			<title>{title}</title>
			<link rel="stylesheet" href="/styles/tokens.css" />
			<link rel="stylesheet" href="/styles/base.css" />
			<link rel="stylesheet" href="/styles/variants.css" />
			<script type="module" src="/components/x-combobox.js" />
			<script
				src="https://unpkg.com/htmx.org@2.0.4/dist/htmx.min.js"
				crossorigin="anonymous"
			/>
		</head>
		<body hx-boost="true">
			<Sidebar active={active} />
			<main>{children}</main>
		</body>
	</html>
);

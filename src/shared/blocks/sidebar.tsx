type Props = {
	pathname: string;
	isAuthed: boolean;
};

type NavItem = {
	href: string;
	label: string | ((isAuthed: boolean) => string);
};

const NAV: ReadonlyArray<NavItem> = [
	{ href: "/players", label: "Players" },
	{ href: "/games", label: "Games" },
	{ href: "/admin", label: (isAuthed) => (isAuthed ? "Admin" : "Login") },
];

const isActive = (pathname: string, href: string) =>
	pathname === href || pathname.startsWith(`${href}/`);

const labelOf = (label: NavItem["label"], isAuthed: boolean) =>
	typeof label === "function" ? label(isAuthed) : label;

export const Sidebar = ({ pathname, isAuthed }: Props) => (
	<nav aria-label="Primary">
		<ul>
			{NAV.map((item) => (
				<li>
					<a
						href={item.href}
						aria-current={isActive(pathname, item.href) ? "page" : undefined}
					>
						{labelOf(item.label, isAuthed)}
					</a>
				</li>
			))}
		</ul>
	</nav>
);

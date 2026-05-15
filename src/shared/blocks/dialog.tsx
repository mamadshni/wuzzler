type Props = {
	open?: boolean;
	id?: string;
	children: JSX.Element | JSX.Element[];
};

export const Dialog = ({ open, id, children }: Props) => {
	const attrs = { id } as Record<string, string | undefined>;
	if (open) {
		(attrs as Record<string, string>).open = "";
	}
	return <dialog {...attrs}>{children}</dialog>;
};

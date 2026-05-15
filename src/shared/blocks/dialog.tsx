type Props = {
	open?: boolean;
	id?: string;
	children: JSX.Element | JSX.Element[];
};

export const Dialog = ({ open, id, children }: Props) => (
	<dialog id={id} open={open || undefined}>
		{children}
	</dialog>
);

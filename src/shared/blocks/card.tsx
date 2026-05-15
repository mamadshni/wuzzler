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

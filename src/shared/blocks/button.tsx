export const Button = (props: JSX.IntrinsicElements["button"]) => (
	<button type="button" {...props} />
);

type SubmitButtonProps = Omit<JSX.IntrinsicElements["button"], "type"> & {
	children: JSX.Element | string;
};

export const SubmitButton = ({ children, ...rest }: SubmitButtonProps) => (
	<button type="submit" {...rest}>
		{children}
	</button>
);

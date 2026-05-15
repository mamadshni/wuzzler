type FieldsetProps = {
	legend: string;
	children: JSX.Element | JSX.Element[];
};

export const Fieldset = ({ legend, children }: FieldsetProps) => (
	<fieldset>
		<legend>{legend}</legend>
		{children}
	</fieldset>
);

type LabelProps = {
	text: string;
	children: JSX.Element;
};

export const Label = ({ text, children }: LabelProps) => (
	// biome-ignore lint/a11y/noLabelWithoutControl: control is passed as children
	<label>
		{text}
		{children}
	</label>
);

export const Input = (
	props: JSX.IntrinsicElements["input"] & { type?: string },
) => <input type="text" {...props} />;

export const Textarea = (props: JSX.IntrinsicElements["textarea"]) => (
	<textarea {...props} />
);

type SelectProps = JSX.IntrinsicElements["select"] & {
	children: JSX.Element | JSX.Element[];
};

export const Select = ({ children, ...props }: SelectProps) => (
	<select {...props}>{children}</select>
);

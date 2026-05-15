declare namespace JSX {
	interface IntrinsicElements {
		"x-combobox": {
			name: string;
			"data-source": string;
			placeholder?: string;
			required?: boolean | string;
		};
	}
}

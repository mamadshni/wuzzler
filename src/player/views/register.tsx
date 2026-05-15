import { SubmitButton } from "../../shared/blocks/button";
import { Input, Label } from "../../shared/blocks/form";

type Props = {
	error?: string;
	values?: { name?: string };
};

export const RegisterPlayer = ({ error, values }: Props) => (
	<form hx-post="/players" hx-target="#player-list" hx-swap="outerHTML">
		<Label text="Name">
			<Input
				name="name"
				value={values?.name ?? ""}
				required
				aria-invalid={error ? "true" : undefined}
				aria-describedby={error ? "name-error" : undefined}
			/>
		</Label>
		{error && (
			<p id="name-error" role="alert">
				{error}
			</p>
		)}
		<SubmitButton>Add player</SubmitButton>
	</form>
);

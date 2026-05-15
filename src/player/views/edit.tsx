import { SubmitButton } from "../../shared/blocks/button";
import { Input, Label } from "../../shared/blocks/form";

type Props = {
	player: { id: string; name: string };
	error?: string;
};

export const EditPlayer = ({ player, error }: Props) => (
	<form
		id="player-profile"
		hx-patch={`/players/${player.id}`}
		hx-target="#player-profile"
		hx-swap="outerHTML"
	>
		<Label text="Name">
			<Input
				name="name"
				value={player.name}
				required
				aria-invalid={error ? "true" : undefined}
				aria-describedby={error ? "edit-name-error" : undefined}
			/>
		</Label>
		{error && (
			<p id="edit-name-error" role="alert">
				{error}
			</p>
		)}
		<SubmitButton>Save</SubmitButton>
	</form>
);

type Props = {
	error?: string;
};

const ComboLabel = ({
	text,
	name,
	required,
}: {
	text: string;
	name: string;
	required?: boolean;
}) => (
	// biome-ignore lint/a11y/noLabelWithoutControl: x-combobox is a form-associated custom element
	<label>
		{text}
		<x-combobox
			name={name}
			data-source="/players/search"
			placeholder="Type to search…"
			required={required ? "" : undefined}
		/>
	</label>
);

export const RegisterGame = ({ error }: Props) => (
	<form hx-post="/games" hx-target="#scoreboard" hx-swap="outerHTML">
		<fieldset>
			<legend>Game mode</legend>
			<label>
				<input type="radio" name="kind" value="1v1" checked />
				1v1
			</label>
			<label>
				<input type="radio" name="kind" value="2v2" />
				2v2
			</label>
		</fieldset>

		<fieldset>
			<legend>Left side</legend>
			<ComboLabel text="Player" name="leftPlayer" required />
			<ComboLabel text="Player A (2v2 only)" name="leftPlayerA" />
			<ComboLabel text="Player B (2v2 only)" name="leftPlayerB" />
			<label>
				Goals
				<input type="number" name="leftGoals" value="0" min="0" required />
			</label>
		</fieldset>

		<fieldset>
			<legend>Right side</legend>
			<ComboLabel text="Player" name="rightPlayer" required />
			<ComboLabel text="Player A (2v2 only)" name="rightPlayerA" />
			<ComboLabel text="Player B (2v2 only)" name="rightPlayerB" />
			<label>
				Goals
				<input type="number" name="rightGoals" value="0" min="0" required />
			</label>
		</fieldset>

		{error && <p role="alert">{error}</p>}
		<button type="submit">Record game</button>
	</form>
);

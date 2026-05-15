type Props = {
	kind?: "1v1" | "2v2";
	error?: string;
};

const ComboLabel = ({ text, name }: { text: string; name: string }) => (
	// biome-ignore lint/a11y/noLabelWithoutControl: x-combobox is a form-associated custom element
	<label>
		{text}
		<x-combobox
			name={name}
			data-source="/players/search"
			placeholder="Type to search…"
			required=""
		/>
	</label>
);

export const RegisterGame = ({ kind = "1v1", error }: Props) => (
	<form
		id="register-game-form"
		hx-post="/games"
		hx-target="#scoreboard"
		hx-swap="outerHTML"
	>
		<input type="hidden" name="kind" value={kind} />

		<fieldset>
			<legend>Mode</legend>
			<button
				type="button"
				aria-pressed={kind === "1v1" ? "true" : "false"}
				hx-get="/games/new?kind=1v1"
				hx-target="#register-game-form"
				hx-swap="outerHTML"
			>
				1v1
			</button>
			<button
				type="button"
				aria-pressed={kind === "2v2" ? "true" : "false"}
				hx-get="/games/new?kind=2v2"
				hx-target="#register-game-form"
				hx-swap="outerHTML"
			>
				2v2
			</button>
		</fieldset>

		{kind === "1v1" ? (
			<>
				<ComboLabel text="Left player" name="leftPlayer" />
				<ComboLabel text="Right player" name="rightPlayer" />
			</>
		) : (
			<>
				<fieldset>
					<legend>Left team</legend>
					<ComboLabel text="Player A" name="leftPlayerA" />
					<ComboLabel text="Player B" name="leftPlayerB" />
				</fieldset>
				<fieldset>
					<legend>Right team</legend>
					<ComboLabel text="Player A" name="rightPlayerA" />
					<ComboLabel text="Player B" name="rightPlayerB" />
				</fieldset>
			</>
		)}

		<fieldset>
			<legend>Winner</legend>
			<label>
				<input type="radio" name="winner" value="left" required />
				Left
			</label>
			<label>
				<input type="radio" name="winner" value="right" />
				Right
			</label>
		</fieldset>

		{error && <p role="alert">{error}</p>}
		<button type="submit">Record game</button>
	</form>
);

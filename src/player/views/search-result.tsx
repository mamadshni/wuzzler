import type { Player } from "../domain";

type Props = {
	items: ReadonlyArray<Player>;
};

export const SearchResults = ({ items }: Props) => (
	<>
		{items.map((p) => (
			// biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: li is used as a listbox option per WAI-ARIA
			// biome-ignore lint/a11y/useFocusableInteractive: keyboard focus managed by x-combobox via aria-activedescendant
			<li role="option" data-value={p.id}>
				{p.name}
			</li>
		))}
	</>
);

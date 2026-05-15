import type { Game } from "../domain";

type Props = {
	game: Game;
	nameOf: (id: string) => string;
};

const formatLineup = (game: Game, nameOf: (id: string) => string): string => {
	if (game.mode.kind === "1v1") {
		return `${nameOf(game.mode.leftPlayer)} vs ${nameOf(game.mode.rightPlayer)}`;
	}
	return `${nameOf(game.mode.leftPlayerA)} & ${nameOf(game.mode.leftPlayerB)} vs ${nameOf(game.mode.rightPlayerA)} & ${nameOf(game.mode.rightPlayerB)}`;
};

const winnerLabel = (game: Game, nameOf: (id: string) => string): string => {
	if (game.mode.kind === "1v1") {
		return game.winner === "left"
			? nameOf(game.mode.leftPlayer)
			: nameOf(game.mode.rightPlayer);
	}
	return game.winner === "left" ? "Left team" : "Right team";
};

export const GameRow = ({ game, nameOf }: Props) => (
	<tr>
		<td>{new Date(game.playedAt).toLocaleDateString()}</td>
		<td>{game.mode.kind}</td>
		<td>{formatLineup(game, nameOf)}</td>
		<td>
			<strong>{winnerLabel(game, nameOf)}</strong>
		</td>
	</tr>
);

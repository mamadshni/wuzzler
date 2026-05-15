import type { Game } from "../domain";
import { winnerSide } from "../domain";

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

export const GameRow = ({ game, nameOf }: Props) => {
	const winner = winnerSide(game);
	const leftWon = winner === "left";
	const rightWon = winner === "right";
	const date = new Date(game.playedAt).toLocaleDateString();

	return (
		<tr>
			<td>{date}</td>
			<td>{game.mode.kind}</td>
			<td>{formatLineup(game, nameOf)}</td>
			<td>
				{leftWon ? <strong>{game.leftGoals}</strong> : game.leftGoals}
				{" – "}
				{rightWon ? <strong>{game.rightGoals}</strong> : game.rightGoals}
			</td>
		</tr>
	);
};

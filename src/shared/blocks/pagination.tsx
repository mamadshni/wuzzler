type Props = {
	page: number;
	total: number;
	hrefFor: (n: number) => string;
};

export const Pagination = ({ page, total, hrefFor }: Props) => {
	if (total <= 1) return null;

	const pages = Array.from({ length: total }, (_, i) => i + 1);

	return (
		<nav aria-label="Pagination">
			<ol>
				{page > 1 && (
					<li>
						<a href={hrefFor(page - 1)}>Previous</a>
					</li>
				)}
				{pages.map((n) => (
					<li>
						<a href={hrefFor(n)} aria-current={n === page ? "page" : undefined}>
							{String(n)}
						</a>
					</li>
				))}
				{page < total && (
					<li>
						<a href={hrefFor(page + 1)}>Next</a>
					</li>
				)}
			</ol>
		</nav>
	);
};

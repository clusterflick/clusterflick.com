import type { Movie, Filters } from "@/types";
import { memo, ReactNode, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import slugify from "@sindresorhus/slugify";
import { List, type ListRowProps } from "react-virtualized/dist/es/List";
import { AutoSizer } from "react-virtualized/dist/es/AutoSizer";
import { WindowScroller } from "react-virtualized/dist/es/WindowScroller";
import { useCinemaData } from "@/state/cinema-data-context";
import getMatchingMovies from "@/utils/get-matching-movies";
import MovieItem from "@/components/movie-item";
import "./index.scss";

const movieItemWidth = 200;
const movieItemHeight = 375;

function MovieItemLink({ movie }: { movie: Movie }) {
  const searchParams = useSearchParams();
  const filterParams =
    searchParams.size > 0 ? `?${searchParams.toString()}` : "";
  return (
    <Link
      href={`/movies/${movie.id}/${slugify(movie.title)}${filterParams}`}
      className="movie-item-wrapper"
    >
      <MovieItem
        movie={movie}
        width={movieItemWidth}
        height={movieItemHeight}
      />
    </Link>
  );
}

const rowRenderer = (
  movies: Movie[],
  itemsPerRow: number,
  { key, style, index }: ListRowProps,
) => {
  const start = itemsPerRow * index;
  const end = start + itemsPerRow;
  return (
    <div key={key} style={style}>
      <ol className="movie-list">
        {movies.slice(start, end).map((movie) => (
          <li key={movie.id}>
            <MovieItemLink movie={movie} />
          </li>
        ))}
      </ol>
    </div>
  );
};

const MovieList = memo(function MovieList({
  filters,
  defaultFilters,
}: {
  filters: Filters;
  defaultFilters?: Filters;
}) {
  const { data } = useCinemaData();
  const movies = useMemo(
    () => getMatchingMovies(data!.movies, filters, defaultFilters),
    [data, filters, defaultFilters],
  );

  return (
    <WindowScroller scrollElement={window}>
      {({ height, isScrolling, registerChild, onChildScroll, scrollTop }) => (
        <AutoSizer disableHeight>
          {({ width }) => {
            const itemsPerRow = Math.floor(width / movieItemWidth);
            const rowCount = Math.ceil(movies.length / itemsPerRow);
            return (
              <div
                ref={(ref) => {
                  if (ref) registerChild(ref as unknown as ReactNode);
                }}
              >
                <List
                  autoHeight
                  height={height}
                  width={width}
                  isScrolling={isScrolling}
                  onScroll={onChildScroll}
                  scrollTop={scrollTop}
                  rowRenderer={(...args) =>
                    rowRenderer(movies, itemsPerRow, ...args)
                  }
                  overscanRowCount={1}
                  rowCount={rowCount}
                  rowHeight={movieItemHeight}
                />
              </div>
            );
          }}
        </AutoSizer>
      )}
    </WindowScroller>
  );
});

export default MovieList;

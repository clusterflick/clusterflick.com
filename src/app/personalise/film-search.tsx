"use client";

import {
  useDeferredValue,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from "react";
import Link from "next/link";
import clsx from "clsx";
import SearchInput from "@/components/search-input";
import Button from "@/components/button";
import PosterTile, { PosterTileList } from "@/components/poster-tile";
import LoadingIndicator from "@/components/loading-indicator";
import UserListButtons from "@/components/user-list-buttons";
import { useUserContext } from "@/state/user-context";
import { useCinemaData } from "@/state/cinema-data-context";
import { getMovieUrl } from "@/utils/get-movie-url";
import { normalizeForSearch } from "@/lib/filters/normalize";
import { searchShowingFilms } from "@/lib/user-lists/search-showing-films";
import {
  searchTmdb,
  TmdbSearchError,
  type TmdbSearchResult,
} from "@/lib/tmdb-search";
import styles from "./page.module.css";

/** For the empty watchlist, which sends the reader here. */
export const FILM_SEARCH_INPUT_ID = "personalise-film-search";

/**
 * How many showing films are drawn as the reader types. Two rows across the
 * page's widest column; past that the query wants another word, and the
 * catalogue link has the rest.
 */
const SHOWING_LIMIT = 12;

/**
 * Below this many characters (once folded), a query names too many films to
 * be worth drawing: "a" is most of the dataset.
 */
const MIN_QUERY_LENGTH = 2;

type TmdbState =
  | { step: "idle" }
  | { step: "searching"; query: string }
  | { step: "done"; query: string; results: TmdbSearchResult[] }
  | { step: "error"; query: string; message: string };

/**
 * Finds a film to put on a list, in the open at the top of the page.
 *
 * Films that are showing are found as the reader types, from the dataset the
 * page has already loaded: instant, and free, since nothing leaves the
 * browser. TheMovieDB, for a film that isn't showing (or never will be), is
 * the second step, on Enter or the "Search all films" button beside the
 * "Showing now" heading (or under the box, when nothing showing matches). That goes
 * through the search Worker, and every request counts against its per-reader
 * rate limit, so it never runs as the reader types.
 */
export default function FilmSearch({
  ref,
}: {
  /** The search's wrapper, for the empty watchlist to scroll to. */
  ref?: RefObject<HTMLElement | null>;
}) {
  const { getIdToken } = useUserContext();
  const { movies, hasAttemptedLoad, isLoading, error } = useCinemaData();
  const [query, setQuery] = useState("");
  const [tmdb, setTmdb] = useState<TmdbState>({ step: "idle" });
  const inFlight = useRef<AbortController | null>(null);
  const trimmed = query.trim();
  // Deferred, so typing stays responsive while a pass over the dataset runs.
  const deferredQuery = useDeferredValue(trimmed);
  const searchable =
    normalizeForSearch(deferredQuery).length >= MIN_QUERY_LENGTH;
  const loading = !hasAttemptedLoad || isLoading;

  const showing = useMemo(
    () => (searchable ? searchShowingFilms(movies, deferredQuery) : []),
    [movies, deferredQuery, searchable],
  );
  const shown = showing.slice(0, SHOWING_LIMIT);
  const shownIds = new Set(shown.map(({ id }) => id));

  // TheMovieDB's answer belongs to the query it was asked: once the box
  // says something else, it is stale, and the button is offered again.
  const tmdbCurrent = tmdb.step !== "idle" && tmdb.query === trimmed;

  const searchAll = async () => {
    if (!trimmed) return;
    // A later search replaces an earlier one still waiting on its answer.
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    setTmdb({ step: "searching", query: trimmed });
    try {
      const { results } = await searchTmdb(
        trimmed,
        getIdToken,
        controller.signal,
      );
      setTmdb({ step: "done", query: trimmed, results });
    } catch (error) {
      if (controller.signal.aborted) return;
      if (error instanceof TmdbSearchError) {
        setTmdb({ step: "error", query: trimmed, message: error.message });
        return;
      }
      console.error("Film search failed", error);
      setTmdb({
        step: "error",
        query: trimmed,
        message:
          "We couldn't reach the server. Check your connection and try again.",
      });
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    searchAll();
  };

  const onChange = (value: string) => {
    setQuery(value);
    // Clearing the box clears what it found.
    if (!value) {
      inFlight.current?.abort();
      setTmdb({ step: "idle" });
    }
  };

  // Films that are showing and already drawn above aren't repeated; one past
  // the limit is TheMovieDB's to show, linked as the dataset's film.
  const tmdbResults =
    tmdbCurrent && tmdb.step === "done"
      ? tmdb.results.filter(({ id }) => !shownIds.has(id))
      : [];
  // Without the listings there's no telling what's showing, and saying
  // nothing matches would be wrong: TheMovieDB is offered instead.
  const nothingShowing =
    searchable && !loading && !error && showing.length === 0;

  return (
    <section ref={ref} className={styles.filmSearchSection}>
      <form role="search" className={styles.row} onSubmit={onSubmit}>
        <SearchInput
          id={FILM_SEARCH_INPUT_ID}
          value={query}
          onChange={onChange}
          placeholder="Find a film to add to your lists"
          ariaLabel="Film title"
          className={styles.filmSearchInput}
        />
      </form>

      {(searchable || tmdbCurrent) && (
        <div aria-live="polite" className={styles.filmSearchResults}>
          {loading ? (
            <LoadingIndicator message="Checking what's showing…" size="sm" />
          ) : (
            shown.length > 0 && (
              <>
                {/* The way on to every film sits beside the heading, where the
                    eye lands first, rather than under results that may run
                    to two rows. */}
                <div className={styles.filmSearchHeader}>
                  <h3 className={styles.groupTitle}>Showing now</h3>
                  {!tmdbCurrent && (
                    <p className={styles.filmSearchAll}>
                      <span className={styles.filmSearchAllText}>
                        Not showing?
                      </span>
                      <Button variant="secondary" size="sm" onClick={searchAll}>
                        Search all films
                      </Button>
                    </p>
                  )}
                </div>
                <div className={styles.lane}>
                  <PosterTileList>
                    {shown.map((movie) => (
                      <PosterTile
                        key={movie.id}
                        title={movie.title}
                        posterPath={movie.posterPath}
                        includedMovies={movie.includedMovies}
                        href={getMovieUrl(movie)}
                        details={movie.year ? [movie.year] : undefined}
                        action={
                          <UserListButtons movie={movie} layout="stacked" />
                        }
                      />
                    ))}
                  </PosterTileList>
                </div>
                {showing.length > shown.length && (
                  <p className={styles.filmSearchMore}>
                    {showing.length.toLocaleString("en-GB")} films showing
                    match.{" "}
                    <Link
                      href={`/catalogue?base=all&search=${encodeURIComponent(deferredQuery)}`}
                    >
                      See them all in the catalogue
                    </Link>
                  </p>
                )}
              </>
            )
          )}

          {(nothingShowing || (error && searchable)) && !tmdbCurrent && (
            <p className={clsx(styles.filmSearchAll, styles.filmSearchNone)}>
              <span className={styles.filmSearchAllText}>
                {error ? (
                  "We couldn't load what's showing."
                ) : (
                  <>
                    Nothing showing matches <strong>{deferredQuery}</strong>.
                  </>
                )}
              </span>
              <Button size="sm" onClick={searchAll}>
                Search all films, showing or not
              </Button>
            </p>
          )}

          {tmdbCurrent && tmdb.step === "searching" && (
            <LoadingIndicator message="Searching all films…" size="sm" />
          )}
          {tmdbCurrent && tmdb.step === "error" && (
            <p className={styles.error} role="alert">
              {tmdb.message}
            </p>
          )}
          {tmdbCurrent && tmdb.step === "done" && (
            <>
              <h3 className={styles.groupTitle}>All films</h3>
              {tmdbResults.length === 0 ? (
                <p className={styles.empty}>
                  {tmdb.results.length === 0
                    ? "No films match that title on TheMovieDB either."
                    : "Nothing beyond the films showing above."}
                </p>
              ) : (
                <div className={styles.lane}>
                  <PosterTileList>
                    {tmdbResults.map((result) => {
                      // A film that's showing is ours as well as TMDB's: it
                      // links to its page, and goes on a list as its page
                      // would put it there.
                      const film = movies[result.id];
                      const entry = film ?? result;
                      return (
                        <PosterTile
                          key={result.id}
                          title={entry.title}
                          posterPath={entry.posterPath}
                          href={film ? getMovieUrl(film) : undefined}
                          details={[
                            entry.year ?? "Year unknown",
                            ...(film ? ["Showing now"] : []),
                          ]}
                          action={
                            <UserListButtons movie={entry} layout="stacked" />
                          }
                        />
                      );
                    })}
                  </PosterTileList>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}

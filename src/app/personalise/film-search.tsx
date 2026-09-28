"use client";

import { useRef, useState, type FormEvent } from "react";
import clsx from "clsx";
import SearchInput from "@/components/search-input";
import Button from "@/components/button";
import PosterTile, { PosterTileList } from "@/components/poster-tile";
import LoadingIndicator from "@/components/loading-indicator";
import UserListButtons from "@/components/user-list-buttons";
import { useUserContext } from "@/state/user-context";
import { useCinemaData } from "@/state/cinema-data-context";
import { getMovieUrl } from "@/utils/get-movie-url";
import {
  searchTmdb,
  TmdbSearchError,
  type TmdbSearchResult,
} from "@/lib/tmdb-search";
import styles from "./page.module.css";

/** For the empty watchlist, which sends the reader here. */
export const FILM_SEARCH_INPUT_ID = "personalise-film-search";

type SearchState =
  | { step: "idle" }
  | { step: "searching" }
  | { step: "done"; query: string; results: TmdbSearchResult[] }
  | { step: "error"; message: string };

/**
 * Finds any film on TheMovieDB, so one that isn't showing — or never will be —
 * can go on a list. A film that is showing links to its page. In the list
 * tools, since the usual way to add a film is from its own page.
 *
 * Searches on submit rather than as the reader types: they're after a title
 * they already know, the answer is a grid rather than a menu to pick from, and
 * every request counts against the Worker's per-reader rate limit.
 */
export default function FilmSearch() {
  const { getIdToken } = useUserContext();
  const { movies } = useCinemaData();
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>({ step: "idle" });
  const inFlight = useRef<AbortController | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    // A later search replaces an earlier one still waiting on its answer.
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    setState({ step: "searching" });
    try {
      const { results } = await searchTmdb(
        trimmed,
        getIdToken,
        controller.signal,
      );
      setState({ step: "done", query: trimmed, results });
    } catch (error) {
      if (controller.signal.aborted) return;
      if (error instanceof TmdbSearchError) {
        setState({ step: "error", message: error.message });
        return;
      }
      console.error("Film search failed", error);
      setState({
        step: "error",
        message:
          "We couldn't reach the server. Check your connection and try again.",
      });
    }
  };

  const onChange = (value: string) => {
    setQuery(value);
    // Clearing the box clears what it found.
    if (!value) {
      inFlight.current?.abort();
      setState({ step: "idle" });
    }
  };

  return (
    <section className={clsx(styles.managementSection, styles.managementWide)}>
      <h3 className={styles.managementTitle}>Add a film</h3>
      <p className={styles.managementText}>
        Want to add a film that&apos;s not currently showing? Search for it
        here.
      </p>
      <form
        role="search"
        className={clsx(styles.row, styles.filmSearch)}
        onSubmit={onSubmit}
      >
        <SearchInput
          id={FILM_SEARCH_INPUT_ID}
          value={query}
          onChange={onChange}
          placeholder="Search by title"
          ariaLabel="Film title"
          className={styles.filmSearchInput}
        />
        <Button type="submit" disabled={state.step === "searching"}>
          Search
        </Button>
      </form>
      <div aria-live="polite">
        {state.step === "searching" && (
          <LoadingIndicator message="Searching…" size="sm" />
        )}
        {state.step === "error" && (
          <p className={styles.error} role="alert">
            {state.message}
          </p>
        )}
        {state.step === "done" && state.results.length === 0 && (
          <p className={styles.empty}>
            No films match <strong>{state.query}</strong>.
          </p>
        )}
      </div>
      {state.step === "done" && state.results.length > 0 && (
        <div className={styles.lane}>
          <PosterTileList>
            {state.results.map((result) => {
              // A film that's showing is ours as well as TMDB's: it links to
              // its page, and goes on a list as its page would put it there.
              const showing = movies[result.id];
              const film = showing ?? result;
              return (
                <PosterTile
                  key={result.id}
                  title={film.title}
                  posterPath={film.posterPath}
                  href={showing ? getMovieUrl(showing) : undefined}
                  details={[
                    film.year ?? "Year unknown",
                    ...(showing ? ["Showing now"] : []),
                  ]}
                  action={<UserListButtons movie={film} layout="stacked" />}
                />
              );
            })}
          </PosterTileList>
        </div>
      )}
    </section>
  );
}

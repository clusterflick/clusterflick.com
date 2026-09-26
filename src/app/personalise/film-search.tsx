"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import ContentSection from "@/components/content-section";
import SearchInput from "@/components/search-input";
import PosterTile, { PosterTileList } from "@/components/poster-tile";
import LoadingIndicator from "@/components/loading-indicator";
import UserListButtons from "@/components/user-list-buttons";
import { useUserContext } from "@/state/user-context";
import { useCinemaData } from "@/state/cinema-data-context";
import { getMovieUrl } from "@/utils/get-movie-url";
import {
  MIN_QUERY_LENGTH,
  searchTmdb,
  TmdbSearchError,
  type TmdbSearchResult,
} from "@/lib/tmdb-search";
import styles from "./page.module.css";

/** Long enough to wait out typing, so a search is one request, not one a key. */
const DEBOUNCE_MS = 300;

/** The last search to come back, for the query it answered. */
type Answer =
  | { query: string; results: TmdbSearchResult[] }
  | { query: string; error: string };

/**
 * Finds any film on TheMovieDB, so one that isn't showing — or never will be —
 * can go on a list. A film that is showing links to its page.
 */
export default function FilmSearch() {
  const { getIdToken } = useUserContext();
  const { movies } = useCinemaData();
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const trimmed = query.trim();
  const isActive = trimmed.length >= MIN_QUERY_LENGTH;
  // The previous answer stays up until the next arrives, so the results
  // don't blank on every pause in typing.
  const isSearching = isActive && answer?.query !== trimmed;

  useEffect(() => {
    if (!isActive) return;
    // Aborted when the query changes, so a slow earlier answer can't land
    // over a later one.
    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchTmdb(trimmed, getIdToken, controller.signal).then(
        ({ results }) => setAnswer({ query: trimmed, results }),
        (error) => {
          if (controller.signal.aborted) return;
          console.error("Film search failed", error);
          setAnswer({
            query: trimmed,
            error:
              error instanceof TmdbSearchError
                ? error.message
                : "We couldn't reach the server. Check your connection and try again.",
          });
        },
      );
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, isActive, getIdToken]);

  const shown = isActive ? answer : null;
  const results = shown && "results" in shown ? shown.results : null;

  return (
    <ContentSection
      title="Add any film"
      intro="Not everything is showing. Find a film to add it to your watchlist, or to the films you've seen."
    >
      <SearchInput
        id="personalise-film-search"
        value={query}
        onChange={setQuery}
        placeholder="Search by title"
        ariaLabel="Search for a film"
        className={styles.filmSearch}
      />
      <div aria-live="polite">
        {isSearching ? (
          <LoadingIndicator message="Searching…" size="sm" />
        ) : shown && "error" in shown ? (
          <p className={styles.error} role="alert">
            {shown.error}
          </p>
        ) : (
          results?.length === 0 && (
            <p className={styles.empty}>
              No films match <strong>{shown!.query}</strong>.
            </p>
          )
        )}
      </div>
      {results && results.length > 0 && (
        <div className={styles.lane}>
          <PosterTileList>
            {results.map((result) => {
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
      <p className={styles.searchAttribution}>
        <Image src="/images/tmdb-logo.svg" alt="TMDB" width={46} height={20} />
        Search by The Movie Database. Clusterflick uses the TMDB API but is not
        endorsed or certified by TMDB.
      </p>
    </ContentSection>
  );
}
